# Capacitor Android App - Milestones

## Milestone 1: Branch & Capacitor Project Setup
- [x] Feature branch aangemaakt (`feature/capacitor-android`)
- [x] `@capacitor/core` en `@capacitor/cli` geinstalleerd in client workspace
- [x] Capacitor geinitialiseerd met `cap init`
- [x] `capacitor.config.ts` geconfigureerd (appId, appName, webDir, androidScheme)
- [x] `.gitignore` bijgewerkt
- [x] Verificatie: `cap doctor` succesvol, `npm run build` werkt nog

## Milestone 2: Socket.io URL & Server CORS
- [x] `useSocket.ts` aangepast met Capacitor platform detectie
- [x] Server CORS bijgewerkt voor Capacitor origins
- [x] Verificatie: web app werkt nog normaal in browser

## Milestone 3: Android Platform Setup
- [x] Web app gebouwd
- [x] Android platform toegevoegd met `cap add android`
- [x] Web build gesynchroniseerd met `cap sync android`
- [x] `.gitignore` bijgewerkt voor Android build artifacts
- [x] Verificatie: `cap doctor` toont Android ("Android looking great!")

## Milestone 4: Native Adjustments
- [x] `@capacitor/app` en `@capacitor/status-bar` geinstalleerd
- [x] Status bar geconfigureerd (donker thema, `#2c1810`)
- [x] Android back button handler toegevoegd
- [x] Viewport meta tag bijgewerkt voor safe areas
- [x] Touch behavior CSS toegevoegd (no zoom, no highlight, no callout)
- [x] Verificatie: app draait in emulator met correcte native UI

## Milestone 5: App Lifecycle & Socket Reconnection
- [x] `appStateChange` listener toegevoegd voor socket reconnectie
- [x] Verificatie: socket herstelt na app achtergrond/voorgrond

## Milestone 6: Build, Test & Document
- [x] Volledige E2E test tegen lokale server (emulator)
- [x] E2E test tegen productie server
- [x] App icon geconfigureerd
- [x] Signing keystore aangemaakt
- [x] Release APK/AAB gebouwd
- [x] Build proces gedocumenteerd
