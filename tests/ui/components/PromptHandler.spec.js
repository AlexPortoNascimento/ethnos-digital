// tests/ui/components/PromptHandler.spec.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PromptHandler } from '../../../src/ui/components/PromptHandler.js';
import inquirer from 'inquirer';

vi.mock('inquirer');

describe('PromptHandler', () => {
  const handler = new PromptHandler();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar a ação selecionada no menu principal', async () => {
    inquirer.prompt.mockResolvedValue({ action: 'RECRUIT' });

    const result = await handler.mainMenu();

    expect(result).toBe('RECRUIT');
    expect(inquirer.prompt).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ name: 'action', type: 'select' })
    ]));
  });

  it('deve mapear corretamente as cartas da mão no seletor de bando', async () => {
    const hand = [
      { id: 1, tribe: 'GIANT', color: 'RED' },
      { id: 2, tribe: 'WIZARD', color: 'BLUE' }
    ];
    inquirer.prompt.mockResolvedValue({ selectedIds: [1] });

    const result = await handler.selectBandCards(hand);

    expect(result).toEqual([1]);
    const promptConfig = inquirer.prompt.mock.calls[0][0][0];
    expect(promptConfig.choices).toHaveLength(4);
    expect(promptConfig.choices[0].name).toContain('GIANT');
  });
});