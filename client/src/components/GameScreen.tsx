import { useGame } from '../contexts/GameContext';
import { Hand } from './Hand';
import { BiddingPhase } from './BiddingPhase';
import { CardSwapPhase } from './CardSwapPhase';
import { TrumpSelection } from './TrumpSelection';
import { PlayingPhase } from './PlayingPhase';
import { RoundEnd } from './RoundEnd';
import { GameEnd } from './GameEnd';
import { StatusBadge } from './StatusBadge';
import { TurnTimer } from './TurnTimer';
import styles from './GameScreen.module.css';

/**
 * Main game screen - shows current game phase and player's hand
 */
export function GameScreen() {
  const {
    gameName,
    gamePhase,
    players,
    hand,
    trump,
    playerId,
    currentTurn,
    validCardIds,
    turnDeadline,
    playCard
  } = useGame();

  // Get current player's info
  const currentPlayer = players.find(p => p.id === playerId);

  return (
    <div className={styles.gameScreen}>
      {/* Header with game info */}
      <header className={styles.header}>
        <div className={styles.gameInfo}>
          <span className={styles.gameCode}>Spel: {gameName}</span>
          <span className={styles.phase}>Fase: {gamePhase}</span>
        </div>
        <div className={styles.playerInfo}>
          <span className={styles.nickname}>{currentPlayer?.nickname}</span>
          {currentPlayer?.isHost && <span className={styles.hostBadge}>Host</span>}
        </div>
      </header>

      {/* Main game area */}
      <main className={styles.gameArea}>
        {/* Player list */}
        <aside className={styles.playerList}>
          <div className={styles.playerListHeader}>
            <h3>Spelers</h3>
            {turnDeadline && <TurnTimer deadline={turnDeadline} />}
          </div>
          <ul>
            {players.map(player => (
              <li key={player.id} className={`${player.id === playerId ? styles.currentPlayer : ''} ${player.id === currentTurn ? styles.activeTurn : ''}`}>
                <span className={styles.playerNameRow}>
                  {player.nickname}
                  {player.isHost && ' '}
                  {!player.isConnected && <span className={styles.offlineTag}>(offline)</span>}
                </span>
                <StatusBadge status={player.status} compact />
              </li>
            ))}
          </ul>
        </aside>

        {/* Center area - phase specific content */}
        <div className={styles.centerArea}>
          {gamePhase === 'bidding' && <BiddingPhase />}

          {gamePhase === 'card-swap' && <CardSwapPhase />}

          {gamePhase === 'trump-selection' && <TrumpSelection />}

          {gamePhase === 'playing' && <PlayingPhase />}

          {gamePhase === 'round-end' && <RoundEnd />}

          {gamePhase === 'game-end' && <GameEnd />}

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
          validCardIds={gamePhase === 'playing' && currentTurn === playerId ? validCardIds : []}
          onCardClick={gamePhase === 'playing' && currentTurn === playerId ? playCard : undefined}
        />
      </footer>
    </div>
  );
}

export default GameScreen;
