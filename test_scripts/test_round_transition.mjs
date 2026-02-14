/**
 * Test: Round Transition
 *
 * Plays 2 complete rounds to verify the game doesn't freeze between rounds.
 *
 * Gebruik: node test_scripts/test_round_transition.mjs
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

  // Drain: consume all buffered events for a given event type
  socket.drain = (event) => {
    if (queues[event]) {
      const count = queues[event].buffer.length;
      queues[event].buffer = [];
      return count;
    }
    return 0;
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

/**
 * Play through bidding, card swap, trump selection to reach playing phase.
 * Returns the updated hands.
 */
async function completeBiddingPhase(s1, s2, hands, sockets) {
  const bidStart = await s1.take('bidding-start');
  console.log(`  Bidding start. First bidder: ${bidStart.firstBidder === s1.id ? 'P1' : 'P2'}`);

  const firstId = bidStart.firstBidder;
  const secondId = firstId === s1.id ? s2.id : s1.id;

  // Consume turn-start for first bidder (already in buffer from bidding-start)
  // First bidder bids 25
  sockets[firstId].emit('place-bid', { type: 'normal', amount: 25 });
  await s1.take('bid-placed');

  // Wait for turn-start for second bidder
  await s1.take('turn-start');

  // Second passes
  sockets[secondId].emit('pass-bid');
  await s1.take('bid-passed');
  const bidComplete = await s1.take('bidding-complete');
  const bidderId = bidComplete.winner;
  console.log(`  Bidding complete. Winner: ${bidderId === s1.id ? 'P1' : 'P2'}`);

  // Card swap
  const swapData = await sockets[bidderId].take('card-swap-start');
  const discardIds = hands[bidderId].slice(0, swapData.tableCards.length).map(c => c.id);
  sockets[bidderId].emit('swap-cards', { discardCardIds: discardIds });
  const newHand = await sockets[bidderId].take('cards-dealt');
  hands[bidderId] = [...newHand.hand];

  // Trump selection
  await sockets[bidderId].take('trump-selection-start');
  sockets[bidderId].emit('select-trump', { suit: 'harten' });
  await s1.take('trump-selected');
  await s1.take('playing-start');

  console.log(`  Playing phase reached. Trump: harten`);
  return { bidderId, hands };
}

/**
 * Play all tricks until round is complete.
 * In a 2-player game: turn-start → play → card-played → turn-start → play → card-played → trick-complete → trick-cleared
 */
async function playAllTricks(s1, s2, hands, sockets) {
  let trickCount = 0;

  while (true) {
    // Player 1 of trick
    const turn1 = await s1.take('turn-start', 10000);
    sockets[turn1.playerId].emit('play-card', { cardId: turn1.validCardIds[0] });
    await s1.take('card-played');
    hands[turn1.playerId] = hands[turn1.playerId].filter(c => c.id !== turn1.validCardIds[0]);

    // Player 2 of trick
    const turn2 = await s1.take('turn-start', 10000);
    sockets[turn2.playerId].emit('play-card', { cardId: turn2.validCardIds[0] });
    await s1.take('card-played');
    hands[turn2.playerId] = hands[turn2.playerId].filter(c => c.id !== turn2.validCardIds[0]);

    // Trick complete
    const trickResult = await s1.take('trick-complete', 10000);
    trickCount++;
    const winner = trickResult.winnerId === s1.id ? 'P1' : 'P2';
    console.log(`    Trick ${trickCount} → ${winner} (${trickResult.trickPoints}pt)`);

    await s1.take('trick-cleared');

    // Check if round is done (all cards played)
    const allEmpty = Object.values(hands).every(h => h.length === 0);
    if (allEmpty) {
      console.log(`  All cards played after ${trickCount} tricks`);
      break;
    }
  }

  return trickCount;
}

async function main() {
  console.log('\n══════════════════════════════════════════════');
  console.log('  TEST: ROUND TRANSITION (2 volledige rondes)');
  console.log('══════════════════════════════════════════════');

  try {
    const s1 = await connect('P1');
    const s2 = await connect('P2');

    const sockets = { [s1.id]: s1, [s2.id]: s2 };

    // Create & join
    s1.emit('create-game', { nickname: 'Speler1', settings: { maxPlayers: 2, gameName: 'RoundTest', turnTimerSeconds: null } });
    const { id: gameId } = await s1.take('game-created');
    console.log(`\n  Game created: ${gameId}`);

    s2.emit('join-game', { gameId, nickname: 'Speler2' });
    await s2.take('game-state');

    // Start game
    s1.emit('start-game');
    const h1 = await s1.take('cards-dealt');
    const h2 = await s2.take('cards-dealt');
    let hands = { [s1.id]: [...h1.hand], [s2.id]: [...h2.hand] };
    console.log(`  P1: ${hands[s1.id].length} cards, P2: ${hands[s2.id].length} cards`);

    // ═══ ROUND 1 ═══
    console.log('\n── RONDE 1 ──');

    let result = await completeBiddingPhase(s1, s2, hands, sockets);
    hands = result.hands;

    await playAllTricks(s1, s2, hands, sockets);

    const roundResult1 = await s1.take('round-result', 10000);
    check(roundResult1 != null, 'Ronde 1 resultaat ontvangen');

    for (const [pid, pr] of Object.entries(roundResult1.playerResults)) {
      const name = pid === s1.id ? 'P1' : 'P2';
      console.log(`  ${name}: ${pr.oldStatus} → ${pr.newStatus} (${pr.won ? 'won' : 'lost'})`);
    }

    // ═══ WAIT FOR ROUND 2 ═══
    console.log('\n── Wacht op ronde 2... ──');

    // Round 2 should start automatically after ROUND_END_DELAY (5.5s)
    const h1r2 = await s1.take('cards-dealt', 15000);
    check(h1r2 != null, 'P1 kreeg kaarten voor ronde 2');
    const h2r2 = await s2.take('cards-dealt', 5000);
    check(h2r2 != null, 'P2 kreeg kaarten voor ronde 2');

    hands = { [s1.id]: [...h1r2.hand], [s2.id]: [...h2r2.hand] };
    console.log(`  P1: ${hands[s1.id].length} cards, P2: ${hands[s2.id].length} cards`);

    // ═══ ROUND 2 ═══
    console.log('\n── RONDE 2 ──');

    result = await completeBiddingPhase(s1, s2, hands, sockets);
    hands = result.hands;

    await playAllTricks(s1, s2, hands, sockets);

    const roundResult2 = await s1.take('round-result', 10000);
    check(roundResult2 != null, 'Ronde 2 resultaat ontvangen');

    for (const [pid, pr] of Object.entries(roundResult2.playerResults)) {
      const name = pid === s1.id ? 'P1' : 'P2';
      console.log(`  ${name}: ${pr.oldStatus} → ${pr.newStatus} (${pr.won ? 'won' : 'lost'})`);
    }

    check(true, 'Twee volledige rondes gespeeld!');

    s1.disconnect();
    s2.disconnect();
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
