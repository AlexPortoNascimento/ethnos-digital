// tests/engine/game.engine.spec.js
import { describe, it, expect, vi } from 'vitest';
import { GameEngine } from '../../src/engine/game.engine.js';
import { ScoreCalculator } from '../../src/engine/score.calculator.js';

describe('GameEngine', () => {
  it('deve processar o fim da Era 1 e iniciar a Era 2 ao encontrar o 3º dragão', async () => {
    // 1. Mocks de infraestrutura
    const mockPrisma = {
      card: {
        // Simula a sequência: Dragão 1 -> Dragão 2 -> Dragão 3 -> (Fim de Era dispara) -> Próxima compra na Era 2
        findFirst: vi.fn()
          .mockResolvedValueOnce({ id: 101, tribe: 'Dragon', color: 'NONE' })
          .mockResolvedValueOnce({ id: 102, tribe: 'Dragon', color: 'NONE' })
          .mockResolvedValueOnce({ id: 103, tribe: 'Dragon', color: 'NONE' })
          .mockResolvedValue({ id: 104, tribe: 'WIZARD', color: 'BLUE' }),
        update: vi.fn().mockResolvedValue({}),
        findMany: vi.fn().mockResolvedValue([]), // Para o DeckService não quebrar
        updateMany: vi.fn().mockResolvedValue({})
      },
      // Mock para o evaluateEndAge e startNewAge não falharem ao persistir
      gameState: {
        update: vi.fn().mockResolvedValue({})
      }
    };

    const mockDeck = { 
      setupDeckForNewAge: vi.fn().mockResolvedValue([]) 
    };
    
    const mockValidator = { 
      canRecruit: vi.fn().mockReturnValue(true) 
    };
    
    const scoreCalculator = new ScoreCalculator();

    // 2. Instanciação
    const engine = new GameEngine(mockPrisma, mockDeck, mockValidator, scoreCalculator);
    
    // Setup de estado inicial (Era 1, 0 dragões)
    engine.state.gameId = 1;
    engine.state.currentAge = 1;
    engine.state.dragonsFound = 0;
    engine.state.players = [{ id: 1, name: 'Jogador 1', hand: [], playedBands: [] }];

    // 3. Execução
    // Esta chamada vai disparar a recursividade: compra D1 -> D2 -> D3 -> evaluateEndAge -> startNewAge
    await engine.drawCard(1, 'DECK');

    // 4. Verificações do "Estado Final"
    
    // A Era deve ter avançado para 2
    expect(engine.state.currentAge).toBe(2);

    // O contador de dragões DEVE ser 0, pois startNewAge() reseta para a nova Era
    // Isso prova que o ciclo de vida do jogo está correto conforme o manual
    expect(engine.state.dragonsFound).toBe(0);

    // Garante que o serviço de baralho foi chamado para preparar a Era 2
    expect(mockDeck.setupDeckForNewAge).toHaveBeenCalled();
  });
});