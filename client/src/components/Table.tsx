import { memo, ReactNode } from 'react';
import styles from './Table.module.css';

interface TableProps {
  children: ReactNode;
  playerCount?: number;
  showOrnaments?: boolean;
}

/**
 * Table - Immersive Victorian casino table with mahogany frame and green felt
 * Evokes the atmosphere of a high-end Amsterdam gaming club
 */
export const Table = memo(function Table({
  children,
  playerCount = 4,
  showOrnaments = true
}: TableProps) {
  return (
    <div className={styles.tableContainer}>
      {/* Ambient atmosphere */}
      <div className={styles.ambientGlow} />

      {/* Wood grain texture overlay */}
      <div className={styles.woodGrain} />

      {/* Main table structure */}
      <div className={styles.table}>
        {/* Outer mahogany frame */}
        <div className={styles.outerFrame}>
          {/* Gold inlay trim */}
          <div className={styles.goldInlay} />

          {/* Inner frame bevel */}
          <div className={styles.innerBevel}>
            {/* Green felt playing surface */}
            <div className={styles.feltSurface}>
              {/* Felt texture overlay */}
              <div className={styles.feltTexture} />

              {/* Subtle spotlight on center */}
              <div className={styles.centerSpotlight} />

              {/* Decorative corner ornaments */}
              {showOrnaments && (
                <>
                  <div className={`${styles.cornerOrnament} ${styles.topLeft}`}>
                    <span className={styles.suitSpade}>♠</span>
                  </div>
                  <div className={`${styles.cornerOrnament} ${styles.topRight}`}>
                    <span className={styles.suitHeart}>♥</span>
                  </div>
                  <div className={`${styles.cornerOrnament} ${styles.bottomLeft}`}>
                    <span className={styles.suitClub}>♣</span>
                  </div>
                  <div className={`${styles.cornerOrnament} ${styles.bottomRight}`}>
                    <span className={styles.suitDiamond}>♦</span>
                  </div>
                </>
              )}

              {/* Center decorative circle */}
              <div className={styles.centerCircle}>
                <div className={styles.innerCircle} />
              </div>

              {/* Content area */}
              <div className={styles.contentArea}>
                {children}
              </div>
            </div>
          </div>
        </div>

        {/* Corner brass fixtures */}
        <div className={`${styles.brassFixture} ${styles.fixtureTL}`} />
        <div className={`${styles.brassFixture} ${styles.fixtureTR}`} />
        <div className={`${styles.brassFixture} ${styles.fixtureBL}`} />
        <div className={`${styles.brassFixture} ${styles.fixtureBR}`} />
      </div>

      {/* Table edge shadow */}
      <div className={styles.tableEdgeShadow} />
    </div>
  );
});

export default Table;
