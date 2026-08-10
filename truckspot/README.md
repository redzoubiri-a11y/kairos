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
User ──1:N── DeviceToken
```

Enums : `Role`, `VerificationStatus`, `DocumentType`, `TruckType`, `TripStatus`,
`MissionStatus`, `NotificationType`, `DevicePlatform`. Schema complet dans
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

L'acceptation est refusee si la capacite restante ne suffit plus. Le controle ne peut pas
se faire a la creation de la mission : plusieurs demandes en attente coexistent sur un meme
trajet sans rien consommer, et deux demandes de 15 m3 sur un trajet de 20 m3 libres sont
toutes les deux legitimes tant qu'aucune n'est acceptee. La verification est portee par la
condition de l'ecriture, donc evaluee sous le verrou de ligne : deux acceptations
simultanees ne peuvent pas la franchir ensemble.

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
| GET     | `/transporters/documents/:id`  | proprietaire ou admin | Lecture d'un document justificatif |
| POST    | `/trucks/create`               | transporteur | Ajout d'un camion                        |
| GET     | `/trucks/mine`                 | transporteur | Flotte du transporteur                   |
| GET     | `/trucks/available`            | authentifie  | Camions disponibles (filtres + geo + fraicheur) |
| GET     | `/trucks/:id`                  | authentifie  | Fiche camion                             |
| PATCH   | `/trucks/:id`                  | transporteur | Mise a jour d'un camion                  |
| PATCH   | `/trucks/:id/position`         | verifie      | Position temps reel                      |
| DELETE  | `/trucks/:id`                  | transporteur | Suppression                              |
| POST    | `/trips/create`                | verifie      | Declaration d'un trajet                  |
| GET     | `/trips/list`                  | authentifie  | Recherche de trajets (filtres + geo + fraicheur) |
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
| POST    | `/notifications/devices`       | authentifie  | Enregistre un appareil pour les push     |
| GET     | `/notifications/devices`       | authentifie  | Appareils enregistres                    |
| DELETE  | `/notifications/devices`       | authentifie  | Retire un appareil (deconnexion)         |
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

### Fraicheur des offres

`GET /trucks/available` n'affiche un camion que si sa position a moins de
`TRUCK_POSITION_TTL_MINUTES` (24 h par defaut, reglable par deploiement, et par
requete avec `freshWithinMinutes`). Une position figee ne vaut pas une
disponibilite : sans cette fenetre, un camion apercu une fois restait sur la
carte indefiniment, a un endroit qu'il avait quitte depuis longtemps — l'inverse
exact de ce que le produit promet.

Le transporteur n'a pas a deviner la regle : `GET /trucks/mine` renvoie
`visibleOnMap` par camion, et l'application l'avertit quand le sien n'apparait
plus. Cote client, chaque camion affiche l'age de sa position, et un point vert
distingue celui qui roule en ce moment.

Meme regle pour les trajets : aucun travail de fond ne fait vieillir un trajet, et
rien ne changeait son statut. Un depart declare pour le 12 aout restait donc propose
en septembre. `GET /trips/list` ecarte desormais les trajets `SCHEDULED` dont l'heure
de depart est passee de plus de `TRIP_DEPARTURE_GRACE_HOURS` (3 h par defaut, le temps
d'un chargement qui traine). Un trajet `IN_PROGRESS` reste propose : le transporteur a
declare qu'il roulait, et sa capacite libre reste reservable en cours de route. Le
transporteur garde l'historique complet de ses trajets via `mine=true`, chacun portant
`visibleInSearch` ; l'application l'avertit et lui rappelle ses deux recours, repousser
le depart ou passer le trajet en cours.

> Le jeu de demonstration date les positions a l'instant du `npm run seed` et place les
> departs a un a trois jours de la. Une base semee la semaine passee affiche donc une
> carte et une recherche vides : relancer le seed.

Deux formes de pagination coexistent, selon la nature de la liste. Les listes stables
(`/trips/list`, `/missions/list`, les routes `/admin/*`) se paginent par numero de page
(`page`, `limit`) et renvoient `{ items, page, pages, total }`. Les flux ou une entree
peut arriver a tout moment — `/chat/history` et `/notifications/list` — se paginent par
curseur : `before` prend le `createdAt` de l'element le plus ancien deja affiche, et la
reponse est `{ items }`. Un numero de page ferait reapparaitre une ligne des qu'un
message ou une notification s'intercale entre deux appels.

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

## Notifications

Trois canaux, un seul point de declenchement cote serveur :

| Canal            | Quand                          | Mecanisme                        |
| ---------------- | ------------------------------ | -------------------------------- |
| In-app           | Toujours                       | Enregistrement en base           |
| WebSocket        | Application ouverte            | `notification:new`               |
| Push systeme     | Application fermee / en fond   | API Expo Push                    |

L'envoi push est detache du cycle requete/reponse : creer une mission ne depend jamais de
la disponibilite du service Expo. Un jeton refuse par Expo est supprime de la base plutot
que reessaye indefiniment.

> **Expo Go ne suffit pas pour tester les push sur Android** : cette fonctionnalite en a
> ete retiree avec le SDK 53. Il faut un *development build*
> (`eas build --profile development`). Les notifications in-app et la websocket, elles,
> fonctionnent normalement dans Expo Go.

## Confidentialite des pieces justificatives

Les documents transmis par les transporteurs sont des pieces d'identite et d'entreprise.
Ils ne sont jamais servis en statique et le bucket reste prive : l'API n'expose que
`GET /api/transporters/documents/:id`, qui exige un jeton et n'autorise que le
proprietaire du dossier ou un administrateur. Le driver `s3` repond par une redirection
vers une URL signee valable cinq minutes. La cle de stockage interne n'est serialisee vers
aucun client.

Consequence cote back-office : un document ne peut pas etre pointe par un `<img src>`
ordinaire. Le dashboard telecharge les octets avec le jeton puis construit une URL blob,
liberee au demontage du composant.

## Integration continue

`.github/workflows/truckspot.yml` se declenche a chaque push touchant `truckspot/`
(le depot heberge d'autres projets, le filtre evite les executions inutiles) et lance
trois jobs en parallele :

| Job          | Contenu                                                                    |
| ------------ | -------------------------------------------------------------------------- |
| `backend`    | PostgreSQL 16 en service, migrations, controle de derive du schema, tests, seed |
| `admin`      | `npm ci`, les 40 tests du back-office, puis le build de production Vite      |
| `mobile`     | `npm ci`, les 38 tests des stores, puis le bundle Expo du graphe complet     |

Le controle de derive (`prisma migrate diff --exit-code`) echoue si `schema.prisma` a ete
modifie sans migration correspondante — l'oubli le plus courant sur ce genre de projet. Il
s'appuie sur une base fantome **distincte** de celle des tests, car Prisma la reinitialise
pour rejouer les migrations.

## Verification

```bash
cd truckspot/backend && npm test
```

**116 tests d'integration** tournent contre une vraie base PostgreSQL et un vrai serveur
HTTP + Socket.IO, sans mock : authentification, cloisonnement des acces (un tiers ne peut
lire ni une mission ni une conversation qui ne le concerne pas), recherche geographique,
filtres de la carte, expiration des positions trop anciennes, transitions de statut
interdites, comptabilite du volume libre (y compris deux acceptations simultanees sur
un meme trajet), chat
temps reel (rejet d'un jeton invalide, absence de message en double), moderation admin,
confidentialite des pieces justificatives (401 sans jeton, 403 pour un tiers, aucune
lecture possible en statique), notifications push (purge des jetons obsoletes, panne
d'Expo sans consequence sur l'action metier) et flux de notifications (curseur `before`,
cloisonnement du `read-all`).

Le back-office dispose de sa propre suite : **40 tests** (Vitest + Testing Library) sur la
garde ADMIN, le motif de refus obligatoire, la normalisation des erreurs du client HTTP et
la pagination — `cd truckspot/frontend_admin && npm test`. Il a par ailleurs ete valide par
140 assertions sur les reponses reelles de l'API et un rendu de chaque page.

L'application mobile dispose de **71 tests** sur ses stores et ses utilitaires (pagination
des missions, des trajets, du fil de notifications et de la conversation, deduplication du
chat, restauration apres un accuse de lecture refuse, filtre marchandise, position temps
reel, fraicheur d'une position) —
`cd truckspot/frontend_mobile && npm test` — completes par un export Expo qui resout
l'integralite du graphe de modules.

## Deploiement

Chaque application embarque son manifeste : le deploiement se fait sans recopier de
commandes a la main.

**Backend — Render.** `backend/render.yaml` est un blueprint complet (service web +
PostgreSQL 16 gere, migrations au demarrage, sonde sur `/api/health`, `JWT_SECRET`
genere). Render > New > Blueprint, puis renseigner les variables marquees `sync: false` :
`PUBLIC_URL`, `CORS_ORIGINS` et les cinq variables `S3_*`.

**Backend — Railway.** `backend/railway.json` construit via le `Dockerfile` et applique
les migrations au demarrage. Ajouter un plugin PostgreSQL et les memes variables.

> Sur Render comme sur Railway, le disque est **ephemere** : `STORAGE_DRIVER=s3` est
> obligatoire, sinon les documents des transporteurs disparaissent au redeploiement
> suivant. Le blueprint Render le force deja.

**Back-office — Vercel.** `frontend_admin/vercel.json` fixe le framework, la sortie et la
reecriture SPA. Definir la racine du projet sur `truckspot/frontend_admin` et la variable
`VITE_API_URL` sur l'API deployee.

**Mobile — Expo EAS.** `frontend_mobile/eas.json` definit trois profils (`development`,
`preview` en APK, `production` en AAB), chacun avec son `EXPO_PUBLIC_API_URL`. Ajuster
l'URL de production, renseigner les cles Google Maps dans `app.json`, puis
`eas build --platform android --profile production`.

Details par application dans `backend/README.md`, `frontend_admin/README.md` et
`frontend_mobile/README.md`.
