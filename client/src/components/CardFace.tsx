import { memo, useMemo } from 'react';
import type { Card, Suit, Rank } from '@shared/index';
import styles from './CardFace.module.css';

interface CardFaceProps {
  card: Card;
  size?: 'sm' | 'md' | 'lg';
}

// SVG suit symbols with Victorian flourishes
const SuitSymbol = memo(function SuitSymbol({
  suit,
  size = 1,
  className = ''
}: {
  suit: Suit;
  size?: number;
  className?: string;
}) {
  const scale = size;

  const symbols: Record<Suit, JSX.Element> = {
    harten: (
      <g transform={`scale(${scale})`} className={className}>
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="currentColor"
        />
      </g>
    ),
    ruiten: (
      <g transform={`scale(${scale})`} className={className}>
        <path
          d="M12 2L2 12l10 10 10-10L12 2z"
          fill="currentColor"
        />
      </g>
    ),
    klaveren: (
      <g transform={`scale(${scale})`} className={className}>
        <circle cx="12" cy="7" r="5" fill="currentColor" />
        <circle cx="6" cy="14" r="5" fill="currentColor" />
        <circle cx="18" cy="14" r="5" fill="currentColor" />
        <path d="M10 18h4v4h-4z" fill="currentColor" />
      </g>
    ),
    schoppen: (
      <g transform={`scale(${scale})`} className={className}>
        <path
          d="M12 2C8 6 4 10 4 14c0 3.31 2.69 6 6 6 .34 0 .67-.03 1-.08V22h2v-2.08c.33.05.66.08 1 .08 3.31 0 6-2.69 6-6 0-4-4-8-8-12z"
          fill="currentColor"
        />
      </g>
    )
  };

  return symbols[suit];
});

// Pip positions for number cards (7-10)
const pipPositions: Record<string, { x: number; y: number; inverted?: boolean }[]> = {
  '7': [
    { x: 50, y: 20 },
    { x: 25, y: 35 },
    { x: 75, y: 35 },
    { x: 50, y: 50 },
    { x: 25, y: 65, inverted: true },
    { x: 75, y: 65, inverted: true },
    { x: 50, y: 80, inverted: true },
  ],
  '8': [
    { x: 25, y: 20 },
    { x: 75, y: 20 },
    { x: 25, y: 40 },
    { x: 75, y: 40 },
    { x: 25, y: 60, inverted: true },
    { x: 75, y: 60, inverted: true },
    { x: 25, y: 80, inverted: true },
    { x: 75, y: 80, inverted: true },
  ],
  '9': [
    { x: 25, y: 18 },
    { x: 75, y: 18 },
    { x: 25, y: 36 },
    { x: 75, y: 36 },
    { x: 50, y: 50 },
    { x: 25, y: 64, inverted: true },
    { x: 75, y: 64, inverted: true },
    { x: 25, y: 82, inverted: true },
    { x: 75, y: 82, inverted: true },
  ],
  '10': [
    { x: 25, y: 15 },
    { x: 75, y: 15 },
    { x: 50, y: 28 },
    { x: 25, y: 38 },
    { x: 75, y: 38 },
    { x: 25, y: 62, inverted: true },
    { x: 75, y: 62, inverted: true },
    { x: 50, y: 72, inverted: true },
    { x: 25, y: 85, inverted: true },
    { x: 75, y: 85, inverted: true },
  ],
};

// Court card illustrations (B=Boer/Jack, V=Vrouw/Queen, K=Koning/King)
const CourtCard = memo(function CourtCard({
  rank,
  suit,
  isRed
}: {
  rank: 'B' | 'V' | 'K';
  suit: Suit;
  isRed: boolean;
}) {
  const color = isRed ? '#b22222' : '#1a1a1a';
  const accent = isRed ? '#8b0000' : '#2a2a2a';
  const highlight = '#d4af37';

  // Dutch-style court card with ornate Victorian details
  return (
    <g className={styles.courtFigure}>
      {/* Background pattern */}
      <defs>
        <pattern id={`court-pattern-${suit}`} patternUnits="userSpaceOnUse" width="8" height="8">
          <path d="M0 0L8 8M8 0L0 8" stroke={accent} strokeWidth="0.5" opacity="0.1"/>
        </pattern>
        <linearGradient id={`court-gradient-${suit}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.9"/>
          <stop offset="100%" stopColor={accent} stopOpacity="0.95"/>
        </linearGradient>
      </defs>

      {/* Central figure frame */}
      <rect x="15" y="25" width="70" height="50" rx="3" fill={`url(#court-pattern-${suit})`} />
      <rect x="15" y="25" width="70" height="50" rx="3" fill="none" stroke={highlight} strokeWidth="1.5" opacity="0.6" />

      {rank === 'K' && (
        <>
          {/* King - Crown and regal pose */}
          <g transform="translate(50, 50)">
            {/* Crown */}
            <path
              d="M-15 -18 L-12 -8 L-6 -15 L0 -5 L6 -15 L12 -8 L15 -18 L15 -5 L-15 -5 Z"
              fill={highlight}
              stroke={accent}
              strokeWidth="0.5"
            />
            {/* Crown jewels */}
            <circle cx="0" cy="-12" r="2" fill="#c41e3a"/>
            <circle cx="-9" cy="-10" r="1.5" fill="#2e7d32"/>
            <circle cx="9" cy="-10" r="1.5" fill="#2e7d32"/>
            {/* Face outline */}
            <ellipse cx="0" cy="5" rx="12" ry="14" fill="#f5e6d3" stroke={color} strokeWidth="1"/>
            {/* Beard */}
            <path d="M-8 12 Q0 22 8 12" fill={color} opacity="0.8"/>
            {/* Eyes */}
            <circle cx="-4" cy="2" r="1.5" fill={color}/>
            <circle cx="4" cy="2" r="1.5" fill={color}/>
            {/* Robe collar */}
            <path d="M-18 20 L0 12 L18 20" fill={color} stroke={highlight} strokeWidth="0.5"/>
          </g>
        </>
      )}

      {rank === 'V' && (
        <>
          {/* Queen - Crown and elegant pose */}
          <g transform="translate(50, 50)">
            {/* Crown (smaller, more elegant) */}
            <path
              d="M-12 -16 L-10 -8 L-5 -13 L0 -6 L5 -13 L10 -8 L12 -16 L12 -6 L-12 -6 Z"
              fill={highlight}
              stroke={accent}
              strokeWidth="0.5"
            />
            {/* Crown jewel */}
            <circle cx="0" cy="-11" r="2" fill="#c41e3a"/>
            {/* Face */}
            <ellipse cx="0" cy="4" rx="10" ry="12" fill="#f5e6d3" stroke={color} strokeWidth="1"/>
            {/* Hair */}
            <path d="M-12 -2 Q-14 8 -10 14 M12 -2 Q14 8 10 14" stroke={color} strokeWidth="2" fill="none"/>
            {/* Eyes */}
            <ellipse cx="-3" cy="2" rx="1.5" ry="1" fill={color}/>
            <ellipse cx="3" cy="2" rx="1.5" ry="1" fill={color}/>
            {/* Lips */}
            <path d="M-2 8 Q0 10 2 8" stroke="#c41e3a" strokeWidth="1" fill="none"/>
            {/* Collar/dress */}
            <path d="M-15 18 Q0 14 15 18" fill={color} stroke={highlight} strokeWidth="0.5"/>
          </g>
        </>
      )}

      {rank === 'B' && (
        <>
          {/* Jack/Boer - Youthful, cap */}
          <g transform="translate(50, 50)">
            {/* Cap */}
            <path
              d="M-14 -10 Q-14 -18 0 -18 Q14 -18 14 -10 L12 -6 L-12 -6 Z"
              fill={color}
              stroke={highlight}
              strokeWidth="0.5"
            />
            {/* Feather */}
            <path d="M8 -16 Q16 -22 10 -10" stroke={highlight} strokeWidth="1.5" fill="none"/>
            {/* Face */}
            <ellipse cx="0" cy="4" rx="11" ry="13" fill="#f5e6d3" stroke={color} strokeWidth="1"/>
            {/* Eyes */}
            <circle cx="-4" cy="1" r="1.5" fill={color}/>
            <circle cx="4" cy="1" r="1.5" fill={color}/>
            {/* Slight smile */}
            <path d="M-3 8 Q0 11 3 8" stroke={color} strokeWidth="0.8" fill="none"/>
            {/* Collar */}
            <path d="M-16 18 L0 10 L16 18" fill={color} stroke={highlight} strokeWidth="0.5"/>
          </g>
        </>
      )}

      {/* Corner suit symbol */}
      <g transform="translate(25, 68) scale(0.4)" className={isRed ? styles.red : styles.black}>
        <SuitSymbol suit={suit} size={1} />
      </g>
      <g transform="translate(75, 32) scale(0.4) rotate(180)" className={isRed ? styles.red : styles.black}>
        <SuitSymbol suit={suit} size={1} />
      </g>
    </g>
  );
});

// Ace card with large centered suit
const AceCard = memo(function AceCard({ suit, isRed }: { suit: Suit; isRed: boolean }) {
  return (
    <g className={styles.aceSuit}>
      {/* Ornate frame around suit */}
      <circle cx="50" cy="50" r="28" fill="none" stroke="#d4af37" strokeWidth="1" opacity="0.4"/>
      <circle cx="50" cy="50" r="32" fill="none" stroke="#d4af37" strokeWidth="0.5" opacity="0.2"/>

      {/* Large centered suit */}
      <g transform="translate(38, 38)" className={isRed ? styles.red : styles.black}>
        <SuitSymbol suit={suit} size={1} />
      </g>

      {/* Decorative corner flourishes */}
      <path d="M10 10 Q15 15 10 20" stroke="#d4af37" strokeWidth="0.5" fill="none" opacity="0.5"/>
      <path d="M90 10 Q85 15 90 20" stroke="#d4af37" strokeWidth="0.5" fill="none" opacity="0.5"/>
      <path d="M10 90 Q15 85 10 80" stroke="#d4af37" strokeWidth="0.5" fill="none" opacity="0.5"/>
      <path d="M90 90 Q85 85 90 80" stroke="#d4af37" strokeWidth="0.5" fill="none" opacity="0.5"/>
    </g>
  );
});

// Number card with pip layout
const NumberCard = memo(function NumberCard({
  rank,
  suit,
  isRed
}: {
  rank: '7' | '8' | '9' | '10';
  suit: Suit;
  isRed: boolean;
}) {
  const positions = pipPositions[rank];

  return (
    <g className={isRed ? styles.red : styles.black}>
      {positions.map((pos, index) => (
        <g
          key={index}
          transform={`translate(${pos.x - 12}, ${pos.y - 12}) ${pos.inverted ? 'rotate(180, 12, 12)' : ''}`}
          className={styles.pip}
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <SuitSymbol suit={suit} size={0.6} />
        </g>
      ))}
    </g>
  );
});

/**
 * CardFace - SVG-based playing card face renderer
 * Renders beautiful Dutch/European style playing cards with Victorian elegance
 */
export const CardFace = memo(function CardFace({ card, size = 'md' }: CardFaceProps) {
  const isRed = card.suit === 'harten' || card.suit === 'ruiten';
  const isCourtCard = ['B', 'V', 'K'].includes(card.rank);
  const isAce = card.rank === 'A';
  const isNumberCard = ['7', '8', '9', '10'].includes(card.rank);

  const sizeClasses = {
    sm: styles.small,
    md: styles.medium,
    lg: styles.large
  };

  const suitSymbol = useMemo(() => {
    const symbols: Record<Suit, string> = {
      harten: '♥',
      ruiten: '♦',
      klaveren: '♣',
      schoppen: '♠'
    };
    return symbols[card.suit];
  }, [card.suit]);

  return (
    <svg
      viewBox="0 0 100 140"
      className={`${styles.cardFace} ${sizeClasses[size]} ${isRed ? styles.redCard : styles.blackCard}`}
      aria-label={`${card.rank} ${card.suit}`}
    >
      {/* Card background with parchment texture */}
      <defs>
        <filter id="cardTexture" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise"/>
          <feDiffuseLighting in="noise" lightingColor="#f5f5dc" surfaceScale="1.5" result="light">
            <feDistantLight azimuth="45" elevation="60"/>
          </feDiffuseLighting>
          <feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="1" k2="0" k3="0" k4="0"/>
        </filter>
        <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#faf8f0"/>
          <stop offset="50%" stopColor="#f5f5dc"/>
          <stop offset="100%" stopColor="#ede9d5"/>
        </linearGradient>
        <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
          <feOffset dx="1" dy="1" result="offsetBlur"/>
          <feComposite in="SourceGraphic" in2="offsetBlur" operator="over"/>
        </filter>
      </defs>

      {/* Card base */}
      <rect
        x="1" y="1"
        width="98" height="138"
        rx="6" ry="6"
        fill="url(#cardBg)"
        stroke="#c9b896"
        strokeWidth="1"
      />

      {/* Inner gold border */}
      <rect
        x="4" y="4"
        width="92" height="132"
        rx="4" ry="4"
        fill="none"
        stroke="#d4af37"
        strokeWidth="0.5"
        opacity="0.4"
      />

      {/* Top-left corner rank and suit */}
      <g className={styles.corner}>
        <text
          x="8" y="18"
          className={`${styles.rankText} ${isRed ? styles.red : styles.black}`}
        >
          {card.rank}
        </text>
        <text
          x="8" y="32"
          className={`${styles.suitText} ${isRed ? styles.red : styles.black}`}
        >
          {suitSymbol}
        </text>
      </g>

      {/* Bottom-right corner rank and suit (inverted) */}
      <g className={styles.corner} transform="rotate(180, 50, 70)">
        <text
          x="8" y="18"
          className={`${styles.rankText} ${isRed ? styles.red : styles.black}`}
        >
          {card.rank}
        </text>
        <text
          x="8" y="32"
          className={`${styles.suitText} ${isRed ? styles.red : styles.black}`}
        >
          {suitSymbol}
        </text>
      </g>

      {/* Card center content */}
      <g className={styles.centerContent}>
        {isAce && <AceCard suit={card.suit} isRed={isRed} />}
        {isCourtCard && (
          <CourtCard
            rank={card.rank as 'B' | 'V' | 'K'}
            suit={card.suit}
            isRed={isRed}
          />
        )}
        {isNumberCard && (
          <NumberCard
            rank={card.rank as '7' | '8' | '9' | '10'}
            suit={card.suit}
            isRed={isRed}
          />
        )}
      </g>

      {/* Subtle card edge highlight */}
      <rect
        x="1" y="1"
        width="98" height="138"
        rx="6" ry="6"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="0.5"
      />
    </svg>
  );
});

export default CardFace;
