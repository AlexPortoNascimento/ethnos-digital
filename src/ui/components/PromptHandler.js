// src/ui/components/PromptHandler.js
import inquirer from 'inquirer';
import chalk from 'chalk';
import { Renderer } from './Renderer.js'; // Importamos o Renderer para usar o getStyle unificado

export class PromptHandler {
  
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
      // Pega o estilo baseado na cor da carta (ex: 'GIANT', 'ELF', 'WIZARD')
      const style = Renderer.getStyle(c.color);
      
      choices.push({
        // REMOVIDO o "Cor: ..." para exibir apenas o bloco da tribo colorido
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
      choices,
      loop: false
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
        const style = Renderer.getStyle(c.color);
        return {
          // REMOVIDO o "(${c.color})" para ficar idêntico ao padrão do resto do jogo
          name: style(`[${c.tribe}]`),
          value: c.id
        };
      }),
      loop: false,
      validate: (answer) => {
        if (answer.length < 1) return 'Você deve selecionar pelo menos uma carta.';
        return true;
      }
    }]);
    return selectedIds;
  }

  /**
   * Escolha do líder (Regra pág. 7)
   */
  async selectLeader(selectedCards) {
    const { leaderId } = await inquirer.prompt([{
      type: 'select',
      name: 'leaderId',
      message: 'Quem será o Líder do bando? (A cor define o Reino e a tribo ativa a habilidade)',
      choices: selectedCards.map(c => {
        // CORREÇÃO: Aplicado o estilo unificado para o menu de escolha do líder
        const style = Renderer.getStyle(c.color);
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