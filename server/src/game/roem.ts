import type { Card, Suit, Rank, RoemType, RoemDeclaration } from 'shared';

// Rank ordering for sequences (lowest to highest)
const RANK_ORDER: Rank[] = ['7', '8', '9', '10', 'B', 'V', 'K', 'A'];

/**
 * Roem punten per type
 */
const ROEM_POINTS: Record<RoemType, number> = {
  'stuk': 20,
  'driekaart': 20,
  'driekaart-stuk': 40,
  'vierkaart': 50,
  'vijfkaart': 100,
  'zeskaart': 100,
  'vier-vrouwen': 100,
  'vier-heren': 100,
  'vier-azen': 100,
  'vier-boeren': 200
};

/**
 * Detecteer alle mogelijke roem in een hand
 */
export function detectRoem(hand: Card[], trump: Suit | null): RoemDeclaration[] {
  const declarations: RoemDeclaration[] = [];

  if (!trump) return declarations; // Geen troef = geen roem (zwabber)

  // 1. Stuk: V + K van troef
  const trumpVrouw = hand.find(c => c.suit === trump && c.rank === 'V');
  const trumpHeer = hand.find(c => c.suit === trump && c.rank === 'K');
  const hasStuk = !!(trumpVrouw && trumpHeer);

  if (hasStuk) {
    declarations.push({
      playerId: '',
      type: 'stuk',
      points: ROEM_POINTS['stuk'],
      cards: [trumpVrouw!, trumpHeer!]
    });
  }

  // 2. Vier-van-een-soort: 4x B, 4x V, 4x K, 4x A
  const fourOfAKind: { rank: Rank; type: RoemType }[] = [
    { rank: 'B', type: 'vier-boeren' },
    { rank: 'V', type: 'vier-vrouwen' },
    { rank: 'K', type: 'vier-heren' },
    { rank: 'A', type: 'vier-azen' }
  ];

  for (const { rank, type } of fourOfAKind) {
    const cards = hand.filter(c => c.rank === rank);
    if (cards.length === 4) {
      declarations.push({
        playerId: '',
        type,
        points: ROEM_POINTS[type],
        cards
      });
    }
  }

  // 3. Sequences per kleur (driekaart, vierkaart, vijfkaart, zeskaart)
  const suits: Suit[] = ['harten', 'ruiten', 'klaveren', 'schoppen'];

  for (const suit of suits) {
    const suitCards = hand.filter(c => c.suit === suit);
    if (suitCards.length < 3) continue;

    // Bepaal welke ranks aanwezig zijn in deze kleur
    const rankIndices = suitCards
      .map(c => RANK_ORDER.indexOf(c.rank))
      .sort((a, b) => a - b);

    // Vind langste opeenvolgende reeksen
    const sequences = findSequences(rankIndices);

    for (const seq of sequences) {
      if (seq.length < 3) continue;

      const seqCards = seq.map(idx =>
        suitCards.find(c => RANK_ORDER.indexOf(c.rank) === idx)!
      );

      // Check of deze reeks het stuk bevat (V+K van troef)
      const containsStuk = suit === trump &&
        seqCards.some(c => c.rank === 'V') &&
        seqCards.some(c => c.rank === 'K');

      let type: RoemType;
      if (seq.length >= 6) {
        type = 'zeskaart';
      } else if (seq.length === 5) {
        type = 'vijfkaart';
      } else if (seq.length === 4) {
        type = 'vierkaart';
      } else if (containsStuk) {
        type = 'driekaart-stuk';
      } else {
        type = 'driekaart';
      }

      declarations.push({
        playerId: '',
        type,
        points: ROEM_POINTS[type],
        cards: seqCards
      });
    }
  }

  // Als een reeks al stuk bevat, verwijder losse stuk-declaratie
  const hasStukInSequence = declarations.some(
    d => d.type === 'driekaart-stuk' || (
      (d.type === 'vierkaart' || d.type === 'vijfkaart' || d.type === 'zeskaart') &&
      d.cards.some(c => c.suit === trump && c.rank === 'V') &&
      d.cards.some(c => c.suit === trump && c.rank === 'K')
    )
  );

  if (hasStukInSequence) {
    const stukIndex = declarations.findIndex(d => d.type === 'stuk');
    if (stukIndex !== -1) {
      declarations.splice(stukIndex, 1);
    }
  }

  return declarations;
}

/**
 * Vind opeenvolgende reeksen in een gesorteerde lijst van indices
 */
function findSequences(sortedIndices: number[]): number[][] {
  if (sortedIndices.length === 0) return [];

  const sequences: number[][] = [];
  let current = [sortedIndices[0]];

  for (let i = 1; i < sortedIndices.length; i++) {
    if (sortedIndices[i] === sortedIndices[i - 1] + 1) {
      current.push(sortedIndices[i]);
    } else {
      sequences.push(current);
      current = [sortedIndices[i]];
    }
  }
  sequences.push(current);

  return sequences;
}

/**
 * Valideer of gemelde roem klopt met de hand
 */
export function validateRoem(
  declared: RoemDeclaration[],
  hand: Card[],
  trump: Suit | null
): boolean {
  if (!trump) return declared.length === 0;

  const actual = detectRoem(hand, trump);

  for (const decl of declared) {
    // Check of het type en de kaarten overeenkomen met een echte roem
    const match = actual.find(a =>
      a.type === decl.type &&
      a.cards.every(c => hand.some(h => h.id === c.id))
    );

    if (!match) return false;
  }

  return true;
}

/**
 * Bereken totaal aantal roempunten
 */
export function getTotalRoemPoints(declarations: RoemDeclaration[]): number {
  return declarations.reduce((sum, d) => sum + d.points, 0);
}

/**
 * Check of roem vals is (speler meldt roem die niet in hand zit)
 * Vals roemen = direct erin!
 */
export function isFalseRoem(
  declared: RoemDeclaration[],
  hand: Card[],
  trump: Suit | null
): boolean {
  if (declared.length === 0) return false;
  return !validateRoem(declared, hand, trump);
}
