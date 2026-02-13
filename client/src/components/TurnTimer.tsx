import { useState, useEffect, useRef } from 'react';
import styles from './TurnTimer.module.css';

interface TurnTimerProps {
  deadline: number | null;
}

/**
 * TurnTimer - Countdown display synced to server deadline.
 * Uses deadline timestamp (ms) for drift-free display.
 */
export function TurnTimer({ deadline }: TurnTimerProps) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!deadline) {
      setRemaining(null);
      return;
    }

    const tick = () => {
      const ms = deadline - Date.now();
      setRemaining(Math.max(0, ms));
    };

    tick();
    intervalRef.current = setInterval(tick, 250);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [deadline]);

  if (remaining === null || remaining <= 0) return null;

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const isUrgent = totalSeconds <= 15;
  const isCritical = totalSeconds <= 5;

  // Progress fraction (estimate total from deadline, cap at 5 min display)
  const fraction = Math.min(1, remaining / (5 * 60 * 1000));

  return (
    <div className={`${styles.container} ${isUrgent ? styles.urgent : ''} ${isCritical ? styles.critical : ''}`}>
      <svg className={styles.ring} viewBox="0 0 40 40">
        <circle
          className={styles.ringBg}
          cx="20" cy="20" r="17"
          fill="none"
          strokeWidth="2.5"
        />
        <circle
          className={styles.ringProgress}
          cx="20" cy="20" r="17"
          fill="none"
          strokeWidth="2.5"
          strokeDasharray={`${fraction * 106.8} 106.8`}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
        />
      </svg>
      <div className={styles.time}>
        {minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : seconds}
      </div>
    </div>
  );
}

export default TurnTimer;
