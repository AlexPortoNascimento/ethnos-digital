import { describe, it, expect } from 'vitest';
import { ScoreCalculator } from '../../src/engine/score.calculator.js';

describe('ScoreCalculator', () => {
  const calculator = new ScoreCalculator();

  // Helper para criar um estado básico que não quebre o calculador
  const createMockState = (players) => ({
    currentAge: 1,
    players: players.map(p => ({ ...p, playedBands: p.playedBands || [] })),
    kingdoms: [] // Adicionado para evitar erro de 'forEach'
  });

  it('deve calcular corretamente os pontos baseados no tamanho da banda (Tabela pág. 9)', () => {
    const gameState = createMockState([
      {
        id: 1,
        playedBands: [{ size: 1 }, { size: 3 }, { size: 6 }]
      }
    ]);

    const results = calculator.calculateAgeGlory(gameState);
    expect(results[0].gloryEarned).toBe(28); // 1 + 6 + 21
  });

  it('deve limitar o bônus máximo para bandas maiores que 6', () => {
    const gameState = createMockState([
      { id: 1, playedBands: [{ size: 10 }] }
    ]);

    const results = calculator.calculateAgeGlory(gameState);
    expect(results[0].gloryEarned).toBe(21);
  });

  it('deve retornar 0 pontos para jogadores sem bandas', () => {
    const gameState = createMockState([{ id: 2, playedBands: [] }]);
    const results = calculator.calculateAgeGlory(gameState);
    expect(results[0].gloryEarned).toBe(0);
  });
});