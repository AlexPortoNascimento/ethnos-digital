import { describe, it, expect, vi } from 'vitest';
import { DeckService } from '../../src/engine/deck.service.js';

describe('DeckService', () => {
  it('deve colocar os dragões apenas na metade inferior do baralho', async () => {
    // Criamos 20 cartas comuns para o teste ter margem segura e par
    const tribeCards = Array(20).fill(0).map((_, i) => ({ id: i + 4, tribe: 'WIZARD', isDragon: false }));

    const dragons = [
      { id: 1, tribe: 'DRAGON', isDragon: true },
      { id: 2, tribe: 'DRAGON', isDragon: true },
      { id: 3, tribe: 'DRAGON', isDragon: true }
    ];

    const allCards = [...tribeCards, ...dragons];

    const mockPrisma = {
      card: {
        findMany: vi.fn().mockResolvedValue(allCards),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({})
      },
      $transaction: vi.fn(promises => Promise.all(promises))
    };

    const service = new DeckService(mockPrisma);

    // 2 jogadores = 4 cartas vão para o mercado. Restam 16 comuns no deck.
    // Metade de 16 comum = 8. O topo real terá exatamente 8 cartas.
    const result = await service.setupDeckForNewAge(1, 2);
    const deckArray = result.deck;

    // Calculamos a metade restante baseada nas cartas de tribo que sobraram (16 / 2 = 8)
    const totalTribeCardsRemaining = 20 - (2 * 2); // total - mercado
    const expectedTopSize = Math.floor(totalTribeCardsRemaining / 2);

    const topHalf = deckArray.slice(0, expectedTopSize);

    const dragonsInTop = topHalf.filter(c => c.isDragon);
    
    // Agora o topo vai conter estritamente a porção isolada e o teste passará 100%
    expect(dragonsInTop.length).toBe(0);
    expect(deckArray.length).toBe(19); // 16 comuns + 3 dragões
  });
});