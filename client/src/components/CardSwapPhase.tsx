import { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import type { Suit } from '@shared/index';
import styles from './CardSwapPhase.module.css';

const SUIT_SYMBOLS: Record<Suit, string> = {
  harten: '♥',
  ruiten: '♦',
  klaveren: '♣',
  schoppen: '♠'
};

/**
 * CardSwapPhase - The bid winner picks up table cards and discards equal number
 * Victorian reveal moment with card selection interface
 */
export function CardSwapPhase() {
  const {
    players,
    playerId,
    currentTurn,
    hand,
    tableCards,
    bidWinner,
    swapCards
  } = useGame();

  const [selectedDiscard, setSelectedDiscard] = useState<string[]>([]);

  const isSwapper = currentTurn === playerId;
  const swapperPlayer = players.find(p => p.id === bidWinner);
  const requiredDiscard = tableCards.length;

  const toggleCard = (cardId: string) => {
    if (!isSwapper) return;
    setSelectedDiscard(prev =>
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : prev.length < requiredDiscard
          ? [...prev, cardId]
          : prev
    );
  };

  const handleConfirm = () => {
    if (selectedDiscard.length === requiredDiscard) {
      swapCards(selectedDiscard);
    }
  };

  // Waiting state for non-swappers
  if (!isSwapper) {
    return (
      <div className={styles.container}>
        <div className={styles.waitingState}>
          <div className={styles.waitingIcon}>
            <span className={styles.cardStack}>🂠</span>
          </div>
          <h2 className={styles.waitingTitle}>Kaarten Ruilen</h2>
          <p className={styles.waitingSubtitle}>
            <span className={styles.swapperName}>{swapperPlayer?.nickname}</span> bekijkt de tafelkaarten...
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

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLine} />
        <h2 className={styles.title}>Kaarten Ruilen</h2>
        <div className={styles.headerLine} />
      </div>

      <p className={styles.instruction}>
        Bekijk de tafelkaarten en leg <strong>{requiredDiscard}</strong> kaarten af uit je hand
      </p>

      {/* Table cards display */}
      <div className={styles.tableCardsSection}>
        <span className={styles.sectionLabel}>Tafelkaarten</span>
        <div className={styles.tableCardsRow}>
          {tableCards.map((tc, index) => {
            const isRed = tc.card.suit === 'harten' || tc.card.suit === 'ruiten';
            return (
              <div
                key={tc.card.id}
                className={`${styles.tableCard} ${tc.faceUp ? styles.faceUp : styles.faceDown}`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {tc.faceUp ? (
                  <div className={`${styles.cardFace} ${isRed ? styles.red : styles.black}`}>
                    <span className={styles.cardRank}>{tc.card.rank}</span>
                    <span className={styles.cardSuit}>{SUIT_SYMBOLS[tc.card.suit]}</span>
                  </div>
                ) : (
                  <div className={styles.cardBack}>
                    <span className={styles.backPattern}>♠♥♦♣</span>
                  </div>
                )}
                <span className={styles.cardLabel}>{tc.faceUp ? 'Open' : 'Blind'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hand - select cards to discard */}
      <div className={styles.handSection}>
        <span className={styles.sectionLabel}>
          Jouw Hand — Selecteer {requiredDiscard} kaarten om af te leggen
          {selectedDiscard.length > 0 && (
            <span className={styles.selectionCount}>
              ({selectedDiscard.length}/{requiredDiscard})
            </span>
          )}
        </span>
        <div className={styles.handGrid}>
          {hand.map((card) => {
            const isRed = card.suit === 'harten' || card.suit === 'ruiten';
            const isSelected = selectedDiscard.includes(card.id);

            return (
              <button
                key={card.id}
                className={`${styles.handCard} ${isSelected ? styles.selectedCard : ''}`}
                onClick={() => toggleCard(card.id)}
                type="button"
              >
                <div className={`${styles.cardFace} ${isRed ? styles.red : styles.black}`}>
                  <span className={styles.cardRank}>{card.rank}</span>
                  <span className={styles.cardSuit}>{SUIT_SYMBOLS[card.suit]}</span>
                </div>
                {isSelected && (
                  <div className={styles.discardOverlay}>
                    <span className={styles.discardIcon}>✗</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirm button */}
      <button
        className={`${styles.confirmButton} ${selectedDiscard.length === requiredDiscard ? styles.ready : ''}`}
        onClick={handleConfirm}
        disabled={selectedDiscard.length !== requiredDiscard}
        type="button"
      >
        {selectedDiscard.length === requiredDiscard
          ? 'Bevestig Ruil'
          : `Selecteer nog ${requiredDiscard - selectedDiscard.length} kaart${requiredDiscard - selectedDiscard.length !== 1 ? 'en' : ''}`}
      </button>
    </div>
  );
}

export default CardSwapPhase;
