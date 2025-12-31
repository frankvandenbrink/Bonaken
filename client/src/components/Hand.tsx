import { useMemo } from 'react';
import type { Card as CardType, Suit } from '@shared/index';
import { sortHand } from '@shared/cardUtils';
import { Card } from './Card';
import styles from './Hand.module.css';

interface HandProps {
  cards: CardType[];
  validCardIds?: string[];
  onCardClick?: (cardId: string) => void;
  selectedCardId?: string | null;
  trump?: Suit | null;
}

/**
 * Hand component - displays cards in a fan layout
 * Cards are sorted by suit then rank, with valid cards raised
 */
export function Hand({
  cards,
  validCardIds = [],
  onCardClick,
  selectedCardId = null,
  trump = null
}: HandProps) {
  // Sort cards by suit and rank
  const sortedCards = useMemo(() => {
    return sortHand(cards, trump);
  }, [cards, trump]);

  // Create a set for faster lookup
  const validSet = useMemo(() => new Set(validCardIds), [validCardIds]);

  if (cards.length === 0) {
    return (
      <div className={styles.hand}>
        <div className={styles.empty}>Geen kaarten</div>
      </div>
    );
  }

  return (
    <div className={styles.hand}>
      <div className={styles.cardContainer}>
        {sortedCards.map((card, index) => {
          const isPlayable = validSet.has(card.id);
          const isSelected = selectedCardId === card.id;

          return (
            <div
              key={card.id}
              className={`${styles.cardWrapper} ${isPlayable ? styles.valid : ''}`}
              style={{
                '--card-index': index,
                '--total-cards': sortedCards.length,
              } as React.CSSProperties}
            >
              <Card
                card={card}
                isPlayable={isPlayable}
                isSelected={isSelected}
                onClick={() => onCardClick?.(card.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Hand;
