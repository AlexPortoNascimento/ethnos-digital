// tests/engine/move.validator.spec.js
import { describe, it, expect } from 'vitest';
import { MoveValidator } from '../../src/engine/move.validator.js';

describe('MoveValidator', () => {
  const validator = new MoveValidator();

  it('deve validar uma banda se todas as cartas forem da mesma tribo', () => {
    const cards = [{ tribe: 'Giant', color: 'Red' }, { tribe: 'Giant', color: 'Blue' }];
    expect(validator.canPlayBand(cards)).toBe(true);
  });

  it('deve invalidar uma banda com tribos e cores diferentes', () => {
    const cards = [{ tribe: 'Giant', color: 'Red' }, { tribe: 'Wizard', color: 'Blue' }];
    expect(validator.canPlayBand(cards)).toBe(false);
  });

  it('não deve permitir recrutar se a mão tiver 10 cartas', () => {
    const player = { hand: new Array(10).fill({}) };
    expect(validator.canRecruit(player)).toBe(false);
  });
});