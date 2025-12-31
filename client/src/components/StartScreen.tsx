import { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { CreateGameModal } from './CreateGameModal';
import { JoinGameModal } from './JoinGameModal';
import styles from './StartScreen.module.css';

// Card suit decorations
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
  const { nickname, setNickname, isConnected, error, clearError } = useGame();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

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

        {/* Action buttons */}
        <div className={styles.actions}>
          <button
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={() => setShowCreateModal(true)}
            disabled={!isConnected}
          >
            <span className={styles.buttonIcon}>✦</span>
            <span>Nieuw Spel Starten</span>
          </button>

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>of</span>
            <span className={styles.dividerLine} />
          </div>

          <button
            className={`${styles.button} ${styles.secondaryButton}`}
            onClick={() => setShowJoinModal(true)}
            disabled={!isConnected}
          >
            <span>Deelnemen aan Spel</span>
          </button>
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <p>2-7 spelers • Leimuiden variant</p>
        </footer>
      </main>

      {/* Modals */}
      {showCreateModal && (
        <CreateGameModal onClose={() => setShowCreateModal(false)} />
      )}
      {showJoinModal && (
        <JoinGameModal onClose={() => setShowJoinModal(false)} />
      )}
    </div>
  );
}
