import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TerminalUI } from '../../src/ui/TerminalUI.js';

describe('TerminalUI', () => {
  let engineMock;
  let ui;

  beforeEach(() => {
    // Mock do Engine
    engineMock = {
      state: {
        currentAge: 1,
        players: [{ id: 1, name: 'P1', hand: [], points: 0 }],
        kingdoms: [],
        market: []
      },
      moveValidator: { canRecruit: vi.fn().mockReturnValue(true) },
      drawCard: vi.fn()
    };

    ui = new TerminalUI(engineMock);
    
    // Mock do PromptHandler interno para não abrir interface real no teste
    ui.prompts.mainMenu = vi.fn();
    ui.prompts.selectRecruitSource = vi.fn();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('deve executar recrutamento do deck quando o usuário escolher', async () => {
    ui.prompts.mainMenu.mockResolvedValue('RECRUIT');
    ui.prompts.selectRecruitSource.mockResolvedValue('DECK');

    await ui.runTurn(engineMock.state.players[0]);

    expect(engineMock.drawCard).toHaveBeenCalledWith(1, 'DECK');
  });

  it('deve exibir erro se o validador impedir o recrutamento', async () => {
    engineMock.moveValidator.canRecruit.mockReturnValue(false);
    ui.prompts.mainMenu.mockResolvedValue('RECRUIT');
    ui.prompts.wait = vi.fn();

    await ui.runTurn(engineMock.state.players[0]);

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Mão cheia'));
    expect(ui.prompts.wait).toHaveBeenCalled();
  });
});