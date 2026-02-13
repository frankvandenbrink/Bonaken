import { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import styles from './GameEnd.module.css';

const STATUS_LABELS: Record<string, string> = {
  suf: 'Suf',
  krom: 'Krom',
  recht: 'Recht',
  wip: 'Wip',
  erin: 'Erin',
  eruit: 'Eruit'
};

/**
 * GameEnd - Theatrical finale screen with Victorian casino aesthetics
 * Shows final statuses, highlights erin/eruit players, and offers rematch
 */
export function GameEnd() {
  const {
    players,
    playerStatuses,
    playerId,
    rematchRequests,
    requestRematch,
    leaveGame
  } = useGame();

  const [curtainsOpen, setCurtainsOpen] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [hasRequestedRematch, setHasRequestedRematch] = useState(false);

  // Theatrical reveal sequence
  useEffect(() => {
    const curtainTimer = setTimeout(() => setCurtainsOpen(true), 300);
    const scoresTimer = setTimeout(() => setShowScores(true), 1000);
    return () => {
      clearTimeout(curtainTimer);
      clearTimeout(scoresTimer);
    };
  }, []);

  // Track if current player has requested rematch
  useEffect(() => {
    if (playerId && rematchRequests.includes(playerId)) {
      setHasRequestedRematch(true);
    }
  }, [playerId, rematchRequests]);

  // Sort players: eruit first (winners), then others, erin last (losers)
  const statusOrder: Record<string, number> = { eruit: 0, recht: 1, wip: 2, suf: 3, krom: 4, erin: 5 };
  const rankedPlayers = [...players].sort((a, b) => {
    const statusA = playerStatuses[a.id] || a.status;
    const statusB = playerStatuses[b.id] || b.status;
    return (statusOrder[statusA] ?? 3) - (statusOrder[statusB] ?? 3);
  });

  // Find current player's status
  const myStatus = playerId ? (playerStatuses[playerId] || '') : '';
  const isCurrentPlayerLoser = myStatus === 'erin';

  const handleRematch = () => {
    if (!hasRequestedRematch) {
      requestRematch();
      setHasRequestedRematch(true);
    }
  };

  // Get players who want rematch
  const rematchPlayerNames = players
    .filter(p => rematchRequests.includes(p.id))
    .map(p => p.nickname);

  return (
    <div className={styles.container}>
      {/* Ambient particles */}
      <div className={styles.particles}>
        {[...Array(12)].map((_, i) => (
          <span key={i} className={styles.particle} style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${4 + Math.random() * 4}s`
          }}>
            {['♠', '♥', '♦', '♣'][i % 4]}
          </span>
        ))}
      </div>

      {/* Theatrical curtains */}
      <div className={`${styles.curtainLeft} ${curtainsOpen ? styles.open : ''}`} />
      <div className={`${styles.curtainRight} ${curtainsOpen ? styles.open : ''}`} />

      {/* Spotlight effect */}
      <div className={styles.spotlight} />

      {/* Main content */}
      <div className={`${styles.stage} ${showScores ? styles.revealed : ''}`}>
        {/* Ornate frame */}
        <div className={styles.frame}>
          <div className={styles.frameCorner} data-position="tl">♠</div>
          <div className={styles.frameCorner} data-position="tr">♥</div>
          <div className={styles.frameCorner} data-position="bl">♣</div>
          <div className={styles.frameCorner} data-position="br">♦</div>

          {/* Header */}
          <header className={styles.header}>
            <div className={styles.headerOrnament}>— ✦ —</div>
            <h1 className={styles.title}>
              {isCurrentPlayerLoser ? 'Helaas...' : 'Einde Spel'}
            </h1>
            <p className={styles.subtitle}>
              {isCurrentPlayerLoser
                ? 'Je bent erin! Rondje geven!'
                : 'Het spel is afgelopen!'}
            </p>
            <div className={styles.headerOrnament}>— ✦ —</div>
          </header>

          {/* Scoreboard */}
          <div className={styles.scoreboard}>
            <div className={styles.scoreboardHeader}>
              <span className={styles.colRank}>#</span>
              <span className={styles.colName}>Speler</span>
              <span className={styles.colScore}>Status</span>
            </div>

            <div className={styles.scoreboardBody}>
              {rankedPlayers.map((player, index) => {
                const status = playerStatuses[player.id] || player.status;
                const isLoser = status === 'erin';
                const isWinner = status === 'eruit';
                const isMe = player.id === playerId;
                const wantsRematch = rematchRequests.includes(player.id);

                return (
                  <div
                    key={player.id}
                    className={`
                      ${styles.playerRow}
                      ${isLoser ? styles.loserRow : ''}
                      ${isMe ? styles.meRow : ''}
                      ${isWinner ? styles.winnerRow : ''}
                    `}
                    style={{ animationDelay: `${1.2 + index * 0.15}s` }}
                  >
                    {/* Rank */}
                    <span className={styles.rank}>
                      {isLoser ? (
                        <span className={styles.loserIcon}>☠</span>
                      ) : isWinner ? (
                        <span className={styles.crownIcon}>♔</span>
                      ) : (
                        <span className={styles.rankNumber}>{index + 1}</span>
                      )}
                    </span>

                    {/* Player name */}
                    <span className={styles.playerName}>
                      <span className={styles.nameText}>{player.nickname}</span>
                      {isMe && <span className={styles.meBadge}>jij</span>}
                      {wantsRematch && (
                        <span className={styles.rematchBadge} title="Wil rematch">↺</span>
                      )}
                    </span>

                    {/* Status */}
                    <span className={`${styles.score} ${isLoser ? styles.loserScore : ''}`}>
                      {STATUS_LABELS[status] || status}
                      {isLoser && <span className={styles.scoreFire}>🔥</span>}
                    </span>

                    {/* Loser flame effect */}
                    {isLoser && <div className={styles.flameEffect} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rematch status */}
          {rematchPlayerNames.length > 0 && (
            <div className={styles.rematchStatus}>
              <span className={styles.rematchIcon}>↺</span>
              <span className={styles.rematchText}>
                {rematchPlayerNames.length === 1
                  ? `${rematchPlayerNames[0]} wil nog een potje`
                  : `${rematchPlayerNames.join(', ')} willen nog een potje`}
              </span>
              <span className={styles.rematchCount}>
                {rematchPlayerNames.length}/{players.length}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <footer className={styles.actions}>
            <button
              className={`${styles.rematchButton} ${hasRequestedRematch ? styles.requested : ''}`}
              onClick={handleRematch}
              disabled={hasRequestedRematch}
            >
              <span className={styles.buttonChip}>♠</span>
              <span className={styles.buttonText}>
                {hasRequestedRematch ? 'Wachten op anderen...' : 'Nog een potje?'}
              </span>
              <span className={styles.buttonChip}>♠</span>
            </button>

            <button className={styles.leaveButton} onClick={leaveGame}>
              <span className={styles.leaveIcon}>←</span>
              Terug naar start
            </button>
          </footer>
        </div>
      </div>

      {/* Victory/defeat message overlay */}
      {showScores && (
        <div className={`${styles.verdict} ${isCurrentPlayerLoser ? styles.defeat : styles.victory}`}>
          {isCurrentPlayerLoser ? (
            <span className={styles.verdictText}>ERIN</span>
          ) : myStatus === 'eruit' ? (
            <span className={styles.verdictText}>ERUIT</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default GameEnd;
