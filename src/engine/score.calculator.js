// src/engine/score.calculator.js

export class ScoreCalculator {
  constructor() {
    // Tabela de Glória por tamanho de banda (Manual pág. 9)
    this.BAND_GLORY_TABLE = [0, 1, 3, 6, 10, 15, 21];
  }

  calculateAgeGlory(gameState) {
    const age = gameState.currentAge;
    const results = gameState.players.map(p => ({
      playerId: p.id,
      gloryEarned: 0
    }));

    // --- 1. PONTUAÇÃO POR BANDAS (Manual pág. 9) ---
    gameState.players.forEach(player => {
      let bandTotal = 0;
      player.playedBands.forEach(band => {
        bandTotal += this._getGloryForBandSize(band.size);
      });
      
      const res = results.find(r => r.playerId === player.id);
      res.gloryEarned += bandTotal;
    });

    // --- 2. PONTUAÇÃO POR REINOS (Manual pág. 9-10) ---
    gameState.kingdoms.forEach(kingdom => {
      // Pega todos os marcadores desse reino e agrupa por jogador
      const standings = kingdom.markers
        .map(m => ({ playerId: m.playerId, count: m.count }))
        .filter(m => m.count > 0)
        .sort((a, b) => b.count - a.count);

      if (standings.length === 0) return;

      // Define quais valores de glória estão em jogo nesta Era
      const rewards = this._getKingdomRewards(kingdom, age);

      // Distribui os prêmios (1º, 2º e 3º lugar)
      this._distributeKingdomGlory(results, standings, rewards, age);
    });

    return results;
  }

  /**
   * Define quanto cada posição ganha baseado na Era atual
   * @private
   */
  _getKingdomRewards(kingdom, age) {
    if (age === 1) return [kingdom.gloryAge1];
    if (age === 2) return [kingdom.gloryAge2, kingdom.gloryAge1];
    if (age === 3) return [kingdom.gloryAge3, kingdom.gloryAge2, kingdom.gloryAge1];
    return [];
  }

  /**
   * Lógica de ranking e empate (Manual pág. 10)
   * "If there is a tie, players add together the Glory rewards and divide it equally"
   * @private
   */
  _distributeKingdomGlory(results, standings, rewards, age) {
    let currentRewardIdx = 0;
    let i = 0;

    while (i < standings.length && currentRewardIdx < rewards.length) {
      const currentCount = standings[i].count;
      
      // Encontra todos os jogadores empatados com a mesma quantidade de marcadores
      const tiedPlayers = standings.filter(s => s.count === currentCount);
      
      // Soma os prêmios das próximas posições equivalentes ao número de empatados
      let totalGlory = 0;
      for (let j = 0; j < tiedPlayers.length; j++) {
        totalGlory += (rewards[currentRewardIdx + j] || 0);
      }

      // Divide a glória (arredondado para baixo)
      const gloryPerPlayer = Math.floor(totalGlory / tiedPlayers.length);

      tiedPlayers.forEach(tp => {
        const res = results.find(r => r.playerId === tp.playerId);
        if (res) res.gloryEarned += gloryPerPlayer;
      });

      // Pula os índices baseados em quantos jogadores empataram
      currentRewardIdx += tiedPlayers.length;
      i += tiedPlayers.length;
    }
  }

  _getGloryForBandSize(size) {
    if (size >= 6) return this.BAND_GLORY_TABLE[6];
    return this.BAND_GLORY_TABLE[size] || 0;
  }
}