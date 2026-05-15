// src/engine/deck.service.js

export class DeckService {
  /**
   * @param {import('@prisma/client').PrismaClient} prisma
   */
  constructor(prisma) {
    this.prisma = prisma;
  }

  /**
   * Prepara o baralho para uma nova Era.
   * @param {number} gameStateId - ID do estado do jogo atual.
   * @param {number} numPlayers - Número de jogadores para calcular o mercado.
   */
  async setupDeckForNewAge(gameStateId, numPlayers) {
    const gameId = parseInt(gameStateId);
    // 1. Verificar se este jogo já possui cartas vinculadas a ele (Eras 2 ou 3)
    let gameCards = await this.prisma.card.findMany({
      where: { gameStateId: gameId }
    });

    // Se for a Era 1, o jogo não tem cartas ainda. Vamos pegar as cartas globais do Seed
    // e associá-las a este jogo.
    if (gameCards.length === 0) {
      console.log(`🃏 Inicializando baralho da Era 1 para o Jogo #${gameId}...`);

      // Buscamos as cartas base criadas pelo seed
      const baseCards = await this.prisma.card.findMany({
        where: { gameStateId: null }
      });

      if (baseCards.length === 0) {
        throw new Error("Nenhuma carta base encontrada no banco de dados. Rode 'npx prisma db seed' primeiro.");
      }

      // Vincula todas as cartas do seed para este jogo específico
      await this.prisma.card.updateMany({
        where: { gameStateId: null },
        data: { gameStateId: gameId }
      });

      // Recarrega as cartas agora devidamente vinculadas
      gameCards = await this.prisma.card.findMany({
        where: { gameStateId: gameId }
      });
    } else {
      console.log(`🃏 Recolhendo e reembaralhando cartas para a próxima Era do Jogo #${gameId}...`);
    }

    // 2. CORREÇÃO DA CAIXA ALTA: Filtrar usando 'DRAGON' em maiúsculo (conforme gerado no seed)
    // Recolhemos também para o deck as cartas que porventura estavam no mercado ou descartadas,
    // mas mantemos as cartas que estão na mão dos jogadores ('HAND') intocadas se o manual mandar reter,
    // ou resetamos tudo que não for HAND. No Ethnos, as mãos continuam entre as Eras!
    const cardsToShuffle = gameCards.filter(c => c.location !== 'HAND');

    const dragons = cardsToShuffle.filter(c => c.tribe?.toUpperCase() === 'DRAGON' || c.isDragon === true );
    const tribeCards = cardsToShuffle.filter(c => c.tribe?.toUpperCase() !== 'DRAGON' && c.isDragon !== true);
    
    // 3. Embaralhamento inicial das cartas de tribo
    let mainDeck = this._shuffle(tribeCards);

    // 4. Regra de Início de Era (Manual p. 5):
    // Divisão do deck para colocar os dragões na metade inferior
    const midPoint = Math.floor(mainDeck.length / 2);
    const topHalf = mainDeck.slice(0, midPoint);
    const bottomHalf = mainDeck.slice(midPoint);

    // 5. Adicionar Dragões à metade inferior e embaralhar essa metade
    const bottomWithDragons = this._shuffle([...bottomHalf, ...dragons]);

    // 6. Recombinar o baralho (Top + Bottom com Dragões)
    const finalDeckOrder = [...topHalf, ...bottomWithDragons];

    // 7. Persistir a nova ordem e a localização 'DECK' no banco
    const updates = finalDeckOrder.map((card, index) =>
      this.prisma.card.update({
        where: { id: card.id },
        data: {
          order: index + 1, // Evita order 0 para não confundir com falsy
          location: 'DECK',
          ownerId: null // Garante que perderam o dono antigo (caso estivessem no mercado)
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