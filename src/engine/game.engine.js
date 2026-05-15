import chalk from 'chalk';

export class GameEngine {
  constructor(prisma, deckService, moveValidator, scoreCalculator) {
    this.prisma = prisma;
    this.deckService = deckService;
    this.moveValidator = moveValidator;
    this.scoreCalculator = scoreCalculator;

    this.state = {
      id: null,
      players: [],
      kingdoms: [],
      market: [],
      currentAge: 1,
      dragonsFound: 0,
      ageEnded: false
    };
  }

  async setupNewGame(playerNames) {
    const kingdomsData = [
      { name: 'RED', gloryAge1: 1, gloryAge2: 3, gloryAge3: 6 },
      { name: 'BLUE', gloryAge1: 1, gloryAge2: 3, gloryAge3: 6 },
      { name: 'ORANGE', gloryAge1: 2, gloryAge2: 4, gloryAge3: 8 },
      { name: 'GREY', gloryAge1: 2, gloryAge2: 4, gloryAge3: 8 },
      { name: 'YELLOW', gloryAge1: 3, gloryAge2: 5, gloryAge3: 10 },
      { name: 'GREEN', gloryAge1: 3, gloryAge2: 5, gloryAge3: 10 },
    ];

    const game = await this.prisma.$transaction(async (tx) => {
      const newGame = await tx.gameState.create({
        data: {
          currentAge: 1,
          dragonsFound: 0,
          gameStarted: true,
          activeTribes: "GIANT,WIZARD,TROLL,SKELETON,DWARVE,ELF"
        }
      });

      for (const name of playerNames) {
        await tx.player.create({
          data: { name, gameStateId: newGame.id, points: 0 }
        });
      }

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

  async initGame(id) {
    await this._loadState(parseInt(id));
    return this.state;
  }

  async _loadState(gameId) {
    const data = await this.prisma.gameState.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: {
            cards: { where: { location: 'HAND' } },
            markers: true,
            bands: { include: { cards: true } }
          }
        },
        kingdoms: {
          include: { markers: { include: { player: true } } }
        },
        cards: {
          where: { location: 'MARKET' }
        }
      }
    });

    if (!data) throw new Error(`Jogo ${gameId} não encontrado.`);

    this.state = {
      ...this.state,
      id: data.id,
      currentAge: data.currentAge,
      dragonsFound: data.dragonsFound,
      players: data.players.map(p => ({
        ...p,
        hand: p.cards,
        playedBands: p.bands || []
      })),
      kingdoms: data.kingdoms,
      market: data.cards,
      ageEnded: data.dragonsFound >= 3
    };
  }

  /**
   * Inicia a Era usando o DeckService (que já monta o mercado e esconde dragões)
   */
  async startNewAge() {
    console.log(chalk.bold.magenta(`\n✨ PREPARANDO A ERA ${this.state.currentAge}...`));

    // 1. DeckService faz o trabalho pesado de recolher cartas e preparar deck/mercado
    await this.deckService.setupDeckForNewAge(this.state.id, this.state.players.length);

    // 2. Resetar contador de dragões no banco
    await this.prisma.gameState.update({
      where: { id: this.state.id },
      data: { dragonsFound: 0 }
    });

    // 3. Se for Era 1, cada um começa com 1 carta (Manual p. 4)
    if (this.state.currentAge === 1) {
      for (const player of this.state.players) {
        await this.drawCard(player.id, true); // true = silent draw
      }
    }

    await this._loadState(this.state.id);
  }

  /**
   * Compra de carta com interrupção imediata de Era
   */
  async drawCard(playerId, silent = false) {
    const card = await this.prisma.card.findFirst({
      where: { gameStateId: this.state.id, location: 'DECK' },
      orderBy: { order: 'asc' }
    });

    if (!card) return { type: 'EMPTY' };

    if (card.tribe?.toUpperCase() === 'DRAGON' || card.isDragon) {
      const updatedGame = await this.prisma.gameState.update({
        where: { id: this.state.id },
        data: { dragonsFound: { increment: 1 } }
      });

      this.state.dragonsFound = updatedGame.dragonsFound;

      await this.prisma.card.update({
        where: { id: card.id },
        data: { location: 'OUT_OF_GAME', order: null }
      });

      const endOfAge = this.state.dragonsFound >= 3;
      if (endOfAge) {
        this.state.ageEnded = true;
        await this.evaluateEndAge();
      }

      return { type: 'DRAGON', count: this.state.dragonsFound, endOfAge };
    }

    // Carta normal
    const updatedCard = await this.prisma.card.update({
      where: { id: card.id },
      data: { location: 'HAND', ownerId: playerId, order: null }
    });

    await this._loadState(this.state.id);
    return { type: 'NORMAL', card: updatedCard };
  }

  async handlePlayBand(player, cardIds, leaderId) {
    const selectedCards = player.hand.filter(c => cardIds.includes(c.id));
    const leader = selectedCards.find(c => c.id === leaderId);

    // 1. Controle de Marcadores
    const targetKingdom = this.state.kingdoms.find(k => k.name === leader.color.toUpperCase());
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

    // 2. Criar o Bando e mover cartas
    await this.prisma.band.create({
      data: {
        playerId: player.id,
        size: selectedCards.length,
        leaderId: leader.id,
        cards: { connect: cardIds.map(id => ({ id })) }
      }
    });

    await this.prisma.card.updateMany({
      where: { id: { in: cardIds } },
      data: { location: 'BAND', order: null, ownerId: null }
    });

    // 3. Regra de Ouro: Descartar o resto da mão para o mercado
    const remainingCards = player.hand.filter(c => !cardIds.includes(c.id));
    if (remainingCards.length > 0) {
      await this.prisma.card.updateMany({
        where: { id: { in: remainingCards.map(c => c.id) } },
        data: { location: 'MARKET', ownerId: null }
      });
      console.log(chalk.yellow(`\n⚠️  ${remainingCards.length} cartas foram para o Mercado!`));
    }

    await this._loadState(this.state.id);
  }

  async evaluateEndAge() {
    console.log(chalk.bold.yellow("\n--- CALCULANDO PONTUAÇÃO DA ERA ---"));

    const results = this.scoreCalculator.calculateAgeGlory(this.state);

    for (const res of results) {
      await this.prisma.player.update({
        where: { id: res.playerId },
        data: { points: { increment: res.gloryEarned } }
      });
    }

    // Limpeza de Bandas da Era
    await this.prisma.band.deleteMany({
      where: { player: { gameStateId: this.state.id } }
    });

    if (this.state.currentAge >= 3) {
      console.log(chalk.bgGreen.black.bold("\n 🏆 FIM DO JOGO! VERIFIQUE O PLACAR FINAL. "));
      this.state.currentAge = 4; // Finaliza o loop da UI
    } else {
      await this.prisma.gameState.update({
        where: { id: this.state.id },
        data: { currentAge: { increment: 1 } }
      });
      this.state.currentAge += 1;
      await this.startNewAge();
    }
  }
}