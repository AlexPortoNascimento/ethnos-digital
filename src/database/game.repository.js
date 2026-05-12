export class GameRepository {
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Carrega o estado completo de um jogo e converte em objetos de domínio
   */
  async getGameById(gameId) {
    const data = await this.prisma.gameState.findUnique({
      where: { id: gameId },
      include: {
        players: { include: { hand: true, bands: { include: { cards: true } } } },
        kingdoms: { include: { controlMarkers: true } },
        cards: true, // Inclui o baralho e mercado
      }
    });

    if (!data) return null;

    // Mapeamento: Transformando dados do Prisma em instâncias de classes
    // Isso garante que você possa chamar métodos como player.addCard() depois
    return {
      id: data.id,
      currentAge: data.currentAge,
      dragonsFound: data.dragonsFound,
      players: data.players.map(p => this._mapPlayer(p)),
      kingdoms: data.kingdoms, // Se Kingdom for apenas dados, pode manter assim
      deck: data.cards.filter(c => c.location === 'DECK'),
      market: data.cards.filter(c => c.location === 'MARKET')
    };
  }

  /**
   * Salva o estado atual do GameEngine de volta no banco
   */
  async save(engineState) {
    const { gameId, currentAge, dragonsFound } = engineState;

    return await this.prisma.gameState.update({
      where: { id: gameId },
      data: {
        currentAge,
        dragonsFound,
        // Aqui você faria updates em massa ou específicos
        // Exemplo: atualizar o placar dos jogadores
      }
    });
  }

  /**
   * Helper privado para instanciar a classe Player
   * @private
   */
  _mapPlayer(playerData) {
    // Aqui você daria um 'new Player()' se tiver a classe definida
    // Por enquanto, retorna um objeto estruturado
    return {
      id: playerData.id,
      name: playerData.name,
      glory: playerData.glory,
      hand: playerData.hand, // Cartas na mão
      playedBands: playerData.bands
    };
  }
}