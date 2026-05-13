export class GameEngine {
  constructor(prisma, deckService, moveValidator, scoreCalculator) {
    this.prisma = prisma;
    this.deckService = deckService;
    this.moveValidator = moveValidator;
    this.scoreCalculator = scoreCalculator;

    // Estado em memória sincronizado com o Banco de Dados
    this.state = {
      id: null,
      players: [],
      kingdoms: [],
      market: [],
      currentAge: 1,
      dragonsFound: 0
    };
  }

  /**
   * Configuração inicial de uma nova partida
   */
  async setupNewGame(playerNames) {
    // Reinos padrão conforme o manual (Cores/Nomes)
    const kingdomsData = [
      { name: 'GIANT', gloryAge1: 0, gloryAge2: 0, gloryAge3: 0 },
      { name: 'WIZARD', gloryAge1: 0, gloryAge2: 0, gloryAge3: 0 },
      { name: 'TROLL', gloryAge1: 0, gloryAge2: 0, gloryAge3: 0 },
      { name: 'ORC', gloryAge1: 0, gloryAge2: 0, gloryAge3: 0 },
      { name: 'DWARVE', gloryAge1: 0, gloryAge2: 0, gloryAge3: 0 },
      { name: 'ELF', gloryAge1: 0, gloryAge2: 0, gloryAge3: 0 },
    ];

    const game = await this.prisma.$transaction(async (tx) => {
      // 1. Cria o GameState
      const newGame = await tx.gameState.create({
        data: {
          currentAge: 1,
          dragonsFound: 0,
          gameStarted: true,
          activeTribes: "GIANT,WIZARD,TROLL,ORC,DWARVE,ELF"
        }
      });

      // 2. Cria os Jogadores
      for (const name of playerNames) {
        await tx.player.create({
          data: {
            name,
            gameStateId: newGame.id,
            points: 0
          }
        });
      }

      // 3. Cria os Reinos
      for (const k of kingdomsData) {
        await tx.kingdom.create({
          data: { ...k, gameStateId: newGame.id }
        });
      }

      return newGame;
    });

    await this.initGame(game.id);
    await this.startNewAge();
    return game.id;
  }

  /**
   * Carrega o estado completo do banco para a memória
   */
  async initGame(id) {
    const gameId = parseInt(id);
    await this._loadState(gameId);
    return this.state;
  }

  async _loadState(gameId) {
    const data = await this.prisma.gameState.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: {
            cards: { where: { location: 'HAND' } },
            markers: true
          }
        },
        kingdoms: {
          include: {
            markers: { include: { player: true } }
          }
        },
        cards: {
          where: { location: 'MARKET' }
        }
      }
    });

    if (!data) throw new Error(`Jogo ${gameId} não encontrado.`);

    this.state = {
      id: data.id,
      currentAge: data.currentAge,
      dragonsFound: data.dragonsFound,
      players: data.players.map(p => ({
        ...p,
        hand: p.cards // Mapeia para facilitar acesso na UI
      })),
      kingdoms: data.kingdoms,
      market: data.cards
    };
  }

  /**
   * Inicializa uma Era (Age) conforme Manual p. 5
   */
  async startNewAge() {
    console.log(`--- Iniciando Era ${this.state.currentAge} ---`);

    // 1. Reset de Dragões
    await this.prisma.gameState.update({
      where: { id: this.state.id },
      data: { dragonsFound: 0 }
    });

    // 2. Preparar baralho (DeckService lida com o shuffle e ordem)
    await this.deckService.setupDeckForNewAge(this.state.id, this.state.players.length);

    // 3. Distribuição inicial: 1 carta para cada jogador
    for (const player of this.state.players) {
      await this.drawCard(player.id);
    }

    // 4. Mercado inicial: 2 cartas por jogador
    const marketSize = this.state.players.length * 2;
    for (let i = 0; i < marketSize; i++) {
      await this._revealToMarket();
    }

    await this._loadState(this.state.id);
  }

  /**
   * Compra de carta com Regra dos Dragões (Manual p. 9)
   */
  async drawCard(playerId) {
    const card = await this.prisma.card.findFirst({
      where: { gameStateId: this.state.id, location: 'DECK' },
      orderBy: { order: 'asc' }
    });

    if (!card) return null;

    if (card.isDragon || card.tribe === 'DRAGON') {
      const updatedGame = await this.prisma.gameState.update({
        where: { id: this.state.id },
        data: { dragonsFound: { increment: 1 } }
      });

      this.state.dragonsFound = updatedGame.dragonsFound;

      // Remove dragão do jogo
      await this.prisma.card.update({
        where: { id: card.id },
        data: { location: 'OUT_OF_GAME' }
      });

      if (this.state.dragonsFound >= 3) {
        return await this.evaluateEndAge();
      }

      // Recursão: compra a próxima após achar um dragão
      return this.drawCard(playerId);
    }

    return await this.prisma.card.update({
      where: { id: card.id },
      data: { location: 'HAND', ownerId: playerId }
    });
  }

  /**
   * Jogar um Bando (Regra p. 7)
   */
  async handlePlayBand(player, cardIds, leaderId) {
    const selectedCards = player.hand.filter(c => cardIds.includes(c.id));
    
    if (!this.moveValidator.canPlayBand(selectedCards)) {
      throw new Error("Bando inválido! Devem ser da mesma tribo ou cor.");
    }

    const leader = selectedCards.find(c => c.id === leaderId);

    // 1. Posicionar Marcador de Controle
    const targetKingdom = this.state.kingdoms.find(k => k.name === leader.color);
    if (targetKingdom) {
      const canPlace = this.moveValidator.canPlaceMarker(player, targetKingdom, selectedCards.length);
      if (canPlace) {
        await this.prisma.controlMarker.upsert({
          where: { playerId_kingdomId: { playerId: player.id, kingdomId: targetKingdom.id } },
          update: { count: { increment: 1 } },
          create: { playerId: player.id, kingdomId: targetKingdom.id, count: 1 }
        });
      }
    }

    // 2. Persistir o Bando
    await this.prisma.band.create({
      data: {
        playerId: player.id,
        size: selectedCards.length,
        leaderId: leader.id,
        cards: { connect: cardIds.map(id => ({ id })) }
      }
    });

    // 3. Atualizar localização das cartas do bando
    await this.prisma.card.updateMany({
      where: { id: { in: cardIds } },
      data: { location: 'BAND', order: null }
    });

    // 4. Regra de Ouro do Descarte (Mão -> Mercado)
    const remainingCards = player.hand.filter(c => !cardIds.includes(c.id));
    if (remainingCards.length > 0) {
      await this.prisma.card.updateMany({
        where: { id: { in: remainingCards.map(c => c.id) } },
        data: { location: 'MARKET', ownerId: null }
      });
    }

    await this._loadState(this.state.id);
  }

  async drawFromMarket(playerId, cardId) {
    await this.prisma.card.update({
      where: { id: cardId },
      data: { location: 'HAND', ownerId: playerId }
    });
    await this._loadState(this.state.id);
  }

  async _revealToMarket() {
    const card = await this.prisma.card.findFirst({
      where: { gameStateId: this.state.id, location: 'DECK' },
      orderBy: { order: 'asc' }
    });

    if (card) {
      await this.prisma.card.update({
        where: { id: card.id },
        data: { location: 'MARKET', order: null }
      });
    }
  }

  async evaluateEndAge() {
    // 1. Calcula a glória da era atual
    const results = this.scoreCalculator.calculateAgeGlory(this.state);
    
    // 2. Atualiza pontos dos jogadores no banco de dados
    for (const res of results) {
      await this.prisma.player.update({
        where: { id: res.playerId },
        data: { points: { increment: res.gloryEarned } }
      });
    }

    // 3. Incrementa a Era tanto localmente (memória) quanto no banco
    this.state.currentAge += 1; // CORREÇÃO: Atualiza a memória para o teste passar!

    await this.prisma.gameState.update({
      where: { id: this.state.id },
      data: { currentAge: this.state.currentAge }
    });

    // 4. Verifica fim de jogo ou reinicia o deck para a próxima Era
    if (this.state.currentAge > 3) {
      console.log("🏆 Jogo Finalizado!");
    } else {
      await this.startNewAge();
    }
  }
}