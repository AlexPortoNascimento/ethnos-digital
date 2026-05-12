import chalk from 'chalk';
import { Renderer } from './components/Renderer.js';
import { PromptHandler } from './components/PromptHandler.js';

export class TerminalUI {
  constructor(engine) {
    this.engine = engine;
    this.prompts = new PromptHandler();
  }

  async start() {
    console.log(chalk.gray("Iniciando interface gráfica...")); // DEBUG
    
    if (!this.engine.state.players || this.engine.state.players.length === 0) {
      console.log(chalk.red("Erro: Estado do jogo não possui jogadores carregados."));
      return;
    }

    while (this.engine.state.currentAge <= 3) {
      for (const player of this.engine.state.players) {
        if (this.engine.state.currentAge > 3) break;
        await this.runTurn(player);
      }
    }
    console.log(chalk.bold.green("\nFIM DE JOGO! OBRIGADO POR JOGAR."));
  }

  async runTurn(player) {
    const initialAge = this.engine.state.currentAge;
    
    // 1. Renderização
    Renderer.renderHeader(this.engine.state, player);
    Renderer.renderKingdoms(this.engine.state.kingdoms);
    Renderer.renderMarket(this.engine.state.market);
    this.showHand(player);

    // 2. Ação do Usuário
    try {
      const action = await this.prompts.mainMenu();
      if (action === 'RECRUIT') {
        await this.executeRecruit(player);
      } else {
        await this.executePlayBand(player);
      }
    } catch (err) {
      console.log(chalk.bgRed(`\n ERRO: ${err.message} `));
      await this.prompts.wait();
    }

    // 3. Verificação de Transição (Fim de Era)
    if (this.engine.state.currentAge > initialAge) {
      console.log(chalk.bgYellow.black(`\n--- FIM DA ERA ${initialAge}! ---`));
      await this.prompts.wait();
    }
  }

  async executeRecruit(player) {
    if (!this.engine.moveValidator.canRecruit(player)) {
      throw new Error("Mão cheia (limite 10). Jogue um bando!");
    }

    const target = await this.prompts.selectRecruitSource(this.engine.state.market);
    if (target === 'DECK') {
      await this.engine.drawCard(player.id, 'DECK');
    } else {
      await this.engine.drawFromMarket(player.id, target);
    }
  }

  async executePlayBand(player) {
    const selectedIds = await this.prompts.selectBandCards(player.hand);
    const selectedCards = player.hand.filter(c => selectedIds.includes(c.id));

    if (!this.engine.moveValidator.canPlayBand(selectedCards)) {
      throw new Error("Bando inválido! Devem ter a mesma Tribo ou mesma Cor.");
    }

    // O primeiro da lista de selecionados será o líder por simplicidade (ou peça outro prompt)
    const leaderId = selectedIds[0];
    await this.engine.handlePlayBand(player.id, selectedIds, leaderId);
    console.log(chalk.green("\nBando jogado! As outras cartas foram para o mercado."));
    await this.prompts.wait();
  }

  showHand(player) {
    console.log(chalk.bold(`\nSUA MÃO:`));
    const handStr = player.hand.map(c => 
      chalk.keyword(c.color.toLowerCase())(c.tribe)
    ).join(' | ');
    console.log(`  ${handStr}\n`);
  }
}