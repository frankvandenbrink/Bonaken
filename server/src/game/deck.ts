import type { Card, Suit, Rank } from 'shared';

const SUITS: Suit[] = ['schoppen', 'harten', 'klaveren', 'ruiten'];
const RANKS: Rank[] = ['7', '8', '9', '10', 'B', 'V', 'K', 'A'];

/**
 * Maak een nieuw 32-kaarten deck
 * Bevat 7, 8, 9, 10, B, V, K, A in 4 kleuren
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        id: `${suit}-${rank}`
      });
    }
  }

  return deck;
}

/**
 * Fisher-Yates shuffle algoritme
 * Schudt het deck willekeurig
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Haal een specifieke kaart uit het deck op ID
 */
export function getCardById(deck: Card[], id: string): Card | undefined {
  return deck.find(card => card.id === id);
}
