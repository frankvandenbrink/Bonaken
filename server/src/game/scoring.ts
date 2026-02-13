import type { Player, Bid, PlayerStatus, Suit, RoemDeclaration } from 'shared';
import { getTotalRoemPoints } from './roem';

export interface RoundResult {
  bidWinner: string;
  bid: Bid;
  bidAchieved: boolean;
  playerResults: Record<string, {
    won: boolean;
    oldStatus: PlayerStatus;
    newStatus: PlayerStatus;
    trickPoints: number;
    roem: number;
  }>;
}

/**
 * Bepaal het resultaat van een ronde
 *
 * Regels:
 * - Bieder behaalt bod (kaartpunten + roem >= bod): bieder wint, rest verliest
 * - Bieder faalt: bieder verliest, rest wint
 * - Misère: 0 slagen halen = winst
 * - Zwabber: alle slagen halen zonder troef = winst
 * - Bonaak: alle slagen halen met troef = winst
 */
export function determineRoundResult(
  players: Player[],
  bidWinner: string,
  bid: Bid,
  trump: Suit | null,
  roemDeclarations: RoemDeclaration[]
): RoundResult {
  const bidder = players.find(p => p.id === bidWinner);
  if (!bidder) {
    throw new Error('Bieder niet gevonden');
  }

  // Bereken bieder punten
  const bidderRoem = roemDeclarations
    .filter(r => r.playerId === bidWinner)
    .reduce((sum, r) => sum + r.points, 0);
  const bidderTotal = bidder.trickPoints + bidderRoem;

  // Bepaal of bod gehaald is
  let bidAchieved: boolean;

  switch (bid.type) {
    case 'misere':
      // Misère: 0 slagen halen
      bidAchieved = bidder.tricksWon === 0;
      break;
    case 'zwabber':
      // Zwabber: alle slagen zonder troef
      bidAchieved = players
        .filter(p => p.id !== bidWinner && p.status !== 'erin' && p.status !== 'eruit')
        .every(p => p.tricksWon === 0);
      break;
    case 'bonaak':
    case 'bonaak-roem':
      // Bonaak: alle slagen met troef
      bidAchieved = players
        .filter(p => p.id !== bidWinner && p.status !== 'erin' && p.status !== 'eruit')
        .every(p => p.tricksWon === 0);
      break;
    default:
      // Normaal bod: kaartpunten + roem >= bod
      bidAchieved = bidderTotal >= bid.amount;
  }

  // Bepaal resultaat per speler
  const playerResults: RoundResult['playerResults'] = {};

  for (const p of players) {
    // Spelers die erin/eruit zijn, slaan over
    if (p.status === 'erin' || p.status === 'eruit') {
      playerResults[p.id] = {
        won: false,
        oldStatus: p.status,
        newStatus: p.status,
        trickPoints: p.trickPoints,
        roem: p.declaredRoem
      };
      continue;
    }

    const oldStatus = p.status;
    let won: boolean;

    if (p.id === bidWinner) {
      won = bidAchieved;
    } else {
      won = !bidAchieved; // Tegenpartij wint als bieder faalt
    }

    const newStatus = updatePlayerStatus(oldStatus, won);
    p.status = newStatus;

    playerResults[p.id] = {
      won,
      oldStatus,
      newStatus,
      trickPoints: p.trickPoints,
      roem: roemDeclarations
        .filter(r => r.playerId === p.id)
        .reduce((sum, r) => sum + r.points, 0)
    };
  }

  return {
    bidWinner,
    bid,
    bidAchieved,
    playerResults
  };
}

/**
 * Status transitie op basis van winst/verlies
 *
 * Leimuidens systeem:
 * - suf + winst = recht
 * - suf + verlies = krom
 * - krom + winst = wip
 * - krom + verlies = erin (verloren! rondje geven)
 * - recht + winst = eruit (veilig!)
 * - recht + verlies = wip
 * - wip + winst = eruit
 * - wip + verlies = erin
 */
export function updatePlayerStatus(status: PlayerStatus, won: boolean): PlayerStatus {
  switch (status) {
    case 'suf':
      return won ? 'recht' : 'krom';
    case 'krom':
      return won ? 'wip' : 'erin';
    case 'recht':
      return won ? 'eruit' : 'wip';
    case 'wip':
      return won ? 'eruit' : 'erin';
    case 'erin':
    case 'eruit':
      return status; // Al afgelopen
  }
}

/**
 * Check of het spel voorbij is (alle actieve spelers erin of eruit)
 */
export function isGameComplete(players: Player[]): boolean {
  const activePlayers = players.filter(p => p.status !== 'erin' && p.status !== 'eruit');
  return activePlayers.length <= 1;
}
