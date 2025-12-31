# Bonaken - Specificatie

Een server-gebaseerde webapplicatie voor het online spelen van het Nederlandse kaartspel Bonaken met meerdere spelers. Volledig in het Nederlands.

---

## 1. Spelregels (Leimuiden-variant)

### 1.1 Basis
- **Kaarten**: 32 kaarten (7, 8, 9, 10, B, V, K, A in alle vier kleuren)
- **Spelers**: 2-7 spelers, configureerbaar per lobby door de host
- **Doel**: Zo min mogelijk punten verzamelen; eerste speler die 10 punten bereikt verliest

### 1.2 Kaartdeling
- Alle 32 kaarten worden verdeeld onder de spelers
- Bij 2 spelers: 16 kaarten per speler, geen slapende kaarten
- Bij andere aantallen: resterende kaarten slapen (verborgen, uit het spel)
- Slapende kaarten blijven **volledig verborgen** - niemand weet welke kaarten ontbreken

### 1.3 Bonaken-fase (voor troef)
1. Na het delen zien spelers hun kaarten maar weten nog niet wat troef is
2. **Simultane keuze**: elke speler kiest geheim "Bonaken" of "Passen"
3. Keuzes worden tegelijk onthuld
4. Bij meerdere bonakers: eerste in wijzerzin vanaf de deler wint
5. Maximaal één bonaker per ronde

### 1.4 Troefkeuze
- **Als iemand bonaakt**: de bonaker kiest troefkleur (via klikken op kleur-icoon)
- **Als niemand bonaakt**: de deler kiest troefkleur

### 1.5 Troefrangorde (Klaverjas-stijl)
Wanneer een kleur troef is, geldt speciale rangorde:
**Boer (hoogst) → 9 → Aas → 10 → Koning → Vrouw → 8 → 7 (laagst)**

Niet-troefkleuren: normale rangorde (A, K, V, B, 10, 9, 8, 7)

### 1.6 Spelverloop slagen
1. Speler links van de deler speelt eerste kaart uit
2. Kleur bekennen is verplicht als mogelijk
3. Hoogste kaart in gevraagde kleur wint, tenzij getroeft wordt
4. Bij troef: hoogste troef wint de slag
5. Winnaar van slag speelt volgende uit

### 1.7 Puntentelling
| Situatie | Punten |
|----------|--------|
| Gefaalde bonaken (niet meerderheid slagen) | +3 punten voor bonaker |
| Geslaagde bonaken | +1 punt voor alle andere spelers |
| Geen bonaker - verliezer (minste slagen) | +1 punt |
| Gelijk aantal slagen (minst) | Alle gelijke spelers +1 punt |

### 1.8 Rondeovergang
- Deler roteert met de klok mee elke ronde
- Match eindigt zodra een speler **10 punten** bereikt (verliezer)

---

## 2. Technische Architectuur

### 2.1 Stack
| Component | Technologie |
|-----------|-------------|
| Backend | Node.js met WebSockets (Socket.io) |
| Frontend | React (responsive) |
| Platform | Webbrowser (mobiel-vriendelijk vanaf start) |
| Hosting | Self-hosted VPS |
| Database | Geen - alleen in-memory state |

### 2.2 Schaalbaarheid
- Doelgroep: 10-50 gelijktijdige spelers
- Simpele architectuur, geen horizontale schaling nodig
- Games worden alleen in geheugen bewaard

### 2.3 Cleanup
- Games zonder activiteit worden na **5 minuten** automatisch verwijderd
- Geen persistentie van spelstatus bij server herstart

---

## 3. Gebruikersbeheer

### 3.1 Identificatie
- **Gastmodus**: geen accounts vereist
- Speler voert bijnaam in bij eerste bezoek
- Bijnaam wordt opgeslagen in browser localStorage
- Duplicaat-namen binnen een spel: geweigerd, speler moet andere naam kiezen

### 3.2 Authenticatie
- Geen inloggen vereist
- Geen profielen, statistieken of vriendensysteem

---

## 4. Matchmaking & Lobby

### 4.1 Spelcodes
- **Alphanumeriek formaat**: 6 karakters (bijv. ABC123)
- Alleen privé codes - geen publieke lobby-lijst
- Geen matchmaking of rangschikking

### 4.2 Lobby
- Host maakt spel aan → ontvangt code
- Andere spelers voeren code in om deel te nemen
- Lobby toont: **alleen spelerslijst** + spelcode + "Wachten op spelers..."
- Host heeft **geen kick-mogelijkheid**
- Host kan starten met **2+ spelers** (slapende kaarten passen zich aan)
- Host stelt in: minimum en maximum aantal spelers

---

## 5. Spelervaring

### 5.1 Timing
- **Beurttimer**: 60 seconden per beurt
- Bij timeout: **willekeurige geldige kaart** wordt gespeeld
- Slag blijft **3-4 seconden** zichtbaar na afloop

### 5.2 Kaartweergave
- Hand: **horizontale waaier** onderaan scherm
- Sortering: automatisch **op kleur, dan rang** (hoogste naar laagste)
- Alleen geldige kaarten zijn klikbaar (ongeldige zetten onmogelijk via UI)

### 5.3 Zichtbare informatie
- **Minimaal**: alleen huidige slag, huidige troef, en scores
- Geen slaggeschiedenis of uitgebreide statistieken

### 5.4 Communicatie
- **Geen in-game chat** - spelers communiceren extern (WhatsApp, etc.)

---

## 6. Disconnectie & Herverbinden

### 6.1 Disconnect-afhandeling
- Spel **pauzeert** wanneer speler disconnecteert
- **Timeout**: 60-120 seconden wachten op herverbinding
- Na timeout: automatisch spelen met willekeurige geldige kaarten

### 6.2 Herverbinden
- Speler kan **op elk moment** tijdens de match herverbinden
- **Volledige staat** wordt hersteld (hand, score, rondestatus)

### 6.3 Vrijwillig verlaten
- **Niet mogelijk** - eenmaal gestart kunnen spelers niet vertrekken
- Enige optie is browser sluiten (behandeld als disconnect)

---

## 7. Visueel Ontwerp

### 7.1 Stijl
- **Klassiek/traditioneel**: houten tafel-textuur, traditionele Nederlandse speelkaarten-esthetiek
- Warme kleuren, gezellige sfeer

### 7.2 Animaties & Geluid
- **Standaard niveau**: basis kaartanimaties (delen, spelen, slag ophalen)
- Subtiele geluidseffecten

### 7.3 Layout
- Desktop: kaarten in waaier onderaan
- Mobiel: responsive aanpassing van dezelfde interface

---

## 8. Gebruikersinterface Flow

### 8.1 Startscherm
- **Twee knoppen**: "Nieuw spel starten" en "Deelnemen aan spel"
- Minimalistisch ontwerp

### 8.2 Nieuw spel
1. Klik "Nieuw spel starten"
2. Stel minimum/maximum spelers in
3. Ontvang spelcode
4. Wacht op spelers in lobby
5. Klik "Start spel" wanneer gereed

### 8.3 Deelnemen
1. Klik "Deelnemen aan spel"
2. Voer 6-karakter code in
3. Voer bijnaam in (indien nieuw/duplicaat)
4. Wacht in lobby tot host start

### 8.4 Spelverloop
1. Kaarten worden gedeeld (met animatie)
2. Bonaken-fase: "Bonaken?" of "Passen?" knoppen (simultaan)
3. Resultaat getoond: wie bonaakt (of niemand)
4. Troefkeuze: vier kleur-iconen voor bonaker/deler
5. Slagen spelen tot ronde eindigt
6. Scores bijgewerkt
7. Herhaal tot iemand 10 punten bereikt

### 8.5 Match-einde
- Eindscores tonen
- **"Nog een potje?"** knop voor rematch met zelfde spelers
- Scores resetten bij rematch
- Terug naar lobby indien geen rematch

---

## 9. Edge Cases

### 9.1 Puntgelijken
- Als meerdere spelers gelijk eindigen met minste slagen: **allemaal +1 punt**

### 9.2 Tweepersoonsvariant
- Elk 16 kaarten, geen slapende kaarten
- Meerderheid = 9+ slagen

### 9.3 Server Issues
- Games met 5+ minuten inactiviteit: automatisch opgeschoond
- Bij server herstart: alle lopende games verloren

---

## 10. Taal & Lokalisatie

- **Uitsluitend Nederlands**
- Alle UI-tekst, foutmeldingen, knoppen in het Nederlands
- Geen internationalisatie-structuur nodig

---

## 11. Beveiliging

- **Geen anti-cheat maatregelen** - vertrouwensbasis (vrienden spelen samen)
- Basis input-validatie server-side
- Geen gevoelige gebruikersdata (geen accounts)

---

## 12. Toekomstige Overwegingen

Het volgende is expliciet **buiten scope** voor v1:
- Android native app (later via responsive web of WebView wrapper)
- Offline/LAN-modus
- Spectator-modus
- Gebruikersaccounts met statistieken
- Publieke lobby's of matchmaking
- AI-bots
- In-game chat
- Meerdere regelvarianties (alleen Leimuiden)
- Leaderboards of ranking

---

## 13. Samenvatting Kernbeslissingen

| Aspect | Keuze |
|--------|-------|
| Regelvariant | Leimuiden (enige optie) |
| Troefbepaling | Bonaker kiest; anders deler |
| Troefrangorde | Klaverjas-stijl (B, 9, A, 10, K, V, 8, 7) |
| Bonaken-verplichting | Meerderheid slagen |
| Puntenlimiet | 10 (vaste waarde) |
| Spelersaantal | 2-7, host configureerbaar |
| Tech stack | Node.js + Socket.io + React |
| Hosting | Self-hosted VPS |
| Accounts | Geen (gast met localStorage bijnaam) |
| Matchmaking | Alleen privé codes |
| Communicatie | Geen (extern) |
| Visuele stijl | Klassiek/traditioneel Nederlands |
| Taal | Alleen Nederlands |
