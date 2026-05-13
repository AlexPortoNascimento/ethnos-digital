import chalk from 'chalk';
import { Renderer } from './components/Renderer.js';
import { PromptHandler } from './components/PromptHandler.js';

export class TerminalUI {
  constructor(engine) {
    this.engine = engine;
    this.prompts = new PromptHandler();
  }

  async ensureGameIsReady() {
    const existingGame = await this.engine.prisma.gameState.findFirst({ include: { players: true } });

    if (!existingGame || !existingGame.gameStarted || existingGame.players.length === 0) {
      const count = await this.prompts.askPlayerCount();
      const names = await this.prompts.askPlayerNames(count);
      await this.engine.setupNewGame(names);
    } else {
      await this.engine.initGame(existingGame.id);
    }
  }

  async start() {
    await this.ensureGameIsReady(); 

    console.log(chalk.gray("Iniciando interface gráfica..."));

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
    let turnEnded = false;

    while (!turnEnded) {
      // 1. Renderização (Sempre atualiza o estado vindo do banco)
      await this.engine.initGame(this.engine.state.id);
      
      // Buscamos a versão mais recente do jogador dentro do estado atualizado
      const freshPlayer = this.engine.state.players.find(p => p.id === player.id);

      Renderer.renderHeader(this.engine.state, freshPlayer);
      Renderer.renderKingdoms(this.engine.state.kingdoms);
      Renderer.renderMarket(this.engine.state.market);
      this.showHand(freshPlayer);

      // 2. Ação do Usuário
      try {
        const action = await this.prompts.mainMenu();
        if (action === 'RECRUIT') {
          // Se o executeRecruit retornar false, significa que ele clicou em VOLTAR
          turnEnded = await this.executeRecruit(freshPlayer);
        } else {
          turnEnded = await this.executePlayBand(freshPlayer);
        }
      } catch (err) {
        console.log(chalk.bgRed(`\n ERRO: ${err.message} `));
        await this.prompts.wait();
      }
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
    
    // TRATAMENTO DO BOTÃO VOLTAR
    if (target === 'BACK') {
      return false; // Retorna false para o loop do runTurn continuar no mesmo jogador
    }

    if (target === 'DECK') {
      await this.engine.drawCard(player.id, 'DECK');
    } else {
      await this.engine.drawFromMarket(player.id, target);
    }

    return true; // Turno finalizado com sucesso
  }

  async executePlayBand(player) {
    const pCards = player.hand || [];
    if (pCards.length === 0) {
      throw new Error("Você não tem cartas na mão para jogar um bando!");
    }

    const selectedIds = await this.prompts.selectBandCards(pCards);
    
    // Se o jogador der Enter sem marcar nada ou cancelar
    if (!selectedIds || selectedIds.length === 0) return false;

    const selectedCards = pCards.filter(c => selectedIds.includes(c.id));

    if (!this.engine.moveValidator.canPlayBand(selectedCards)) {
      throw new Error("Bando inválido! Devem ter a mesma Tribo ou mesma Cor.");
    }

    // AGORA USA O PROMPT DE LÍDER REAL
    const leaderId = await this.prompts.selectLeader(selectedCards);

    await this.engine.handlePlayBand(player, selectedIds, leaderId);
    console.log(chalk.green("\nBando jogado! As outras cartas foram para o mercado."));
    await this.prompts.wait();
    
    return true; // Turno finalizado com sucesso
  }

  showHand(player) {
    console.log(chalk.bold(`\nSUA MÃO:`));
    
    // CORRIGIDO: de player.hand para player.cards
    const cards = player.hand || []; 
    
    if (cards.length === 0) {
      console.log(chalk.gray('  (Sua mão está vazia)'));
      return;
    }

    const handStr = cards.map(c => {
      const style = Renderer.colorMap[c.color.toLowerCase()] || chalk.white;
      return style(`[${c.tribe}]`);
    }).join(' | ');

    console.log(`  ${handStr}\n`);
  }
}