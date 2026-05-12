export class MoveValidator {
  constructor() {
    this.MAX_HAND_SIZE = 10;
  }

  /**
   * Verifica se o jogador pode recrutar uma carta (do deck ou mercado).
   * Regra: Não pode recrutar se já tiver 10 cartas na mão.
   * @param {Object} player - Instância do jogador com sua mão atual.
   * @returns {boolean}
   */
  canRecruit(player) {
    if (player.hand.length >= this.MAX_HAND_SIZE) {
      return false; 
      // No GameEngine, você pode lançar um erro: "Mão cheia! Você deve jogar uma banda."
    }
    return true;
  }

  /**
   * Verifica se uma seleção de cartas pode formar uma Banda válida.
   * Regra: Todas as cartas devem ser da mesma TRIBO ou da mesma COR.
   * @param {Object[]} selectedCards - Array de objetos Card.
   * @returns {boolean}
   */
  canPlayBand(selectedCards) {
    if (!selectedCards || selectedCards.length === 0) return false;

    // Se for apenas uma carta, é sempre uma banda válida
    if (selectedCards.length === 1) return true;

    const firstCard = selectedCards[0];

    // Verifica se todas são da mesma tribo
    const allSameTribe = selectedCards.every(
      (card) => card.tribe === firstCard.tribe
    );

    // Verifica se todas são da mesma cor (reino)
    const allSameColor = selectedCards.every(
      (card) => card.color === firstCard.color
    );

    return allSameTribe || allSameColor;
  }

  /**
   * Verifica se o jogador pode colocar um marcador de controle ao jogar a banda.
   * Regra: O tamanho da banda deve ser MAIOR que o número de marcadores 
   * que o jogador já possui naquele reino.
   * @param {Object} player - Instância do jogador.
   * @param {Object} kingdom - O reino correspondente à cor do LÍDER da banda.
   * @param {number} bandSize - Quantidade de cartas na banda jogada.
   * @returns {boolean}
   */
  canPlaceMarker(player, kingdom, bandSize) {
    // Busca quantos marcadores o jogador já tem nesse reino específico
    const currentMarkers = kingdom.controlMarkers.get(player.id) || 0;

    // Regra p. 7: "Se o tamanho da banda for maior que o número de seus marcadores..."
    return bandSize > currentMarkers;
  }
}