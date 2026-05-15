import { describe, it, expect, vi } from 'vitest';
import { DeckService } from '../../src/engine/deck.service.js';

describe('DeckService', () => {
  it('deve colocar os dragões apenas na metade inferior do baralho', async () => {
    // Mock do Prisma com suporte a toUpperCase e ID numérico
    const mockPrisma = {
      card: {
        findMany: vi.fn().mockResolvedValue([
          { id: 1, tribe: 'Dragon' }, { id: 2, tribe: 'Dragon' }, { id: 3, tribe: 'Dragon' },
          ...Array(10).fill({ id: 99, tribe: 'Wizard' }) 
        ]),
        update: vi.fn(),
        updateMany: vi.fn()
      },
      $transaction: vi.fn(promises => Promise.all(promises))
    };

    const service = new DeckService(mockPrisma);
    
    // Passamos o número 1 para evitar erro de parse no log
    const deck = await service.setupDeckForNewAge(1);

    // As primeiras 5 cartas (metade superior de 13 cartas) não podem conter dragões
    const topHalf = deck.slice(0, 5);
    const containsDragon = topHalf.some(c => c.tribe?.toUpperCase() === 'DRAGON');
    
    expect(containsDragon).toBe(false);
    expect(deck.length).toBe(13);
  });
});