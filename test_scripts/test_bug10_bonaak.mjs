/**
 * Test Bug #10: Bonaak - Ronde stopt direct als bieder slag verliest
 *
 * Gebruik: node test_scripts/test_bug10_bonaak.mjs
 * Vereist: server draait op localhost:3001
 */

import { io } from 'socket.io-client';

const SERVER = 'http://localhost:3001';

// ── Event queue: buffers events so we never miss them ──

const ALL_EVENTS = [
  'game-created', 'game-state', 'cards-dealt', 'bidding-start',
  'turn-start', 'bid-placed', 'bid-passed', 'bidding-complete',
  'card-swap-start', 'cards-swapped', 'trump-selection-start', 'trump-selected',
  'playing-start', 'card-played', 'trick-complete', 'trick-cleared',
  'round-result', 'chat-message', 'error', 'player-disconnected',
  'player-reconnected', 'lobby-updated', 'chat-history'
];

function createEventQueue(socket) {
  const queues = {};
  const originalOn = socket.on.bind(socket);

  // Pre-register all event queues immediately
  for (const event of ALL_EVENTS) {
    queues[event] = { buffer: [], waiters: [] };
    originalOn(event, (data) => {
      const q = queues[event];
      if (q.waiters.length > 0) {
        const waiter = q.waiters.shift();
        waiter.resolve(data);
      } else {
        q.buffer.push(data);
      }
    });
  }

  socket.take = (event, ms = 15000) => {
    // Ensure queue exists (for events not pre-registered)
    if (!queues[event]) {
      queues[event] = { buffer: [], waiters: [] };
      originalOn(event, (data) => {
        const q = queues[event];
        if (q.waiters.length > 0) {
          const waiter = q.waiters.shift();
          waiter.resolve(data);
        } else {
          q.buffer.push(data);
        }
      });
    }
    const q = queues[event];
    if (q.buffer.length > 0) {
      return Promise.resolve(q.buffer.shift());
    }
    return new Promise((resolve, reject) => {
      const waiter = { resolve };
      const t = setTimeout(() => {
        // Remove stale waiter on timeout
        const idx = q.waiters.indexOf(waiter);
        if (idx !== -1) q.waiters.splice(idx, 1);
        reject(new Error(`Timeout: ${socket._name} → ${event}`));
      }, ms);
      waiter.resolve = (data) => { clearTimeout(t); resolve(data); };
      q.waiters.push(waiter);
    });
  };

  return socket;
}

function connect(name) {
  return new Promise((resolve, reject) => {
    const socket = io(SERVER, { transports: ['websocket'], reconnection: false });
    socket._name = name;
    socket.on('connect', () => { console.log(`[${name}] Verbonden (${socket.id})`); resolve(createEventQueue(socket)); });
    socket.on('connect_error', (e) => reject(new Error(`${name}: ${e.message}`)));
    setTimeout(() => reject(new Error(`${name} timeout`)), 5000);
  });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('\n══════════════════════════════════════════════');
  console.log('  TEST BUG #10: BONAAK STOPT BIJ VERLOREN SLAG');
  console.log('══════════════════════════════════════════════\n');

  const s1 = await connect('Speler1');
  const s2 = await connect('Speler2');

  try {
    // ── 1. Create & join ──
    s1.emit('create-game', { nickname: 'Speler1', settings: { maxPlayers: 2, gameName: 'BonaakTest', turnTimerSeconds: null } });
    const { id: gameId } = await s1.take('game-created');
    console.log(`Spel aangemaakt: ${gameId}`);

    s2.emit('join-game', { gameId, nickname: 'Speler2' });
    await s2.take('game-state');
    console.log('Speler2 gejoined\n');

    // ── 2. Start game ──
    s1.emit('start-game');
    const h1 = await s1.take('cards-dealt');
    const h2 = await s2.take('cards-dealt');
    const bidStart = await s1.take('bidding-start');

    const hands = { [s1.id]: [...h1.hand], [s2.id]: [...h2.hand] };
    const sockets = { [s1.id]: s1, [s2.id]: s2 };
    const names = { [s1.id]: 'Speler1', [s2.id]: 'Speler2' };

    console.log(`Speler1 hand: ${hands[s1.id].map(c => c.rank + c.suit[0]).join(' ')}`);
    console.log(`Speler2 hand: ${hands[s2.id].map(c => c.rank + c.suit[0]).join(' ')}`);

    // ── 3. Bidding (use s1 for all broadcast events) ──
    const firstId = bidStart.firstBidder;
    const secondId = firstId === s1.id ? s2.id : s1.id;

    // First bidder bids 25
    console.log(`\n[${names[firstId]}] Biedt 25`);
    sockets[firstId].emit('place-bid', { type: 'normal', amount: 25 });
    await s1.take('bid-placed');
    await s1.take('turn-start'); // consume turn-start for second bidder

    // Second bidder bids bonaak
    console.log(`[${names[secondId]}] Biedt BONAAK (200)`);
    sockets[secondId].emit('place-bid', { type: 'bonaak', amount: 200 });
    await s1.take('bid-placed');
    await s1.take('turn-start'); // consume turn-start for first bidder

    // First bidder passes
    console.log(`[${names[firstId]}] Past`);
    sockets[firstId].emit('pass-bid');

    const bidComplete = await s1.take('bidding-complete');
    const bidderId = bidComplete.winner;
    const opponentId = bidderId === s1.id ? s2.id : s1.id;
    console.log(`Biedwinnaar: ${names[bidderId]} (bonaak)\n`);

    // ── 4. Card swap ──
    const swapData = await sockets[bidderId].take('card-swap-start');
    const nDiscard = swapData.tableCards.length;
    const discardIds = hands[bidderId].slice(0, nDiscard).map(c => c.id);
    console.log(`[${names[bidderId]}] Swapt ${nDiscard} kaarten`);
    sockets[bidderId].emit('swap-cards', { discardCardIds: discardIds });

    const newHand = await sockets[bidderId].take('cards-dealt');
    hands[bidderId] = [...newHand.hand];
    console.log(`[${names[bidderId]}] Nieuwe hand: ${hands[bidderId].map(c => c.rank + c.suit[0]).join(' ')}`);

    // ── 5. Trump selection ──
    await sockets[bidderId].take('trump-selection-start');
    const trump = hands[bidderId][0].suit;
    console.log(`[${names[bidderId]}] Troef: ${trump}`);
    sockets[bidderId].emit('select-trump', { suit: trump });
    await s1.take('trump-selected');

    // ── 6. Play tricks ──
    await s1.take('playing-start');
    console.log('\n─── SPEELFASE ───');

    // Track "Bonaak mislukt!" via chat-message queue
    let bonaakMislukt = false;
    const originalTake = s1.take;

    let trickCount = 0;
    let roundResult = null;

    for (let t = 0; t < 6; t++) {
      // 2 cards per trick (2 players)
      for (let c = 0; c < 2; c++) {
        // turn-start is broadcast to room — take from s1 only, use playerId to know who plays
        const turn = await s1.take('turn-start', 10000);
        const turnPlayerId = turn.playerId;

        const cardId = turn.validCardIds[0];
        const card = hands[turnPlayerId]?.find(x => x.id === cardId);
        console.log(`  [${names[turnPlayerId]}] speelt ${card ? `${card.rank} ${card.suit}` : cardId}`);

        sockets[turnPlayerId].emit('play-card', { cardId });
        hands[turnPlayerId] = hands[turnPlayerId].filter(x => x.id !== cardId);

        await s1.take('card-played', 5000);
      }

      const trick = await s1.take('trick-complete', 5000);
      trickCount++;
      const bidderWon = trick.winnerId === bidderId;
      console.log(`  → Slag ${trickCount}: ${names[trick.winnerId]} wint (${trick.trickPoints}pt) ${bidderWon ? '' : '← TEGENSTANDER!'}`);

      // Wait for trick-cleared (2.5s delay)
      await s1.take('trick-cleared', 5000);

      if (!bidderWon) {
        console.log('  ⚡ Bieder verloor — ronde moet NU stoppen');
        // After bonaak failure: server emits system msg + round-result immediately
        // Wait for round-result with generous timeout
        roundResult = await s1.take('round-result', 5000).catch(() => null);
        // Drain chat to find "Bonaak mislukt!"
        while (true) {
          const msg = await s1.take('chat-message', 300).catch(() => null);
          if (!msg) break;
          if (msg.message?.type === 'system' && msg.message.text.includes('Bonaak mislukt')) {
            bonaakMislukt = true;
            console.log('  *** "Bonaak mislukt!" ontvangen ***');
          }
        }
        if (roundResult) {
          console.log(`  Ronde beëindigd na ${trickCount} slag(en)`);
        }
        break; // Always break after opponent won (bonaak over)
      }

      // Normal trick: check if round ended (all cards played)
      roundResult = await s1.take('round-result', 500).catch(() => null);
      if (roundResult) {
        console.log(`  Ronde beëindigd na ${trickCount} slag(en)`);
        break;
      }
    }

    // If still no round result, wait a bit longer
    if (!roundResult) {
      roundResult = await s1.take('round-result', 5000).catch(() => null);
    }

    // ── 7. Verify ──
    console.log('\n══════════════════════════════════════════════');
    console.log('  VERIFICATIE');
    console.log('══════════════════════════════════════════════');

    const checks = [];

    if (roundResult) {
      checks.push({ ok: true, msg: 'Round-result ontvangen' });
      checks.push({ ok: roundResult.bid.type === 'bonaak', msg: `Bid type = ${roundResult.bid.type}` });

      if (roundResult.bidAchieved) {
        checks.push({ ok: null, msg: 'Bieder won alle slagen — test inconclusive (draai opnieuw)' });
      } else {
        checks.push({ ok: true, msg: 'Bonaak mislukt (bidAchieved=false)' });
        checks.push({ ok: trickCount < 6, msg: `Ronde stopte na ${trickCount}/6 slagen` });
        checks.push({ ok: bonaakMislukt, msg: '"Bonaak mislukt!" systeem bericht' });
      }
    } else {
      checks.push({ ok: false, msg: 'Geen round-result ontvangen' });
    }

    let allPassed = true;
    for (const c of checks) {
      const icon = c.ok === true ? '✅' : c.ok === false ? '❌' : '⚠️';
      console.log(`  ${icon} ${c.msg}`);
      if (c.ok === false) allPassed = false;
      if (c.ok === null) allPassed = null;
    }

    console.log(`\n  RESULTAAT: ${allPassed === true ? 'PASSED ✅' : allPassed === false ? 'FAILED ❌' : 'INCONCLUSIVE ⚠️'}`);
    console.log('══════════════════════════════════════════════\n');

    s1.disconnect(); s2.disconnect();
    await sleep(500);
    process.exit(allPassed === true ? 0 : allPassed === false ? 2 : 1);

  } catch (err) {
    console.error('\n❌ FOUT:', err.message);
    s1.disconnect(); s2.disconnect();
    await sleep(500);
    process.exit(2);
  }
}

main();
