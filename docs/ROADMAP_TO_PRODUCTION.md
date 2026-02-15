# Bonaken - Roadmap to Production

*Production Readiness Analysis*
*Date: 15 februari 2026*

---

## Executive Summary

De Bonaken app is een **technisch indrukwekkende implementatie** van het Nederlandse kaartspel met complexe spelregels (Leimuiden variant). De core game logic is robuust en goed gestructureerd, maar er zijn **kritieke gaps** die een publieke release nog niet geschikt maken voor algemene gebruikers.

### Korte Samenvatting
- ✅ **Sterk**: Game logic, architectuur, visuele polish, deployment
- ⚠️ **Matig**: Error handling, edge cases, reconnectie-logica
- ❌ **Zwak**: Geen tests, onboarding, accessibility, mobile UX

### Aanbeveling
**Niet gereed voor publieke beta**. Minimaal 2-3 weken extra werk nodig voor stabiele vrienden-release, 4-6 weken voor publieke beta.

---

## 1. Current State Analysis

### 1.1 Complete Features ✅

| Feature | Status | Kwaliteit |
|---------|--------|-----------|
| **Core Game Logic** | ✅ Volledig | Uitstekend - Complexe Leimuiden regels correct geïmplementeerd |
| **WebSocket Real-time** | ✅ Volledig | Goed - Socket.io met type-safety |
| **Bied Systeem** | ✅ Volledig | Uitstekend - Inclusief Misère, Zwabber, Bonaak |
| **Kaart Validatie** | ✅ Volledig | Uitstekend - Kleur bekennen, troef regels, boer verzaken |
| **Roem Detectie** | ✅ Volledig | Goed - Alle Leimuiden combinaties |
| **Scoring System** | ✅ Volledig | Uitstekend - Status progressie (suf → eruit) |
| **Visuele Design** | ✅ Volledig | Uitstekend - SVG kaarten, casino thema |
| **Geluidseffecten** | ✅ Volledig | Goed - Web Audio synthesis |
| **Deployment** | ✅ Volledig | Goed - Docker + VPS + Android APK |
| **Turn Timer** | ✅ Volledig | Goed - Auto-play bij timeout |
| **Rematch** | ✅ Volledig | Goed - Stemmingssysteem |
| **Chat** | ✅ Volledig | Basis - Systeem + speler berichten |

### 1.2 Missing Features ❌

| Feature | Impact | Prioriteit |
|---------|--------|------------|
| **Spelregels Uitleg** | Hoog - Geen context voor nieuwe spelers | P0 |
| **Onboarding/Tutorial** | Hoog - Spel direct starten zonder uitleg | P0 |
| **Spel Geschiedenis** | Medium - Geen slag-ronde terugkijk | P1 |
| **Statistieken** | Low - Geen persoonlijke stats | P2 |
| **Spectator Mode** | Low - Geen kijkers mogelijk | P2 |
| **Troefboer Verzaken UI** | Medium - Regel aanwezig, geen expliciete UI | P1 |
| **Vals Roemen Penalty** | Medium - Niet geïmplementeerd | P1 |
| **Misère "Vuil Opkomen"** | Low - Niet geïmplementeerd | P2 |

### 1.3 Code Quality Assessment

**Backend (`server/src/` - ~2,800 lines)**

| Aspect | Score | Opmerkingen |
|--------|-------|-------------|
| Architecture | ⭐⭐⭐⭐⭐ | Duidelijke module scheiding (game/, socket/) |
| Type Safety | ⭐⭐⭐⭐⭐ | Volledige TypeScript coverage, shared types |
| Game Logic | ⭐⭐⭐⭐⭐ | Robuust, edge cases goed afgedekt |
| Error Handling | ⭐⭐⭐ | Basis try-catch, geen structured error responses |
| Input Validation | ⭐⭐⭐ | Server-side validatie aanwezig maar basic |
| Documentation | ⭐⭐⭐ | Code comments in Nederlands, geen JSDoc |

**Frontend (`client/src/` - ~3,700 lines)**

| Aspect | Score | Opmerkingen |
|--------|-------|-------------|
| Component Structuur | ⭐⭐⭐⭐ | 18 componenten, duidelijke verantwoordelijkheden |
| State Management | ⭐⭐⭐⭐ | React Context + useSocket hook, geen Redux nodig |
| Type Safety | ⭐⭐⭐⭐ | Goede typing, enkele `any` in event handlers |
| CSS/Modules | ⭐⭐⭐⭐⭐ | CSS Modules, goede scoping, casino thema |
| Error Boundaries | ⭐ | Geen React error boundaries |
| Responsive | ⭐⭐⭐ | Mobiel werkt maar niet geoptimaliseerd |

### 1.4 Architecture Review

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER / APK                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ StartScreen │  │ GameContext  │  │ Socket.io Client │   │
│  │  (React)    │  │  (State)     │  │   (WebSocket)    │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS + WebSocket
┌─────────────────────────────────────────────────────────────┐
│                         VPS (Docker)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                        Nginx                           │ │
│  │         (SSL + Static Files + WS Proxy)                │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                              │
│  ┌───────────────────────────┼────────────────────────────┐ │
│  │                    Node.js Container                   │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │ │
│  │  │   Express   │  │  Socket.io   │  │  GameManager  │  │ │
│  │  │   (HTTP)    │  │  (WebSocket) │  │  (Singleton)  │  │ │
│  │  └─────────────┘  └──────────────┘  └───────────────┘  │ │
│  │                                                        │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐ │ │
│  │  │  Bidding │ │  Trump   │ │ Gameplay │ │  Scoring  │ │ │
│  │  │ Handlers │ │ Handlers │ │ Handlers │ │  Module   │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Sterke punten architectuur:**
- Monorepo met shared types tussen client/server
- Event-driven via Socket.io met volledige type safety
- GameManager singleton voor centrale state
- Geen database nodig (in-memory, ephemeral games)
- Docker containerization voor eenvoudige deployment

**Zwakke punten:**
- Geen horizontal scaling mogelijk (singleton GameManager)
- Geen message queue voor event buffering
- Geen persistentie bij server crash

---

## 2. Critical Gaps for Public Release

### 2.1 Security Concerns 🚨

| Issue | Severity | Beschrijving |
|-------|----------|--------------|
| **No Rate Limiting** | 🔴 Hoog | Geen bescherming tegen spam/DoS op Socket.io events |
| **No Input Sanitization** | 🟡 Medium | Nicknames en chat berichten worden niet geëscaped |
| **No Authentication** | 🟢 Low | Acceptabel voor vrienden-spel, geen accounts |
| **CORS Config** | 🟡 Medium | Strikte CORS in production, maar geen origin validatie op events |
| **Game Code Brute Force** | 🟡 Medium | 8-karakter UUID, theoretisch brute-forcebaar |

**Aanbeveling:**
```typescript
// Rate limiting nodig op critical events
// Voorbeeld: max 10 berichten/minuut per speler
// Nickname sanitization: strip HTML, max 15 chars
```

### 2.2 Scalability Issues

| Issue | Impact | Oplossing |
|-------|--------|-----------|
| **In-Memory Only** | Server restart = alle games verloren | Acceptabel voor scope, documenteren |
| **Single Process** | Max ~1000 concurrent connections | Verticale scaling voldoende voor doelgroep |
| **No Load Balancing** | Geen multi-server setup | Niet nodig voor 10-50 spelers |
| **Game Cleanup** | ✅ Goed | 5-min inactivity cleanup werkt |

**Verdict:** Voor de beoogde doelgroep (10-50 spelers) is de huidige architectuur **voldoende**.

### 2.3 Error Handling Gaps

| Locatie | Probleem | Impact |
|---------|----------|--------|
| **Client - GameContext** | Geen try-catch rond socket emits | Crashes bij netwerk fouten |
| **Client - Components** | Geen Error Boundaries | Wit scherm bij render errors |
| **Server - Handlers** | Geen global error handler | Server crash bij onverwachte input |
| **Server - GameManager** | Geen state recovery | Corrupte game state mogelijk |
| **Reconnect Logic** | Onvolledig geïmplementeerd | Spelers verliezen progressie |

**Specifieke foutscenario's:**
1. ❌ Socket emit tijdens disconnectie → geen feedback
2. ❌ Server restart tijdens spel → spel verloren
3. ❌ Client render error → wit scherm
4. ❌ Game state corruptie → onduidelijke foutmelding

### 2.4 Missing Features for General Users

| Feature | Waarom Nodig | Huidige Status |
|---------|--------------|----------------|
| **Spelregels Uitleg** | Niemand kent Leimuiden regels | ❌ Alleen `.md` files, geen in-app uitleg |
| **Foutmeldingen in Context** | "Spel niet gevonden" is te vaag | ❌ Generieke errors |
| **Spel Terugkijken** | Disputes over slagen/scores | ❌ Geen geschiedenis |
| **Host Kick Functionaliteit** | Speler die AFK blijft | ❌ Kan alleen wachten op timeout |
| **Spel Pausie** | Telefoon bel onderbreekt | ⚠️ Disconnect werkt, maar geen expliciete pauze |

---

## 3. User Experience Improvements Needed

### 3.1 Onboarding Flow

**Huidige Flow:**
```
Open App → Nickname invoeren → Start Scherm (geen uitleg)
    ↓
Create/Join Game → Direct in Lobby → Host start → DIRECT SPEL
    ↓
Kaarten worden gedeeld → Bied fase (geen uitleg wat te doen)
```

**Problemen:**
1. ❌ Geen uitleg wat Bonaken is
2. ❌ Geen uitleg bied fase (wat is Misère? Zwabber?)
3. ❌ Geen uitleg troef selectie
4. ❌ Geen uitleg doel van het spel
5. ❌ Geen "Hoe speel ik" beschikbaar tijdens spel

**Verbetervoorstel (P0):**
```
Eerste keer openen → Welkom scherm → "Hoe werkt het?" knop
    ↓
Start Scherm met "?" help knop → Popup met spelregels
    ↓
In Lobby → "Spelregels" knop beschikbaar
    ↓
Eerste bied fase → Tooltips: "Dit is bieden..."
    ↓
Tijdens spel → "?" knop met actuele fase uitleg
```

### 3.2 UI/UX Enhancements

| Element | Huidig | Verbetering | Prioriteit |
|---------|--------|-------------|------------|
| **Troef Indicator** | Klein label boven tafel | Groot, geanimeerd icoon met kleur | P1 |
| **Beurt Indicator** | "Jouw beurt" tekst | Pulsing ring om actieve speler + geluid | P1 |
| **Laatste Slag** | Geen zichtbaar | "Vorige slag" knop om te reviewen | P1 |
| **Scorebord** | Alleen tijdens round-end | Altijd zichtbaar, compact | P1 |
| **Chat** | Basis popup | Betere notificaties, ongelezen badge | P2 |
| **Animaties** | Goed | Meer feedback bij winst/verlies | P2 |

### 3.3 Mobile Responsiveness

| Aspect | Huidig | Probleem | Prioriteit |
|--------|--------|----------|------------|
| **Kaarten waaier** | Horizontaal scroll | Op kleine schermen slecht zichtbaar | P1 |
| **Tafel layout** | Fixed sizes | Overlappende elementen op telefoon | P1 |
| **Touch targets** | ~40px | Soms te klein voor vette vingers | P1 |
| **Keyboard** | Geen handling | Input velden verschuiven layout niet | P2 |
| **Landscape** | Werkt | Maar niet geoptimaliseerd | P2 |
| **Viewport** | Geen viewport lock | Rotatie breekt layout | P2 |

**Specifieke mobiele issues:**
- ❌ iPhone notch overlap
- ❌ Android back button gedrag inconsistent
- ❌ Keyboard popup verschuift kaarten buiten beeld
- ❌ Status bar niet gestyled

### 3.4 Accessibility

| Criterium | Huidig | WCAG 2.1 AA |
|-----------|--------|-------------|
| **Screen Reader** | ❌ Geen ARIA labels | ❌ Niet compliant |
| **Keyboard Nav** | ❌ Alleen mouse/touch | ❌ Niet compliant |
| **Color Contrast** | ⚠️ Rood op groen (kaarten) | 🟡 Gedeeltelijk |
| **Font Size** | ⚠️ Fixed px sizes | 🟡 Niet schaalbaar |
| **Focus Indicators** | ❌ Geen | ❌ Niet compliant |
| **Reduced Motion** | ❌ Geen respect voor prefers-reduced-motion | ❌ Niet compliant |

**Impact:** Gebruikers met visuele beperkingen kunnen het spel **niet spelen**.

---

## 4. Technical Debt & Refactoring

### 4.1 Areas Needing Cleanup

| File/Module | Issue | Ernst |
|-------------|-------|-------|
| `GameContext.tsx` | 400+ regels, te veel verantwoordelijkheden | Medium |
| `lobbyHandlers.ts` | Disconnect logic verspreid | Medium |
| `gameplayHandlers.ts` | Trick/round/game logica in één file | Medium |
| CSS Modules | Enkele duplicaties in animations | Low |
| Socket events | Geen event versioning | Medium |

**Refactor voorstellen:**
```typescript
// 1. Split GameContext in kleinere contexts
//    - ConnectionContext
//    - GameStateContext  
//    - PlayerContext
//    - ChatContext

// 2. Extract disconnect handling naar aparte service
//    - ConnectionManager class

// 3. Event versioning voor backwards compatibility
//    - socket.io room versioning
```

### 4.2 Testing Coverage Gaps

**Huidige status:** ❌ **Geen enkele test**

| Type | Aantal | Doel |
|------|--------|------|
| Unit tests | 0 | Game logic modules |
| Integration tests | 0 | Socket event flows |
| E2E tests | 0 | Complete game flows |
| Visual tests | 0 | UI regressies |

**Test scripts** (in `test_scripts/`) zijn handige debugging tools maar:
- Geen assertions
- Geen automatische uitvoering
- Geen coverage rapportage

**Vereiste tests (P0):**
```typescript
// Critical paths die getest moeten worden:
1. Complete game flow (2, 3, 4, 5 spelers)
2. Bied logica (normaal, Misère, Zwabber, Bonaak)
3. Kaart validatie (alle follow-suit scenario's)
4. Scoring (alle status overgangen)
5. Reconnect logic (mid-game, tussen rondes)
6. Timer expiry (auto-play validatie)
7. Edge cases (gelijke scores, allemaal passen)
```

### 4.3 Documentation Needs

| Document | Bestaat | Volledig | Actueel |
|----------|---------|----------|---------|
| `README.md` | ❌ Nee | - | - |
| `API.md` | ❌ Nee | - | - |
| `ARCHITECTURE.md` | ❌ Nee | - | - |
| `CONTRIBUTING.md` | ❌ Nee | - | - |
| `CHANGELOG.md` | ❌ Nee | - | - |
| Code comments | ✅ Ja | ⚠️ Gedeeltelijk | ✅ Ja |
| `CLAUDE.md` | ✅ Ja | ✅ Ja | ✅ Ja |
| `spec.md` | ✅ Ja | ⚠️ Verouderd | ❌ Nee |
| `DEPLOYMENT.md` | ✅ Ja | ✅ Ja | ✅ Ja |

**Snel win:**
- Maak `README.md` met snelle start, architectuur overzicht, screenshot
- Update `spec.md` of markeer als verouderd
- Voeg JSDoc toe aan publieke functies

---

## 5. Prioritized Roadmap

### P0: Must-Have for Public Beta (2-3 weken)

| Item | Estimated | Omschrijving |
|------|-----------|--------------|
| **README + Documentatie** | 0.5 dag | Basis setup instructies |
| **Spelregels in App** | 2 dagen | Modal/popup met spelregels uitleg |
| **Reconnect Logic Fix** | 2 dagen | Volledige reconnect implementatie |
| **Error Boundaries** | 1 dag | React error boundaries + fallback UI |
| **Rate Limiting** | 1 dag | Socket.io rate limiting middleware |
| **Input Sanitization** | 0.5 dag | Nickname + chat sanitization |
| **Mobiele Layout Fix** | 2 dagen | Kaarten waaier, viewport fixes |
| **Core Tests** | 3 dagen | Unit tests voor game logic |
| **Bug Fixes** | 2 dagen | Op basis van huidige bug reports |
| **Subtotal** | **14 dagen** | ~3 weken |

### P1: Should-Have for Full Release (+2-3 weken)

| Item | Estimated | Omschrijving |
|------|-----------|--------------|
| **Test Suite Compleet** | 3 dagen | 80%+ coverage |
| **Accessibility** | 3 dagen | ARIA labels, keyboard nav, contrast |
| **UI Polish** | 2 dagen | Troef indicator, scorebord, animaties |
| **Spel Geschiedenis** | 2 dagen | Laatste slag review, ronde terugkijk |
| **Host Kick** | 1 dag | AFK speler verwijderen |
| **Performance Opt** | 1 dag | Memoization, lazy loading |
| **Analytics** | 1 dag | Basis usage tracking |
| **Subtotal** | **13 dagen** | ~2.5 weken |

### P2: Nice-to-Have (+onbepaald)

| Item | Estimated | Omschrijving |
|------|-----------|--------------|
| **Spectator Mode** | 2 dagen | Kijkers toestaan |
| **Statistieken** | 2 dagen | Persoonlijke stats, leaderboards |
| **Troefboer Verzaken UI** | 1 dag | Expliciete "verzaken" knop |
| **Vals Roemen** | 1 dag | Penalty implementatie |
| **Offline Mode** | 5 dagen | LAN multiplayer |
| **AI Bots** | 5 dagen | Spelen tegen computer |
| **Themes** | 2 dagen | Verschillende kaart/tafel themes |
| **Push Notificaties** | 2 dagen | "Je bent aan de beurt" |

---

## 6. Specific Recommendations

### 6.1 What to Fix Before Friends Stop Finding Bugs

**Direct actie vereist (deze week):**

1. **🐛 Reconnect Logic**
   ```typescript
   // Probleem: reconnect-to-game handler bestaat maar is onvolledig
   // In lobbyHandlers.ts lijn 183: "Kan niet opnieuw verbinden"
   
   // Fix nodig:
   // - Volledige state reconstructie
   // - Hand cards herstellen
   // - Current trick herstellen
   // - Timer state herstellen
   ```

2. **🐛 Disconnect Timeout**
   ```typescript
   // Probleem: 60s timeout is te kort voor mobiele netwerk switches
   // Verlengen naar 120s en betere UI feedback
   ```

3. **🐛 Error Handling**
   ```typescript
   // Probleem: Wit scherm bij onverwachte errors
   // Fix: Error Boundary toevoegen in App.tsx
   ```

4. **🐛 Game State Corruptie**
   ```typescript
   // Probleem: Soms "hangt" een spel in bidding fase
   // Fix: Timeout op bidding fase, auto-pass na 2x timer expiry
   ```

### 6.2 What to Add for Public Beta

**Must-haves:**

1. **📖 Spelregels Modal**
   ```typescript
   // Component: GameRulesModal.tsx
   // Content: Verkorte Leimuiden regels (1 A4)
   // Trigger: "?" knop in StartScreen, Lobby, en GameScreen
   ```

2. **📱 Mobile Optimalisatie**
   ```css
   /* Prioriteiten:
    * - Kaarten waaier: verticale stack op smalle schermen
    * - Tafel: compactere layout
    * - Touch: min 44px targets
    */
   ```

3. **🧪 Test Suite**
   ```typescript
   // Minimum: 
   // - 5 unit tests voor cardValidation.ts
   // - 3 integration tests voor game flow
   // - 1 E2E test voor complete game
   ```

4. **🔒 Security Basics**
   ```typescript
   // Rate limiting:
   // - max 10 events/sec per socket
   // - max 50 chat berichten/minuut
   
   // Input sanitization:
   // - DOMPurify op chat
   // - Max 15 chars nickname
   ```

### 6.3 What to Add for Full Release

**Polish items:**

1. **🎨 Visuele Feedback**
   - Pulsing ring om actieve speler
   - Grotere troef indicator
   - Scorebord altijd zichtbaar

2. **♿ Accessibility**
   - ARIA labels op alle interactieve elementen
   - Keyboard navigatie
   - Screen reader support

3. **📊 Analytics**
   - Games gestart/voltooid
   - Gemiddelde speelduur
   - Drop-off points

4. **🌍 Internationalisatie Prep**
   - Extract alle strings naar NL.ts
   - Structuur voor toekomstige talen

---

## Appendix A: Code Metrics

| Metric | Waarde |
|--------|--------|
| **Backend Lines** | ~2,800 |
| **Frontend Lines** | ~3,700 |
| **Shared Lines** | ~200 |
| **Total** | ~6,700 |
| **Components** | 18 React components |
| **Socket Events** | 32 server → client, 11 client → server |
| **Test Files** | 4 (handmatige scripts, geen automatische tests) |
| **Test Coverage** | 0% |

## Appendix B: Bug Tracker Status

*Op moment van schrijven:*
- API endpoint: https://bonaken-board.frankvdbrink.nl/api/agent/bugs
- Aantal actieve bugs: Onbekend (check API)
- Laatste release: v1.0.1-bugfix

## Appendix C: Deployment Checklist

Voor elke release:

- [ ] Alle tests passen
- [ ] Build succesvol (`npm run build`)
- [ ] Docker image gebouwd
- [ ] APK getest op Android device
- [ ] WebSocket connectie getest
- [ ] Reconnect getest
- [ ] Game flow getest (complete ronde)
- [ ] Mobiele layout gecontroleerd

---

*Eindrapport - Bonaken Production Readiness Analysis*
*Samengesteld door: AI Agent*
*Datum: 15 februari 2026*
