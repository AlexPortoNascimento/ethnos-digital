// src/engine/deck.service.js

export class DeckService {
  /**
   * @param {import('@prisma/client').PrismaClient} prisma
   */
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Prepara o baralho para uma nova Era seguindo estritamente o Manual.
   * @param {number} gameStateId - ID do jogo.
   * @param {number} numPlayers - Usado para definir o tamanho do mercado (2 * numPlayers).
   */
  async setupDeckForNewAge(gameStateId, numPlayers) {
    const gameId = parseInt(gameStateId);

    // 1. Carregar todas as cartas vinculadas ao jogo
    let allCards = await this.prisma.card.findMany({
      where: { gameStateId: gameId }
    });

    // Setup inicial (Era 1) se não houver cartas
    if (allCards.length === 0) {
      const baseCards = await this.prisma.card.findMany({ where: { gameStateId: null } });
      if (baseCards.length === 0) throw new Error("Execute o seed primeiro!");
      
      await this.prisma.card.updateMany({
        where: { gameStateId: null },
        data: { gameStateId: gameId }
      });
      allCards = await this.prisma.card.findMany({ where: { gameStateId: gameId } });
    }

    // 2. RECOLHIMENTO TOTAL (Manual Pág. 11)
    // "Discard all Ally cards, both from players' hands and from played Bands."
    // No código: todas as cartas voltam, independente da location antiga.
    const dragons = allCards.filter(c => 
      c.tribe?.toUpperCase() === 'DRAGON' || c.isDragon === true
    );
    const tribeCards = allCards.filter(c => 
      c.tribe?.toUpperCase() !== 'DRAGON' && c.isDragon !== true
    );

    // 3. MONTAGEM DO MERCADO (Manual Pág. 4)
    // "Draw cards from the deck and place them face up... twice as many as the number of players."
    // IMPORTANTE: Isso é feito ANTES de colocar os dragões no deck.
    let shuffledTribes = this._shuffle(tribeCards);
    
    const marketSize = numPlayers * 2;
    const marketCards = shuffledTribes.slice(0, marketSize);
    const remainingTribes = shuffledTribes.slice(marketSize);

    // 4. DIVISÃO DO DECK E DRAGÕES (Manual Pág. 5)
    // Divide as tribos restantes ao meio e coloca os 3 dragões na metade inferior.
    const midPoint = Math.floor(remainingTribes.length / 2);
    const topHalf = remainingTribes.slice(0, midPoint);
    const bottomHalf = remainingTribes.slice(midPoint);

    // Adiciona os dragões e reembaralha apenas a metade de baixo
    const bottomWithDragons = this._shuffle([...bottomHalf, ...dragons]);

    // Baralho final: Metade superior (sem dragões) + Metade inferior (com dragões)
    const finalDeck = [...topHalf, ...bottomWithDragons];

    // 5. PERSISTÊNCIA (Transação para garantir integridade)
    const operations = [];

    // Limpar mãos e bandas antigas, mover para o Mercado
    marketCards.forEach(c => {
      operations.push(this.prisma.card.update({
        where: { id: c.id },
        data: { location: 'MARKET', order: null, ownerId: null, bandId: null }
      }));
    });

    // Atualizar o Deck
    finalDeck.forEach((c, index) => {
      operations.push(this.prisma.card.update({
        where: { id: c.id },
        data: { location: 'DECK', order: index + 1, ownerId: null, bandId: null }
      }));
    });

    await this.prisma.$transaction(operations);

    console.log(`✅ Era preparada: ${marketCards.length} no mercado, ${finalDeck.length} no deck.`);
    return { market: marketCards, deck: finalDeck };
  }

  /**
   * Algoritmo Fisher-Yates
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