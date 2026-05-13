import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TerminalUI } from '../../src/ui/TerminalUI.js';

describe('TerminalUI', () => {
  let engineMock;
  let ui;

  beforeEach(() => {
    engineMock = {
      state: {
        id: 1,
        currentAge: 1,
        players: [{ id: 1, name: 'Jogador 1', hand: [], points: 0 }],
        kingdoms: [],
        market: []
      },
      initGame: vi.fn().mockImplementation(async () => engineMock.state),
      moveValidator: { canRecruit: vi.fn().mockReturnValue(true) },
      drawCard: vi.fn().mockResolvedValue({})
    };

    ui = new TerminalUI(engineMock);
    ui.prompts.mainMenu = vi.fn();
    ui.prompts.selectRecruitSource = vi.fn();
    ui.prompts.wait = vi.fn().mockResolvedValue();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('deve executar recrutamento do deck quando o usuário escolher', async () => {
    ui.prompts.mainMenu.mockResolvedValueOnce('RECRUIT');
    ui.prompts.selectRecruitSource.mockResolvedValueOnce('DECK');

    await ui.runTurn(engineMock.state.players[0]);

    expect(engineMock.drawCard).toHaveBeenCalled();
  });

  it('deve exibir erro se o validador impedir o recrutamento', async () => {
    // 1. Bloqueia o recrutamento
    engineMock.moveValidator.canRecruit.mockReturnValue(false);
    
    // 2. Simula a escolha de recrutamento
    ui.prompts.mainMenu.mockResolvedValueOnce('RECRUIT'); 

    // 3. Forçamos o prompt de espera a lançar uma exceção de escape controlada.
    // Assim que a UI exibir o erro e chamar o `wait()`, o teste sai do loop de vez!
    ui.prompts.wait.mockRejectedValueOnce(new Error('BREAK_LOOP'));

    // 4. Executa esperando a nossa quebra de fluxo controlada
    try {
      await ui.runTurn(engineMock.state.players[0]);
    } catch (err) {
      if (err.message !== 'BREAK_LOOP') throw err;
    }

    // 5. Asserts de validação
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Mão cheia'));
    expect(ui.prompts.wait).toHaveBeenCalled();
  });
});