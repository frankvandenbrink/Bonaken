import { useGame } from '../contexts/GameContext';
import type { RoemDeclaration } from '@shared/index';
import styles from './RoemIndicator.module.css';

const ROEM_LABELS: Record<string, string> = {
  stuk: 'Stuk',
  driekaart: 'Driekaart',
  'driekaart-stuk': 'Driekaart + Stuk',
  vierkaart: 'Vierkaart',
  vijfkaart: 'Vijfkaart',
  zeskaart: 'Zeskaart',
  'vier-vrouwen': '4 Vrouwen',
  'vier-heren': '4 Heren',
  'vier-azen': '4 Azen',
  'vier-boeren': '4 Boeren'
};

/**
 * RoemIndicator - Shows roem declarations during gameplay
 * Compact display that appears when roem is declared
 */
export function RoemIndicator() {
  const { roemDeclarations, players } = useGame();

  if (roemDeclarations.length === 0) return null;

  // Group declarations by player
  const byPlayer = new Map<string, RoemDeclaration[]>();
  for (const decl of roemDeclarations) {
    const existing = byPlayer.get(decl.playerId) || [];
    existing.push(decl);
    byPlayer.set(decl.playerId, existing);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.icon}>★</span>
        <span className={styles.title}>Roem</span>
      </div>

      <div className={styles.declarations}>
        {Array.from(byPlayer.entries()).map(([pid, decls]) => {
          const player = players.find(p => p.id === pid);
          const totalPoints = decls.reduce((sum, d) => sum + d.points, 0);

          return (
            <div key={pid} className={styles.playerRoem}>
              <span className={styles.playerName}>{player?.nickname}</span>
              <div className={styles.roemList}>
                {decls.map((decl, i) => (
                  <span key={i} className={styles.roemItem}>
                    {ROEM_LABELS[decl.type] || decl.type} ({decl.points})
                  </span>
                ))}
              </div>
              <span className={styles.totalPoints}>{totalPoints}pt</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RoemIndicator;
