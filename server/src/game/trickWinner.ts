import type { Rank, Suit, PlayedCard } from '../../../shared/src/index';

/**
 * Troef rankvolgorde (hoogste eerst)
 * Boer is altijd hoogste, dan de 9, dan de rest in normale volgorde
 * B(8) > 9(7) > A(6) > 10(5) > K(4) > V(3) > 8(2) > 7(1)
 */
const TRUMP_RANK_VALUES: Record<Rank, number> = {
  'B': 8,   // Boer - hoogste troef
  '9': 7,   // Negen - tweede hoogste troef
  'A': 6,
  '10': 5,
  'K': 4,
  'V': 3,
  '8': 2,
  '7': 1
};

/**
 * Normale rankvolgorde (hoogste eerst)
 * A(8) > K(7) > V(6) > B(5) > 10(4) > 9(3) > 8(2) > 7(1)
 */
const NORMAL_RANK_VALUES: Record<Rank, number> = {
  'A': 8,
  'K': 7,
  'V': 6,
  'B': 5,
  '10': 4,
  '9': 3,
  '8': 2,
  '7': 1
};

/**
 * Haal de waarde van een kaart op
 * @param rank - De rang van de kaart
 * @param isTrump - Of de kaart een troefkaart is
 */
export function getCardValue(rank: Rank, isTrump: boolean): number {
  return isTrump ? TRUMP_RANK_VALUES[rank] : NORMAL_RANK_VALUES[rank];
}

/**
 * Bepaal de winnaar van een slag
 * Regels:
 * 1. Troef wint altijd van niet-troef
 * 2. Bij meerdere troeven: hoogste troef wint
 * 3. Zonder troef: hoogste kaart in gevraagde kleur wint
 *
 * @param trick - De gespeelde kaarten in de slag
 * @param trump - De troefkleur
 * @returns De winnende PlayedCard
 */
export function determineTrickWinner(
  trick: PlayedCard[],
  trump: Suit | null
): PlayedCard {
  if (trick.length === 0) {
    throw new Error('Cannot determine winner of empty trick');
  }

  if (trick.length === 1) {
    return trick[0];
  }

  const leadSuit = trick[0].card.suit;

  // Vind alle troefkaarten
  const trumpCards = trump
    ? trick.filter(pc => pc.card.suit === trump)
    : [];

  // Als er troefkaarten zijn gespeeld, wint de hoogste troef
  if (trumpCards.length > 0) {
    return trumpCards.reduce((winner, current) => {
      const winnerValue = getCardValue(winner.card.rank, true);
      const currentValue = getCardValue(current.card.rank, true);
      return currentValue > winnerValue ? current : winner;
    });
  }

  // Geen troef gespeeld: hoogste kaart in gevraagde kleur wint
  const leadSuitCards = trick.filter(pc => pc.card.suit === leadSuit);

  return leadSuitCards.reduce((winner, current) => {
    const winnerValue = getCardValue(winner.card.rank, false);
    const currentValue = getCardValue(current.card.rank, false);
    return currentValue > winnerValue ? current : winner;
  });
}

/**
 * Bepaal de winnaar ID van een slag
 */
export function getTrickWinnerId(
  trick: PlayedCard[],
  trump: Suit | null
): string {
  return determineTrickWinner(trick, trump).playerId;
}
