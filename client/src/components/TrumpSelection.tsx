import { useGame } from '../contexts/GameContext';
import type { Suit } from '@shared/index';
import styles from './TrumpSelection.module.css';

const SUITS: { suit: Suit; symbol: string; name: string; color: 'red' | 'black' }[] = [
  { suit: 'harten', symbol: '♥', name: 'Harten', color: 'red' },
  { suit: 'ruiten', symbol: '♦', name: 'Ruiten', color: 'red' },
  { suit: 'klaveren', symbol: '♣', name: 'Klaveren', color: 'black' },
  { suit: 'schoppen', symbol: '♠', name: 'Schoppen', color: 'black' },
];

/**
 * TrumpSelection - Ceremonial trump suit selection
 * The bonaker (or dealer if no one bonaked) chooses the trump suit
 */
export function TrumpSelection() {
  const { currentTurn, playerId, trump, selectTrump, players } = useGame();

  const isSelector = currentTurn === playerId;
  const selectorPlayer = players.find(p => p.id === currentTurn);
  const selectorName = selectorPlayer?.nickname || 'Onbekend';

  // If trump is already selected, show confirmation
  if (trump) {
    const selectedSuit = SUITS.find(s => s.suit === trump);
    return (
      <div className={styles.container}>
        <div className={styles.selectedState}>
          <div className={styles.selectedHeader}>
            <span className={styles.crownIcon}>♚</span>
            <h2 className={styles.selectedTitle}>Troef Gekozen</h2>
          </div>

          <div className={`${styles.selectedSuit} ${styles[selectedSuit?.color || 'black']}`}>
            <span className={styles.selectedSymbol}>{selectedSuit?.symbol}</span>
            <span className={styles.selectedName}>{selectedSuit?.name}</span>
          </div>

          <div className={styles.radiance}>
            <div className={styles.radianceRing} />
            <div className={styles.radianceRing} style={{ animationDelay: '0.2s' }} />
            <div className={styles.radianceRing} style={{ animationDelay: '0.4s' }} />
          </div>

          <p className={styles.continueHint}>Het spel begint zo...</p>
        </div>
      </div>
    );
  }

  // Waiting state for non-selectors
  if (!isSelector) {
    return (
      <div className={styles.container}>
        <div className={styles.waitingState}>
          <div className={styles.waitingIcon}>
            <span className={styles.cardBack}>🂠</span>
          </div>
          <h2 className={styles.waitingTitle}>Wachten op Troefkeuze</h2>
          <p className={styles.waitingSubtitle}>
            <span className={styles.selectorName}>{selectorName}</span> kiest de troef...
          </p>
          <div className={styles.waitingDots}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
        </div>
      </div>
    );
  }

  // Selection state for the selector
  return (
    <div className={styles.container}>
      <div className={styles.selectionState}>
        <div className={styles.header}>
          <div className={styles.ornament}>✦</div>
          <h2 className={styles.title}>Kies Je Troef</h2>
          <div className={styles.ornament}>✦</div>
        </div>

        <p className={styles.subtitle}>
          Welke kleur zal zegevieren?
        </p>

        <div className={styles.suitsGrid}>
          {SUITS.map((suit, index) => (
            <button
              key={suit.suit}
              className={`${styles.suitButton} ${styles[suit.color]}`}
              onClick={() => selectTrump(suit.suit)}
              style={{ animationDelay: `${index * 0.1}s` }}
              type="button"
            >
              <div className={styles.suitInner}>
                <span className={styles.suitSymbol}>{suit.symbol}</span>
                <span className={styles.suitName}>{suit.name}</span>
              </div>
              <div className={styles.suitGlow} />
            </button>
          ))}
        </div>

        <p className={styles.hint}>
          Klik op een kleur om troef te bepalen
        </p>
      </div>
    </div>
  );
}

export default TrumpSelection;
