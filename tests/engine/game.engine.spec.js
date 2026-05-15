import { describe, it, expect, vi } from 'vitest';
import { GameEngine } from '../../src/engine/game.engine.js';
import { ScoreCalculator } from '../../src/engine/score.calculator.js'

describe('GameEngine', () => {
  it('deve processar o fim da Era 1 e iniciar a Era 2 ao encontrar o 3º dragão', async () => {
    let dragonsCount = 2;
    let currentAge = 1;

    const mockPrisma = {
      gameState: {
        update: vi.fn().mockImplementation(({ data }) => {
          if (data.dragonsFound?.increment) dragonsCount++;
          // Quando a era vira no evaluateEndAge:
          if (data.currentAge?.increment) currentAge++;
          // Quando reseta para a nova era no startNewAge:
          if (data.dragonsFound === 0) dragonsCount = 0;
          
          return Promise.resolve({ id: 1, dragonsFound: dragonsCount, currentAge });
        }),
        findUnique: vi.fn().mockImplementation(() => Promise.resolve({
          id: 1, currentAge, dragonsFound: dragonsCount, players: [], kingdoms: [], cards: []
        }))
      },
      card: {
        findFirst: vi.fn().mockResolvedValue({ id: 103, tribe: 'DRAGON', isDragon: true }),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({}),
        deleteMany: vi.fn().mockResolvedValue({})
      },
      band: { deleteMany: vi.fn().mockResolvedValue({}) },
      player: { update: vi.fn().mockResolvedValue({}) }
    };

    const mockDeckService = { setupDeckForNewAge: vi.fn().mockResolvedValue({ market: [], deck: [] }) };
    const engine = new GameEngine(mockPrisma, mockDeckService, {}, new ScoreCalculator());
    
    engine.state = { 
      id: 1, currentAge: 1, dragonsFound: 2, 
      players: [{ id: 1, hand: [], playedBands: [] }], 
      kingdoms: [] 
    };

    const result = await engine.drawCard(1);

    // O waitFor agora terá sucesso porque currentAge é incrementado no mock
    await vi.waitFor(() => {
      if (engine.state.currentAge !== 2) throw new Error("Ainda não virou");
    });

    expect(result.endOfAge).toBe(true);
    expect(engine.state.currentAge).toBe(2);
  });
});