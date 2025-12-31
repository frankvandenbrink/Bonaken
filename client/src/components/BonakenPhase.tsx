import { useMemo } from 'react';
import { useGame } from '../contexts/GameContext';
import styles from './BonakenPhase.module.css';

/**
 * BonakenPhase - The dramatic choice moment
 * Players secretly choose to "bonaken" (commit to winning majority) or "passen" (pass)
 */
export function BonakenPhase() {
  const {
    players,
    playerId,
    hasChosen,
    chosenCount,
    bonakenChoices,
    bonaker,
    makeBonakChoice
  } = useGame();

  // Check if all choices are revealed (bonaker is set means reveal happened)
  const isRevealed = bonakenChoices.length > 0 &&
    bonakenChoices.every(c => c.choice !== null) &&
    bonaker !== undefined;

  // Get the bonaker player info
  const bonakerPlayer = useMemo(() => {
    if (!bonaker) return null;
    return players.find(p => p.id === bonaker);
  }, [bonaker, players]);

  // Get player name by ID
  const getPlayerName = (id: string) => {
    const player = players.find(p => p.id === id);
    return player?.nickname || 'Onbekend';
  };

  // Waiting phase - player has chosen but not all revealed
  if (hasChosen && !isRevealed) {
    return (
      <div className={styles.container}>
        <div className={styles.waitingState}>
          <div className={styles.hourglass}>⏳</div>
          <h2 className={styles.waitingTitle}>Wachten op andere spelers...</h2>
          <div className={styles.progressContainer}>
            <div className={styles.progressText}>
              <span className={styles.progressCount}>{chosenCount}</span>
              <span className={styles.progressDivider}>van</span>
              <span className={styles.progressTotal}>{players.length}</span>
              <span className={styles.progressLabel}>heeft gekozen</span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(chosenCount / players.length) * 100}%` }}
              />
            </div>
            <div className={styles.progressDots}>
              {players.map((_, i) => (
                <span
                  key={i}
                  className={`${styles.dot} ${i < chosenCount ? styles.dotFilled : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reveal phase - show all choices
  if (isRevealed) {
    return (
      <div className={styles.container}>
        <div className={styles.revealState}>
          {/* Result announcement */}
          <div className={styles.resultAnnouncement}>
            {bonaker ? (
              <>
                <div className={styles.crown}>👑</div>
                <h2 className={styles.resultTitle}>
                  <span className={styles.bonakerName}>{bonakerPlayer?.nickname}</span>
                  <span className={styles.bonakerVerb}> bonaakt!</span>
                </h2>
                <div className={styles.sparkles}>
                  <span className={styles.sparkle}>✦</span>
                  <span className={styles.sparkle}>✦</span>
                  <span className={styles.sparkle}>✦</span>
                </div>
              </>
            ) : (
              <>
                <div className={styles.noOneIcon}>🃏</div>
                <h2 className={styles.resultTitleNobody}>Niemand bonaakt</h2>
                <p className={styles.resultSubtitle}>De deler kiest troef</p>
              </>
            )}
          </div>

          {/* All player choices */}
          <div className={styles.choicesGrid}>
            {bonakenChoices.map((choice, index) => {
              const player = players.find(p => p.id === choice.playerId);
              const isBonaker = choice.playerId === bonaker;
              const didBonak = choice.choice === 'bonaken';

              return (
                <div
                  key={choice.playerId}
                  className={`${styles.playerChoice} ${isBonaker ? styles.isBonaker : ''} ${didBonak ? styles.didBonak : styles.didPass}`}
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className={styles.playerAvatar}>
                    {isBonaker && <span className={styles.miniCrown}>👑</span>}
                    <span className={styles.avatarIcon}>
                      {player?.id === playerId ? '👤' : '🎭'}
                    </span>
                  </div>
                  <span className={styles.playerName}>
                    {player?.nickname}
                    {player?.id === playerId && <span className={styles.youLabel}> (jij)</span>}
                  </span>
                  <span className={`${styles.choiceLabel} ${didBonak ? styles.bonakLabel : styles.passLabel}`}>
                    {didBonak ? 'BONAKEN' : 'PASSEN'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Choice phase - show buttons
  return (
    <div className={styles.container}>
      <div className={styles.choiceState}>
        <div className={styles.header}>
          <h2 className={styles.title}>Maak je keuze</h2>
          <p className={styles.subtitle}>
            Bonaken = de meerderheid van de slagen winnen
          </p>
        </div>

        <div className={styles.buttonContainer}>
          <button
            className={styles.bonakButton}
            onClick={() => makeBonakChoice('bonaken')}
            type="button"
          >
            <span className={styles.buttonIcon}>🎯</span>
            <span className={styles.buttonText}>Bonaken</span>
            <span className={styles.buttonSubtext}>Ik win de meerderheid</span>
          </button>

          <div className={styles.orDivider}>
            <span className={styles.orLine} />
            <span className={styles.orText}>of</span>
            <span className={styles.orLine} />
          </div>

          <button
            className={styles.passButton}
            onClick={() => makeBonakChoice('passen')}
            type="button"
          >
            <span className={styles.buttonIcon}>✋</span>
            <span className={styles.buttonText}>Passen</span>
            <span className={styles.buttonSubtext}>Ik pas deze ronde</span>
          </button>
        </div>

        <p className={styles.hint}>
          Je keuze blijft geheim tot iedereen gekozen heeft
        </p>
      </div>
    </div>
  );
}

export default BonakenPhase;
