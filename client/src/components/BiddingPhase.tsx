import { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import type { BidType } from '@shared/index';
import { TurnTimer } from './TurnTimer';
import styles from './BiddingPhase.module.css';

const BID_TYPE_LABELS: Record<BidType, string> = {
  normal: 'Bod',
  bonaak: 'Bonaak',
  'bonaak-roem': 'Bonaak + Roem'
};

/**
 * BiddingPhase - Victorian auction-house styled bidding interface
 * Players bid sequentially, raising the stakes or passing
 */
const SUIT_SYMBOLS: Record<string, string> = {
  harten: '♥',
  ruiten: '♦',
  klaveren: '♣',
  schoppen: '♠'
};

export function BiddingPhase() {
  const {
    players,
    playerId,
    currentTurn,
    currentBid,
    biddingOrder,
    placeBid,
    passBid,
    turnDeadline,
    tableCards
  } = useGame();

  const [bidAmount, setBidAmount] = useState(currentBid ? currentBid.amount + 5 : 25);

  const isMyTurn = currentTurn === playerId;
  const currentBidder = players.find(p => p.id === currentTurn);
  const currentBidPlayer = currentBid ? players.find(p => p.id === currentBid.playerId) : null;

  // Minimum bid is current + 5, or 25 if no bid yet
  const minBid = currentBid ? currentBid.amount + 5 : 25;

  const handleRaiseBid = () => {
    placeBid('normal', bidAmount);
    setBidAmount(bidAmount + 5);
  };

  const handleSpecialBid = (type: BidType) => {
    const amounts: Record<string, number> = {
      bonaak: 200,
      'bonaak-roem': 250
    };
    placeBid(type, amounts[type] || 200);
  };

  const handlePass = () => {
    passBid();
  };

  const increaseBid = () => {
    setBidAmount(prev => prev + 5);
  };

  const decreaseBid = () => {
    setBidAmount(prev => Math.max(minBid, prev - 5));
  };

  // Keep bidAmount in sync with minimum
  if (bidAmount < minBid) {
    setBidAmount(minBid);
  }

  // Determine which special bids are available
  const canBonaak = !currentBid || (currentBid.type !== 'bonaak' && currentBid.type !== 'bonaak-roem');
  const canBonaakRoem = currentBid?.type === 'bonaak';

  // Timer is handled by TurnTimer component

  return (
    <div className={styles.container}>
      {/* Ornamental header */}
      <div className={styles.header}>
        <div className={styles.headerLine} />
        <h2 className={styles.title}>Biedronde</h2>
        <div className={styles.headerLine} />
      </div>

      {/* Table cards display */}
      {tableCards.length > 0 && (
        <div className={styles.tableCardsSection}>
          <span className={styles.tableCardsLabel}>Tafelkaarten</span>
          <div className={styles.tableCardsRow}>
            {tableCards.map((tc, i) => {
              const isRed = tc.card.suit === 'harten' || tc.card.suit === 'ruiten';
              return (
                <div key={i} className={styles.tableCard} style={{ animationDelay: `${i * 0.15}s` }}>
                  {tc.faceUp ? (
                    <div className={`${styles.tableCardFace} ${isRed ? styles.red : styles.black}`}>
                      <span className={styles.tableCardRank}>{tc.card.rank}</span>
                      <span className={styles.tableCardSuit}>{SUIT_SYMBOLS[tc.card.suit]}</span>
                    </div>
                  ) : (
                    <div className={styles.tableCardBack}>?</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Current bid display */}
      <div className={styles.bidDisplay}>
        {currentBid ? (
          <div className={styles.currentBid}>
            <span className={styles.bidLabel}>Huidig Bod</span>
            <div className={styles.bidAmount}>{currentBid.amount}</div>
            <span className={styles.bidType}>{BID_TYPE_LABELS[currentBid.type]}</span>
            <span className={styles.bidder}>
              door <strong>{currentBidPlayer?.nickname}</strong>
            </span>
          </div>
        ) : (
          <div className={styles.noBid}>
            <span className={styles.noBidIcon}>♠</span>
            <span className={styles.noBidText}>Nog geen bod</span>
            <span className={styles.noBidHint}>Vanaf 25 punten</span>
          </div>
        )}
      </div>

      {/* Bidding order - players around the table */}
      <div className={styles.biddingOrder}>
        {biddingOrder.map((pid, index) => {
          const player = players.find(p => p.id === pid);
          if (!player) return null;

          const isCurrent = pid === currentTurn;
          const hasPassed = player.hasPassed;
          const isMe = pid === playerId;
          const isBidLeader = currentBid?.playerId === pid;

          return (
            <div
              key={pid}
              className={`
                ${styles.orderPlayer}
                ${isCurrent ? styles.currentPlayer : ''}
                ${hasPassed ? styles.passedPlayer : ''}
                ${isMe ? styles.mePlayer : ''}
              `}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className={styles.playerDot}>
                {hasPassed ? '✗' : isCurrent ? '►' : isBidLeader ? '★' : '●'}
              </div>
              <span className={styles.orderName}>
                {player.nickname}
                {isMe && <span className={styles.meBadge}>jij</span>}
              </span>
              {hasPassed && <span className={styles.passedLabel}>Gepast</span>}
              {isBidLeader && !hasPassed && <span className={styles.leaderLabel}>Hoogste</span>}
            </div>
          );
        })}
      </div>

      {/* Turn indicator */}
      <div className={`${styles.turnIndicator} ${isMyTurn ? styles.myTurn : ''}`}>
        {isMyTurn ? (
          <>
            <div className={styles.turnPulse} />
            <span className={styles.turnText}>Jouw beurt om te bieden</span>
          </>
        ) : (
          <span className={styles.waitingText}>
            <span className={styles.waitingName}>{currentBidder?.nickname || '...'}</span> is aan de beurt
            <span className={styles.waitingDots}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </span>
          </span>
        )}

        {/* Timer */}
        {turnDeadline && <TurnTimer deadline={turnDeadline} />}
      </div>

      {/* Bid controls - only when it's your turn */}
      {isMyTurn && (
        <div className={styles.controls}>
          {/* Normal bid */}
          <div className={styles.normalBid}>
            <button
              className={styles.adjustButton}
              onClick={decreaseBid}
              disabled={bidAmount <= minBid}
              type="button"
            >
              −
            </button>
            <div className={styles.bidValue}>
              <span className={styles.bidValueNumber}>{bidAmount}</span>
            </div>
            <button
              className={styles.adjustButton}
              onClick={increaseBid}
              type="button"
            >
              +
            </button>
            <button
              className={styles.bidButton}
              onClick={handleRaiseBid}
              type="button"
            >
              Bieden
            </button>
          </div>

          {/* Special bids */}
          <div className={styles.specialBids}>
            {canBonaak && (
              <button
                className={`${styles.specialButton} ${styles.bonaak}`}
                onClick={() => handleSpecialBid('bonaak')}
                type="button"
              >
                <span className={styles.specialIcon}>♔</span>
                Bonaak
              </button>
            )}
            {canBonaakRoem && (
              <button
                className={`${styles.specialButton} ${styles.bonaakRoem}`}
                onClick={() => handleSpecialBid('bonaak-roem')}
                type="button"
              >
                <span className={styles.specialIcon}>♔★</span>
                Bonaak + Roem
              </button>
            )}
          </div>

          {/* Pass button */}
          <button
            className={styles.passButton}
            onClick={handlePass}
            type="button"
          >
            Pas
          </button>
        </div>
      )}
    </div>
  );
}

export default BiddingPhase;
