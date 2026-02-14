import type { Card, Player, TableCard } from 'shared';
import { createDeck, shuffleDeck } from './deck';

interface DealResult {
  hands: Map<string, Card[]>;
  tableCards: TableCard[];
  sleepingCards: Card[];
}

/**
 * Leimuiden kaartdistributie
 * Altijd 6 kaarten per speler (max 5 spelers)
 * 2 open + 0-1 blind op tafel, rest slaapt
 */
export function getCardDistribution(playerCount: number): {
  cardsPerPlayer: number;
  openCards: number;
  blindCards: number;
  sleepingCards: number;
} {
  const distributions: Record<number, {
    cardsPerPlayer: number;
    openCards: number;
    blindCards: number;
    sleepingCards: number;
  }> = {
    2: { cardsPerPlayer: 6, openCards: 2, blindCards: 0, sleepingCards: 18 },
    3: { cardsPerPlayer: 6, openCards: 2, blindCards: 0, sleepingCards: 12 },
    4: { cardsPerPlayer: 6, openCards: 2, blindCards: 0, sleepingCards: 6 },
    5: { cardsPerPlayer: 6, openCards: 2, blindCards: 0, sleepingCards: 0 },
  };

  return distributions[playerCount] || distributions[4];
}

/**
 * Deel kaarten uit volgens Leimuiden regels
 * Per 3 kaarten: ieder 3, dan open+blind op tafel, dan ieder weer 3
 */
export function dealCards(players: Player[]): DealResult {
  const deck = shuffleDeck(createDeck());
  const playerCount = players.length;
  const { cardsPerPlayer, openCards, blindCards, sleepingCards: sleepingCount } = getCardDistribution(playerCount);

  const hands = new Map<string, Card[]>();
  let cardIndex = 0;

  // Initialiseer handen
  for (const player of players) {
    hands.set(player.id, []);
  }

  // Eerste ronde: 3 kaarten per speler
  for (const player of players) {
    const hand = hands.get(player.id)!;
    hand.push(...deck.slice(cardIndex, cardIndex + 3));
    cardIndex += 3;
  }

  // Tafelkaarten: open kaarten
  const tableCards: TableCard[] = [];
  for (let i = 0; i < openCards; i++) {
    tableCards.push({ card: deck[cardIndex], faceUp: true });
    cardIndex++;
  }

  // Tafelkaarten: blinde kaarten
  for (let i = 0; i < blindCards; i++) {
    tableCards.push({ card: deck[cardIndex], faceUp: false });
    cardIndex++;
  }

  // Tweede ronde: resterende kaarten per speler (tot cardsPerPlayer bereikt)
  const remainingPerPlayer = cardsPerPlayer - 3;
  for (const player of players) {
    const hand = hands.get(player.id)!;
    hand.push(...deck.slice(cardIndex, cardIndex + remainingPerPlayer));
    cardIndex += remainingPerPlayer;
  }

  // Slapende kaarten (doen niet mee)
  const sleepingCards = deck.slice(cardIndex, cardIndex + sleepingCount);

  return {
    hands,
    tableCards,
    sleepingCards
  };
}
