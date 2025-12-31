import { useGame } from '../contexts/GameContext';
import { Hand } from './Hand';
import { BonakenPhase } from './BonakenPhase';
import styles from './GameScreen.module.css';

/**
 * Main game screen - shows current game phase and player's hand
 */
export function GameScreen() {
  const { gameCode, gamePhase, players, hand, trump, playerId, nickname, trumpSelector } = useGame();

  // Get current player's info
  const currentPlayer = players.find(p => p.id === playerId);

  return (
    <div className={styles.gameScreen}>
      {/* Header with game info */}
      <header className={styles.header}>
        <div className={styles.gameInfo}>
          <span className={styles.gameCode}>Spel: {gameCode}</span>
          <span className={styles.phase}>Fase: {gamePhase}</span>
        </div>
        <div className={styles.playerInfo}>
          <span className={styles.nickname}>{nickname}</span>
          {currentPlayer?.isHost && <span className={styles.hostBadge}>Host</span>}
        </div>
      </header>

      {/* Main game area */}
      <main className={styles.gameArea}>
        {/* Player list */}
        <aside className={styles.playerList}>
          <h3>Spelers</h3>
          <ul>
            {players.map(player => (
              <li key={player.id} className={player.id === playerId ? styles.currentPlayer : ''}>
                {player.nickname}
                {player.isHost && ' 👑'}
                {!player.isConnected && ' (offline)'}
              </li>
            ))}
          </ul>
        </aside>

        {/* Center area - phase specific content */}
        <div className={styles.centerArea}>
          {gamePhase === 'bonaken' && <BonakenPhase />}

          {gamePhase === 'trump-selection' && (
            <div className={styles.trumpSelection}>
              <h2>Troef Kiezen</h2>
              {trumpSelector === playerId ? (
                <p>Kies een troefkleur...</p>
              ) : (
                <p>Wachten op troefkeuze...</p>
              )}
              {/* TODO: Add trump selection UI in Fase 5 */}
            </div>
          )}

          {gamePhase === 'dealing' && (
            <div className={styles.dealing}>
              <h2>Kaarten worden gedeeld...</h2>
              <div className={styles.spinner} />
            </div>
          )}
        </div>
      </main>

      {/* Hand display at bottom */}
      <footer className={styles.handArea}>
        <Hand
          cards={hand}
          trump={trump}
          validCardIds={[]} // No cards playable during bonaken phase
          onCardClick={(cardId) => console.log('Clicked:', cardId)}
        />
      </footer>
    </div>
  );
}

export default GameScreen;
