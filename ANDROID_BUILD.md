# Android Build Guide - Bonaken

## Vereisten

- Android Studio (met Android SDK)
- Node.js 20+

## Ontwikkeling

### Web app bouwen en synchroniseren

```bash
npm run build
cd client && npx cap sync android
```

### Openen in Android Studio

```bash
cd client && npx cap open android
```

Selecteer een emulator en klik **Run**.

### Lokaal testen (tegen eigen server)

1. Maak `client/.env.local` aan:
   ```
   VITE_SERVER_URL=http://10.0.2.2:3001
   ```
2. Pas `client/capacitor.config.ts` aan:
   ```ts
   server: {
     androidScheme: 'http',
     cleartext: true,
   }
   ```
3. Herbouw: `npm run build && cd client && npx cap sync android`
4. Start de server: `npm run dev:server`
5. Run de app in Android Studio

**Vergeet niet** de config terug te zetten voor productie (androidScheme: 'https', geen cleartext).

## Productie Build

### Release APK bouwen

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export KEYSTORE_PASSWORD="<jouw wachtwoord>"
export KEY_PASSWORD="<jouw wachtwoord>"

npm run build
cd client && npx cap sync android
cd android && ./gradlew assembleRelease
```

APK staat in: `client/android/app/build/outputs/apk/release/app-release.apk`

### AAB bouwen (voor Play Store)

```bash
cd client/android && ./gradlew bundleRelease
```

AAB staat in: `client/android/app/build/outputs/bundle/release/app-release.aab`

## Keystore

- Bestand: `bonaken-release-key.jks` (in project root)
- Alias: `bonaken`
- **Bewaar het wachtwoord veilig** — zonder keystore + wachtwoord kun je geen updates publiceren

## App bijwerken

1. Pas de web code aan
2. `npm run build && cd client && npx cap sync android`
3. Verhoog `versionCode` en `versionName` in `client/android/app/build.gradle`
4. Bouw de release: `./gradlew assembleRelease` of `./gradlew bundleRelease`
