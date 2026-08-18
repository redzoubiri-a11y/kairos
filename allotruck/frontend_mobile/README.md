# AlloTruck — Application mobile

Application React Native (Expo SDK 54) pour les clients et les transporteurs.

## Installation

```bash
cd allotruck/frontend_mobile
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

## Notifications push

L'appareil s'enregistre aupres de l'API a chaque etablissement de session
(`src/api/push.js`) et se desinscrit a la deconnexion — avant l'effacement du jeton,
puisque la route exige d'etre authentifie. Un tap sur une notification ouvre la mission
concernee, y compris lorsque l'application etait fermee
(`src/hooks/usePushResponse.js`).

Deux prerequis avant que cela fonctionne :

1. **`projectId` EAS** — renseignez `expo.extra.eas.projectId` dans `app.json`
   (`eas init` le fait pour vous). Tant que le placeholder est en place, l'application
   journalise un avertissement explicite et se contente des notifications in-app plutot
   que d'echouer.
2. **Un development build sur Android** — les notifications push distantes ont ete
   retirees d'Expo Go avec le SDK 53 :

   ```bash
   eas build --platform android --profile development
   ```

   Dans Expo Go, les notifications in-app et la websocket continuent de fonctionner
   normalement ; seules les notifications systeme sont indisponibles.

## Tests

```bash
npm test          # une passe
npm run test:watch
```

38 tests (Vitest, environnement node) sur les stores, ou se trouve la logique :

| Store | Couverture |
| --- | --- |
| `missionStore` | Pagination, ecart des doublons, upsert par websocket, compteur du badge |
| `chatStore` | Deduplication des messages, isolation des conversations, echec d'envoi |
| `mapStore` | Filtre marchandise croise avec les trajets, position temps reel, filtres |

Les stores sont du JavaScript pur : les modules d'API et de socket sont remplaces
par des doublures, la chaine d'imports Expo n'est donc jamais chargee et les tests
tournent sans emulateur.

Le job `mobile` de la CI lance ces tests puis un export Expo qui resout et transpile
l'integralite du graphe de modules.

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
| Client       | `client@allotruck.dz`       | `Password123!` |
| Transporteur | `transporteur@allotruck.dz` | `Password123!` |

## Verification effectuee

Le graphe de modules complet a ete valide via `npx expo export --platform android --dev`
(1005 modules, bundle 7,1 Mo).

Note : `expo export` en mode production echoue dans certains conteneurs Linux dont le
binaire `hermesc` est ancien (il rejette les champs prives de classe presents dans les
sources de React Native 0.81). Cela n'affecte ni le code applicatif ni les builds EAS,
qui utilisent leur propre chaine Hermes.

## Build de production

`eas.json` definit trois profils, chacun avec son `EXPO_PUBLIC_API_URL` :

| Profil        | Sortie                | Usage                          |
| ------------- | --------------------- | ------------------------------ |
| `development` | client de dev         | Debug sur emulateur            |
| `preview`     | APK Android           | Diffusion interne aux testeurs |
| `production`  | AAB Android           | Publication sur le Play Store  |

Ajustez l'URL de production dans `eas.json` avant le premier build.

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
eas build --platform android --profile production
eas build --platform ios --profile production
```
