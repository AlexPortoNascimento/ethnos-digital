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
        if (this.engine.state.ageEnded || this.engine.state.currentAge > 3) break;

        await this.runTurn(player);
      }
    }
    
    await this.engine.initGame(this.engine.state.id);
    const finalPlayers = [...this.engine.state.players];

    finalPlayers.sort((a, b) => b.points - a.points);

    console.log('\n' + '='.repeat(40));
    console.log(chalk.bold.yellow("      🏆 CLASSICAÇÃO FINAL 🏆      "));
    console.log('='.repeat(40));

    finalPlayers.forEach((player, index) => {
      const position = index + 1;
      let logLine = `${position}º Lugar: ${player.name} - ${player.points} pontos`;
      
      if (position === 1) {
        console.log(chalk.bold.gold ? chalk.bold.yellow(logLine) : chalk.bold.cyan(logLine));
      } else {
        console.log(logLine);
      }
    });

    console.log('='.repeat(40));
    
    const winner = finalPlayers[0];
    console.log(chalk.bgGreen.black.bold(`\n 🎉 PARABÉNS ${winner.name.toUpperCase()} PELA VITÓRIA! 🥂 `));

    console.log(chalk.bold.green("\nFIM DE JOGO! OBRIGADO POR JOGAR."));
    process.exit();
  }

  async runTurn(player) {
    const initialAge = this.engine.state.currentAge;
    let turnEnded = false;

    while (!turnEnded) {
      // 1. Renderização (Sempre atualiza o estado vindo do banco)
      await this.engine.initGame(this.engine.state.id);

      if (this.engine.state.ageEnded) break;

      // Buscamos a versão mais recente do jogador dentro do estado atualizado
      const freshPlayer = this.engine.state.players.find(p => p.id === player.id);

      if (this.engine.state.ageEnded || this.engine.state.currentAge > initialAge) {
        await this.prompts.wait();
      }

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

    if (target === 'BACK') return false;

    if (target === 'DECK') {
      let drawComplete = false;

      while (!drawComplete) {
        const result = await this.engine.drawCard(player.id);

        if (result.type === 'DRAGON') {
          // PRIMEIRA CONFIRMAÇÃO: O aviso do dragão
          console.log('\n' + '='.repeat(40));
          console.log(chalk.bgRed.white.bold(` 🔥 CUIDADO! UM DRAGÃO FOI REVELADO! (${result.count}/3) `));
          console.log('='.repeat(40));

          await this.prompts.wait(); // Espera o primeiro Enter

          if (result.endOfAge) {
            console.log(chalk.red.bold("\nO TERCEIRO DRAGÃO ACORDOU. A ERA TERMINOU!"));
            drawComplete = true; // Para o loop de compra
          } else {
            console.log(chalk.yellow("\nComo não foi o terceiro, você deve comprar outra carta..."));
            // O loop continua e chama drawCard novamente para o mesmo jogador
          }
        } else {
          // Carta normal comprada com sucesso
          console.log(chalk.green(`\n✅ Você recrutou um ${result.card.tribe} para sua mão.`));
          drawComplete = true;
        }
      }
    } else {
      // Recrutamento do Mercado
      await this.engine.drawFromMarket(player.id, target);
      console.log(chalk.green("\n✅ Carta do mercado adicionada à sua mão."));
    }

    // SEGUNDA CONFIRMAÇÃO: O "pressione enter para continuar" geral do turno
    await this.prompts.wait();
    return true;
  }

  async executePlayBand(player) {
    const pCards = player.hand || [];
    if (pCards.length === 0) {
      throw new Error("Você não tem cartas na mão para jogar um bando!");
    }

    const selectedIds = await this.prompts.selectBandCards(pCards);

    // TRATAMENTO DO VOLTAR: Se 'BACK' estiver no array ou se nada for selecionado
    if (!selectedIds || selectedIds.length === 0 || selectedIds.includes('BACK')) {
      return false;
    }

    const selectedCards = pCards.filter(c => selectedIds.includes(c.id));

    // Validação extra antes de pedir o líder
    if (!this.engine.moveValidator.canPlayBand(selectedCards)) {
      throw new Error("Bando inválido! Devem ser todos da mesma Tribo ou todos da mesma Cor.");
    }

    const leaderId = await this.prompts.selectLeader(selectedCards);

    // Executa a jogada no motor
    await this.engine.handlePlayBand(player, selectedIds, leaderId);

    console.log(chalk.green("\n✅ Bando jogado com sucesso!"));
    await this.prompts.wait();

    return true;
  }

  showHand(player) {
    console.log(chalk.bold(`\nSUA MÃO:`));

    const cards = player.hand || [];

    if (cards.length === 0) {
      console.log(chalk.gray('  (Sua mão está vazia)'));
      return;
    }

    const handStr = cards.map(c => {
      // Usa o método estático getStyle que criamos e corrigimos no Renderer
      const style = Renderer.getStyle(c.color || c.tribe);
      return style(`[${c.tribe}]`);
    }).join(' | ');

    console.log(`  ${handStr}\n`);
  }
}