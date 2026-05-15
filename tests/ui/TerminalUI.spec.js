import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TerminalUI } from '../../src/ui/TerminalUI.js';

describe('TerminalUI', () => {
  let logSpy;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('deve interromper o turno imediatamente se o terceiro dragão for revelado', async () => {
    const mockEngine = {
      state: { id: 1, currentAge: 1, players: [{ id: 1, name: 'P1' }], market: [], kingdoms: [] },
      initGame: vi.fn(),
      moveValidator: { canRecruit: vi.fn().mockReturnValue(true) },
      // Simula o 3º dragão sendo sorteado
      drawCard: vi.fn().mockResolvedValue({ type: 'DRAGON', count: 3, endOfAge: true })
    };

    const ui = new TerminalUI(mockEngine);
    
    // Mock do prompt para selecionar "RECRUIT" e depois "DECK"
    vi.spyOn(ui.prompts, 'mainMenu').mockResolvedValue('RECRUIT');
    vi.spyOn(ui.prompts, 'selectRecruitSource').mockResolvedValue('DECK');
    vi.spyOn(ui.prompts, 'wait').mockResolvedValue();

    await ui.executeRecruit(mockEngine.state.players[0]);

    // Pega todas as chamadas do console.log e junta em uma string limpa
    const allLogs = logSpy.mock.calls.map(call => call[0]).join('\n');
    const cleanLogs = allLogs.replace(/\u001b\[\d+m/g, ''); // Remove cores ANSI

    expect(cleanLogs).toContain("DRAGÃO FOI REVELADO");
    expect(cleanLogs).toContain("A ERA TERMINOU");
  });
});