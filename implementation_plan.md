# Bonaken - Implementatieplan

Een server-gebaseerde webapplicatie voor het online spelen van het Nederlandse kaartspel Bonaken.

---

## Workflow Per Fase

Na elke fase:
1. Test in browser met Chrome DevTools plugin
2. Itereer totdat alles werkt
3. Commit met gedetailleerde message
4. Vink checkboxes af in dit bestand
5. Update CLAUDE.md met voltooide features

---

## Fase 1: Project Foundation [VOLTOOID]

**Doel:** Monorepo structuur met werkende WebSocket verbinding

### Setup
- [x] Root `package.json` met npm workspaces configuratie
- [x] `.gitignore` voor node_modules, dist, etc.
- [x] `CLAUDE.md` met development instructies

### Server (/server)
- [x] `package.json` met Express, Socket.io, TypeScript dependencies
- [x] `tsconfig.json` configuratie
- [x] `src/index.ts` - Basis Express + Socket.io server op poort 3001
- [x] npm scripts: `dev`, `build`, `start`

### Client (/client)
- [x] `package.json` met React, Vite, Socket.io-client dependencies
- [x] `vite.config.ts` met proxy naar backend
- [x] `tsconfig.json` configuratie
- [x] `index.html` entry point
- [x] `src/main.tsx` - React root
- [x] `src/App.tsx` - Met socket verbindingsindicator
- [x] npm scripts: `dev`, `build`, `preview`

### Shared Types (/shared)
- [x] `types/index.ts` - Card, Player, GameState interfaces

### Test Criteria
- [x] `npm run dev` start beide servers
- [x] Client toont "Verbonden" bij succesvolle WebSocket connectie
- [x] Server logt connectie/disconnectie events

---

## Fase 2: Lobby System

**Doel:** Spel aanmaken en joinen met 6-karakter codes

### Server
- [ ] `src/utils/codeGenerator.ts` - Genereer 6-char alfanumerieke codes
- [ ] `src/types/game.ts` - GameState, Player types
- [ ] `src/game/GameManager.ts` - In-memory game storage (Map)
- [ ] `src/socket/lobbyHandlers.ts`:
  - [ ] `create-game` event handler
  - [ ] `join-game` event handler
  - [ ] `update-settings` event handler
  - [ ] `start-game` event handler
  - [ ] Duplicaat naam validatie
  - [ ] Game not found error handling

### Client
- [ ] `src/hooks/useSocket.ts` - Socket.io React hook
- [ ] `src/contexts/GameContext.tsx` - Game state context
- [ ] `src/components/StartScreen.tsx`:
  - [ ] "Nieuw spel starten" knop
  - [ ] "Deelnemen aan spel" knop
  - [ ] Moderne UI met frontend-design skill
- [ ] `src/components/NicknameInput.tsx`:
  - [ ] Bijnaam invoerveld
  - [ ] localStorage persistentie
  - [ ] Validatie (2-15 karakters)
- [ ] `src/components/CreateGameModal.tsx`:
  - [ ] Min/max spelers sliders (2-7)
  - [ ] Aanmaken bevestiging
- [ ] `src/components/JoinGameModal.tsx`:
  - [ ] Code invoerveld (6 karakters)
  - [ ] Error feedback bij ongeldige code
- [ ] `src/components/Lobby.tsx`:
  - [ ] Spelcode prominent weergeven
  - [ ] Spelerslijst met online status
  - [ ] "Wachten op spelers..." bericht
  - [ ] Host: "Start Spel" knop (disabled tot min spelers)
  - [ ] Speler aantal indicator

### Test Criteria
- [ ] Tab 1: Nieuw spel maken → ontvang 6-char code
- [ ] Tab 2: Code invoeren → join lobby
- [ ] Beide tabs tonen beide spelers
- [ ] Duplicaat naam wordt geweigerd met foutmelding
- [ ] Ongeldige code toont foutmelding
- [ ] Host kan settings aanpassen
- [ ] Start knop werkt alleen met 2+ spelers

---

## Fase 3: Kaart Systeem

**Doel:** 32-kaarten deck, delen, en kaart weergave

### Server
- [ ] `src/game/deck.ts`:
  - [ ] `createDeck()` - 32 kaarten (7,8,9,10,B,V,K,A × 4 kleuren)
  - [ ] `shuffleDeck()` - Fisher-Yates shuffle
- [ ] `src/game/dealing.ts`:
  - [ ] `dealCards()` - Verdeel kaarten over spelers
  - [ ] Bereken slapende kaarten per speler aantal
  - [ ] Socket event: `cards-dealt`

### Shared
- [ ] `utils/cardUtils.ts`:
  - [ ] `sortHand()` - Sorteer op kleur, dan rang
  - [ ] Normale rankvolgorde: A,K,V,B,10,9,8,7
  - [ ] Troef rankvolgorde: B,9,A,10,K,V,8,7
  - [ ] Kleurvolgorde: schoppen, harten, klaveren, ruiten

### Client
- [ ] `src/components/Card.tsx`:
  - [ ] Kaart weergave (later SVG)
  - [ ] Kleur styling (rood/zwart)
  - [ ] Rank en suit symbolen
  - [ ] Playable/disabled states
  - [ ] Hover en click effects
- [ ] `src/components/Hand.tsx`:
  - [ ] Horizontale waaier layout
  - [ ] Overlappende kaarten
  - [ ] Responsive spacing
  - [ ] Speelbare kaarten highlighted

### Test Criteria
- [ ] Na "Start Spel" worden kaarten gedeeld
- [ ] 2 spelers: 16 kaarten elk, 0 slapend
- [ ] 3 spelers: 10 kaarten elk, 2 slapend
- [ ] 4 spelers: 8 kaarten elk, 0 slapend
- [ ] 5 spelers: 6 kaarten elk, 2 slapend
- [ ] 6 spelers: 5 kaarten elk, 2 slapend
- [ ] 7 spelers: 4 kaarten elk, 4 slapend
- [ ] Kaarten zijn gesorteerd weergegeven
- [ ] Kaart componenten renderen correct

---

## Fase 4: Bonaken Fase

**Doel:** Simultane geheime keuze "Bonaken" of "Passen"

### Server
- [ ] `src/game/bonaken.ts`:
  - [ ] `BonakChoice` interface
  - [ ] `determineBonaker()` - Bij meerdere: eerste in wijzerzin vanaf deler
  - [ ] Tracking van wie al gekozen heeft
- [ ] `src/socket/bonakenHandlers.ts`:
  - [ ] `bonaken-choice` event (bonaken/passen)
  - [ ] `bonaken-phase-start` emit
  - [ ] `player-chose` emit (zonder keuze te onthullen)
  - [ ] `bonaken-revealed` emit wanneer allen gekozen
  - [ ] `bonaker-determined` emit met winnende bonaker

### Client
- [ ] `src/components/BonakenPhase.tsx`:
  - [ ] Twee grote knoppen: "Bonaken" en "Passen"
  - [ ] Na keuze: "Wachten op andere spelers..."
  - [ ] Progress indicator (X van Y heeft gekozen)
  - [ ] Onthulling animatie
  - [ ] Resultaat: wie bonaakt of "Niemand bonaakt"
- [ ] Game state update voor bonaken fase

### Test Criteria
- [ ] Na delen start bonaken fase automatisch
- [ ] Elke speler ziet "Bonaken" en "Passen" knoppen
- [ ] Na kiezen verschijnt wacht indicator
- [ ] Keuzes worden pas onthuld als iedereen gekozen heeft
- [ ] Bij één bonaker: die wint
- [ ] Bij meerdere bonakers: eerste in wijzerzin vanaf deler wint
- [ ] Bij niemand bonaakt: correct bericht getoond

---

## Fase 5: Troef Selectie

**Doel:** Bonaker of deler kiest troefkleur

### Server
- [ ] `src/game/trump.ts`:
  - [ ] `getTrumpSelector()` - Return bonaker of deler ID
- [ ] `src/socket/trumpHandlers.ts`:
  - [ ] `trump-selection-start` emit met selector ID
  - [ ] `select-trump` event handler
  - [ ] `trump-selected` emit naar alle spelers
  - [ ] Validatie: alleen selector mag kiezen

### Client
- [ ] `src/components/TrumpSelection.tsx`:
  - [ ] Vier kleur iconen (harten, ruiten, klaveren, schoppen)
  - [ ] Alleen klikbaar voor selector
  - [ ] Wacht staat voor niet-selectors
  - [ ] Animatie bij selectie
- [ ] `src/components/TrumpIndicator.tsx`:
  - [ ] Altijd zichtbare troef indicator
  - [ ] Duidelijk icoon + kleur

### Test Criteria
- [ ] Na bonaken fase start troef selectie
- [ ] Als iemand bonaakt: bonaker selecteert
- [ ] Als niemand bonaakt: deler selecteert
- [ ] Niet-selectors kunnen niet klikken
- [ ] Na selectie ziet iedereen de troef
- [ ] Troef indicator blijft zichtbaar tijdens spel

---

## Fase 6: Slag Spelen

**Doel:** Kaarten spelen met correcte regelhandhaving

### Server
- [ ] `src/game/cardValidation.ts`:
  - [ ] `getValidCards()` - Kleur bekennen verplicht
  - [ ] Als geen kaart van gevraagde kleur: alle kaarten geldig
  - [ ] Eerste speler: alle kaarten geldig
- [ ] `src/game/trickWinner.ts`:
  - [ ] Troef rankvolgorde: B(8),9(7),A(6),10(5),K(4),V(3),8(2),7(1)
  - [ ] Normale rankvolgorde: A(8),K(7),V(6),B(5),10(4),9(3),8(2),7(1)
  - [ ] `determineTrickWinner()` logica
  - [ ] Troef beats non-troef
  - [ ] Hoogste in gevraagde kleur wint (als geen troef)
- [ ] `src/game/turnManager.ts`:
  - [ ] `getNextPlayer()` - Volgende in wijzerzin
  - [ ] `getFirstPlayer()` - Links van deler
  - [ ] `getTrickStarter()` - Winnaar vorige slag
- [ ] `src/game/timer.ts`:
  - [ ] `TurnTimer` class
  - [ ] 60 seconden per beurt
  - [ ] Bij timeout: speel willekeurige geldige kaart
- [ ] `src/socket/gameplayHandlers.ts`:
  - [ ] `play-card` event handler
  - [ ] Kaart validatie
  - [ ] `turn-start` emit met geldige kaarten
  - [ ] `card-played` emit
  - [ ] `trick-complete` emit na alle kaarten
  - [ ] `trick-cleared` emit na 3-4 sec delay
  - [ ] `round-complete` emit na alle slagen

### Client
- [ ] `src/components/GameBoard.tsx`:
  - [ ] Centrale tafel layout
  - [ ] Speler posities rond tafel
  - [ ] Troef indicator
  - [ ] Score weergave
  - [ ] Huidige speler indicator
- [ ] `src/components/TrickArea.tsx`:
  - [ ] Gespeelde kaarten in midden
  - [ ] Speler labels bij kaarten
  - [ ] Winnaar highlight
- [ ] `src/components/TurnTimer.tsx`:
  - [ ] Countdown van 60 sec
  - [ ] Visuele urgentie (kleur change)
  - [ ] Timer pauze bij disconnect
- [ ] Hand component update:
  - [ ] Alleen geldige kaarten klikbaar
  - [ ] Ongeldige kaarten grayed out
  - [ ] Beurt indicator

### Test Criteria
- [ ] Speler links van deler begint eerste slag
- [ ] Alleen geldige kaarten zijn klikbaar
- [ ] Kleur bekennen wordt afgedwongen
- [ ] Gespeelde kaart verschijnt in midden
- [ ] Alle spelers zien gespeelde kaarten
- [ ] Na volledige slag: winnaar bepaald
- [ ] Slag blijft 3-4 seconden zichtbaar
- [ ] Winnaar van slag begint volgende
- [ ] Troef B is hoogste troef
- [ ] Troef beats hogere non-troef
- [ ] Timer countdown werkt
- [ ] Timeout speelt willekeurige geldige kaart

---

## Fase 7: Puntentelling

**Doel:** Scoring per ronde, 10 punten = verloren

### Server
- [ ] `src/game/scoring.ts`:
  - [ ] `calculateRoundScores()`:
    - [ ] Bonaken geslaagd (meerderheid slagen): +1 voor alle anderen
    - [ ] Bonaken mislukt: +3 voor bonaker
    - [ ] Geen bonaker: +1 voor speler(s) met minste slagen
  - [ ] `checkGameEnd()` - Speler met 10+ punten
  - [ ] Meerderheid berekening per speler aantal
- [ ] Socket events:
  - [ ] `round-scores` emit met punten deze ronde
  - [ ] `game-scores` emit met totale stand

### Client
- [ ] `src/components/RoundEnd.tsx`:
  - [ ] Overzicht slagen per speler
  - [ ] Bonaken resultaat (geslaagd/mislukt)
  - [ ] Punten toegekend deze ronde
  - [ ] Bijgewerkte totaalscores
  - [ ] "Volgende ronde" countdown/knop
- [ ] `src/components/ScoreBoard.tsx`:
  - [ ] Altijd zichtbaar tijdens spel
  - [ ] Speler namen met scores
  - [ ] Highlight speler dichtbij 10

### Test Criteria
- [ ] Na alle slagen: ronde einde scherm
- [ ] Bonaken geslaagd = meerderheid slagen
- [ ] Bonaken geslaagd: anderen krijgen +1
- [ ] Bonaken mislukt: bonaker krijgt +3
- [ ] Geen bonaker: minste slagen krijgt +1
- [ ] Bij gelijke minste slagen: allen +1
- [ ] Scores worden opgeteld over rondes
- [ ] Deler roteert naar volgende speler

---

## Fase 8: Spel Einde & Rematch

**Doel:** 10+ punten = verloren, rematch mogelijkheid

### Server
- [ ] `src/game/rematch.ts`:
  - [ ] `resetForRematch()` - Reset scores, behoud spelers
  - [ ] Deler roteert door
- [ ] Socket events:
  - [ ] `game-ended` emit met verliezer en finale scores
  - [ ] `request-rematch` event
  - [ ] `rematch-requested` emit
  - [ ] `rematch-started` emit

### Client
- [ ] `src/components/GameEnd.tsx`:
  - [ ] Finale scorebord (gerangschikt)
  - [ ] Verliezer highlight (10+ punten)
  - [ ] "Nog een potje?" knop
  - [ ] "Terug naar start" knop
- [ ] Rematch flow:
  - [ ] Toon wie rematch wil
  - [ ] Start nieuwe ronde als allen akkoord

### Test Criteria
- [ ] Spel eindigt wanneer iemand 10+ punten bereikt
- [ ] Eindscherm toont correcte finale scores
- [ ] Verliezer is duidelijk gemarkeerd
- [ ] "Nog een potje?" start nieuw spel
- [ ] Scores zijn gereset bij rematch
- [ ] Deler roteert bij rematch
- [ ] "Terug naar start" werkt

---

## Fase 9: Disconnect/Reconnect

**Doel:** Robuuste verbindingsafhandeling met spel pauze

### Server
- [ ] `src/socket/connectionHandlers.ts`:
  - [ ] Disconnect detectie
  - [ ] Player `isConnected` flag update
  - [ ] `player-disconnected` emit
  - [ ] Reconnect timeout (90 sec)
  - [ ] `reconnect-to-game` event handler
  - [ ] Volledige state restore
  - [ ] `player-reconnected` emit
- [ ] Spel pauze logica:
  - [ ] Timer pauzeren bij disconnect
  - [ ] Na timeout: auto-play willekeurige kaart

### Client
- [ ] `src/components/DisconnectOverlay.tsx`:
  - [ ] "Wachten op [naam]..." melding
  - [ ] Countdown timer
  - [ ] Reconnect pogingen
- [ ] Reconnect logica:
  - [ ] Automatische reconnect poging
  - [ ] Nickname ophalen uit localStorage
  - [ ] Game state restore

### Test Criteria
- [ ] Bij tab sluiten: anderen zien disconnect melding
- [ ] Spel pauzeert als disconnected speler aan beurt is
- [ ] Timer pauzeert bij disconnect
- [ ] Tab heropenen: automatische reconnect
- [ ] Volledige game state is hersteld
- [ ] Hand, score, ronde status correct
- [ ] Na 90 sec timeout: auto-play en doorgaan

---

## Fase 10: Visuele Polish

**Doel:** Klassieke Nederlandse kaartspel esthetiek met SVG kaarten

### Styling
- [ ] `src/styles/theme.ts`:
  - [ ] Kleurenpalet (bruin, goud, groen, cream)
  - [ ] Typography (serif fonts)
  - [ ] Shadows en depth
- [ ] `src/styles/global.css`:
  - [ ] Reset styles
  - [ ] Base typography
  - [ ] Color variables
- [ ] `src/styles/animations.css`:
  - [ ] Kaart deal animatie
  - [ ] Kaart speel animatie
  - [ ] Slag verzamel animatie
  - [ ] Fade in/out transitions

### SVG Kaarten
- [ ] `src/assets/cards/` directory
- [ ] `src/components/CardFace.tsx`:
  - [ ] SVG rendering per kaart
  - [ ] Suit symbolen (harten, ruiten, klaveren, schoppen)
  - [ ] Rank displays
  - [ ] Court cards (B, V, K) styling
- [ ] Alle 32 kaart designs

### Tafel Layout
- [ ] `src/components/Table.tsx`:
  - [ ] Houten textuur achtergrond
  - [ ] Groen vilt center
  - [ ] Gouden trim accenten
  - [ ] Speler posities
- [ ] Responsive design:
  - [ ] Desktop layout
  - [ ] Tablet layout
  - [ ] Mobiel layout (scrollbare hand)

### Geluidseffecten
- [ ] `src/utils/sounds.ts`:
  - [ ] Sound manager class
  - [ ] Volume controle
  - [ ] Mute optie
- [ ] `src/assets/sounds/`:
  - [ ] Kaart shuffle
  - [ ] Kaart spelen (slap)
  - [ ] Slag winnen (swipe)
  - [ ] Beurt notificatie (ding)
  - [ ] Game start/einde

### Test Criteria
- [ ] Houten tafel textuur zichtbaar
- [ ] SVG kaarten renderen scherp
- [ ] Animaties zijn soepel (60fps)
- [ ] Geluidseffecten spelen correct
- [ ] Responsive op alle schermformaten
- [ ] Touch interacties werken op mobiel

---

## Fase 11: Cleanup & Stabiliteit

**Doel:** Automatische opruiming en error handling

### Server
- [ ] `src/services/cleanupService.ts`:
  - [ ] Periodic cleanup (elke minuut)
  - [ ] Verwijder games > 5 min inactief
  - [ ] `lastActivity` timestamp tracking
  - [ ] Disconnect remaining sockets
- [ ] `src/utils/errorHandler.ts`:
  - [ ] Socket handler error wrapper
  - [ ] Graceful error logging
  - [ ] Client error feedback
- [ ] `src/utils/validation.ts`:
  - [ ] Input sanitization
  - [ ] Game state validation

### Client
- [ ] Error boundaries
- [ ] Connection retry logic
- [ ] User-friendly error messages

### Test Criteria
- [ ] Inactief spel wordt na 5 min opgeruimd
- [ ] Server crasht niet bij ongeldige input
- [ ] Error messages zijn duidelijk (Nederlands)
- [ ] Memory leaks zijn voorkomen

---

## Fase 12: Finale Integratie Test

**Doel:** Complete game flow validatie

### Full Game Flow Tests
- [ ] 2 spelers: complete game tot 10 punten
- [ ] 3 spelers: complete game
- [ ] 4 spelers: complete game
- [ ] 5 spelers: complete game
- [ ] 6 spelers: complete game
- [ ] 7 spelers: complete game

### Edge Case Tests
- [ ] Meerdere bonakers in één ronde
- [ ] Alle spelers passen (geen bonaker)
- [ ] Gelijke scores voor minste slagen
- [ ] Turn timeout meerdere keren
- [ ] Host disconnect mid-game
- [ ] Alle spelers disconnect behalve één
- [ ] Rematch na game end
- [ ] Terug naar start na game end

### Performance Tests
- [ ] Rapid card playing (geen lag)
- [ ] Meerdere games tegelijk op server
- [ ] Lange game sessie (memory stable)

### Cross-Browser Tests
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

## Kritieke Type Definities

```typescript
// /shared/types/index.ts

export type Suit = 'harten' | 'ruiten' | 'klaveren' | 'schoppen';
export type Rank = '7' | '8' | '9' | '10' | 'B' | 'V' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // e.g., "harten-B"
}

export interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  isConnected: boolean;
  hand: Card[];
  score: number;
  tricksWon: number;
}

export type GamePhase =
  | 'lobby'
  | 'dealing'
  | 'bonaken'
  | 'trump-selection'
  | 'playing'
  | 'round-end'
  | 'game-end';

export interface GameSettings {
  minPlayers: number;
  maxPlayers: number;
}

export interface PlayedCard {
  playerId: string;
  card: Card;
}

export interface BonakChoice {
  playerId: string;
  choice: 'bonaken' | 'passen' | null;
}

export interface GameState {
  code: string;
  phase: GamePhase;
  players: Player[];
  settings: GameSettings;
  currentDealer: string;
  currentTurn: string | null;
  trump: Suit | null;
  bonaker: string | null;
  bonakenChoices: BonakChoice[];
  currentTrick: PlayedCard[];
  roundNumber: number;
  lastActivity: number;
}
```

---

## Nederlandse UI Strings

```typescript
// /client/src/utils/strings.ts

export const NL = {
  // Start
  title: 'Bonaken',
  startGame: 'Nieuw spel starten',
  joinGame: 'Deelnemen aan spel',

  // Lobby
  gameCode: 'Spelcode',
  enterCode: 'Voer spelcode in',
  enterNickname: 'Kies een bijnaam',
  waitingForPlayers: 'Wachten op spelers...',
  minPlayers: 'Minimum spelers',
  maxPlayers: 'Maximum spelers',
  startButton: 'Start spel',
  playersInLobby: '{count} spelers in lobby',

  // Bonaken
  bonaken: 'Bonaken',
  passen: 'Passen',
  waitingForChoices: 'Wachten op andere spelers...',
  nobodyBonaked: 'Niemand bonaakt',
  playerBonaked: '{name} bonaakt!',
  choicesMade: '{count} van {total} heeft gekozen',

  // Trump
  selectTrump: 'Kies troef',
  trumpIs: 'Troef: {suit}',
  waitingForTrump: 'Wachten op troefkeuze...',

  // Suits
  harten: 'Harten',
  ruiten: 'Ruiten',
  klaveren: 'Klaveren',
  schoppen: 'Schoppen',

  // Gameplay
  yourTurn: 'Jouw beurt',
  waitingFor: 'Wachten op {name}...',
  trickWonBy: 'Slag voor {name}',
  roundNumber: 'Ronde {number}',

  // Scoring
  roundOver: 'Ronde afgelopen',
  bonakenSucceeded: 'Bonaken geslaagd!',
  bonakenFailed: 'Bonaken mislukt!',
  points: 'punten',
  tricks: 'slagen',

  // Game End
  gameOver: 'Spel afgelopen',
  loser: '{name} heeft verloren!',
  rematch: 'Nog een potje?',
  backToStart: 'Terug naar start',

  // Connection
  connectionLost: 'Verbinding verloren',
  reconnecting: 'Opnieuw verbinden...',
  playerDisconnected: '{name} is losgekoppeld',
  waitingForReconnect: 'Wachten op {name}...',

  // Errors
  invalidCode: 'Ongeldige spelcode',
  nameTaken: 'Deze naam is al in gebruik',
  gameFull: 'Dit spel is vol',
  gameNotFound: 'Spel niet gevonden',
};
```
