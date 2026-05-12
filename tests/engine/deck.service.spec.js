// tests/engine/deck.service.spec.js
import { describe, it, expect, vi } from 'vitest';
import { DeckService } from '../../src/engine/deck.service.js';

describe('DeckService', () => {
  it('deve colocar os dragões apenas na metade inferior do baralho', async () => {
    // Mock do Prisma
    const mockPrisma = {
      card: {
        findMany: vi.fn().mockResolvedValue([
          { id: 1, tribe: 'Dragon' }, { id: 2, tribe: 'Dragon' }, { id: 3, tribe: 'Dragon' },
          ...Array(10).fill({ id: 99, tribe: 'Wizard' }) // 10 cartas comuns
        ]),
        update: vi.fn()
      },
      $transaction: vi.fn(promises => Promise.all(promises))
    };

    const service = new DeckService(mockPrisma);
    const deck = await service.setupDeckForNewAge('game-1');

    // As primeiras cartas não podem ser dragões (pela proporção do nosso mock)
    // Na regra real com 75 cartas, os dragões ficam após a posição ~35
    const topHalf = deck.slice(0, 5);
    const containsDragon = topHalf.some(c => c.tribe === 'Dragon');
    
    expect(containsDragon).toBe(false);
    expect(deck.length).toBe(13);
  });
});