import type { Player } from 'shared';

/**
 * Krijg de volgende speler in wijzerzin
 * @param players - Alle spelers in het spel
 * @param currentPlayerId - De huidige speler
 * @returns De volgende speler
 */
export function getNextPlayer(players: Player[], currentPlayerId: string): Player {
  const currentIndex = players.findIndex(p => p.id === currentPlayerId);
  if (currentIndex === -1) {
    throw new Error('Current player not found');
  }

  const nextIndex = (currentIndex + 1) % players.length;
  return players[nextIndex];
}

/**
 * Krijg de eerste speler van een ronde (links van de deler)
 * @param players - Alle spelers in het spel
 * @param dealerId - De deler
 * @returns De eerste speler
 */
export function getFirstPlayer(players: Player[], dealerId: string): Player {
  return getNextPlayer(players, dealerId);
}

/**
 * Krijg de speler die de volgende slag begint (winnaar van vorige slag)
 * @param players - Alle spelers
 * @param winnerId - De winnaar van de vorige slag
 * @returns De speler die begint
 */
export function getTrickStarter(players: Player[], winnerId: string): Player {
  const winner = players.find(p => p.id === winnerId);
  if (!winner) {
    throw new Error('Winner not found');
  }
  return winner;
}

/**
 * Bereken hoeveel slagen nodig zijn voor meerderheid
 * @param totalTricks - Totaal aantal slagen in de ronde
 * @returns Minimaal aantal slagen voor meerderheid
 */
export function getMajorityThreshold(totalTricks: number): number {
  return Math.floor(totalTricks / 2) + 1;
}

/**
 * Bereken het totaal aantal slagen in een ronde
 * Dit is gebaseerd op het aantal kaarten per speler
 * @param cardsPerPlayer - Aantal kaarten per speler
 * @returns Totaal aantal slagen
 */
export function getTotalTricks(cardsPerPlayer: number): number {
  return cardsPerPlayer;
}

/**
 * Controleer of een speler de meerderheid van slagen heeft gewonnen
 * @param tricksWon - Aantal gewonnen slagen
 * @param totalTricks - Totaal aantal slagen
 * @returns Boolean of speler meerderheid heeft
 */
export function hasMajority(tricksWon: number, totalTricks: number): boolean {
  return tricksWon >= getMajorityThreshold(totalTricks);
}
