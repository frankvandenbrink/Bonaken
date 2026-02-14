import type { Player, Bid, BidType } from 'shared';

export interface BiddingState {
  biddingOrder: string[];
  firstBidder: string;
}

/**
 * Initialiseer biedvolgorde: speler na dealer, kloksgewijs
 */
export function initBiddingState(players: Player[], dealerId: string): BiddingState {
  let dealerIndex = players.findIndex(p => p.id === dealerId);
  if (dealerIndex === -1) {
    console.warn(`initBiddingState: dealer ${dealerId} niet gevonden, val terug op index 0`);
    dealerIndex = 0;
  }
  const biddingOrder: string[] = [];

  // Start na de dealer, kloksgewijs
  for (let i = 1; i <= players.length; i++) {
    const idx = (dealerIndex + i) % players.length;
    // Sla spelers over die erin/eruit zijn
    if (players[idx].status !== 'erin' && players[idx].status !== 'eruit') {
      biddingOrder.push(players[idx].id);
    }
  }

  return {
    biddingOrder,
    firstBidder: biddingOrder[0]
  };
}

/**
 * Valideer of een bod geldig is
 */
export function isValidBid(newType: BidType, newAmount: number, currentBid: Bid | null): boolean {
  // Eerste bod: minimaal 25
  if (!currentBid) {
    if (newType === 'normal') return newAmount >= 25 && newAmount % 5 === 0;
    if (newType === 'misere') return true; // Misere mag altijd als eerste bod
    return false; // Zwabber/bonaak niet als eerste bod
  }

  switch (newType) {
    case 'normal':
      // Moet hoger zijn dan huidig bod, in stappen van 5
      if (currentBid.type !== 'normal') return false;
      return newAmount > currentBid.amount && newAmount % 5 === 0;

    case 'misere':
      // Boven 100, onder 105
      if (currentBid.type === 'misere') return true; // Meerdere misere toegestaan
      if (currentBid.type === 'normal') return currentBid.amount <= 100;
      return false;

    case 'zwabber':
      // Boven 125, onder 130
      if (currentBid.type === 'bonaak' || currentBid.type === 'bonaak-roem') return false;
      if (currentBid.type === 'zwabber') return false;
      if (currentBid.type === 'misere') return true;
      if (currentBid.type === 'normal') return currentBid.amount <= 125;
      return false;

    case 'bonaak':
      // Hoogste bod, alleen overtroffen door bonaak + roem
      if (currentBid.type === 'bonaak-roem') return false;
      if (currentBid.type === 'bonaak') return false; // Niet direct bonaak + roem bieden
      return true;

    case 'bonaak-roem':
      // Alleen als reactie op gewone bonaak
      if (currentBid.type === 'bonaak') return true;
      if (currentBid.type === 'bonaak-roem') return newAmount > currentBid.amount;
      return false;

    default:
      return false;
  }
}

/**
 * Bepaal de volgende bieder (sla gepaste spelers over)
 */
export function getNextBidder(biddingOrder: string[], currentBidderId: string, passedPlayers: Set<string>): string | null {
  const currentIndex = biddingOrder.indexOf(currentBidderId);

  for (let i = 1; i <= biddingOrder.length; i++) {
    const nextIndex = (currentIndex + i) % biddingOrder.length;
    const nextId = biddingOrder[nextIndex];
    if (!passedPlayers.has(nextId)) {
      return nextId;
    }
  }

  return null; // Iedereen gepast
}

/**
 * Check of het bieden compleet is (1 bieder over, of speciale gevallen)
 */
export function isBiddingComplete(biddingOrder: string[], passedPlayers: Set<string>, currentBid: Bid | null): {
  complete: boolean;
  winner: string | null;
} {
  const activeBidders = biddingOrder.filter(id => !passedPlayers.has(id));

  // Als iedereen gepast heeft
  if (activeBidders.length === 0) {
    return { complete: true, winner: null };
  }

  // Bij misere: meerdere spelers mogen meegaan, maar bieden stopt als iedereen heeft gekozen
  if (currentBid?.type === 'misere') {
    // Misere is speciaal: iedereen mag mee-miseren
    // Bieden is pas compleet als alle niet-gepaste spelers hun keuze hebben gemaakt
    if (activeBidders.length === 1) {
      return { complete: true, winner: activeBidders[0] };
    }
  }

  // 1 bieder over = winnaar
  if (activeBidders.length === 1 && currentBid) {
    return { complete: true, winner: activeBidders[0] };
  }

  return { complete: false, winner: null };
}
