/**
 * Test Bug #9: Disconnect/Reconnect
 *
 * Tests:
 * A. Mid-game disconnect → reconnect within 60s → game state restored
 * B. Reconnect during player's turn → turn-start re-emitted, can play card
 *
 * Gebruik: node test_scripts/test_bug9_reconnect.mjs
 * Vereist: server draait op localhost:3001
 */

import { io } from 'socket.io-client';

const SERVER = 'http://localhost:3001';

// ── Event queue ──

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

// ── Helper: create game, bid, get to playing phase ──

async function setupGame(gameName) {
  const s1 = await connect(`${gameName}-P1`);
  const s2 = await connect(`${gameName}-P2`);

  // Create & join
  s1.emit('create-game', { nickname: 'Speler1', settings: { maxPlayers: 2, gameName, turnTimerSeconds: null } });
  const { id: gameId } = await s1.take('game-created');

  s2.emit('join-game', { gameId, nickname: 'Speler2' });
  await s2.take('game-state');

  // Start game
  s1.emit('start-game');
  const h1 = await s1.take('cards-dealt');
  const h2 = await s2.take('cards-dealt');
  const bidStart = await s1.take('bidding-start');

  const hands = { [s1.id]: [...h1.hand], [s2.id]: [...h2.hand] };
  const sockets = { [s1.id]: s1, [s2.id]: s2 };
  const names = { [s1.id]: 'Speler1', [s2.id]: 'Speler2' };

  // Quick bid: first bids 25, second passes
  const firstId = bidStart.firstBidder;
  const secondId = firstId === s1.id ? s2.id : s1.id;

  sockets[firstId].emit('place-bid', { type: 'normal', amount: 25 });
  await s1.take('bid-placed');
  await s1.take('turn-start'); // consume turn-start for second bidder

  sockets[secondId].emit('pass-bid');
  const bidComplete = await s1.take('bidding-complete');
  const bidderId = bidComplete.winner;

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

  return { s1, s2, gameId, hands, sockets, names, bidderId };
}

// ═══════════════════════════════════════════════
//  Test A: Reconnect mid-game
// ═══════════════════════════════════════════════

async function testReconnectMidGame() {
  console.log('\n── TEST A: Reconnect midden in het spel ──\n');

  const { s1, s2, gameId, hands, sockets, names, bidderId } = await setupGame('ReconnTest');
  console.log(`  Spel: ${gameId}, speelfase bereikt`);

  // Play 1 trick first to verify the game works
  const turn1 = await s1.take('turn-start');
  sockets[turn1.playerId].emit('play-card', { cardId: turn1.validCardIds[0] });
  await s1.take('card-played');

  const turn2 = await s1.take('turn-start');
  sockets[turn2.playerId].emit('play-card', { cardId: turn2.validCardIds[0] });
  await s1.take('card-played');
  await s1.take('trick-complete');
  await s1.take('trick-cleared');
  console.log('  Eerste slag gespeeld ✓\n');

  // ── Disconnect Speler2 ──
  const s2OldId = s2.id;
  console.log(`  [Speler2] Disconnecting (${s2OldId})...`);
  s2.disconnect();

  const discNotif = await s1.take('player-disconnected', 5000);
  check(discNotif.nickname === 'Speler2', `player-disconnected voor "${discNotif.nickname}"`);

  // Check system message
  let gotDisconnectMsg = false;
  while (true) {
    const msg = await s1.take('chat-message', 1000).catch(() => null);
    if (!msg) break;
    if (msg.message?.type === 'system' && msg.message.text.includes('losgekoppeld')) {
      gotDisconnectMsg = true;
    }
  }
  check(gotDisconnectMsg, '"losgekoppeld" systeem bericht ontvangen');

  // ── Reconnect Speler2 ──
  console.log('\n  [Speler2] Reconnecting met nieuwe socket...');
  const s2New = await connect('Speler2-new');

  s2New.emit('reconnect-to-game', { gameId, nickname: 'Speler2' });

  // Wait for reconnect events on s1
  const reconnNotif = await s1.take('player-reconnected', 5000);
  check(reconnNotif.nickname === 'Speler2', `player-reconnected voor "${reconnNotif.nickname}"`);

  // Check that s2New received game state
  const gs = await s2New.take('game-state', 5000);
  check(gs != null, 'Game state ontvangen na reconnect');
  check(gs.phase === 'playing', `Game phase = ${gs.phase}`);

  // Check player list
  const playerNames = gs.players.map(p => p.nickname);
  check(playerNames.includes('Speler1') && playerNames.includes('Speler2'),
    `Beide spelers: ${playerNames.join(', ')}`);

  const reconnPlayer = gs.players.find(p => p.nickname === 'Speler2');
  check(reconnPlayer?.isConnected === true, `Speler2 isConnected = ${reconnPlayer?.isConnected}`);

  // Check hand received
  const handData = await s2New.take('cards-dealt', 5000);
  check(handData.hand.length > 0, `Hand hersteld: ${handData.hand.length} kaarten`);

  // Check chat history received
  const chatHist = await s2New.take('chat-history', 3000).catch(() => null);
  check(chatHist != null, 'Chat history ontvangen');

  // Check system message about reconnect
  let gotReconnectMsg = false;
  while (true) {
    const msg = await s1.take('chat-message', 1000).catch(() => null);
    if (!msg) break;
    if (msg.message?.type === 'system' && msg.message.text.includes('opnieuw verbonden')) {
      gotReconnectMsg = true;
    }
  }
  check(gotReconnectMsg, '"opnieuw verbonden" systeem bericht');

  // Cleanup
  s1.disconnect();
  s2New.disconnect();
  await sleep(500);
}

// ═══════════════════════════════════════════════
//  Test B: Reconnect during your turn
// ═══════════════════════════════════════════════

async function testReconnectDuringTurn() {
  console.log('\n── TEST B: Reconnect terwijl het je beurt is ──\n');

  const { s1, s2, gameId, hands, sockets, names, bidderId } = await setupGame('TurnReconn');
  console.log(`  Spel: ${gameId}, speelfase bereikt`);

  // Get first turn-start
  const firstTurn = await s1.take('turn-start');
  const turnPlayerId = firstTurn.playerId;
  const turnName = names[turnPlayerId];
  const isS2Turn = turnPlayerId === s2.id;

  // If it's S1's turn, play a card first so S2 gets the next turn
  let disconnectSocket, staySocket;
  if (!isS2Turn) {
    // Play s1's card
    sockets[turnPlayerId].emit('play-card', { cardId: firstTurn.validCardIds[0] });
    await s1.take('card-played');

    // Wait for s2's turn
    const s2Turn = await s1.take('turn-start');
    console.log(`  Het is nu Speler2's beurt — disconnect!`);
    disconnectSocket = s2;
    staySocket = s1;
  } else {
    console.log(`  Het is Speler2's beurt — disconnect!`);
    disconnectSocket = s2;
    staySocket = s1;
  }

  // ── Disconnect the player whose turn it is ──
  const oldId = disconnectSocket.id;
  disconnectSocket.disconnect();
  await staySocket.take('player-disconnected', 5000);
  console.log(`  [Speler2] Disconnected (${oldId})\n`);

  // ── Reconnect ──
  console.log('  [Speler2] Reconnecting...');
  const newSocket = await connect('Speler2-turn');

  newSocket.emit('reconnect-to-game', { gameId, nickname: 'Speler2' });

  // Wait for reconnect notification
  await staySocket.take('player-reconnected', 5000);

  // Get game state on new socket
  const gs = await newSocket.take('game-state', 5000);
  check(gs.phase === 'playing', `Game phase na reconnect = ${gs.phase}`);

  // Get hand
  const handData = await newSocket.take('cards-dealt', 5000);
  check(handData.hand.length > 0, `Hand: ${handData.hand.length} kaarten`);

  // Key check: turn-start should be re-emitted since it was this player's turn
  const turnRestart = await newSocket.take('turn-start', 5000).catch(() => null);
  check(turnRestart != null, 'turn-start opnieuw ontvangen na reconnect');

  if (turnRestart) {
    check(turnRestart.validCardIds.length > 0, `${turnRestart.validCardIds.length} geldige kaarten`);

    // Play a card to prove the reconnected socket works
    const cardId = turnRestart.validCardIds[0];
    const card = handData.hand.find(c => c.id === cardId);
    console.log(`  [Speler2] Speelt ${card ? `${card.rank} ${card.suit}` : cardId}`);
    newSocket.emit('play-card', { cardId });

    const played = await staySocket.take('card-played', 5000);
    check(played != null, 'Kaart succesvol gespeeld na reconnect');
  }

  // Cleanup
  staySocket.disconnect();
  newSocket.disconnect();
  await sleep(500);
}

// ═══════════════════════════════════════════════
//  Run all
// ═══════════════════════════════════════════════

async function main() {
  console.log('\n══════════════════════════════════════════════');
  console.log('  TEST BUG #9: DISCONNECT / RECONNECT');
  console.log('══════════════════════════════════════════════');

  try {
    await testReconnectMidGame();
    await testReconnectDuringTurn();
  } catch (err) {
    console.error('\n❌ ONVERWACHTE FOUT:', err.message);
    checks.push({ ok: false, msg: `Crash: ${err.message}` });
  }

  // Summary
  console.log('\n══════════════════════════════════════════════');
  console.log('  SAMENVATTING');
  console.log('══════════════════════════════════════════════');

  const passed = checks.filter(c => c.ok).length;
  const failed = checks.filter(c => !c.ok).length;

  for (const c of checks) {
    console.log(`  ${c.ok ? '✅' : '❌'} ${c.msg}`);
  }

  console.log(`\n  ${passed} passed, ${failed} failed`);
  console.log(`  RESULTAAT: ${failed === 0 ? 'ALL PASSED ✅' : 'FAILED ❌'}`);
  console.log('══════════════════════════════════════════════\n');

  process.exit(failed === 0 ? 0 : 1);
}

main();
