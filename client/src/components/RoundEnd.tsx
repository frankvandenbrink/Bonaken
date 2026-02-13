import { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import styles from './RoundEnd.module.css';

const STATUS_LABELS: Record<string, string> = {
  suf: 'Suf',
  krom: 'Krom',
  recht: 'Recht',
  wip: 'Wip',
  erin: 'Erin',
  eruit: 'Eruit'
};

/**
 * RoundEnd - Theatrical round summary with scoring reveal
 * Shows bid result, trick points, and status transitions
 */
export function RoundEnd() {
  const {
    players,
    roundResult,
    playerId,
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

  const bidWinnerPlayer = roundResult
    ? players.find(p => p.id === roundResult.bidWinner)
    : null;

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

        {/* Bid Result Banner */}
        {roundResult && (
          <div className={`${styles.bonakenBanner} ${
            roundResult.bidAchieved ? styles.success : styles.failed
          }`}>
            {roundResult.bidAchieved ? (
              <>
                <span className={styles.resultIcon}>★</span>
                <span className={styles.resultText}>
                  <strong>{bidWinnerPlayer?.nickname}</strong> haalt het bod van {roundResult.bid.amount}!
                </span>
                <span className={styles.resultIcon}>★</span>
              </>
            ) : (
              <>
                <span className={styles.resultIcon}>✗</span>
                <span className={styles.resultText}>
                  <strong>{bidWinnerPlayer?.nickname}</strong> haalt het bod van {roundResult.bid.amount} niet!
                </span>
                <span className={styles.resultIcon}>✗</span>
              </>
            )}
          </div>
        )}

        {/* Player Results Table */}
        <div className={styles.resultsTable}>
          <div className={styles.tableHeader}>
            <span className={styles.colPlayer}>Speler</span>
            <span className={styles.colTricks}>Punten</span>
            <span className={styles.colRound}>Resultaat</span>
            <span className={styles.colTotal}>Status</span>
          </div>

          <div className={styles.tableBody}>
            {players.map((player, index) => {
              const result = roundResult?.playerResults[player.id];
              const isMe = player.id === playerId;
              const isBidWinner = player.id === roundResult?.bidWinner;
              const won = result?.won ?? false;
              const isEliminated = result?.newStatus === 'erin';
              const isSafe = result?.newStatus === 'eruit';

              return (
                <div
                  key={player.id}
                  className={`${styles.tableRow} ${isMe ? styles.isMe : ''} ${isEliminated ? styles.isDanger : ''}`}
                  style={{ animationDelay: `${0.5 + index * 0.15}s` }}
                >
                  <span className={styles.colPlayer}>
                    <span className={styles.playerRank}>#{index + 1}</span>
                    <span className={styles.playerName}>
                      {player.nickname}
                      {isBidWinner && <span className={styles.bonakerBadge}>B</span>}
                      {isMe && <span className={styles.meBadge}>jij</span>}
                    </span>
                  </span>

                  <span className={styles.colTricks}>
                    <span className={styles.tricksValue}>
                      {result?.trickPoints ?? 0}pt
                      {(result?.roem ?? 0) > 0 && ` +${result?.roem}r`}
                    </span>
                  </span>

                  <span className={styles.colRound}>
                    {won ? (
                      <span className={styles.noPoints} style={{ color: '#4caf50' }}>Gewonnen</span>
                    ) : (
                      <span className={styles.pointsGained} style={{ color: '#c41e3a' }}>Verloren</span>
                    )}
                  </span>

                  <span className={styles.colTotal}>
                    <span className={`${styles.totalScore} ${isEliminated ? styles.dangerScore : ''} ${isSafe ? styles.safeScore : ''}`}>
                      {result ? `${STATUS_LABELS[result.oldStatus]} → ${STATUS_LABELS[result.newStatus]}` : STATUS_LABELS[player.status]}
                      {isEliminated && <span className={styles.dangerIcon}>⚠</span>}
                      {isSafe && ' ✓'}
                    </span>
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
            Bieder
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#c41e3a' }} />
            Erin (verloren)
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#4caf50' }} />
            Eruit (veilig)
          </span>
        </div>

        {/* Footer with countdown */}
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
