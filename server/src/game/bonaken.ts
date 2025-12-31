import type { BonakChoice, Player } from '../../../shared/src/index';

/**
 * Check of alle spelers een keuze hebben gemaakt
 */
export function allPlayersChosen(choices: BonakChoice[]): boolean {
  return choices.every(choice => choice.choice !== null);
}

/**
 * Krijg het aantal spelers dat al gekozen heeft
 */
export function getChosenCount(choices: BonakChoice[]): number {
  return choices.filter(choice => choice.choice !== null).length;
}

/**
 * Bepaal wie de bonaker is
 * Regels:
 * - Als niemand bonaakt: return null
 * - Als één persoon bonaakt: die wint
 * - Als meerdere bonaken: eerste in wijzerzin vanaf de deler wint
 *
 * @param choices - Alle gemaakte keuzes
 * @param players - Alle spelers in de juiste volgorde
 * @param dealerId - ID van de huidige deler
 * @returns De ID van de bonaker, of null als niemand bonaakt
 */
export function determineBonaker(
  choices: BonakChoice[],
  players: Player[],
  dealerId: string
): string | null {
  // Vind alle spelers die bonaken
  const bonakers = choices.filter(c => c.choice === 'bonaken');

  if (bonakers.length === 0) {
    return null;
  }

  if (bonakers.length === 1) {
    return bonakers[0].playerId;
  }

  // Meerdere bonakers: bepaal volgorde vanaf deler (wijzerzin = links van deler eerst)
  const dealerIndex = players.findIndex(p => p.id === dealerId);

  // Maak een geordende lijst vanaf de speler links van de deler
  const orderedPlayers: Player[] = [];
  for (let i = 1; i <= players.length; i++) {
    const index = (dealerIndex + i) % players.length;
    orderedPlayers.push(players[index]);
  }

  // Vind de eerste bonaker in deze volgorde
  for (const player of orderedPlayers) {
    if (bonakers.some(b => b.playerId === player.id)) {
      return player.id;
    }
  }

  // Zou niet moeten gebeuren
  return bonakers[0].playerId;
}

/**
 * Registreer de keuze van een speler
 */
export function registerChoice(
  choices: BonakChoice[],
  playerId: string,
  choice: 'bonaken' | 'passen'
): boolean {
  const playerChoice = choices.find(c => c.playerId === playerId);

  if (!playerChoice) {
    return false; // Speler niet gevonden
  }

  if (playerChoice.choice !== null) {
    return false; // Speler heeft al gekozen
  }

  playerChoice.choice = choice;
  return true;
}

/**
 * Check of een speler al gekozen heeft
 */
export function hasPlayerChosen(choices: BonakChoice[], playerId: string): boolean {
  const choice = choices.find(c => c.playerId === playerId);
  return choice?.choice !== null;
}

/**
 * Reset alle keuzes voor een nieuwe ronde
 */
export function resetChoices(players: Player[]): BonakChoice[] {
  return players.map(p => ({
    playerId: p.id,
    choice: null
  }));
}
