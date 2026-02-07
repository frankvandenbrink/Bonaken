# Capacitor Android App - Milestones

## Milestone 1: Branch & Capacitor Project Setup
- [x] Feature branch aangemaakt (`feature/capacitor-android`)
- [x] `@capacitor/core` en `@capacitor/cli` geinstalleerd in client workspace
- [x] Capacitor geinitialiseerd met `cap init`
- [x] `capacitor.config.ts` geconfigureerd (appId, appName, webDir, androidScheme)
- [x] `.gitignore` bijgewerkt
- [x] Verificatie: `cap doctor` succesvol, `npm run build` werkt nog

## Milestone 2: Socket.io URL & Server CORS
- [ ] `useSocket.ts` aangepast met Capacitor platform detectie
- [ ] Server CORS bijgewerkt voor Capacitor origins
- [ ] Verificatie: web app werkt nog normaal in browser

## Milestone 3: Android Platform Setup
- [ ] Web app gebouwd
- [ ] Android platform toegevoegd met `cap add android`
- [ ] Web build gesynchroniseerd met `cap sync android`
- [ ] `.gitignore` bijgewerkt voor Android build artifacts
- [ ] Verificatie: `cap doctor` toont Android, project opent in Android Studio

## Milestone 4: Native Adjustments
- [ ] `@capacitor/app` en `@capacitor/status-bar` geinstalleerd
- [ ] Status bar geconfigureerd (donker thema, `#2c1810`)
- [ ] Android back button handler toegevoegd
- [ ] Viewport meta tag bijgewerkt voor safe areas
- [ ] Touch behavior CSS toegevoegd (no zoom, no highlight, no callout)
- [ ] Verificatie: app draait in emulator met correcte native UI

## Milestone 5: App Lifecycle & Socket Reconnection
- [ ] `appStateChange` listener toegevoegd voor socket reconnectie
- [ ] Verificatie: socket herstelt na app achtergrond/voorgrond

## Milestone 6: Build, Test & Document
- [ ] Volledige E2E test tegen productie server
- [ ] App icon geconfigureerd
- [ ] Signing keystore aangemaakt
- [ ] Release APK/AAB gebouwd
- [ ] Build proces gedocumenteerd
