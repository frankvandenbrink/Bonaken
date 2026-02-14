import { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import type { GameSettings } from '@shared/index';
import styles from './Modal.module.css';

interface CreateGameModalProps {
  onClose: () => void;
}

const TIMER_PRESETS = [
  { label: 'Geen timer', value: null },
  { label: '1 minuut', value: 60 },
  { label: '5 minuten', value: 300 },
  { label: '30 minuten', value: 1800 },
  { label: '1 uur', value: 3600 },
  { label: '24 uur', value: 86400 },
];

export function CreateGameModal({ onClose }: CreateGameModalProps) {
  const { createGame, nickname } = useGame();
  const [settings, setSettings] = useState<GameSettings>({
    maxPlayers: 4,
    gameName: '',
    turnTimerSeconds: null
  });
  const [customTimer, setCustomTimer] = useState(false);
  const [customSeconds, setCustomSeconds] = useState(300);

  const handleCreate = () => {
    if (!settings.gameName.trim()) return;
    createGame({
      ...settings,
      gameName: settings.gameName.trim(),
      turnTimerSeconds: customTimer ? customSeconds : settings.turnTimerSeconds
    });
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
          {/* Game Name */}
          <div className={styles.setting}>
            <div className={styles.settingHeader}>
              <label className={styles.settingLabel}>Spelnaam</label>
            </div>
            <input
              type="text"
              value={settings.gameName}
              onChange={e => setSettings(prev => ({ ...prev, gameName: e.target.value }))}
              placeholder="Bijv. Tafel van Henk"
              maxLength={30}
              className={styles.textInput}
              autoFocus
            />
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
              max={5}
              value={settings.maxPlayers}
              onChange={e => setSettings(prev => ({ ...prev, maxPlayers: Number(e.target.value) }))}
              className={styles.slider}
            />
            <div className={styles.sliderLabels}>
              <span>2</span>
              <span>5</span>
            </div>
          </div>

          {/* Timer */}
          <div className={styles.setting}>
            <div className={styles.settingHeader}>
              <label className={styles.settingLabel}>Timer per beurt</label>
            </div>
            <div className={styles.timerOptions}>
              {TIMER_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  className={`${styles.timerOption} ${
                    !customTimer && settings.turnTimerSeconds === preset.value ? styles.timerActive : ''
                  }`}
                  onClick={() => {
                    setCustomTimer(false);
                    setSettings(prev => ({ ...prev, turnTimerSeconds: preset.value }));
                  }}
                >
                  {preset.label}
                </button>
              ))}
              <button
                className={`${styles.timerOption} ${customTimer ? styles.timerActive : ''}`}
                onClick={() => setCustomTimer(true)}
              >
                Aangepast...
              </button>
            </div>
            {customTimer && (
              <div className={styles.customTimer}>
                <input
                  type="number"
                  min={10}
                  max={86400}
                  value={customSeconds}
                  onChange={e => setCustomSeconds(Number(e.target.value))}
                  className={styles.textInput}
                />
                <span className={styles.timerUnit}>seconden</span>
              </div>
            )}
          </div>

          {/* Info box */}
          <div className={styles.infoBox}>
            <p><strong>Kaarten per speler:</strong> 6 (altijd)</p>
            <p><strong>Tafelkaarten:</strong> 2 open</p>
          </div>
        </div>

        <footer className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Annuleren
          </button>
          <button
            className={styles.confirmButton}
            onClick={handleCreate}
            disabled={!nickname || !settings.gameName.trim()}
          >
            Spel Aanmaken
          </button>
        </footer>
      </div>
    </div>
  );
}
