import type { Card, Suit, Rank } from './index';

// Volgorde van kleuren (voor sortering)
const SUIT_ORDER: Suit[] = ['schoppen', 'harten', 'klaveren', 'ruiten'];

// Normale rankvolgorde (hoog naar laag)
const NORMAL_RANK_ORDER: Rank[] = ['A', 'K', 'V', 'B', '10', '9', '8', '7'];

// Troef rankvolgorde (Klaverjas stijl): B > 9 > A > 10 > K > V > 8 > 7
const TRUMP_RANK_ORDER: Rank[] = ['B', '9', 'A', '10', 'K', 'V', '8', '7'];

/**
 * Sorteer een hand kaarten
 * Eerst op kleur, dan op rang (troef gebruikt speciale volgorde)
 */
export function sortHand(hand: Card[], trump: Suit | null): Card[] {
  return [...hand].sort((a, b) => {
    // Eerst sorteren op kleur
    const suitDiffA = SUIT_ORDER.indexOf(a.suit);
    const suitDiffB = SUIT_ORDER.indexOf(b.suit);

    if (suitDiffA !== suitDiffB) {
      return suitDiffA - suitDiffB;
    }

    // Dan op rang (troefkleur gebruikt speciale volgorde)
    const rankOrder = (a.suit === trump) ? TRUMP_RANK_ORDER : NORMAL_RANK_ORDER;
    return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
  });
}

/**
 * Krijg de waarde van een kaart voor vergelijking
 * Hogere waarde = sterkere kaart
 */
export function getCardValue(card: Card, trump: Suit | null): number {
  const rankOrder = (card.suit === trump) ? TRUMP_RANK_ORDER : NORMAL_RANK_ORDER;
  // Keer om zodat hoogste rang hoogste waarde heeft
  return rankOrder.length - rankOrder.indexOf(card.rank);
}

/**
 * Check of een kaart van een bepaalde kleur is
 */
export function isCardOfSuit(card: Card, suit: Suit): boolean {
  return card.suit === suit;
}

/**
 * Filter kaarten van een bepaalde kleur
 */
export function getCardsOfSuit(cards: Card[], suit: Suit): Card[] {
  return cards.filter(card => card.suit === suit);
}

/**
 * Krijg een leesbare naam voor een kleur (Nederlands)
 */
export function getSuitName(suit: Suit): string {
  const names: Record<Suit, string> = {
    harten: 'Harten',
    ruiten: 'Ruiten',
    klaveren: 'Klaveren',
    schoppen: 'Schoppen'
  };
  return names[suit];
}

/**
 * Krijg het symbool voor een kleur
 */
export function getSuitSymbol(suit: Suit): string {
  const symbols: Record<Suit, string> = {
    harten: '♥',
    ruiten: '♦',
    klaveren: '♣',
    schoppen: '♠'
  };
  return symbols[suit];
}

/**
 * Check of een kleur rood is
 */
export function isRedSuit(suit: Suit): boolean {
  return suit === 'harten' || suit === 'ruiten';
}

/**
 * Krijg een leesbare naam voor een rang (Nederlands)
 */
export function getRankName(rank: Rank): string {
  const names: Record<Rank, string> = {
    '7': '7',
    '8': '8',
    '9': '9',
    '10': '10',
    'B': 'Boer',
    'V': 'Vrouw',
    'K': 'Koning',
    'A': 'Aas'
  };
  return names[rank];
}

/**
 * Krijg een korte weergave voor een rang
 */
export function getRankDisplay(rank: Rank): string {
  return rank;
}

// Kaartpunten (Leimuiden variant)
const TRUMP_POINTS: Record<Rank, number> = {
  'B': 20, '9': 14, 'A': 11, '10': 10, 'K': 3, 'V': 2, '8': 0, '7': 0
};

const NON_TRUMP_POINTS: Record<Rank, number> = {
  'A': 11, '10': 10, 'K': 3, 'V': 2, 'B': 1, '9': 0, '8': 0, '7': 0
};

/**
 * Krijg de puntwaarde van een kaart
 * Troefkaarten hebben andere waarden dan niet-troefkaarten
 */
export function getCardPoints(card: Card, trump: Suit | null): number {
  if (trump && card.suit === trump) {
    return TRUMP_POINTS[card.rank];
  }
  return NON_TRUMP_POINTS[card.rank];
}

/**
 * Bereken het totaal puntwaarde van kaarten in een slag
 */
export function getTrickPoints(trick: { card: Card }[], trump: Suit | null): number {
  return trick.reduce((total, played) => total + getCardPoints(played.card, trump), 0);
}
