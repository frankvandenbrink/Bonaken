import { memo } from 'react';
import type { Card as CardType } from '@shared/index';
import { getSuitSymbol, isRedSuit } from '@shared/cardUtils';
import styles from './Card.module.css';

interface CardProps {
  card: CardType;
  isPlayable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

/**
 * Playing card component with Dutch cafe aesthetic
 * Displays suit symbol and rank with appropriate coloring
 */
export const Card = memo(function Card({
  card,
  isPlayable = false,
  isSelected = false,
  onClick
}: CardProps) {
  const suitSymbol = getSuitSymbol(card.suit);
  const isRed = isRedSuit(card.suit);

  const handleClick = () => {
    if (isPlayable && onClick) {
      onClick();
    }
  };

  return (
    <button
      className={`${styles.card} ${isPlayable ? styles.playable : ''} ${isSelected ? styles.selected : ''} ${isRed ? styles.red : styles.black}`}
      onClick={handleClick}
      disabled={!isPlayable}
      aria-label={`${card.rank} ${card.suit}`}
      type="button"
    >
      {/* Top-left corner */}
      <div className={styles.corner}>
        <span className={styles.rank}>{card.rank}</span>
        <span className={styles.suit}>{suitSymbol}</span>
      </div>

      {/* Center suit symbol */}
      <div className={styles.center}>
        <span className={styles.centerSuit}>{suitSymbol}</span>
      </div>

      {/* Bottom-right corner (inverted) */}
      <div className={`${styles.corner} ${styles.bottomRight}`}>
        <span className={styles.rank}>{card.rank}</span>
        <span className={styles.suit}>{suitSymbol}</span>
      </div>

      {/* Card texture overlay */}
      <div className={styles.texture} />
    </button>
  );
});

export default Card;
