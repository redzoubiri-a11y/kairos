# TruckSpot — MVP

Plateforme de mise en relation entre clients ayant de la marchandise a transporter et
transporteurs disposant de volume libre dans leurs camions, en Algerie.

Trois applications, un seul backend :

| Dossier            | Role                | Stack                                                  |
| ------------------ | ------------------- | ------------------------------------------------------ |
| `backend/`         | API REST + WebSocket| Node.js, Express, Prisma, PostgreSQL, Socket.IO, JWT   |
| `frontend_mobile/` | Application mobile  | React Native, Expo SDK 54, React Navigation, Zustand   |
| `frontend_admin/`  | Back-office         | React, Vite, React Router, Zustand, Axios              |

> Ce projet vit dans un sous-dossier du depot afin de ne pas entrer en conflit avec
> l'application Expo situee a la racine (chacune a son propre `metro.config.js`).

## Demarrage rapide

```bash
# 1. Base de donnees
cd truckspot/backend
docker compose up -d db

# 2. API
cp .env.example .env          # renseigner JWT_SECRET
npm install
npm run prisma:migrate
npm run seed
npm run dev                   # http://localhost:4000

# 3. Back-office (nouveau terminal)
cd truckspot/frontend_admin
cp .env.example .env
npm install && npm run dev    # http://localhost:5173

# 4. Mobile (nouveau terminal)
cd truckspot/frontend_mobile
cp .env.example .env
npm install && npm start
```

## Comptes de demonstration

Crees par `npm run seed`. Mot de passe commun : `Password123!`

| Role                      | Email                       |
| ------------------------- | --------------------------- |
| Administrateur            | `admin@truckspot.dz`        |
| Client                    | `client@truckspot.dz`       |
| Transporteur verifie      | `transporteur@truckspot.dz` |
| Transporteur en attente   | `estfret@truckspot.dz`      |

## Parcours fonctionnel

**Transporteur** — s'inscrit avec sa raison sociale, envoie ses documents (RC, patente,
carte grise), attend la validation d'un administrateur, enregistre ses camions, declare
un trajet avec le volume et la charge encore libres, recoit les missions, accepte ou
refuse, discute avec le client.

**Client** — voit sur la carte les camions disponibles autour de lui, filtre par volume,
type de camion et rayon, consulte les trajets declares, envoie une mission, suit son
avancement et discute avec le transporteur.

**Administrateur** — traite la file des transporteurs en attente, consulte les documents,
valide ou refuse avec motif, surveille les trajets, les missions et les statistiques.

Une regle structurante : un transporteur non verifie n'apparait sur aucune carte, ne peut
ni publier de trajet ni mettre a jour sa position, et ne peut pas recevoir de mission.

## Modele de donnees

```
User ──1:1── TransporterProfile ──1:N── TransporterDocument
                     │
                     ├──1:N── Truck ──1:N── Trip
                     │                        │
                     └──────1:N── Mission ────┘
                                    │
                                    └──1:N── ChatMessage

User ──1:N── Notification
```

Enums : `Role`, `VerificationStatus`, `DocumentType`, `TruckType`, `TripStatus`,
`MissionStatus`, `NotificationType`. Schema complet dans
`backend/prisma/schema.prisma`.

### Cycle de vie d'une mission

```
PENDING ──► ACCEPTED ──► IN_PROGRESS ──► COMPLETED
   │            │              │
   ├──► REJECTED│              │
   └──────────► CANCELLED ◄────┘
```

Les transitions sont verifiees cote serveur. Seul le transporteur peut accepter, refuser,
demarrer ou terminer ; seul le client peut annuler. Accepter une mission rattachee a un
trajet decremente le volume et la charge libres de ce trajet ; une annulation les restitue.

## API

Base : `http://localhost:4000/api` — authentification par `Authorization: Bearer <jwt>`.

| Methode | Route                          | Acces        | Description                              |
| ------- | ------------------------------ | ------------ | ---------------------------------------- |
| POST    | `/auth/signup`                 | public       | Inscription client ou transporteur       |
| POST    | `/auth/login`                  | public       | Connexion                                |
| GET     | `/auth/me`                     | authentifie  | Profil courant                           |
| PATCH   | `/auth/me`                     | authentifie  | Mise a jour du profil                    |
| POST    | `/auth/change-password`        | authentifie  | Changement de mot de passe               |
| POST    | `/transporters/create`         | authentifie  | Creation du profil entreprise            |
| GET     | `/transporters/me`             | transporteur | Profil entreprise + documents            |
| PATCH   | `/transporters/me`             | transporteur | Mise a jour de l'entreprise              |
| POST    | `/transporters/upload-docs`    | transporteur | Envoi des documents (multipart)          |
| POST    | `/trucks/create`               | transporteur | Ajout d'un camion                        |
| GET     | `/trucks/mine`                 | transporteur | Flotte du transporteur                   |
| GET     | `/trucks/available`            | authentifie  | Camions disponibles (filtres + geo)      |
| GET     | `/trucks/:id`                  | authentifie  | Fiche camion                             |
| PATCH   | `/trucks/:id`                  | transporteur | Mise a jour d'un camion                  |
| PATCH   | `/trucks/:id/position`         | verifie      | Position temps reel                      |
| DELETE  | `/trucks/:id`                  | transporteur | Suppression                              |
| POST    | `/trips/create`                | verifie      | Declaration d'un trajet                  |
| GET     | `/trips/list`                  | authentifie  | Recherche de trajets (filtres + geo)     |
| GET     | `/trips/:id`                   | authentifie  | Fiche trajet                             |
| PATCH   | `/trips/:id`                   | transporteur | Mise a jour                              |
| DELETE  | `/trips/:id`                   | transporteur | Annulation                               |
| POST    | `/missions/create`             | client       | Envoi d'une mission                      |
| GET     | `/missions/list`               | authentifie  | Missions selon le role                   |
| GET     | `/missions/:id`                | participant  | Fiche mission                            |
| PATCH   | `/missions/update-status`      | participant  | Changement de statut                     |
| POST    | `/chat/send`                   | participant  | Envoi d'un message                       |
| GET     | `/chat/history`                | participant  | Historique d'une conversation            |
| PATCH   | `/chat/:missionId/read`        | participant  | Marquer comme lu                         |
| GET     | `/notifications/list`          | authentifie  | Notifications                            |
| PATCH   | `/notifications/read-all`      | authentifie  | Tout marquer comme lu                    |
| GET     | `/admin/stats`                 | admin        | Statistiques globales                    |
| GET     | `/admin/transporters`          | admin        | File de moderation                       |
| PATCH   | `/admin/verify-transporter`    | admin        | Validation ou refus (motif obligatoire)  |
| GET     | `/admin/trips`                 | admin        | Tous les trajets                         |
| GET     | `/admin/missions`              | admin        | Toutes les missions                      |
| GET     | `/admin/users`                 | admin        | Tous les comptes                         |
| PATCH   | `/admin/users/:id/active`      | admin        | Activation / desactivation               |

Les erreurs suivent toujours la forme
`{ "error": { "message": string, "details"?: [{ field, message }] } }`.

Les parametres de requete sont valides en mode strict : n'envoyez jamais de parametre
vide ou inconnu, la reponse serait un 400.

## WebSockets

Connexion Socket.IO sur l'origine du backend, JWT passe dans le handshake :
`io(API_URL, { auth: { token } })`.

**Emis par le client**

| Evenement         | Charge utile                                | Effet                                |
| ----------------- | ------------------------------------------- | ------------------------------------ |
| `mission:join`    | `missionId`                                 | Rejoint le salon d'une mission       |
| `mission:leave`   | `missionId`                                 | Quitte le salon                      |
| `chat:send`       | `{ missionId, content }`                    | Envoie un message                    |
| `chat:typing`     | `{ missionId }`                             | Signale la saisie                    |
| `truck:position`  | `{ truckId, latitude, longitude }`          | Met a jour la position (transporteur)|

**Recus par le client**

| Evenement                   | Diffusion            |
| --------------------------- | -------------------- |
| `mission:new`               | Transporteur cible   |
| `mission:updated`           | Contrepartie + salon |
| `chat:message`              | Salon de la mission  |
| `chat:inbox`                | Canal personnel      |
| `chat:typing`               | Salon de la mission  |
| `notification:new`          | Canal personnel      |
| `truck:position`            | Tous les clients     |
| `transporter:verification`  | Transporteur concerne|

`chat:message` et `chat:inbox` sont deliberement distincts : un destinataire deja present
dans le salon afficherait sinon deux fois le meme message.

## Verification

```bash
cd truckspot/backend && npm test
```

**57 tests d'integration** tournent contre une vraie base PostgreSQL et un vrai serveur
HTTP + Socket.IO, sans mock : authentification, cloisonnement des acces (un tiers ne peut
lire ni une mission ni une conversation qui ne le concerne pas), recherche geographique,
filtres de la carte, transitions de statut interdites, comptabilite du volume libre, chat
temps reel (rejet d'un jeton invalide, absence de message en double) et moderation admin.

Le back-office a ete valide par 140 assertions sur les reponses reelles de l'API, plus un
rendu de chaque page contre l'API en fonctionnement.

L'application mobile a ete validee par un export Expo complet du graphe de modules
(1005 modules).

## Deploiement

**Backend — Railway ou Render.** Provisionner un PostgreSQL, definir `DATABASE_URL`,
`JWT_SECRET`, `PUBLIC_URL`, `CORS_ORIGINS` et `NODE_ENV=production`. Le `Dockerfile`
fourni applique les migrations au demarrage (`prisma migrate deploy`). Les documents sont
stockes sur disque dans `UPLOAD_DIR` : montez un volume persistant, ou basculez vers un
stockage objet avant la mise en production.

**Back-office — Vercel.** Racine `truckspot/frontend_admin`, commande `npm run build`,
sortie `dist`, variable `VITE_API_URL` pointant sur l'API deployee.

**Mobile — Expo EAS.** `eas build --platform android --profile production`. Definir
`EXPO_PUBLIC_API_URL` sur l'API deployee et renseigner les cles Google Maps dans
`app.json` avant le build.

Details par application dans `backend/README.md`, `frontend_admin/README.md` et
`frontend_mobile/README.md`.
