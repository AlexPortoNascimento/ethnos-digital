export class GameEngine {
  constructor(prisma, deckService, moveValidator, scoreCalculator) {
    this.prisma = prisma;
    this.deckService = deckService;
    this.moveValidator = moveValidator;
    this.scoreCalculator = scoreCalculator;

    // Estado volátil (em memória durante o processamento do turno)
    this.state = {
      gameId: null,
      players: [],
      kingdoms: [],
      currentAge: 1,
      dragonsFound: 0
    };
  }

  /**
   * Inicializa um novo jogo ou carrega um existente
   */
  async initGame(gameId) {
    this.state.gameId = gameId;
    await this._loadState();
  }

  /**
   * Prepara uma nova Era (Age)
   * Regras: Resetar deck, dar 1 carta a cada jogador, preparar mercado.
   */
  async startNewAge() {
    console.log(`--- Iniciando Era ${this.state.currentAge} ---`);

    // 1. Resetar dragões e preparar deck via DeckService
    this.state.dragonsFound = 0;
    await this.deckService.setupDeckForNewAge(this.state.gameId);

    // 2. Dar 1 carta inicial para cada jogador (Regra p. 5)
    for (const player of this.state.players) {
      await this.drawCard(player.id, 'DECK');
    }

    // 3. Abrir o Mercado (2 cartas por jogador)
    const marketSize = this.state.players.length * 2;
    for (let i = 0; i < marketSize; i++) {
      await this._revealToMarket();
    }

    await this._saveState();
  }

  /**
   * Processa a ação escolhida pelo jogador
   * @param {string} playerId 
   * @param {Object} action { type: 'RECRUIT' | 'PLAY_BAND', data: ... }
   */
  async processTurn(playerId, action) {
    const player = this.state.players.find(p => p.id === playerId);

    if (action.type === 'RECRUIT') {
      await this.handleRecruit(player, action.data);
    } else if (action.type === 'PLAY_BAND') {
      await this.handlePlayBand(player, action.data);
    }

    // Salva o estado após cada ação bem-sucedida
    await this._saveState();
  }

  /**
   * Lógica de Recrutamento
   */
  async handleRecruit(player, source) {
    // Validação via MoveValidator
    if (!this.moveValidator.canRecruit(player, this.state)) {
      throw new Error("Limite de mão atingido ou ação inválida.");
    }

    if (source.type === 'DECK') {
      await this.drawCard(player.id, 'DECK');
    } else {
      await this.drawFromMarket(player.id, source.cardId);
    }
  }

  /**
   * Compra de carta e verificação de dragões
   */
  async drawCard(playerId, source) {
    // Lógica para pegar a carta com menor 'position' no deck
    const card = await this.prisma.card.findFirst({
      where: { gameStateId: this.state.gameId, location: 'DECK' },
      orderBy: { position: 'asc' }
    });

    if (card.tribe === 'Dragon') {
      this.state.dragonsFound++;
      console.log(`🔥 Dragão encontrado! (${this.state.dragonsFound}/3)`);

      // Se for o 3º dragão, a Era acaba imediatamente
      if (this.state.dragonsFound >= 3) {
        return this.evaluateEndAge();
      }

      // Dragões comprados são removidos do jogo (p. 9) e o jogador compra outra
      await this.prisma.card.update({ where: { id: card.id }, data: { location: 'REMOVED' } });
      return this.drawCard(playerId, 'DECK');
    }

    // Move carta para a mão do jogador
    await this.prisma.card.update({
      where: { id: card.id },
      data: { location: 'HAND', playerId: playerId, position: null }
    });
  }



  /**
   * Finalização da Era e Cálculo de Pontos
   */
  async evaluateEndAge() {
    console.log("🏁 Fim da Era! Calculando glória...");

    // Delega o cálculo para o serviço especializado
    const gloryResults = this.scoreCalculator.calculateAgeGlory(this.state);

    // Persiste glória nos jogadores
    // ... lógica de update ...

    this.state.currentAge++;
    if (this.state.currentAge > 3) {
      this.endGame();
    } else {
      await this.startNewAge();
    }
  }

  // Métodos Privados de Persistência
  async _saveState() {
    // Aqui você chamaria o PrismaRepository para salvar o snapshot
  }

  async _loadState() {
    // Carrega jogadores, reinos e estado atual do banco
  }

  async _revealToMarket() {
    // Tira do deck e coloca no slot de mercado (location: 'MARKET')
  }

async handlePlayBand(player, cardIds, leaderId) {
    // 1. Identifica as cartas na mão do jogador
    const selectedCards = player.hand.filter(c => cardIds.includes(c.id));

    // 2. Validação de Regra: A banda é válida? (Mesma tribo ou Cor)
    if (!this.moveValidator.canPlayBand(selectedCards)) {
      throw new Error("Banda inválida! As cartas devem ser da mesma tribo ou da mesma cor.");
    }

    const leader = selectedCards.find(c => c.id === leaderId);
    if (!leader) throw new Error("Líder não encontrado na seleção.");

    // 3. Lógica de Marcador de Controle (Regra p. 7, item 3)
    // Encontramos o reino que combina com a COR do líder
    const targetKingdom = await this.prisma.kingdom.findFirst({
      where: { name: leader.color } 
    });

    if (targetKingdom) {
      if (this.moveValidator.canPlaceMarker(player, targetKingdom, selectedCards.length)) {
        await this.prisma.controlMarker.upsert({
          where: { 
            playerId_kingdomId: { playerId: player.id, kingdomId: targetKingdom.id } 
          },
          update: { count: { increment: 1 } },
          create: { playerId: player.id, kingdomId: targetKingdom.id, count: 1 }
        });
        console.log(`✅ Marcador de controle adicionado em ${targetKingdom.name}`);
      }
    }

    // 4. PERSISTÊNCIA DAS CARTAS DA BANDA
    // Move as cartas selecionadas para a área de bandas do jogador
    await this.prisma.card.updateMany({
      where: { id: { in: cardIds } },
      data: { 
        location: 'BAND', 
        ownerId: player.id,
        order: null // Sai do baralho definitivamente
      }
    });

    // Criamos o registro da banda no banco para histórico e pontuação posterior
    await this.prisma.band.create({
      data: {
        playerId: player.id,
        size: selectedCards.length,
        leaderId: leader.id,
        cards: { connect: cardIds.map(id => ({ id })) }
      }
    });

    // 5. A REGRA DE OURO (Regra p. 7, item 5):
    // "Quaisquer cartas restantes na sua mão devem ser descartadas viradas para cima 
    // ao lado do tabuleiro para que os jogadores as recrutem em seu turno."
    const remainingCards = player.hand.filter(c => !cardIds.includes(c.id));

    if (remainingCards.length > 0) {
      const remainingIds = remainingCards.map(c => c.id);
      
      await this.prisma.card.updateMany({
        where: { id: { in: remainingIds } },
        data: { 
          location: 'MARKET', // Vão para o mercado/tabuleiro
          ownerId: null,      // Perdem o dono
          order: null         // Não voltam para o deck
        }
      });
      console.log(`♻️  ${remainingCards.length} cartas foram movidas para o mercado.`);
    }

    // 6. Habilidades de Tribo (Opcional para a próxima etapa)
    // Aqui você chamaria this.abilityService.execute(leader.tribe, ...)
  }

  async _revealToMarket() {
    // Pega a carta do topo do deck
    const card = await this.prisma.card.findFirst({
      where: { gameStateId: this.state.gameId, location: 'DECK' },
      orderBy: { order: 'asc' } // Usando 'order' conforme seu schema
    });

    if (card) {
      await this.prisma.card.update({
        where: { id: card.id },
        data: { location: 'MARKET', order: null }
      });
    }
  }

  async drawFromMarket(playerId, cardId) {
    // Apenas move do mercado para a mão
    await this.prisma.card.update({
      where: { id: cardId },
      data: { location: 'HAND', ownerId: playerId }
    });
  }
}