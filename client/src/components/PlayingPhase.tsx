import { useGame } from '../contexts/GameContext';
import type { Suit } from '@shared/index';
import { Table } from './Table';
import styles from './PlayingPhase.module.css';

const SUIT_SYMBOLS: Record<Suit, string> = {
  harten: '♥',
  ruiten: '♦',
  klaveren: '♣',
  schoppen: '♠'
};

const SUIT_NAMES: Record<Suit, string> = {
  harten: 'Harten',
  ruiten: 'Ruiten',
  klaveren: 'Klaveren',
  schoppen: 'Schoppen'
};

/**
 * PlayingPhase - The main gameplay component
 * Shows current trick, trump indicator, turn indicator, and scores
 */
export function PlayingPhase() {
  const {
    currentTurn,
    currentTrick,
    trump,
    players,
    playerId,
    trickWinner,
    bonaker
  } = useGame();

  const isMyTurn = currentTurn === playerId;
  const currentPlayer = players.find(p => p.id === currentTurn);
  const winnerPlayer = trickWinner ? players.find(p => p.id === trickWinner) : null;

  // Get card position based on player index relative to current player
  const getCardPosition = (playerIndex: number, totalPlayers: number) => {
    const myIndex = players.findIndex(p => p.id === playerId);
    const relativeIndex = (playerIndex - myIndex + totalPlayers) % totalPlayers;

    // Position cards in a circle formation
    const positions = [
      { bottom: '10%', left: '50%', transform: 'translateX(-50%)' }, // Me (bottom)
      { top: '50%', left: '10%', transform: 'translateY(-50%)' },    // Left
      { top: '10%', left: '50%', transform: 'translateX(-50%)' },    // Top
      { top: '50%', right: '10%', transform: 'translateY(-50%)' },   // Right
      { top: '25%', left: '20%' },  // Top-left
      { top: '25%', right: '20%' }, // Top-right
      { bottom: '25%', left: '20%' }, // Bottom-left
    ];

    return positions[relativeIndex] || positions[0];
  };

  return (
    <div className={styles.container}>
      {/* Top bar: Trump + Turn indicator */}
      <div className={styles.topBar}>
        {/* Trump Indicator */}
        {trump && (
          <div className={`${styles.trumpIndicator} ${styles[trump]}`}>
            <span className={styles.trumpLabel}>Troef</span>
            <span className={styles.trumpSymbol}>{SUIT_SYMBOLS[trump]}</span>
            <span className={styles.trumpName}>{SUIT_NAMES[trump]}</span>
          </div>
        )}

        {/* Turn Indicator */}
        <div className={`${styles.turnIndicator} ${isMyTurn ? styles.myTurn : ''}`}>
          {trickWinner ? (
            <div className={styles.winnerAnnouncement}>
              <span className={styles.winnerIcon}>★</span>
              <span className={styles.winnerText}>
                {winnerPlayer?.nickname} wint de slag!
              </span>
            </div>
          ) : isMyTurn ? (
            <>
              <div className={styles.turnPulse} />
              <span className={styles.turnText}>Jouw beurt</span>
              <span className={styles.turnHint}>Kies een kaart</span>
            </>
          ) : (
            <>
              <span className={styles.waitingText}>
                <span className={styles.playerName}>{currentPlayer?.nickname || '...'}</span>
                <span className={styles.waitingSuffix}> is aan zet</span>
              </span>
              <div className={styles.waitingDots}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center: Trick Area with Immersive Table */}
      <div className={styles.trickArea}>
        <Table playerCount={players.length} showOrnaments={true}>
          {/* Played cards */}
          {currentTrick.length > 0 ? (
            <div className={styles.playedCards}>
              {currentTrick.map((playedCard, index) => {
                const player = players.find(p => p.id === playedCard.playerId);
                const playerIndex = players.findIndex(p => p.id === playedCard.playerId);
                const isWinner = playedCard.playerId === trickWinner;
                const isRed = playedCard.card.suit === 'harten' || playedCard.card.suit === 'ruiten';

                return (
                  <div
                    key={playedCard.card.id}
                    className={`${styles.playedCard} ${isWinner ? styles.winningCard : ''}`}
                    style={{
                      ...getCardPosition(playerIndex, players.length),
                      animationDelay: `${index * 0.1}s`
                    }}
                  >
                    <div className={`${styles.cardFace} ${isRed ? styles.red : styles.black}`}>
                      <span className={styles.cardRank}>{playedCard.card.rank}</span>
                      <span className={styles.cardSuit}>{SUIT_SYMBOLS[playedCard.card.suit]}</span>
                    </div>
                    <span className={styles.cardPlayer}>{player?.nickname}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyTrick}>
              <span className={styles.emptyIcon}>♠♥♦♣</span>
              <span className={styles.emptyText}>Wachten op eerste kaart...</span>
            </div>
          )}
        </Table>
      </div>

      {/* Bottom: Player scores */}
      <div className={styles.scoreBoard}>
        <div className={styles.scoreTitle}>Slagen</div>
        <div className={styles.scores}>
          {players.map(player => {
            const isCurrentTurn = player.id === currentTurn;
            const isBonaker = player.id === bonaker;
            const isMe = player.id === playerId;

            return (
              <div
                key={player.id}
                className={`
                  ${styles.scoreItem}
                  ${isCurrentTurn ? styles.active : ''}
                  ${isBonaker ? styles.bonaker : ''}
                  ${isMe ? styles.me : ''}
                `}
              >
                <span className={styles.scoreName}>
                  {player.nickname}
                  {isBonaker && <span className={styles.bonakerBadge}>B</span>}
                </span>
                <span className={styles.scoreValue}>{player.tricksWon}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PlayingPhase;
