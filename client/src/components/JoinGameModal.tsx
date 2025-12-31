import { useState, useRef, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import styles from './Modal.module.css';

interface JoinGameModalProps {
  onClose: () => void;
}

export function JoinGameModal({ onClose }: JoinGameModalProps) {
  const { joinGame, nickname } = useGame();
  const [code, setCode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCodeChange = (value: string) => {
    // Only allow alphanumeric, convert to uppercase
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (cleaned.length <= 6) {
      setCode(cleaned);
    }
  };

  const handleJoin = () => {
    if (code.length === 6) {
      joinGame(code);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6) {
      handleJoin();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>

        <header className={styles.header}>
          <h2 className={styles.title}>Deelnemen</h2>
          <p className={styles.subtitle}>Voer de 6-cijferige spelcode in</p>
        </header>

        {!nickname && (
          <div className={styles.warning}>
            Voer eerst een bijnaam in op het startscherm
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.codeInputWrapper}>
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={e => handleCodeChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ABC123"
              className={styles.codeInput}
              maxLength={6}
              autoComplete="off"
              autoCapitalize="characters"
            />
            <div className={styles.codeUnderline}>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <span
                  key={i}
                  className={`${styles.codeChar} ${code[i] ? styles.filled : ''}`}
                >
                  {code[i] || ''}
                </span>
              ))}
            </div>
          </div>

          <p className={styles.hint}>
            Vraag de spelcode aan de host van het spel
          </p>
        </div>

        <footer className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Annuleren
          </button>
          <button
            className={styles.confirmButton}
            onClick={handleJoin}
            disabled={code.length !== 6 || !nickname}
          >
            Deelnemen
          </button>
        </footer>
      </div>
    </div>
  );
}
