import { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import type { GameSettings } from '@shared/index';
import styles from './Modal.module.css';

interface CreateGameModalProps {
  onClose: () => void;
}

export function CreateGameModal({ onClose }: CreateGameModalProps) {
  const { createGame, nickname } = useGame();
  const [settings, setSettings] = useState<GameSettings>({
    minPlayers: 2,
    maxPlayers: 4
  });

  const handleCreate = () => {
    createGame(settings);
  };

  const handleMinChange = (value: number) => {
    setSettings(prev => ({
      ...prev,
      minPlayers: value,
      maxPlayers: Math.max(prev.maxPlayers, value)
    }));
  };

  const handleMaxChange = (value: number) => {
    setSettings(prev => ({
      ...prev,
      maxPlayers: value,
      minPlayers: Math.min(prev.minPlayers, value)
    }));
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>

        <header className={styles.header}>
          <h2 className={styles.title}>Nieuw Spel</h2>
          <p className={styles.subtitle}>Stel het spel in naar wens</p>
        </header>

        {!nickname && (
          <div className={styles.warning}>
            Voer eerst een bijnaam in op het startscherm
          </div>
        )}

        <div className={styles.content}>
          {/* Min Players */}
          <div className={styles.setting}>
            <div className={styles.settingHeader}>
              <label className={styles.settingLabel}>Minimum Spelers</label>
              <span className={styles.settingValue}>{settings.minPlayers}</span>
            </div>
            <input
              type="range"
              min={2}
              max={7}
              value={settings.minPlayers}
              onChange={e => handleMinChange(Number(e.target.value))}
              className={styles.slider}
            />
            <div className={styles.sliderLabels}>
              <span>2</span>
              <span>7</span>
            </div>
          </div>

          {/* Max Players */}
          <div className={styles.setting}>
            <div className={styles.settingHeader}>
              <label className={styles.settingLabel}>Maximum Spelers</label>
              <span className={styles.settingValue}>{settings.maxPlayers}</span>
            </div>
            <input
              type="range"
              min={2}
              max={7}
              value={settings.maxPlayers}
              onChange={e => handleMaxChange(Number(e.target.value))}
              className={styles.slider}
            />
            <div className={styles.sliderLabels}>
              <span>2</span>
              <span>7</span>
            </div>
          </div>

          {/* Info box */}
          <div className={styles.infoBox}>
            <p>
              <strong>Kaarten per speler:</strong>{' '}
              {settings.maxPlayers === 2 && '16'}
              {settings.maxPlayers === 3 && '10'}
              {settings.maxPlayers === 4 && '8'}
              {settings.maxPlayers === 5 && '6'}
              {settings.maxPlayers === 6 && '5'}
              {settings.maxPlayers === 7 && '4'}
            </p>
          </div>
        </div>

        <footer className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Annuleren
          </button>
          <button
            className={styles.confirmButton}
            onClick={handleCreate}
            disabled={!nickname}
          >
            Spel Aanmaken
          </button>
        </footer>
      </div>
    </div>
  );
}
