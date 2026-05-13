import chalk from 'chalk';
import { Renderer } from './components/Renderer.js';
import { PromptHandler } from './components/PromptHandler.js';

export class TerminalUI {
  constructor(engine) {
    this.engine = engine;
    this.prompts = new PromptHandler();
  }

  async ensureGameIsReady() {
    // Verifica se já existe um jogo no banco (id: 1 por simplicidade no seu model)
    const existingGame = await this.engine.prisma.gameState.findFirst({include: { players: true }});

    if (!existingGame || !existingGame.gameStarted || existingGame.players.length === 0) {
      
      const count = await this.prompts.askPlayerCount();
      const names = await this.prompts.askPlayerNames(count);
      
      await this.engine.setupNewGame(names);
    } else {
      await this.engine.initGame(existingGame.id);
    }
  }

  async start() {
  // 1. Garante que o jogo exista e tenha jogadores antes de qualquer coisa
  await this.ensureGameIsReady(); 

  console.log(chalk.gray("Iniciando interface gráfica..."));

  if (!this.engine.state.players || this.engine.state.players.length === 0) {
    console.log(chalk.red("Erro: Estado do jogo não possui jogadores carregados."));
    return;
  }

  while (this.engine.state.currentAge <= 3) {
    for (const player of this.engine.state.players) {
      // Verifica se a era mudou durante o turno de alguém (ex: comprou o 3º dragão)
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
    
    // O Prisma carrega como 'cards', então garantimos que seja um array
    const cards = player.hand|| []; 
    
    if (cards.length === 0) {
      console.log(chalk.gray('  (Sua mão está vazia)'));
      return;
    }

    const handStr = cards.map(c => {
      // Usando a lógica de cores segura que criamos no Renderer
      const style = Renderer.colorMap[c.color.toLowerCase()] || chalk.white;
      return style(`[${c.tribe}]`);
    }).join(' | ');

    console.log(`  ${handStr}\n`);
  }
}