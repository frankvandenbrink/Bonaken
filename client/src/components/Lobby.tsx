import { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import type { GameSettings } from '@shared/index';
import styles from './Lobby.module.css';

export function Lobby() {
  const {
    gameCode,
    players,
    settings,
    isHost,
    playerId,
    updateSettings,
    startGame,
    leaveGame
  } = useGame();

  const [localSettings, setLocalSettings] = useState<GameSettings>(settings);
  const [copied, setCopied] = useState(false);

  const canStart = players.length >= settings.minPlayers;

  const handleCopyCode = async () => {
    if (gameCode) {
      await navigator.clipboard.writeText(gameCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleMinChange = (value: number) => {
    const newSettings = {
      ...localSettings,
      minPlayers: value,
      maxPlayers: Math.max(localSettings.maxPlayers, value)
    };
    setLocalSettings(newSettings);
    updateSettings(newSettings);
  };

  const handleMaxChange = (value: number) => {
    const newSettings = {
      ...localSettings,
      maxPlayers: value,
      minPlayers: Math.min(localSettings.minPlayers, value)
    };
    setLocalSettings(newSettings);
    updateSettings(newSettings);
  };

  return (
    <div className={styles.container}>
      <div className={styles.lobby}>
        {/* Header with game code */}
        <header className={styles.header}>
          <h1 className={styles.title}>Wachtkamer</h1>

          <div className={styles.codeSection}>
            <span className={styles.codeLabel}>Spelcode</span>
            <button
              className={styles.codeButton}
              onClick={handleCopyCode}
              title="Kopieer spelcode"
            >
              <span className={styles.code}>{gameCode}</span>
              <span className={styles.copyIcon}>
                {copied ? '✓' : '⧉'}
              </span>
            </button>
            {copied && <span className={styles.copiedText}>Gekopieerd!</span>}
          </div>
        </header>

        {/* Players list */}
        <section className={styles.playersSection}>
          <h2 className={styles.sectionTitle}>
            Spelers ({players.length}/{settings.maxPlayers})
          </h2>

          <ul className={styles.playerList}>
            {players.map((player, index) => (
              <li
                key={player.id}
                className={`${styles.player} ${player.id === playerId ? styles.isYou : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className={styles.playerIcon}>
                  {player.isHost ? '♔' : '♙'}
                </span>
                <span className={styles.playerName}>
                  {player.nickname}
                  {player.id === playerId && <span className={styles.youBadge}>(jij)</span>}
                </span>
                {player.isHost && (
                  <span className={styles.hostBadge}>Host</span>
                )}
                <span className={`${styles.statusDot} ${player.isConnected ? styles.online : styles.offline}`} />
              </li>
            ))}

            {/* Empty slots */}
            {Array.from({ length: settings.maxPlayers - players.length }).map((_, i) => (
              <li key={`empty-${i}`} className={`${styles.player} ${styles.empty}`}>
                <span className={styles.playerIcon}>○</span>
                <span className={styles.playerName}>Wachten op speler...</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Host settings */}
        {isHost && (
          <section className={styles.settingsSection}>
            <h2 className={styles.sectionTitle}>Instellingen</h2>

            <div className={styles.settingsGrid}>
              <div className={styles.setting}>
                <label className={styles.settingLabel}>
                  Min: <strong>{localSettings.minPlayers}</strong>
                </label>
                <input
                  type="range"
                  min={2}
                  max={7}
                  value={localSettings.minPlayers}
                  onChange={e => handleMinChange(Number(e.target.value))}
                  className={styles.slider}
                />
              </div>

              <div className={styles.setting}>
                <label className={styles.settingLabel}>
                  Max: <strong>{localSettings.maxPlayers}</strong>
                </label>
                <input
                  type="range"
                  min={2}
                  max={7}
                  value={localSettings.maxPlayers}
                  onChange={e => handleMaxChange(Number(e.target.value))}
                  className={styles.slider}
                />
              </div>
            </div>
          </section>
        )}

        {/* Actions */}
        <footer className={styles.footer}>
          {isHost ? (
            <>
              <button
                className={styles.startButton}
                onClick={startGame}
                disabled={!canStart}
              >
                {canStart
                  ? 'Start Spel'
                  : `Nog ${settings.minPlayers - players.length} speler(s) nodig`
                }
              </button>
            </>
          ) : (
            <div className={styles.waitingMessage}>
              <span className={styles.waitingIcon}>⏳</span>
              <span>Wachten tot de host het spel start...</span>
            </div>
          )}

          <button className={styles.leaveButton} onClick={leaveGame}>
            Verlaat Spel
          </button>
        </footer>
      </div>
    </div>
  );
}
