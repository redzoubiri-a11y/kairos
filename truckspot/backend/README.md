# TruckSpot — Backend

API REST + WebSockets. Node.js, Express, Prisma, PostgreSQL, Socket.IO, JWT.

## Installation

```bash
cd truckspot/backend
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
| `npm run prisma:migrate` | Cree et applique une migration               |
| `npm run prisma:deploy`  | Applique les migrations (production)         |
| `npm run prisma:studio`  | Explorateur de base de donnees               |
| `npm run seed`           | Remplit la base avec un jeu de demonstration |

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
| `UPLOAD_DIR`         | `uploads`               | Dossier de stockage des documents             |
| `MAX_UPLOAD_BYTES`   | `5242880`               | Taille maximale par fichier                   |
| `DISABLE_RATE_LIMIT` | `false`                 | A n'activer que pour des tests locaux         |

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
docker build -t truckspot-api .
docker run -p 4000:4000 --env-file .env truckspot-api
```

Sur Railway ou Render, connecter le depot, definir la racine sur `truckspot/backend`,
provisionner un PostgreSQL et renseigner les variables ci-dessus.

Les documents televerses sont ecrits sur le disque local. En production, montez un volume
persistant sur `UPLOAD_DIR` ou remplacez `middleware/upload.js` par un stockage objet
(S3, Cloudflare R2) — les conteneurs de ces plateformes ont un disque ephemere.
