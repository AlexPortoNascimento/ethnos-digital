export class DeckService {
  /**
   * @param {import('@prisma/client').PrismaClient} prisma
   */
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Prepara o baralho para uma nova Era.
   * @param {string} gameStateId - ID do estado do jogo atual.
   * @param {number} numPlayers - Número de jogadores para calcular o mercado.
   */
  async setupDeckForNewAge(gameStateId, numPlayers) {
    // 1. Recuperar todas as cartas do banco que pertencem a este jogo
    const allCards = await this.prisma.card.findMany({
      where: { gameStateId },
    });

    // 2. Separar as cartas especiais (Dragões) das comuns (Tribos)
    const dragons = allCards.filter(c => c.tribe === 'Dragon');
    const tribeCards = allCards.filter(c => c.tribe !== 'Dragon');

    // 3. Embaralhamento inicial das cartas de tribo
    let mainDeck = this._shuffle(tribeCards);

    // 4. Regra de Início de Era (Manual p. 5):
    // - Cada jogador recebe 1 carta (isso será feito pelo GameEngine, mas o deck precisa estar pronto)
    // - Mercado recebe 2x número de jogadores
    // Aqui apenas preparamos a lógica de divisão do deck remanescente
    
    // Simulação da separação para o "terço final" ou "metade inferior" 
    const midPoint = Math.floor(mainDeck.length / 2);
    const topHalf = mainDeck.slice(0, midPoint);
    const bottomHalf = mainDeck.slice(midPoint);

    // 5. Adicionar Dragões à metade inferior e embaralhar essa metade
    const bottomWithDragons = this._shuffle([...bottomHalf, ...dragons]);

    // 6. Recombinar o baralho (Top + Bottom com Dragões)
    const finalDeckOrder = [...topHalf, ...bottomWithDragons];

    // 7. Persistir a nova ordem no banco
    // Atualizamos o campo 'order' (ou similar) de cada carta para refletir a pilha
    const updates = finalDeckOrder.map((card, index) => 
      this.prisma.card.update({
        where: { id: card.id },
        data: { 
          order: index,
          location: 'DECK', // Garante que voltem ao deck no início da Era
          slotIndex: null   // Limpa slots de mercado anteriores
        }
      })
    );

    await this.prisma.$transaction(updates);
    
    return finalDeckOrder;
  }

  /**
   * Algoritmo Fisher-Yates para embaralhamento puro.
   * @private
   */
  _shuffle(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
}