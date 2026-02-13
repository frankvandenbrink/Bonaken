import { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { CreateGameModal } from './CreateGameModal';
import styles from './StartScreen.module.css';

const SuitIcon = ({ suit }: { suit: 'hearts' | 'diamonds' | 'clubs' | 'spades' }) => {
  const symbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  const isRed = suit === 'hearts' || suit === 'diamonds';
  return (
    <span className={`${styles.suit} ${isRed ? styles.red : styles.black}`}>
      {symbols[suit]}
    </span>
  );
};

export function StartScreen() {
  const { nickname, setNickname, isConnected, error, clearError, availableGames, listGames, joinGame } = useGame();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Auto-refresh game list
  useEffect(() => {
    if (isConnected) {
      listGames();
      const interval = setInterval(listGames, 3000);
      return () => clearInterval(interval);
    }
  }, [isConnected, listGames]);

  return (
    <div className={styles.container}>
      {/* Decorative corner suits */}
      <div className={styles.cornerTopLeft}><SuitIcon suit="spades" /></div>
      <div className={styles.cornerTopRight}><SuitIcon suit="hearts" /></div>
      <div className={styles.cornerBottomLeft}><SuitIcon suit="diamonds" /></div>
      <div className={styles.cornerBottomRight}><SuitIcon suit="clubs" /></div>

      <main className={styles.main}>
        {/* Logo/Title */}
        <header className={styles.header}>
          <div className={styles.titleWrapper}>
            <div className={styles.ornament}>✦</div>
            <h1 className={styles.title}>Bonaken</h1>
            <div className={styles.ornament}>✦</div>
          </div>
          <p className={styles.subtitle}>Het Nederlandse Kaartspel</p>
        </header>

        {/* Connection status */}
        <div className={styles.connectionStatus}>
          <span className={`${styles.statusDot} ${isConnected ? styles.connected : styles.disconnected}`} />
          <span className={styles.statusText}>
            {isConnected ? 'Verbonden' : 'Verbinden...'}
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div className={styles.error} onClick={clearError}>
            <span>{error}</span>
            <button className={styles.errorClose}>×</button>
          </div>
        )}

        {/* Nickname input */}
        <div className={styles.nicknameSection}>
          <label className={styles.label} htmlFor="nickname">Jouw Bijnaam</label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Bijv. Henk, Pietje, etc."
            maxLength={15}
            className={styles.nicknameInput}
          />
        </div>

        {/* Create game button */}
        <div className={styles.actions}>
          <button
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={() => setShowCreateModal(true)}
            disabled={!isConnected}
          >
            <span className={styles.buttonIcon}>✦</span>
            <span>Nieuw Spel Starten</span>
          </button>
        </div>

        {/* Game Browser */}
        <div className={styles.gameBrowser}>
          <h2 className={styles.browserTitle}>Beschikbare Spellen</h2>
          {availableGames.length === 0 ? (
            <div className={styles.noGames}>
              <p>Geen open spellen gevonden</p>
              <p className={styles.noGamesHint}>Start een nieuw spel of wacht tot iemand er een aanmaakt</p>
            </div>
          ) : (
            <ul className={styles.gameList}>
              {availableGames.map(game => (
                <li key={game.id} className={styles.gameItem}>
                  <div className={styles.gameInfo}>
                    <span className={styles.gameName}>{game.name}</span>
                    <span className={styles.gameDetails}>
                      {game.playerCount}/{game.maxPlayers} spelers — Host: {game.hostNickname}
                    </span>
                  </div>
                  <button
                    className={styles.joinButton}
                    onClick={() => joinGame(game.id)}
                    disabled={!isConnected || !nickname.trim()}
                  >
                    Deelnemen
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <p>2-5 spelers — Leimuiden variant</p>
        </footer>
      </main>

      {/* Modals */}
      {showCreateModal && (
        <CreateGameModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
