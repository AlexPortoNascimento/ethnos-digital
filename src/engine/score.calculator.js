export class ScoreCalculator {
  constructor() {
    // Tabela de Glória por tamanho de banda (Manual pág. 9)
    // Tamanho: [0, 1, 2, 3, 4, 5, 6+]
    this.BAND_GLORY_TABLE = [0, 1, 3, 6, 10, 15, 21];
  }

  /**
   * Calcula a glória de todos os jogadores ao fim de uma Era.
   * @param {Object} gameState - O estado vindo do Engine
   */
  calculateAgeGlory(gameState) {
    const results = [];

    for (const player of gameState.players) {
      let bandGlory = 0;

      // 1. Somar pontos de cada banda jogada nesta Era
      player.playedBands.forEach(band => {
        bandGlory += this._getGloryForBandSize(band.size);
      });

      // 2. Aqui no futuro entra o cálculo de marcadores nos Reinos
      // Por enquanto, focamos nas bandas para destravar os testes
      results.push({
        playerId: player.id,
        gloryEarned: bandGlory
      });
    }

    return results;
  }

  /**
   * Retorna os pontos baseado no tamanho da banda
   * @private
   */
  _getGloryForBandSize(size) {
    if (size >= 6) return this.BAND_GLORY_TABLE[6];
    return this.BAND_GLORY_TABLE[size] || 0;
  }
}