import chalk from 'chalk';
import Table from 'cli-table3';

export class Renderer {
  static renderHeader(state, currentPlayer) {
    console.clear();
    console.log(chalk.bold.blue('=== ETHNOS DIGITAL ==='));
    console.log(chalk.yellow(`Era: ${state.currentAge} | Dragões: ${state.dragonsFound}/3`));
    console.log(chalk.cyan(`Vez de: ${currentPlayer.name} (${currentPlayer.points} pts)\n`));
  }

  static renderKingdoms(kingdoms) {
    const table = new Table({
      head: [chalk.white('Reino'), chalk.white('Glória (I/II/III)'), chalk.white('Marcadores')],
      colWidths: [15, 20, 30]
    });

    kingdoms.forEach(k => {
      const markers = k.markers
        ?.map(m => `${m.player.name}(${m.count})`)
        .join(', ') || 'Vazio';

      table.push([
        chalk.keyword(k.name.toLowerCase() || 'white')(k.name),
        `${k.gloryAge1}/${k.gloryAge2}/${k.gloryAge3}`,
        markers
      ]);
    });

    console.log(chalk.bold('🏰 ESTADO DOS REINOS'));
    console.log(table.toString());
  }

  static renderMarket(market) {
    console.log(chalk.bold('\n🛒 MERCADO:'));
    if (market.length === 0) return console.log(chalk.gray('  (Vazio)'));
    
    const display = market.map(c => 
      chalk.keyword(c.color.toLowerCase())(`[${c.tribe}]`)
    ).join(' ');
    console.log(`  ${display}`);
  }
}