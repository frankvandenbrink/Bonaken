import type { PlayerStatus } from '@shared/index';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: PlayerStatus;
  compact?: boolean;
}

const STATUS_CONFIG: Record<PlayerStatus, { label: string; className: string }> = {
  suf: { label: 'Suf', className: 'suf' },
  krom: { label: 'Krom', className: 'krom' },
  recht: { label: 'Recht', className: 'recht' },
  wip: { label: 'Wip', className: 'wip' },
  erin: { label: 'Erin', className: 'erin' },
  eruit: { label: 'Eruit', className: 'eruit' }
};

/**
 * StatusBadge - Shows player status with color coding
 * suf=neutral, krom=warning, recht=safe, wip=caution, erin=lost, eruit=won
 */
export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span className={`${styles.badge} ${styles[config.className]} ${compact ? styles.compact : ''}`}>
      {config.label}
    </span>
  );
}

export default StatusBadge;
