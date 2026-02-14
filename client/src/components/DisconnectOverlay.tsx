import { useGame } from '../contexts/GameContext';
import styles from './DisconnectOverlay.module.css';

export function DisconnectOverlay() {
  const { isDisconnected } = useGame();

  if (!isDisconnected) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.spinner} />
        <h2 className={styles.title}>Verbinding verbroken</h2>
        <p className={styles.message}>Opnieuw verbinden...</p>
      </div>
    </div>
  );
}
