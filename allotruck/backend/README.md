# AlloTruck — Backend

API REST + WebSockets. Node.js, Express, Prisma, PostgreSQL, Socket.IO, JWT.

## Installation

```bash
cd allotruck/backend
docker compose up -d db        # PostgreSQL 16 sur le port 5432
cp .env.example .env           # renseigner JWT_SECRET
npm install
npm run prisma:migrate
npm run seed
```

Generer un secret :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Lancement

```bash
npm run dev     # nodemon, http://localhost:4000
npm start       # production
```

Verification : `curl http://localhost:4000/api/health`

## Scripts

| Commande                 | Effet                                        |
| ------------------------ | -------------------------------------------- |
| `npm run dev`            | Serveur en rechargement automatique          |
| `npm start`              | Serveur de production                        |
| `npm test`               | Suite de tests d'integration                 |
| `npm run test:watch`     | Tests en rechargement automatique            |
| `npm run prisma:migrate` | Cree et applique une migration               |
| `npm run prisma:deploy`  | Applique les migrations (production)         |
| `npm run prisma:studio`  | Explorateur de base de donnees               |
| `npm run seed`           | Remplit la base avec un jeu de demonstration |

## Tests

```bash
npm test
```

85 tests d'integration repartis en huit suites (`tests/`), executes avec le lanceur
integre de Node contre une **vraie** base PostgreSQL et un vrai serveur HTTP + Socket.IO :
aucun mock, aucune dependance de test supplementaire hormis `socket.io-client`.

| Suite                 | Couverture                                                              |
| --------------------- | ----------------------------------------------------------------------- |
| `auth.test.js`        | Inscription, connexion, non-enumeration des comptes, jetons, mot de passe |
| `fleet.test.js`       | Camions, trajets, recherche geographique, filtres, cloisonnement         |
| `missions.test.js`    | Cycle de vie, droits par role, comptabilite du volume libre, notifications |
| `chat.test.js`        | Historique, accuses de lecture, salons Socket.IO, absence de doublon     |
| `admin.test.js`       | Moderation, effets de la verification, statistiques, activation de compte |
| `documents.test.js`   | Envoi multipart, confidentialite des pieces, absence de service statique |
| `storage-s3.test.js`  | Driver s3 face a un endpoint S3 minimal : signature SigV4, URL presignee |
| `push.test.js`        | Appareils, envoi Expo, purge des jetons morts, resilience aux pannes    |

Ces tests tournent aussi en integration continue a chaque push
(`.github/workflows/allotruck.yml`), contre un service PostgreSQL 16.

> La suite **vide les tables** de la base pointee par `DATABASE_URL` avant de s'executer.
> Utilisez une base dediee. Le lancement est refuse si `NODE_ENV=production`.
> La limitation de debit est desactivee pendant les tests (la suite cree bien plus de
> comptes qu'un client reel).

## Variables d'environnement

| Variable             | Defaut                  | Role                                          |
| -------------------- | ----------------------- | --------------------------------------------- |
| `NODE_ENV`           | `development`           | Mode d'execution                              |
| `PORT`               | `4000`                  | Port d'ecoute                                 |
| `DATABASE_URL`       | —                       | Chaine de connexion PostgreSQL (obligatoire)  |
| `JWT_SECRET`         | —                       | Secret de signature des jetons (obligatoire)  |
| `JWT_EXPIRES_IN`     | `7d`                    | Duree de validite des jetons                  |
| `PUBLIC_URL`         | `http://localhost:4000` | Prefixe des URL de documents televerses       |
| `CORS_ORIGINS`       | `*`                     | Origines autorisees, separees par des virgules|
| `UPLOAD_DIR`         | `uploads`               | Dossier local des documents (driver `local`)  |
| `MAX_UPLOAD_BYTES`   | `5242880`               | Taille maximale par fichier                   |
| `DISABLE_RATE_LIMIT` | `false`                 | A n'activer que pour des tests locaux         |
| `STORAGE_DRIVER`     | `local`                 | `local` ou `s3`                               |
| `S3_ENDPOINT`        | —                       | Requis hors AWS (R2, Scaleway, MinIO)         |
| `S3_REGION`          | `auto`                  | Region du bucket                              |
| `S3_BUCKET`          | —                       | Nom du bucket (driver `s3`)                   |
| `S3_ACCESS_KEY_ID`   | —                       | Cle d'acces (driver `s3`)                     |
| `S3_SECRET_ACCESS_KEY` | —                     | Cle secrete (driver `s3`)                     |
| `PUSH_ENABLED`       | `true`                  | Envoi des notifications push Expo             |
| `EXPO_ACCESS_TOKEN`  | —                       | Jeton d'acces Expo, recommande en production  |
| `EXPO_PUSH_URL`      | API publique Expo       | Surchargeable pour les tests                  |

## Stockage des documents

Les pieces justificatives (RC, patente, carte grise, piece d'identite) passent par un
driver de stockage interchangeable, choisi par `STORAGE_DRIVER` :

- **`local`** — ecrit dans `UPLOAD_DIR`. Parfait en developpement, et valable en
  production **uniquement** si l'hote dispose d'un volume persistant.
- **`s3`** — tout bucket compatible S3 : AWS, Cloudflare R2, Scaleway, MinIO. C'est le
  choix obligatoire sur Railway, Render ou Fly sans volume, dont le disque est efface a
  chaque redeploiement.

Ces documents sont des pieces d'identite : **ils ne sont jamais servis en statique**. Le
bucket reste prive et l'API n'expose aucune URL directe. Un client recoit
`GET /api/transporters/documents/:id`, qui verifie le jeton et n'autorise que le
proprietaire du dossier ou un administrateur ; le driver `s3` repond par une redirection
vers une URL signee valable cinq minutes. La cle de stockage n'est jamais serialisee vers
le client.

## Notifications push

Deux canaux complementaires, declenches par le meme appel a
`notificationService.push()` :

- **WebSocket** (`notification:new`) — application ouverte, livraison instantanee.
- **Push Expo** — application fermee ou en arriere-plan.

Un appareil s'enregistre via `POST /api/notifications/devices` avec son jeton Expo.
Le jeton est unique en base : un telephone qui change de compte est simplement
rattache au nouvel utilisateur, sans doublon.

Trois garanties de robustesse, toutes couvertes par les tests :

- L'envoi est **detache** du cycle requete/reponse. Creer une mission ne depend
  jamais de la disponibilite du service Expo.
- Un jeton refuse par Expo (`DeviceNotRegistered`) est **supprime de la base**,
  au lieu d'etre reessaye a chaque notification.
- Une panne d'Expo ne fait echouer ni l'action metier ni la notification in-app.

## Architecture

```
src/
  config/       chargement et validation de l'environnement, client Prisma
  middleware/   authentification JWT, roles, validation zod, uploads multer, erreurs
  validators/   schemas zod de toutes les entrees (corps, query, params)
  services/     logique metier (le seul endroit qui touche la base)
  controllers/  adaptation HTTP, aucune logique metier
  routes/       declaration des routes et composition des middlewares
  websocket/    serveur Socket.IO et registre d'emission utilise par les services
  utils/        erreurs typees, calculs geographiques, serialisation
```

Un service ne connait pas HTTP, un controleur ne connait pas la base. Les services
emettent vers les clients via `websocket/realtime.js`, ce qui evite une dependance
circulaire avec le bootstrap Socket.IO.

## Securite

- Mots de passe hashes avec bcrypt, `passwordHash` jamais serialise vers le client.
- Email inconnu et mot de passe errone renvoient le meme message : pas d'enumeration.
- Limitation de debit : 20 tentatives / 15 min sur `/auth`, 300 requetes / min ailleurs.
- `helmet`, CORS configurable, corps JSON limite a 1 Mo.
- Uploads : types MIME restreints (JPEG, PNG, WEBP, PDF), nom de fichier sur disque
  genere par le serveur — le nom fourni par le client n'est jamais utilise comme chemin.
- Toute entree passe par un schema zod strict avant d'atteindre un service.
- Les acces aux missions et aux conversations sont verifies participant par participant.

## Documentation de l'API

Tableau complet des routes, evenements WebSocket et modele de donnees dans le
[README du projet](../README.md).

## Deploiement

Le `Dockerfile` applique les migrations puis demarre le serveur :

```bash
docker build -t allotruck-api .
docker run -p 4000:4000 --env-file .env allotruck-api
```

Deux manifestes evitent toute configuration manuelle :

- **`render.yaml`** — blueprint complet : service web, PostgreSQL 16 gere, migrations au
  demarrage, sonde sur `/api/health`, `JWT_SECRET` genere. Il reste a renseigner les
  variables marquees `sync: false` (`PUBLIC_URL`, `CORS_ORIGINS`, les cinq `S3_*`).
- **`railway.json`** — construit via le `Dockerfile`, migrations au demarrage, sonde de
  sante. Ajouter un plugin PostgreSQL et les memes variables.

> Le disque de ces deux plateformes est **ephemere** : `STORAGE_DRIVER=s3` y est
> obligatoire, faute de quoi les documents des transporteurs disparaissent au
> redeploiement suivant. Le blueprint Render le force deja.
