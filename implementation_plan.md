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

## Fase 2: Lobby System [VOLTOOID]

**Doel:** Spel aanmaken en joinen met 6-karakter codes

### Server
- [x] `src/utils/codeGenerator.ts` - Genereer 6-char alfanumerieke codes
- [x] `src/types/game.ts` - GameState, Player types (in shared/src/index.ts)
- [x] `src/game/GameManager.ts` - In-memory game storage (Map)
- [x] `src/socket/lobbyHandlers.ts`:
  - [x] `create-game` event handler
  - [x] `join-game` event handler
  - [x] `update-settings` event handler
  - [x] `start-game` event handler
  - [x] Duplicaat naam validatie
  - [x] Game not found error handling

### Client
- [x] `src/hooks/useSocket.ts` - Socket.io React hook
- [x] `src/contexts/GameContext.tsx` - Game state context
- [x] `src/components/StartScreen.tsx`:
  - [x] "Nieuw spel starten" knop
  - [x] "Deelnemen aan spel" knop
  - [x] Moderne UI met frontend-design skill
- [x] Nickname input in StartScreen (integrated):
  - [x] Bijnaam invoerveld
  - [x] localStorage persistentie
  - [x] Validatie (2-15 karakters)
- [x] `src/components/CreateGameModal.tsx`:
  - [x] Min/max spelers sliders (2-7)
  - [x] Aanmaken bevestiging
- [x] `src/components/JoinGameModal.tsx`:
  - [x] Code invoerveld (6 karakters)
  - [x] Error feedback bij ongeldige code
- [x] `src/components/Lobby.tsx`:
  - [x] Spelcode prominent weergeven
  - [x] Spelerslijst met online status
  - [x] "Wachten op spelers..." bericht
  - [x] Host: "Start Spel" knop (disabled tot min spelers)
  - [x] Speler aantal indicator

### Test Criteria
- [x] Tab 1: Nieuw spel maken → ontvang 6-char code
- [x] Tab 2: Code invoeren → join lobby
- [x] Beide tabs tonen beide spelers
- [x] Duplicaat naam wordt geweigerd met foutmelding
- [x] Ongeldige code toont foutmelding
- [x] Host kan settings aanpassen
- [x] Start knop werkt alleen met 2+ spelers

---

## Fase 3: Kaart Systeem [VOLTOOID]

**Doel:** 32-kaarten deck, delen, en kaart weergave

### Server
- [x] `src/game/deck.ts`:
  - [x] `createDeck()` - 32 kaarten (7,8,9,10,B,V,K,A × 4 kleuren)
  - [x] `shuffleDeck()` - Fisher-Yates shuffle
- [x] `src/game/dealing.ts`:
  - [x] `dealCards()` - Verdeel kaarten over spelers
  - [x] Bereken slapende kaarten per speler aantal
  - [x] Socket event: `cards-dealt`

### Shared
- [x] `utils/cardUtils.ts`:
  - [x] `sortHand()` - Sorteer op kleur, dan rang
  - [x] Normale rankvolgorde: A,K,V,B,10,9,8,7
  - [x] Troef rankvolgorde: B,9,A,10,K,V,8,7
  - [x] Kleurvolgorde: schoppen, harten, klaveren, ruiten

### Client
- [x] `src/components/Card.tsx`:
  - [x] Kaart weergave (later SVG)
  - [x] Kleur styling (rood/zwart)
  - [x] Rank en suit symbolen
  - [x] Playable/disabled states
  - [x] Hover en click effects
- [x] `src/components/Hand.tsx`:
  - [x] Horizontale waaier layout
  - [x] Overlappende kaarten
  - [x] Responsive spacing
  - [x] Speelbare kaarten highlighted
- [x] `src/components/GameScreen.tsx`:
  - [x] Game header met spelcode en fase
  - [x] Spelerslijst sidebar
  - [x] Fase-specifieke content
  - [x] Hand weergave onderaan

### Test Criteria
- [x] Na "Start Spel" worden kaarten gedeeld
- [x] 2 spelers: 16 kaarten elk, 0 slapend
- [x] 3 spelers: 10 kaarten elk, 2 slapend (logica geïmplementeerd)
- [x] 4 spelers: 8 kaarten elk, 0 slapend (logica geïmplementeerd)
- [x] 5 spelers: 6 kaarten elk, 2 slapend (logica geïmplementeerd)
- [x] 6 spelers: 5 kaarten elk, 2 slapend (logica geïmplementeerd)
- [x] 7 spelers: 4 kaarten elk, 4 slapend (logica geïmplementeerd)
- [x] Kaarten zijn gesorteerd weergegeven
- [x] Kaart componenten renderen correct

---

## Fase 4: Bonaken Fase [VOLTOOID]

**Doel:** Simultane geheime keuze "Bonaken" of "Passen"

### Server
- [x] `src/game/bonaken.ts`:
  - [x] `BonakChoice` interface
  - [x] `determineBonaker()` - Bij meerdere: eerste in wijzerzin vanaf deler
  - [x] Tracking van wie al gekozen heeft
- [x] `src/socket/bonakenHandlers.ts`:
  - [x] `bonaken-choice` event (bonaken/passen)
  - [x] `bonaken-phase-start` emit
  - [x] `player-chose` emit (zonder keuze te onthullen)
  - [x] `bonaken-revealed` emit wanneer allen gekozen
  - [x] `bonaker-determined` emit met winnende bonaker

### Client
- [x] `src/components/BonakenPhase.tsx`:
  - [x] Twee grote knoppen: "Bonaken" en "Passen"
  - [x] Na keuze: "Wachten op andere spelers..."
  - [x] Progress indicator (X van Y heeft gekozen)
  - [x] Onthulling animatie
  - [x] Resultaat: wie bonaakt of "Niemand bonaakt"
- [x] Game state update voor bonaken fase

### Test Criteria
- [x] Na delen start bonaken fase automatisch
- [x] Elke speler ziet "Bonaken" en "Passen" knoppen
- [x] Na kiezen verschijnt wacht indicator
- [x] Keuzes worden pas onthuld als iedereen gekozen heeft
- [x] Bij één bonaker: die wint
- [x] Bij meerdere bonakers: eerste in wijzerzin vanaf deler wint
- [x] Bij niemand bonaakt: correct bericht getoond

---

## Fase 5: Troef Selectie [VOLTOOID]

**Doel:** Bonaker of deler kiest troefkleur

### Server
- [x] `src/socket/trumpHandlers.ts`:
  - [x] `getTrumpSelector()` - Return bonaker of deler ID
  - [x] `select-trump` event handler
  - [x] `trump-selected` emit naar alle spelers
  - [x] Validatie: alleen selector mag kiezen
  - [x] Automatische transitie naar speelfase
  - [x] Slapende kaarten naar bonaker

### Client
- [x] `src/components/TrumpSelection.tsx`:
  - [x] Vier kleur iconen (harten, ruiten, klaveren, schoppen)
  - [x] Alleen klikbaar voor selector
  - [x] Wacht staat voor niet-selectors ("Host kiest de troef...")
  - [x] Celebration animatie bij selectie
- [x] `src/components/TrumpSelection.module.css`:
  - [x] Luxe casino esthetiek met glow effects
  - [x] Rood/zwart kleuren voor suits
  - [x] Animaties: slideUp, suitReveal, crownPulse, radiateOut
- [ ] `src/components/TrumpIndicator.tsx`: (TODO in Fase 6)
  - [ ] Altijd zichtbare troef indicator
  - [ ] Duidelijk icoon + kleur

### Test Criteria
- [x] Na bonaken fase start troef selectie
- [x] Als iemand bonaakt: bonaker selecteert
- [x] Als niemand bonaakt: deler selecteert
- [x] Niet-selectors kunnen niet klikken
- [x] Na selectie ziet iedereen de troef
- [ ] Troef indicator blijft zichtbaar tijdens spel (TODO in Fase 6)

---

## Fase 6: Slag Spelen [VOLTOOID]

**Doel:** Kaarten spelen met correcte regelhandhaving

### Server
- [x] `src/game/cardValidation.ts`:
  - [x] `getValidCards()` - Kleur bekennen verplicht
  - [x] Als geen kaart van gevraagde kleur: alle kaarten geldig
  - [x] Eerste speler: alle kaarten geldig
- [x] `src/game/trickWinner.ts`:
  - [x] Troef rankvolgorde: B(8),9(7),A(6),10(5),K(4),V(3),8(2),7(1)
  - [x] Normale rankvolgorde: A(8),K(7),V(6),B(5),10(4),9(3),8(2),7(1)
  - [x] `determineTrickWinner()` logica
  - [x] Troef beats non-troef
  - [x] Hoogste in gevraagde kleur wint (als geen troef)
- [x] `src/game/turnManager.ts`:
  - [x] `getNextPlayer()` - Volgende in wijzerzin
  - [x] `getFirstPlayer()` - Links van deler
  - [x] `getMajorityThreshold()` - Meerderheid berekening
- [ ] `src/game/timer.ts`: (TODO later)
  - [ ] `TurnTimer` class
  - [ ] 60 seconden per beurt
  - [ ] Bij timeout: speel willekeurige geldige kaart
- [x] `src/socket/gameplayHandlers.ts`:
  - [x] `play-card` event handler
  - [x] Kaart validatie
  - [x] `turn-start` emit met geldige kaarten
  - [x] `card-played` emit
  - [x] `trick-complete` emit na alle kaarten (met tricksWon)
  - [x] `trick-cleared` emit na 2.5 sec delay
  - [x] `round-scores` emit na alle slagen

### Client
- [x] `src/components/PlayingPhase.tsx`:
  - [x] Centrale groene speeltafel layout
  - [x] Troef indicator met glow animatie
  - [x] Beurt indicator ("Jouw beurt" / "X is aan zet")
  - [x] SLAGEN scorebord met bonaker badge
- [x] `src/components/PlayingPhase.module.css`:
  - [x] Luxury casino aesthetic
  - [x] Circulaire slag weergave
  - [x] Kaart drop animaties
  - [x] Winnaar highlight
- [ ] `src/components/TurnTimer.tsx`: (TODO later)
  - [ ] Countdown van 60 sec
  - [ ] Visuele urgentie (kleur change)
  - [ ] Timer pauze bij disconnect
- [x] Hand component update:
  - [x] Alleen geldige kaarten klikbaar
  - [x] Ongeldige kaarten niet klikbaar
  - [x] Beurt indicator via validCardIds

### Test Criteria
- [x] Speler links van deler begint eerste slag
- [x] Alleen geldige kaarten zijn klikbaar
- [x] Kleur bekennen wordt afgedwongen
- [x] Gespeelde kaart verschijnt in midden
- [x] Alle spelers zien gespeelde kaarten
- [x] Na volledige slag: winnaar bepaald
- [x] Slag blijft 2.5 seconden zichtbaar
- [x] Winnaar van slag begint volgende
- [x] Troef B is hoogste troef
- [x] Troef beats hogere non-troef
- [x] Score (tricksWon) wordt real-time bijgewerkt
- [ ] Timer countdown werkt (TODO later)
- [ ] Timeout speelt willekeurige geldige kaart (TODO later)

---

## Fase 7: Puntentelling [VOLTOOID]

**Doel:** Scoring per ronde, 10 punten = verloren

### Server
- [x] Scoring logica in `gameplayHandlers.ts`:
  - [x] `handleRoundComplete()`:
    - [x] Bonaken geslaagd (meerderheid slagen): +1 voor alle anderen
    - [x] Bonaken mislukt: +3 voor bonaker
    - [x] Geen bonaker: +1 voor speler(s) met minste slagen
  - [x] `handleGameEnd()` - Speler met 10+ punten
  - [x] Meerderheid berekening via `getMajorityThreshold()`
- [x] Socket events:
  - [x] `round-scores` emit met punten deze ronde
  - [x] `game-scores` emit met totale stand

### Client
- [x] `src/components/RoundEnd.tsx`:
  - [x] Overzicht slagen per speler
  - [x] Bonaken resultaat (geslaagd/mislukt)
  - [x] Punten toegekend deze ronde
  - [x] Bijgewerkte totaalscores
  - [x] Auto-countdown naar volgende ronde (5 sec)
  - [x] Danger highlighting voor spelers dichtbij 10
- [x] `src/components/RoundEnd.module.css`:
  - [x] Theatrical reveal animaties
  - [x] Casino-stijl aesthetiek
  - [x] Responsive design
- [ ] `src/components/ScoreBoard.tsx`: (TODO later)
  - [ ] Altijd zichtbaar tijdens spel
  - [ ] Speler namen met scores
  - [ ] Highlight speler dichtbij 10

### Test Criteria
- [x] Na alle slagen: ronde einde scherm
- [x] Bonaken geslaagd = meerderheid slagen
- [x] Bonaken geslaagd: anderen krijgen +1 (logica geïmplementeerd)
- [x] Bonaken mislukt: bonaker krijgt +3 (logica geïmplementeerd)
- [x] Geen bonaker: minste slagen krijgt +1
- [x] Bij gelijke minste slagen: allen +1 (logica geïmplementeerd)
- [x] Scores worden opgeteld over rondes
- [x] Deler roteert naar volgende speler
- [x] Nieuwe ronde start automatisch na countdown

---

## Fase 8: Spel Einde & Rematch [VOLTOOID]

**Doel:** 10+ punten = verloren, rematch mogelijkheid

### Server
- [x] `src/game/rematch.ts`:
  - [x] `resetForRematch()` - Reset scores, behoud spelers (in gameplayHandlers.ts)
  - [x] Deler roteert door
- [x] Socket events:
  - [x] `game-ended` emit met verliezer en finale scores
  - [x] `request-rematch` event
  - [x] `rematch-requested` emit
  - [x] `rematch-started` emit

### Client
- [x] `src/components/GameEnd.tsx`:
  - [x] Finale scorebord (gerangschikt)
  - [x] Verliezer highlight (10+ punten)
  - [x] "Nog een potje?" knop
  - [x] "Terug naar start" knop
- [x] Rematch flow:
  - [x] Toon wie rematch wil
  - [x] Start nieuwe ronde als allen akkoord

### Test Criteria
- [x] Spel eindigt wanneer iemand 10+ punten bereikt
- [x] Eindscherm toont correcte finale scores
- [x] Verliezer is duidelijk gemarkeerd
- [x] "Nog een potje?" start nieuw spel
- [x] Scores zijn gereset bij rematch
- [x] Deler roteert bij rematch
- [x] "Terug naar start" werkt

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

## Fase 10: Visuele Polish [VOLTOOID]

**Doel:** Klassieke Nederlandse kaartspel esthetiek met SVG kaarten

### Styling
- [x] `src/index.css`:
  - [x] Kleurenpalet (bruin, goud, groen, cream) in CSS variables
  - [x] Typography (serif fonts)
  - [x] Shadows en depth
  - [x] Card-specifieke animaties (cardDeal, cardPlay, cardFlip, trickCollect, etc.)
- [x] Animaties in `src/index.css`:
  - [x] Kaart deal animatie (cardDeal)
  - [x] Kaart speel animatie (cardPlay)
  - [x] Slag verzamel animatie (trickCollect)
  - [x] Glow en bounce transitions

### SVG Kaarten
- [x] `src/components/CardFace.tsx`:
  - [x] SVG rendering per kaart
  - [x] Suit symbolen (harten, ruiten, klaveren, schoppen)
  - [x] Rank displays met pip layouts
  - [x] Court cards (B, V, K) styling
- [x] Alle 32 kaart designs via dynamische pip layouts
- [x] `src/components/CardFace.module.css` met styling

### Tafel Layout
- [x] `src/components/Table.tsx`:
  - [x] Houten textuur achtergrond (mahonie frame)
  - [x] Groen vilt center met textuur
  - [x] Gouden trim accenten (inlay en shimmer)
  - [x] Messing hoek-fixtures
  - [x] Decoratieve kaartsuit symbolen in hoeken
- [x] `src/components/Table.module.css`:
  - [x] Uitgebreide CSS met variabelen
  - [x] Responsive design voor desktop en mobiel
- [x] PlayingPhase integratie met Table component

### Geluidseffecten
- [x] `src/utils/sounds.ts`:
  - [x] Sound manager class met Web Audio API synthesis
  - [x] Volume controle
  - [x] Mute optie met localStorage persistentie
- [x] Synthesized geluidseffecten (geen externe bestanden):
  - [x] Kaart shuffle
  - [x] Kaart spelen
  - [x] Kaart delen
  - [x] Slag winnen
  - [x] Beurt notificatie
  - [x] Game start/einde
  - [x] Bonaken sound
  - [x] Button click

### Test Criteria
- [x] Houten tafel textuur zichtbaar (mahonie frame met wood grain)
- [x] Kaarten renderen scherp met pip layouts
- [x] Animaties zijn soepel
- [x] Geluidseffecten geïmplementeerd (Web Audio synthesis)
- [x] Responsive op desktop
- [x] Touch interacties werken

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
