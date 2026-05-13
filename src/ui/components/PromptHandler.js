import inquirer from 'inquirer';
import chalk from 'chalk';

export class PromptHandler {
  // Mapa de cores seguro (mesmo do Renderer)
  static colorMap = {
    red: chalk.red,
    blue: chalk.blue,
    green: chalk.green,
    yellow: chalk.yellow,
    purple: chalk.magenta,
    orange: chalk.hex('#FFA500'),
    grey: chalk.gray,
    white: chalk.white,
    none: chalk.white
  };

  static getStyle(colorName) {
    return this.colorMap[colorName?.toLowerCase()] || chalk.white;
  }

  async mainMenu() {
    const { action } = await inquirer.prompt([{
      type: 'select',
      name: 'action',
      message: 'Sua vez! O que deseja fazer?',
      choices: [
        { name: '🃏 Recrutar Aliado (Comprar carta)', value: 'RECRUIT' },
        { name: '🛡️  Jogar um Bando (Baixar cartas)', value: 'PLAY_BAND' }
      ]
    }]);
    return action;
  }

  async selectRecruitSource(marketCards) {
    const choices = [
      { name: chalk.bold('✨ Comprar do Topo do Baralho'), value: 'DECK' },
      new inquirer.Separator('--- Mercado ---')
    ];

    marketCards.forEach(c => {
      const style = PromptHandler.getStyle(c.color);
      choices.push({
        name: style(`[${c.tribe}]`),
        value: c.id
      });
    });

    choices.push(new inquirer.Separator());
    choices.push({ name: '⬅️  Voltar', value: 'BACK' });

    const { target } = await inquirer.prompt([{
      type: 'select',
      name: 'target',
      message: 'Escolha uma carta para sua mão:',
      choices
    }]);
    return target;
  }

  async selectBandCards(hand) {
    if (hand.length === 0) return [];

    const { selectedIds } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'selectedIds',
      message: 'Selecione as cartas que formarão seu bando (Espaço para marcar, Enter para confirmar):',
      choices: hand.map(c => {
        const style = PromptHandler.getStyle(c.color);
        return {
          name: style(`${c.tribe} (${c.color})`),
          value: c.id
        };
      }),
      validate: (answer) => {
        if (answer.length < 1) return 'Você deve selecionar pelo menos uma carta.';
        return true;
      }
    }]);
    return selectedIds;
  }

  /**
   * NOVO: Escolha do líder (Regra pág. 7)
   */
  async selectLeader(selectedCards) {
    const { leaderId } = await inquirer.prompt([{
      type: 'select',
      name: 'leaderId',
      message: 'Quem será o Líder do bando? (A cor define o Reino e a tribo ativa a habilidade)',
      choices: selectedCards.map(c => {
        const style = PromptHandler.getStyle(c.color);
        return {
          name: style(`${c.tribe} - Reino ${c.color}`),
          value: c.id
        };
      })
    }]);
    return leaderId;
  }

  async wait() {
    await inquirer.prompt([{ type: 'input', name: 'k', message: '\nPressione Enter para continuar...' }]);
  }

  // Métodos de Setup (Início do Jogo)
  async askPlayerCount() {
    const { count } = await inquirer.prompt([{
      type: 'select',
      name: 'count',
      message: 'Quantas pessoas vão jogar?',
      choices: [
        { name: '3 Jogadores', value: 3 },
        { name: '4 Jogadores', value: 4 },
        { name: '5 Jogadores', value: 5 },
        { name: '6 Jogadores', value: 6 },
      ]
    }]);
    return count;
  }

  async askPlayerNames(count) {
    const questions = [];
    for (let i = 1; i <= count; i++) {
      questions.push({
        type: 'input',
        name: `player_${i}`,
        message: `Nome do Jogador ${i}:`,
        validate: (input) => input.trim() !== '' || 'O nome não pode estar vazio.'
      });
    }
    const answers = await inquirer.prompt(questions);
    return Object.values(answers);
  }
}