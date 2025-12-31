import { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import styles from './RoundEnd.module.css';

/**
 * RoundEnd - Theatrical round summary with scoring reveal
 * Shows tricks won, bonaken result, and score changes
 */
export function RoundEnd() {
  const {
    players,
    roundScores,
    gameScores,
    bonakenSucceeded,
    bonaker,
    playerId,
    isHost
  } = useGame();

  const [countdown, setCountdown] = useState(5);
  const [showResults, setShowResults] = useState(false);

  // Start reveal animation after mount
  useEffect(() => {
    const timer = setTimeout(() => setShowResults(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const bonakerPlayer = bonaker ? players.find(p => p.id === bonaker) : null;

  // Sort players by tricks won (descending)
  const sortedPlayers = [...players].sort((a, b) => b.tricksWon - a.tricksWon);

  // Calculate total tricks for majority display
  const totalTricks = players.reduce((sum, p) => sum + p.tricksWon, 0);
  const majorityNeeded = Math.floor(totalTricks / 2) + 1;

  return (
    <div className={styles.container}>
      {/* Decorative corner flourishes */}
      <div className={styles.flourishTopLeft}>♠</div>
      <div className={styles.flourishTopRight}>♥</div>
      <div className={styles.flourishBottomLeft}>♦</div>
      <div className={styles.flourishBottomRight}>♣</div>

      {/* Main content card */}
      <div className={`${styles.resultCard} ${showResults ? styles.revealed : ''}`}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLine} />
          <h1 className={styles.title}>Ronde Voltooid</h1>
          <div className={styles.headerLine} />
        </header>

        {/* Bonaken Result Banner */}
        <div className={`${styles.bonakenBanner} ${
          bonakenSucceeded === true ? styles.success :
          bonakenSucceeded === false ? styles.failed :
          styles.neutral
        }`}>
          {bonakenSucceeded === true && (
            <>
              <span className={styles.resultIcon}>★</span>
              <span className={styles.resultText}>
                <strong>{bonakerPlayer?.nickname}</strong> heeft succesvol gebonaakt!
              </span>
              <span className={styles.resultIcon}>★</span>
            </>
          )}
          {bonakenSucceeded === false && (
            <>
              <span className={styles.resultIcon}>✗</span>
              <span className={styles.resultText}>
                <strong>{bonakerPlayer?.nickname}</strong> is mislukt met bonaken!
              </span>
              <span className={styles.resultIcon}>✗</span>
            </>
          )}
          {bonakenSucceeded === null && (
            <span className={styles.resultText}>Niemand heeft gebonaakt</span>
          )}
        </div>

        {/* Majority info for bonaker */}
        {bonaker && (
          <div className={styles.majorityInfo}>
            <span className={styles.majorityLabel}>Meerderheid nodig:</span>
            <span className={styles.majorityValue}>{majorityNeeded} slagen</span>
            <span className={styles.majorityDivider}>|</span>
            <span className={styles.majorityLabel}>Behaald:</span>
            <span className={`${styles.majorityValue} ${
              bonakerPlayer && bonakerPlayer.tricksWon >= majorityNeeded
                ? styles.majoritySuccess
                : styles.majorityFailed
            }`}>
              {bonakerPlayer?.tricksWon} slagen
            </span>
          </div>
        )}

        {/* Player Results Table */}
        <div className={styles.resultsTable}>
          <div className={styles.tableHeader}>
            <span className={styles.colPlayer}>Speler</span>
            <span className={styles.colTricks}>Slagen</span>
            <span className={styles.colRound}>Ronde</span>
            <span className={styles.colTotal}>Totaal</span>
          </div>

          <div className={styles.tableBody}>
            {sortedPlayers.map((player, index) => {
              const roundScore = roundScores?.[player.id] ?? 0;
              const totalScore = gameScores[player.id] ?? player.score;
              const isMe = player.id === playerId;
              const isBonaker = player.id === bonaker;
              const isDanger = totalScore >= 8;
              const gotPoints = roundScore > 0;

              return (
                <div
                  key={player.id}
                  className={`${styles.tableRow} ${isMe ? styles.isMe : ''} ${isDanger ? styles.isDanger : ''}`}
                  style={{ animationDelay: `${0.5 + index * 0.15}s` }}
                >
                  <span className={styles.colPlayer}>
                    <span className={styles.playerRank}>#{index + 1}</span>
                    <span className={styles.playerName}>
                      {player.nickname}
                      {isBonaker && <span className={styles.bonakerBadge}>B</span>}
                      {isMe && <span className={styles.meBadge}>jij</span>}
                    </span>
                  </span>

                  <span className={styles.colTricks}>
                    <span className={styles.tricksValue}>{player.tricksWon}</span>
                  </span>

                  <span className={styles.colRound}>
                    {gotPoints ? (
                      <span className={styles.pointsGained}>+{roundScore}</span>
                    ) : (
                      <span className={styles.noPoints}>—</span>
                    )}
                  </span>

                  <span className={styles.colTotal}>
                    <span className={`${styles.totalScore} ${isDanger ? styles.dangerScore : ''}`}>
                      {totalScore}
                      {isDanger && <span className={styles.dangerIcon}>⚠</span>}
                    </span>
                    <span className={styles.maxScore}>/10</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#d4af37' }} />
            Bonaker
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#c41e3a' }} />
            Bijna verloren (8+)
          </span>
        </div>

        {/* Footer with countdown/button */}
        <footer className={styles.footer}>
          <div className={styles.countdownContainer}>
            <div className={styles.countdownRing}>
              <svg viewBox="0 0 40 40" className={styles.countdownSvg}>
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  stroke="rgba(212, 175, 55, 0.2)"
                  strokeWidth="3"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  stroke="#d4af37"
                  strokeWidth="3"
                  strokeDasharray={113}
                  strokeDashoffset={113 - (113 * countdown / 5)}
                  strokeLinecap="round"
                  className={styles.countdownProgress}
                />
              </svg>
              <span className={styles.countdownNumber}>{countdown}</span>
            </div>
            <span className={styles.countdownText}>
              Volgende ronde begint over...
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default RoundEnd;
