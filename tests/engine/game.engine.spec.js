// tests/engine/game.engine.spec.js
import { describe, it, expect, vi } from 'vitest';
import { GameEngine } from '../../src/engine/game.engine.js';

describe('GameEngine', () => {
  it('deve incrementar dragonsFound ao comprar um dragão', async () => {
    const mockPrisma = {
      card: {
        findFirst: vi.fn().mockResolvedValue({ id: 'd1', tribe: 'Dragon' }),
        update: vi.fn()
      }
    };
    const mockDeck = { setupDeckForNewAge: vi.fn() };
    const mockValidator = { canRecruit: vi.fn().mockReturnValue(true) };

    const engine = new GameEngine(mockPrisma, mockDeck, mockValidator);
    engine.state.gameId = 'g1';
    
    await engine.drawCard('p1', 'DECK');
    
    expect(engine.state.dragonsFound).toBe(1);
  });
});