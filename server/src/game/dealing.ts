import type { Card, Player } from 'shared';
import { createDeck, shuffleDeck } from './deck';

interface DealResult {
  hands: Map<string, Card[]>; // playerId -> cards
  sleepingCards: Card[];
}

/**
 * Bereken hoeveel kaarten per speler en hoeveel slapende kaarten
 * Gebaseerd op het aantal spelers
 */
export function getCardDistribution(playerCount: number): { cardsPerPlayer: number; sleepingCards: number } {
  // 32 kaarten totaal
  // 2 spelers: 16 elk, 0 slapend
  // 3 spelers: 10 elk, 2 slapend
  // 4 spelers: 8 elk, 0 slapend
  // 5 spelers: 6 elk, 2 slapend
  // 6 spelers: 5 elk, 2 slapend
  // 7 spelers: 4 elk, 4 slapend

  const distributions: Record<number, { cardsPerPlayer: number; sleepingCards: number }> = {
    2: { cardsPerPlayer: 16, sleepingCards: 0 },
    3: { cardsPerPlayer: 10, sleepingCards: 2 },
    4: { cardsPerPlayer: 8, sleepingCards: 0 },
    5: { cardsPerPlayer: 6, sleepingCards: 2 },
    6: { cardsPerPlayer: 5, sleepingCards: 2 },
    7: { cardsPerPlayer: 4, sleepingCards: 4 }
  };

  return distributions[playerCount] || distributions[4];
}

/**
 * Deel kaarten uit aan alle spelers
 * Returns een map van playerId -> kaarten en eventuele slapende kaarten
 */
export function dealCards(players: Player[]): DealResult {
  const deck = shuffleDeck(createDeck());
  const playerCount = players.length;
  const { cardsPerPlayer, sleepingCards: sleepingCount } = getCardDistribution(playerCount);

  const hands = new Map<string, Card[]>();
  let cardIndex = 0;

  // Deel kaarten aan elke speler
  for (const player of players) {
    const hand = deck.slice(cardIndex, cardIndex + cardsPerPlayer);
    hands.set(player.id, hand);
    cardIndex += cardsPerPlayer;
  }

  // Resterende kaarten zijn slapend
  const sleepingCards = deck.slice(cardIndex, cardIndex + sleepingCount);

  return {
    hands,
    sleepingCards
  };
}

/**
 * Wijs slapende kaarten toe aan de bonaker
 * De bonaker krijgt alle slapende kaarten erbij
 */
export function assignSleepingCards(
  hands: Map<string, Card[]>,
  sleepingCards: Card[],
  bonakerId: string
): void {
  const bonakerHand = hands.get(bonakerId);
  if (bonakerHand && sleepingCards.length > 0) {
    bonakerHand.push(...sleepingCards);
  }
}
