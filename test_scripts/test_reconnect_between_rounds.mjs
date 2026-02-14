/**
 * Test: Reconnect Between Rounds
 *
 * Simulates disconnect + reconnect during the round-end phase
 * (the 5.5s gap between round-result and bidding-start).
 * This is the scenario that causes the "freeze after one round" bug on mobile.
 *
 * Gebruik: node test_scripts/test_reconnect_between_rounds.mjs
 * Vereist: server draait op localhost:3001
 */

import { io } from 'socket.io-client';

const SERVER = 'http://localhost:3001';

const ALL_EVENTS = [
  'game-created', 'game-state', 'cards-dealt', 'bidding-start',
  'turn-start', 'bid-placed', 'bid-passed', 'bidding-complete',
  'card-swap-start', 'cards-swapped', 'trump-selection-start', 'trump-selected',
  'playing-start', 'card-played', 'trick-complete', 'trick-cleared',
  'round-result', 'chat-message', 'error', 'player-disconnected',
  'player-reconnected', 'lobby-updated', 'chat-history', 'all-passed',
  'timer-expired', 'timer-update'
];

function createEventQueue(socket) {
  const queues = {};
  const originalOn = socket.on.bind(socket);

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
    socket.on('connect', () => { console.log(`  [${name}] Verbonden (${socket.id})`); resolve(createEventQueue(socket)); });
    socket.on('connect_error', (e) => reject(new Error(`${name}: ${e.message}`)));
    setTimeout(() => reject(new Error(`${name} timeout`)), 5000);
  });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const checks = [];
function check(ok, msg) {
  checks.push({ ok, msg });
  console.log(`  ${ok ? '✅' : '❌'} ${msg}`);
}

async function main() {
  console.log('\n══════════════════════════════════════════════');
  console.log('  TEST: RECONNECT DURING ROUND TRANSITION');
  console.log('══════════════════════════════════════════════');

  try {
    const s1 = await connect('P1');
    const s2 = await connect('P2');
    const sockets = { [s1.id]: s1, [s2.id]: s2 };

    // Create & join
    s1.emit('create-game', { nickname: 'Speler1', settings: { maxPlayers: 2, gameName: 'RoundReconn', turnTimerSeconds: null } });
    const { id: gameId } = await s1.take('game-created');
    console.log(`\n  Game: ${gameId}`);

    s2.emit('join-game', { gameId, nickname: 'Speler2' });
    await s2.take('game-state');

    // Start
    s1.emit('start-game');
    const h1 = await s1.take('cards-dealt');
    const h2 = await s2.take('cards-dealt');
    let hands = { [s1.id]: [...h1.hand], [s2.id]: [...h2.hand] };

    // ═══ ROUND 1: Bid, play all tricks ═══
    console.log('\n── RONDE 1 ──');
    const bidStart = await s1.take('bidding-start');
    const firstId = bidStart.firstBidder;
    const secondId = firstId === s1.id ? s2.id : s1.id;

    sockets[firstId].emit('place-bid', { type: 'normal', amount: 25 });
    await s1.take('bid-placed');
    await s1.take('turn-start');
    sockets[secondId].emit('pass-bid');
    await s1.take('bid-passed');
    const bidComplete = await s1.take('bidding-complete');
    const bidderId = bidComplete.winner;

    const swapData = await sockets[bidderId].take('card-swap-start');
    const discardIds = hands[bidderId].slice(0, swapData.tableCards.length).map(c => c.id);
    sockets[bidderId].emit('swap-cards', { discardCardIds: discardIds });
    const newHand = await sockets[bidderId].take('cards-dealt');
    hands[bidderId] = [...newHand.hand];

    await sockets[bidderId].take('trump-selection-start');
    sockets[bidderId].emit('select-trump', { suit: 'harten' });
    await s1.take('trump-selected');
    await s1.take('playing-start');

    // Play all tricks
    for (let trick = 0; trick < 6; trick++) {
      const t1 = await s1.take('turn-start');
      sockets[t1.playerId].emit('play-card', { cardId: t1.validCardIds[0] });
      await s1.take('card-played');
      hands[t1.playerId] = hands[t1.playerId].filter(c => c.id !== t1.validCardIds[0]);

      const t2 = await s1.take('turn-start');
      sockets[t2.playerId].emit('play-card', { cardId: t2.validCardIds[0] });
      await s1.take('card-played');
      hands[t2.playerId] = hands[t2.playerId].filter(c => c.id !== t2.validCardIds[0]);

      await s1.take('trick-complete');
      await s1.take('trick-cleared');
    }

    const roundResult = await s1.take('round-result');
    check(roundResult != null, 'Ronde 1 resultaat ontvangen');
    console.log('  Ronde 1 klaar!\n');

    // ═══ DISCONNECT P2 DURING ROUND-END (before round 2 starts) ═══
    console.log('  [Speler2] Disconnect tijdens ronde-einde...');
    const s2OldId = s2.id;
    s2.disconnect();
    await s1.take('player-disconnected', 5000);
    console.log(`  [Speler2] Disconnected (${s2OldId})`);

    // Wait a moment (simulating mobile network drop)
    await sleep(1000);

    // Reconnect P2 with new socket
    console.log('  [Speler2] Reconnecting met nieuwe socket...');
    const s2New = await connect('P2-new');

    s2New.emit('reconnect-to-game', { gameId, nickname: 'Speler2' });

    // Get game state from reconnect
    const gs = await s2New.take('game-state', 10000);
    check(gs != null, 'Game state ontvangen na reconnect');
    console.log(`  Game phase na reconnect: ${gs.phase}`);

    // Wait for round 2 to start (could already be started or will start soon)
    // The server starts round 2 after ROUND_END_DELAY (5.5s) from round-result

    // Get cards for round 2
    const r2Hand = await s2New.take('cards-dealt', 15000);
    check(r2Hand != null, 'Kaarten voor ronde 2 ontvangen');
    check(r2Hand.hand.length > 0, `Hand: ${r2Hand.hand.length} kaarten`);

    // Get bidding-start for round 2
    const r2Bidding = await s2New.take('bidding-start', 15000);
    check(r2Bidding != null, 'bidding-start ontvangen voor ronde 2');
    check(r2Bidding.biddingOrder.length === 2, `Biedvolgorde: ${r2Bidding.biddingOrder.length} spelers`);

    // Verify we can bid in round 2
    const turnEvent = await s1.take('turn-start', 5000).catch(() => null);
    // Find whose turn it is
    const currentBidder = r2Bidding.firstBidder;
    const bidderSocket = currentBidder === s1.id ? s1 : s2New;
    const bidderName = currentBidder === s1.id ? 'P1' : 'P2-new';

    console.log(`  ${bidderName} is aan de beurt om te bieden`);
    bidderSocket.emit('place-bid', { type: 'normal', amount: 25 });
    const bidPlaced = await s1.take('bid-placed', 5000);
    check(bidPlaced != null, 'Bod geplaatst in ronde 2');

    console.log('\n  Ronde 2 bieden werkt!');

    s1.disconnect();
    s2New.disconnect();
  } catch (err) {
    console.error('\n❌ FOUT:', err.message);
    checks.push({ ok: false, msg: `Crash: ${err.message}` });
  }

  // Summary
  console.log('\n══════════════════════════════════════════════');
  const passed = checks.filter(c => c.ok).length;
  const failed = checks.filter(c => !c.ok).length;
  for (const c of checks) {
    console.log(`  ${c.ok ? '✅' : '❌'} ${c.msg}`);
  }
  console.log(`\n  ${passed} passed, ${failed} failed`);
  console.log(`  ${failed === 0 ? 'ALL PASSED ✅' : 'FAILED ❌'}`);
  console.log('══════════════════════════════════════════════\n');
  process.exit(failed === 0 ? 0 : 1);
}

main();
