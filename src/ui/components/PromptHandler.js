import inquirer from 'inquirer';
import chalk from 'chalk';

export class PromptHandler {
  async mainMenu() {
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'Sua jogada:',
      choices: [
        { name: '🔹 Recrutar Aliado', value: 'RECRUIT' },
        { name: '🎴 Jogar um Bando', value: 'PLAY_BAND' }
      ]
    }]);
    return action;
  }

  async selectRecruitSource(marketCards) {
    const choices = [
      { name: chalk.bold('Comprar do Topo do Baralho 🎴'), value: 'DECK' },
      new inquirer.Separator('--- Mercado ---')
    ];

    marketCards.forEach(c => {
      choices.push({
        name: `${chalk.keyword(c.color.toLowerCase())(c.tribe)}`,
        value: c.id
      });
    });

    const { target } = await inquirer.prompt([{
      type: 'list',
      name: 'target',
      message: 'Escolha a carta:',
      choices
    }]);
    return target;
  }

  async selectBandCards(hand) {
    const { selectedIds } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'selectedIds',
      message: 'Selecione as cartas para o bando:',
      choices: hand.map(c => ({
        name: `${c.tribe} (${c.color})`,
        value: c.id
      }))
    }]);
    return selectedIds;
  }

  async wait() {
    await inquirer.prompt([{ type: 'input', name: 'k', message: '\nPressione Enter para continuar...' }]);
  }
}