import { describe, it, expect } from 'vitest';
import { ScoreCalculator } from '../../src/engine/score.calculator.js';

describe('ScoreCalculator', () => {
  const calculator = new ScoreCalculator();

  it('deve calcular corretamente os pontos baseados no tamanho da banda (Tabela pág. 9)', () => {
    const gameState = {
      players: [
        {
          id: 1,
          playedBands: [
            { size: 1 }, // 1 ponto
            { size: 3 }, // 6 pontos
            { size: 6 }  // 21 pontos
          ]
        }
      ]
    };

    const results = calculator.calculateAgeGlory(gameState);

    // Soma esperada: 1 + 6 + 21 = 28
    expect(results[0].gloryEarned).toBe(28);
  });

  it('deve limitar o bônus máximo para bandas maiores que 6', () => {
    const gameState = {
      players: [
        {
          id: 1,
          playedBands: [{ size: 10 }] // Deve valer o mesmo que tamanho 6 (21 pts)
        }
      ]
    };

    const results = calculator.calculateAgeGlory(gameState);
    expect(results[0].gloryEarned).toBe(21);
  });

  it('deve retornar 0 pontos para jogadores sem bandas', () => {
    const gameState = {
      players: [{ id: 2, playedBands: [] }]
    };

    const results = calculator.calculateAgeGlory(gameState);
    expect(results[0].gloryEarned).toBe(0);
  });

  it('deve calcular pontos para múltiplos jogadores simultaneamente', () => {
    const gameState = {
      players: [
        { id: 1, playedBands: [{ size: 2 }] }, // 3 pts
        { id: 2, playedBands: [{ size: 4 }] }  // 10 pts
      ]
    };

    const results = calculator.calculateAgeGlory(gameState);
    expect(results.find(r => r.playerId === 1).gloryEarned).toBe(3);
    expect(results.find(r => r.playerId === 2).gloryEarned).toBe(10);
  });
});