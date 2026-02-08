# Google Play Store Publicatie - Bonaken

## 1. Developer Account

- Registreer op https://play.google.com/console
- Eenmalige kosten: **$25**
- Google account vereist

## 2. AAB Bouwen

De Play Store vereist een Android App Bundle (AAB), geen APK:

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export KEYSTORE_PASSWORD="<jouw wachtwoord>"
export KEY_PASSWORD="<jouw wachtwoord>"

npm run build
cd client && npx cap sync android
cd android && ./gradlew bundleRelease
```

Output: `client/android/app/build/outputs/bundle/release/app-release.aab`

## 3. Store Listing Voorbereiden

In Play Console heb je nodig:

- **App naam:** Bonaken
- **Korte beschrijving:** (max 80 tekens) bijv. "Bonaken kaartspel - speel online met vrienden"
- **Volledige beschrijving:** (max 4000 tekens) spelregels, features uitleggen
- **Screenshots:** minimaal 2 telefoon screenshots (maak ze in de emulator)
- **Feature graphic:** 1024x500 banner afbeelding
- **App icoon:** 512x512 (exporteer vanuit `client/assets/icon-foreground.svg`)
- **Categorie:** Games > Card
- **Content rating:** vragenlijst invullen (simpel voor een kaartspel)
- **Privacy policy URL:** verplicht — kan een simpele pagina op je site zijn

## 4. Upload & Review

1. Ga naar **Production > Create new release**
2. Upload het `.aab` bestand
3. Vul release notes in (bijv. "Eerste versie van Bonaken")
4. Verstuur voor review

## Tijdlijn

- Review duurt meestal **1-3 dagen** voor nieuwe apps
- Google kan vervolgvragen stellen over functionaliteit

## Aandachtspunten

- **Privacy policy** is verplicht — zelfs een simpele verklaring dat je geen persoonlijke data verzamelt, gehost op bijv. `bonaken.frankvdbrink.nl/privacy`
- **Doelgroep** — als het spel voor alle leeftijden is, geef dat aan bij de content rating
- **Store listing taal** — stel Nederlands in als primair, eventueel Engels toevoegen
