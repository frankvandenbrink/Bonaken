import type { Card, Rank, Suit, PlayedCard } from 'shared';

/**
 * Troef rankwaarden voor vergelijking (hoger = sterker)
 * B(8) > 9(7) > A(6) > 10(5) > K(4) > V(3) > 8(2) > 7(1)
 */
const TRUMP_RANK_VALUES: Record<Rank, number> = {
  'B': 8, '9': 7, 'A': 6, '10': 5, 'K': 4, 'V': 3, '8': 2, '7': 1
};

function getTrumpValue(rank: Rank): number {
  return TRUMP_RANK_VALUES[rank];
}

/**
 * Bepaal welke kaarten een speler mag spelen - Leimuiden regels
 *
 * Regels:
 * 1. Eerste speler: alle kaarten geldig
 * 2. Bijlopen verplicht (gevraagde kleur spelen)
 * 3. Introeven mag te allen tijde (troef spelen i.p.v. bijlopen)
 * 4. Troefboer mag altijd verzaakt worden (nooit verplicht te spelen)
 * 5. Na introeven door een speler: niet ondertroeven
 *    - Tenzij je geen gevraagde kleur hebt EN geen hogere troef
 * 6. Bij troef gevraagd: niet verplicht over te troeven
 */
export function getValidCards(
  hand: Card[],
  currentTrick: PlayedCard[],
  trump: Suit | null
): Card[] {
  // Eerste speler: alle kaarten zijn geldig
  if (currentTrick.length === 0) {
    return hand;
  }

  const ledSuit = currentTrick[0].card.suit;

  // Zonder troef (zwabber): alleen kleur bekennen
  if (!trump) {
    const suitCards = hand.filter(c => c.suit === ledSuit);
    return suitCards.length > 0 ? suitCards : hand;
  }

  const trumpJackId = `${trump}-B`;

  // Categoriseer de hand
  const ledSuitCards = hand.filter(c => c.suit === ledSuit);
  const trumpCards = hand.filter(c => c.suit === trump);
  const trumpCardsNoJack = trumpCards.filter(c => c.id !== trumpJackId);
  const otherCards = hand.filter(c => c.suit !== ledSuit && c.suit !== trump);

  // ===== TROEF GEVRAAGD =====
  if (ledSuit === trump) {
    // Troef is gevraagd: moet troef bijspelen
    // Niet verplicht om over te troeven
    // Troefboer mag verzaakt worden
    if (trumpCardsNoJack.length > 0) {
      // Heeft niet-boer troef: moet troef spelen (alle troef geldig, incl boer)
      return trumpCards;
    } else {
      // Alleen de boer of geen troef: mag alles spelen (boer is exempt)
      return hand;
    }
  }

  // ===== NIET-TROEF GEVRAAGD =====

  // Check of iemand al getroeft heeft in deze slag
  let highestTrumpValue = -1;
  let someoneHasTrumped = false;
  for (const played of currentTrick) {
    if (played.card.suit === trump) {
      someoneHasTrumped = true;
      const val = getTrumpValue(played.card.rank);
      if (val > highestTrumpValue) {
        highestTrumpValue = val;
      }
    }
  }

  const validSet = new Set<string>();

  // Altijd geldig: bijlopen (gevraagde kleur spelen)
  for (const c of ledSuitCards) {
    validSet.add(c.id);
  }

  if (someoneHasTrumped) {
    // Iemand heeft getroeft → niet ondertroeven
    const higherTrumps = trumpCards.filter(c => getTrumpValue(c.rank) > highestTrumpValue);

    // Hogere troeven zijn altijd geldig (overtroeven)
    for (const c of higherTrumps) {
      validSet.add(c.id);
    }

    if (ledSuitCards.length === 0) {
      // Geen gevraagde kleur
      const higherTrumpsNoJack = trumpCardsNoJack.filter(c => getTrumpValue(c.rank) > highestTrumpValue);

      if (higherTrumpsNoJack.length === 0) {
        // Geen hogere niet-boer troef: mag ondertroeven OF andere kleur spelen
        for (const c of trumpCards) validSet.add(c.id);
        for (const c of otherCards) validSet.add(c.id);
      } else {
        // Heeft hogere troef: mag ook andere kleur spelen (maar niet ondertroeven)
        for (const c of otherCards) validSet.add(c.id);
      }
    }
    // Als je WEL gevraagde kleur hebt: bijlopen of overtroeven (al toegevoegd)
  } else {
    // Niemand heeft getroeft → alle troeven geldig (introeven mag altijd)
    for (const c of trumpCards) {
      validSet.add(c.id);
    }

    if (ledSuitCards.length === 0) {
      // Geen gevraagde kleur: mag ook andere kleur spelen
      for (const c of otherCards) {
        validSet.add(c.id);
      }
    }
    // Als je WEL gevraagde kleur hebt: bijlopen of introeven (al toegevoegd)
  }

  // Converteer set naar kaarten
  let result = hand.filter(c => validSet.has(c.id));

  // Troefboer-exemptie: als de boer de ENIGE geldige kaart is,
  // mag de speler alles spelen (boer kan nooit geforceerd worden)
  if (result.length === 1 && result[0].id === trumpJackId) {
    return hand;
  }

  // Veiligheidsval: als niets geldig is, mag alles
  if (result.length === 0) {
    return hand;
  }

  return result;
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
