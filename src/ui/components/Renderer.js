import chalk from 'chalk';
import Table from 'cli-table3';

export class Renderer {
  // Mapeamento unificado e tolerante a falhas (reinos e cores padrão)
  static colorMap = {
    // Tribos / Reinos
    'giant': chalk.red,
    'troll': chalk.hex('#FFA500'), // Laranja
    'skeleton': chalk.gray,
    'dwarf': chalk.yellow,
    'dwarve': chalk.yellow,
    'elf': chalk.green,
    'wizard': chalk.blue,
    'orc': chalk.magenta,

    // Cores puras
    'red': chalk.red,
    'blue': chalk.blue,
    'green': chalk.green,
    'yellow': chalk.yellow,
    'purple': chalk.magenta,
    'orange': chalk.hex('#FFA500'),
    'grey': chalk.gray,
    'white': chalk.white,
    'none': chalk.white,
    'dragon': chalk.bgRed.white
  };

  static getStyle(colorName) {
    if (!colorName) return chalk.white;
    const color = colorName.toLowerCase().trim();
    return this.colorMap[color] || chalk.white;
  }

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

      // Substituído chalk.keyword por getStyle
      const colorStyle = this.getStyle(k.name);

      table.push([
        colorStyle(k.name),
        `${k.gloryAge1}/${k.gloryAge2}/${k.gloryAge3}`,
        markers
      ]);
    });

    console.log(chalk.bold('🏰 ESTADO DOS REINOS'));
    console.log(table.toString());
  }

  static renderMarket(market) {
    console.log(chalk.bold('\n🛒 MERCADO:'));
    if (!market || market.length === 0) return console.log(chalk.gray('  (Vazio)'));
    
    // Substituído chalk.keyword por getStyle
    const display = market.map(c => {
      const style = this.getStyle(c.color);
      return style(`[${c.tribe}]`);
    }).join(' ');
    
    console.log(`  ${display}\n`);
  }
}