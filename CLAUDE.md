# Bonaken Development Instructions

## Game Overview
Online multiplayer card game Bonaken (Leimuiden variant) with full bidding system,
roem declarations, and status-based scoring. Deployed at bonaken.frankvdbrink.nl.

## Reference Documents
- `bonaken_leidemuiden.md` — Official Leimuiden game rules (authoritative source)
- `spec.md` — Original simplified spec (outdated; actual implementation follows full Leimuiden rules)
- `implementation_plan.md` — Phase checkboxes (phases 1-10 done, 11-12 remaining)
- `spelregels.md` — Additional rules reference
- `DEPLOYMENT.md` — VPS deployment with Docker + nginx
- `ANDROID_BUILD.md` / `INSTALL_APK.md` / `PLAYSTORE.md` — Android native app docs
- `CAPACITOR_PLAN.md` — Capacitor integration plan

## Tech Stack
- **Backend:** Node.js + Express + Socket.io 4.7 + TypeScript 5.3
- **Frontend:** React 18 + Vite 5 + TypeScript 5.3 + CSS Modules
- **Shared:** TypeScript types and card utilities (CommonJS + ESM)
- **Native:** Capacitor 8 (Android wrapper)
- **Deploy:** Docker + docker-compose + nginx reverse proxy
- **No database** — in-memory state only
- **Dutch language only** throughout the UI

## Project Structure
```
/bonaken
├── /client                          # React frontend (Vite + TypeScript)
│   ├── /src
│   │   ├── /components              # 18 React components + CSS Modules
│   │   │   ├── StartScreen.tsx      # Game browser, create/join game
│   │   │   ├── Lobby.tsx            # Pre-game lobby with player list
│   │   │   ├── GameScreen.tsx       # Phase router
│   │   │   ├── BiddingPhase.tsx     # Auction UI (bids 25-200 + special bids)
│   │   │   ├── CardSwapPhase.tsx    # Bid winner picks up table cards
│   │   │   ├── TrumpSelection.tsx   # Suit selector
│   │   │   ├── PlayingPhase.tsx     # Main game table with trick display
│   │   │   ├── RoundEnd.tsx         # Round results with status changes
│   │   │   ├── GameEnd.tsx          # Final standings + rematch
│   │   │   ├── Card.tsx / CardFace.tsx / Hand.tsx  # Card rendering (SVG)
│   │   │   ├── Table.tsx            # Mahogany table with green felt
│   │   │   ├── TurnTimer.tsx        # Countdown with urgency display
│   │   │   ├── RoemIndicator.tsx    # Roem declaration display
│   │   │   ├── StatusBadge.tsx      # Player status indicator
│   │   │   └── CreateGameModal.tsx  # Game creation settings
│   │   ├── /contexts
│   │   │   └── GameContext.tsx       # Complete game state + Socket.io integration
│   │   ├── /hooks
│   │   │   └── useSocket.ts         # Socket.io React hook
│   │   ├── /utils
│   │   │   ├── sounds.ts            # Web Audio API synthesis (8 effects)
│   │   │   └── nativeSetup.ts       # Capacitor initialization
│   │   ├── App.tsx                   # Router + Capacitor back button
│   │   └── index.css                # Global styles, CSS variables, animations
│   └── /android                     # Capacitor Android build
├── /server                          # Node.js backend (Socket.io + TypeScript)
│   └── /src
│       ├── /game                    # Game logic modules
│       │   ├── GameManager.ts       # Central state manager (singleton, Map-based)
│       │   ├── bidding.ts           # Bid validation, turn order, completion
│       │   ├── scoring.ts           # Leimuiden status system
│       │   ├── cardValidation.ts    # Follow-suit rules, valid card checking
│       │   ├── trickWinner.ts       # Trump ranking + trick winner logic
│       │   ├── roem.ts              # Roem detection and validation
│       │   ├── dealing.ts           # Card distribution with table cards
│       │   ├── deck.ts              # 32-card deck creation, Fisher-Yates shuffle
│       │   ├── timer.ts             # Turn timer with deadline tracking
│       │   └── turnManager.ts       # Next player, first player, majority calc
│       ├── /socket                  # Socket event handlers
│       │   ├── lobbyHandlers.ts     # Create/join game, settings, game browser
│       │   ├── biddingHandlers.ts   # Bidding flow with timers
│       │   ├── trumpHandlers.ts     # Card swap + trump selection
│       │   └── gameplayHandlers.ts  # Trick-taking loop, round/game end
│       └── index.ts                 # Express + Socket.io server, CORS, SPA routing
├── /shared                          # Shared TypeScript types
│   └── /src
│       ├── index.ts                 # Core types (Card, Player, GameState, Socket events)
│       └── cardUtils.ts             # Sort, points, suit/rank helpers
├── Dockerfile                       # Production Docker build
├── docker-compose.yml               # Docker compose for deployment
└── package.json                     # Root monorepo config (npm workspaces)
```

## Game Rules (Leimuiden Variant — Actually Implemented)

### Cards & Dealing
- 32 cards: 7, 8, 9, 10, B, V, K, A × 4 suits (harten, ruiten, klaveren, schoppen)
- 2-5 players (maxPlayers in settings)
- Table cards: 2 open + 0-2 blind (varies by player count)
- Sleeping cards for uneven divisions

### Bidding System
- Starting bid: 25 points, increments of 5
- Special bids: Misère (105), Zwabber (130), Bonaak (200), Bonaak+Roem
- Misère allows multiple players simultaneously
- Turn-based bidding with pass mechanic
- Bid winner picks up table cards (card-swap phase), then selects trump

### Card Values
- **Trump:** B(20), 9(14), A(11), 10(10), K(3), V(2), 8(0), 7(0) = 60pt
- **Non-trump:** A(11), 10(10), K(3), V(2), B(1), 9(0), 8(0), 7(0) = 27pt each
- **Total deck:** 141 points

### Trump Ranking
- **Trump:** B > 9 > A > 10 > K > V > 8 > 7
- **Non-trump:** A > K > V > B > 10 > 9 > 8 > 7

### Trick-Taking Rules
- Follow suit mandatory
- Trump overrides when you can't follow suit
- First player in trick: left of dealer (round 1) or trick winner (subsequent)

### Roem Declarations
- Stuk (V+K of trump): 20pt
- Driekaart: 20pt (with stuk: 40pt)
- Vierkaart: 50pt, Vijfkaart: 100pt, Zeskaart: 100pt
- Vier vrouwen/heren/azen: 100pt, Vier boeren: 200pt

### Scoring (Status Progression System)
All players start at `suf`:
- `suf` → win: `recht` / lose: `krom`
- `krom` → win: `wip` / lose: `erin`
- `recht` → win: `eruit` / lose: `wip`
- `wip` → win: `eruit` / lose: `erin`
- Game ends when all but 1 player is `erin` or `eruit`

### Socket Events
- **Server → Client:** 32 events (lobby, bidding, trump, gameplay, scoring, timer, connection)
- **Client → Server:** 11 events (lobby, bidding, card swap, trump, gameplay, connection)
- All events fully typed via `ServerToClientEvents` and `ClientToServerEvents` in shared/src/index.ts

## Development Workflow
1. Test each feature in browser using Chrome DevTools
2. Iterate until feature works correctly
3. Write automated Socket.io test scripts for bug fixes and new features (in `test_scripts/`)
4. Run all existing tests to verify no regressions
5. Commit with detailed Dutch message describing the feature
6. Update implementation_plan.md checkboxes
7. Update this file with completed features

## Testing
- **Test scripts:** `test_scripts/` directory with Socket.io client tests
- **Run:** `node test_scripts/<test>.mjs` (requires server running on localhost:3001)
- **Pattern:** Event queue with buffered socket events, `socket.take(event, timeout)` for async assertions
- **Always write tests** after fixing bugs or adding features — verify the fix works and prevent regressions

## Completed Features
- [x] Fase 1: Project Foundation (monorepo + WebSocket)
- [x] Fase 2: Lobby System (game browser, create/join, settings)
- [x] Fase 3: Card System (32-card deck, dealing, SVG rendering)
- [x] Fase 4: Bidding System (full Leimuiden bidding replaces simple bonaken phase)
- [x] Fase 5: Trump Selection (card swap + suit selection)
- [x] Fase 6: Trick-Taking (gameplay with follow-suit rules)
- [x] Fase 7: Scoring (Leimuiden status progression system)
- [x] Fase 8: Game End/Rematch (standings + rematch voting)
- [x] Fase 9: Turn Timers + Disconnect/Reconnect
- [x] Fase 10: Visual Polish (Victorian/casino theme, SVG cards, Web Audio sounds)
- [x] Android Native App (Capacitor wrapper, APK builds)
- [x] Production Deployment (Docker + nginx on VPS)
- [ ] Fase 11: Cleanup/Stability (error handling, input validation)
- [ ] Fase 12: Final Testing (multi-player validation, edge cases)

## Bug Tracker
- **Bugs API:** https://bonaken-board.frankvdbrink.nl/api/agent/bugs — Fetch this endpoint to get current reported bugs

## Known Gaps / TODO
- **Error handling:** No React error boundaries, no comprehensive input validation, no Dutch error messages
- **Advanced rules not yet implemented:**
  - Troefboer verzaken (withholding trump jack)
  - Vals roemen penalty (instant `erin` + 0 points)
  - Misère special rules: vuil opkomen, mandatory trump declaration for solo misère
  - "Liggen is liggen" enforcement

## Frontend Design
Use the frontend-design skill for all UI components
