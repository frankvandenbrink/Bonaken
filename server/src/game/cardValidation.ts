import type { Card, Suit, PlayedCard } from 'shared';

/**
 * Bepaal welke kaarten een speler mag spelen
 * Regels:
 * - Eerste speler van de slag: alle kaarten zijn geldig
 * - Anders: kleur bekennen verplicht (moet kleur van eerste kaart spelen)
 * - Als geen kaart van gevraagde kleur: alle kaarten geldig
 */
export function getValidCards(
  hand: Card[],
  currentTrick: PlayedCard[],
  _trump: Suit | null
): Card[] {
  // Eerste speler: alle kaarten zijn geldig
  if (currentTrick.length === 0) {
    return hand;
  }

  // Gevraagde kleur is de kleur van de eerste gespeelde kaart
  const leadSuit = currentTrick[0].card.suit;

  // Filter kaarten van de gevraagde kleur
  const matchingSuitCards = hand.filter(card => card.suit === leadSuit);

  // Als speler kaarten van de gevraagde kleur heeft: alleen die zijn geldig
  if (matchingSuitCards.length > 0) {
    return matchingSuitCards;
  }

  // Geen kaarten van gevraagde kleur: alle kaarten zijn geldig
  return hand;
}

/**
 * Controleer of een specifieke kaart gespeeld mag worden
 */
export function isValidCard(
  cardId: string,
  hand: Card[],
  currentTrick: PlayedCard[],
  trump: Suit | null
): boolean {
  const validCards = getValidCards(hand, currentTrick, trump);
  return validCards.some(card => card.id === cardId);
}

/**
 * Haal de IDs op van geldige kaarten
 */
export function getValidCardIds(
  hand: Card[],
  currentTrick: PlayedCard[],
  trump: Suit | null
): string[] {
  return getValidCards(hand, currentTrick, trump).map(card => card.id);
}
