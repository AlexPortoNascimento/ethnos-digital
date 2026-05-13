import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Renderer } from '../../../src/ui/components/Renderer.js';
import chalk from 'chalk';

describe('Renderer', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'clear').mockImplementation(() => {});
  });

  it('deve renderizar o cabeçalho com os dados do estado', () => {
    const state = { currentAge: 1, dragonsFound: 0 };
    const player = { name: 'Player 1', points: 10 };

    Renderer.renderHeader(state, player);

    expect(console.clear).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('ETHNOS DIGITAL'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Era: 1'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Player 1 (10 pts)'));
  });

  it('deve exibir "Vazio" quando o mercado estiver sem cartas', () => {
    Renderer.renderMarket([]);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('(Vazio)'));
  });
});