// tests/engine/game.engine.spec.js
import { describe, it, expect, vi } from 'vitest';
import { GameEngine } from '../../src/engine/game.engine.js';
import { ScoreCalculator } from '../../src/engine/score.calculator.js';

describe('GameEngine', () => {
  it('deve processar o fim da Era 1 e iniciar a Era 2 ao encontrar o 3º dragão', async () => {
    let dragonsInDb = 0;
    
    // Pilha controlada para evitar loops infinitos de recursão
    const deckStack = [
      { id: 101, tribe: 'DRAGON', isDragon: true },
      { id: 102, tribe: 'DRAGON', isDragon: true },
      { id: 103, tribe: 'DRAGON', isDragon: true },
      { id: 104, tribe: 'WIZARD', isDragon: false },
      { id: 105, tribe: 'ELF', isDragon: false },
      { id: 106, tribe: 'ORC', isDragon: false }
    ];

    const mockPrisma = {
      card: {
        findFirst: vi.fn().mockImplementation(() => Promise.resolve(deckStack.shift() || null)),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({})
      },
      gameState: {
        update: vi.fn().mockImplementation(({ data }) => {
          if (data.dragonsFound?.increment) dragonsInDb++;
          if (data.dragonsFound === 0) dragonsInDb = 0;
          return Promise.resolve({ id: 1, dragonsFound: dragonsInDb, currentAge: data.currentAge || 1 });
        }),
        findUnique: vi.fn().mockResolvedValue({
          id: 1, currentAge: 2, dragonsFound: 0,
          players: [{ id: 1, name: 'Jogador 1', cards: [], markers: [], playedBands: [] }], 
          kingdoms: [], cards: []
        })
      },
      player: { update: vi.fn().mockResolvedValue({}) }
    };

    const scoreCalculator = new ScoreCalculator();
    // Garante que o cálculo de glória retorne um array vazio esperado e não quebre
    vi.spyOn(scoreCalculator, 'calculateAgeGlory').mockReturnValue([]);

    const engine = new GameEngine(mockPrisma, { setupDeckForNewAge: vi.fn() }, {}, scoreCalculator);
    
    // Injeta playedBands aqui também para blindar o estado inicial em memória
    engine.state = { 
      id: 1, 
      currentAge: 1, 
      dragonsFound: 0, 
      players: [{ id: 1, name: 'Jogador 1', hand: [], playedBands: [] }], 
      kingdoms: [], 
      market: [] 
    };

    await engine.drawCard(1);

    expect(engine.state.currentAge).toBe(2);
    expect(engine.state.dragonsFound).toBe(0);
  });
});