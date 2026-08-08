# TruckSpot — Application mobile

Application React Native (Expo SDK 54) pour les clients et les transporteurs.

## Installation

```bash
cd truckspot/frontend_mobile
npm install
cp .env.example .env
```

Renseignez l'URL du backend dans `.env` selon votre cible :

| Cible                | `EXPO_PUBLIC_API_URL`        |
| -------------------- | ---------------------------- |
| Emulateur Android    | `http://10.0.2.2:4000`       |
| Simulateur iOS       | `http://localhost:4000`      |
| Telephone physique   | `http://<ip-du-pc>:4000`     |

## Lancement

```bash
npm start          # Metro + QR code Expo
npm run android    # ouvre l'emulateur Android
npm run ios        # ouvre le simulateur iOS
```

Le backend doit tourner en parallele (`cd ../backend && npm run dev`).

## Cartographie

L'ecran carte utilise `react-native-maps` avec le provider Google. Renseignez vos cles
dans `app.json` avant tout build natif :

- `expo.android.config.googleMaps.apiKey`
- `expo.ios.config.googleMapsApiKey`

Les cles se creent depuis la console Google Cloud (API « Maps SDK for Android » et
« Maps SDK for iOS »). Sans cle, la carte s'affiche vide sur un build natif ; Expo Go
sur Android utilise sa propre cle de developpement.

## Architecture

```
src/
  api/          client axios (intercepteurs token + normalisation d'erreurs), endpoints, socket.io
  store/        zustand : auth, carte, missions, chat, notifications
  navigation/   RootNavigator : Splash → Onboarding → Login → Tabs (client ou transporteur)
  screens/      les 15 ecrans de l'application
  components/   bibliotheque UI (Button, BottomSheet anime, VolumeSlider, ChatBubble, pins carte...)
  hooks/        geolocalisation, branchement des evenements temps reel
  theme/        tokens de design (couleurs, espacements, typographie)
  utils/        formatage FR, constantes metier (villes, types de camions, marchandises)
```

### Navigation

```
Splash → Onboarding (3 slides) → Login / Signup → Tabs

Tabs client        : Carte · Missions · Alertes · Profil
Tabs transporteur  : Demandes · Declarer · Alertes · Profil

Carte → BottomSheet camion → MissionForm → MissionDetail → Chat
Profil → MyTrucks · MyTrips · Documents · Settings
```

### Temps reel

`src/hooks/useRealtime.js` est monte une seule fois a la racine et redistribue les
evenements Socket.IO vers les stores : `mission:new`, `mission:updated`, `chat:message`,
`chat:inbox`, `chat:typing`, `notification:new`, `truck:position`,
`transporter:verification`.

## Comptes de demonstration

Apres `npm run seed` cote backend :

| Role         | Email                       | Mot de passe   |
| ------------ | --------------------------- | -------------- |
| Client       | `client@truckspot.dz`       | `Password123!` |
| Transporteur | `transporteur@truckspot.dz` | `Password123!` |

## Verification effectuee

Le graphe de modules complet a ete valide via `npx expo export --platform android --dev`
(1005 modules, bundle 7,1 Mo).

Note : `expo export` en mode production echoue dans certains conteneurs Linux dont le
binaire `hermesc` est ancien (il rejette les champs prives de classe presents dans les
sources de React Native 0.81). Cela n'affecte ni le code applicatif ni les builds EAS,
qui utilisent leur propre chaine Hermes.

## Build de production

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
eas build --platform ios --profile production
```
