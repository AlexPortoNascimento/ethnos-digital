// src/engine/move.validator.js
export class MoveValidator {
  constructor() {
    this.MAX_HAND_SIZE = 10;
  }

  canRecruit(player) {
    return player.hand.length < this.MAX_HAND_SIZE;
  }

  canPlayBand(selectedCards) {
    if (!selectedCards || selectedCards.length === 0) return false;
    if (selectedCards.length === 1) return true;

    const firstCard = selectedCards[0];
    const allSameTribe = selectedCards.every(c => c.tribe === firstCard.tribe);
    const allSameColor = selectedCards.every(c => c.color === firstCard.color);

    return allSameTribe || allSameColor;
  }

  /**
   * CORREÇÃO: O kingdom.markers agora é tratado como o ARRAY que o Prisma retorna
   */
  canPlaceMarker(player, kingdom, bandSize) {
    // Procura no array de marcadores do reino se o jogador já tem um registro lá
    const playerMarker = kingdom.markers?.find(m => m.playerId === player.id);
    const currentCount = playerMarker ? playerMarker.count : 0;

    // Regra: Tamanho do bando deve ser MAIOR que o número de marcadores atuais
    return bandSize > currentCount;
  }
}