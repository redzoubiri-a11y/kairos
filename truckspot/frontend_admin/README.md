# TruckSpot — Console d'administration

Tableau de bord web permettant à un administrateur TruckSpot de valider les dossiers
transporteurs, de suivre les trajets et les missions, et de gérer les comptes
utilisateurs.

## Stack

React 18 · Vite · React Router v6 · Axios · Zustand · CSS natif (variables CSS,
aucune librairie de composants ni de graphiques).

## Installation

```bash
npm install
```

## Configuration

Copiez le fichier d'exemple et ajustez l'URL de l'API si nécessaire :

```bash
cp .env.example .env
```

| Variable       | Description                          | Valeur par défaut               |
| -------------- | ------------------------------------ | ------------------------------- |
| `VITE_API_URL` | URL de base de l'API TruckSpot       | `http://localhost:4000/api`     |

Le backend doit être démarré et accessible à cette adresse.

## Commandes

```bash
npm run dev       # serveur de développement (http://localhost:5174)
npm run build     # build de production dans dist/
npm run preview   # prévisualise le build de production
```

## Tests

```bash
npm test          # une passe
npm run test:watch
```

40 tests (Vitest + Testing Library, environnement jsdom) portant sur ce qui casse
silencieusement :

| Fichier | Couverture |
| --- | --- |
| `pages/LoginPage.test.jsx` | Garde ADMIN : un client ou un transporteur est refuse et aucun jeton n'est stocke |
| `pages/TransportersPage.test.jsx` | File de moderation, etats vide et erreur, motif de refus obligatoire |
| `api/client.test.js` | Injection du jeton, normalisation des erreurs, purge de session sur 401, `cleanParams` |
| `components/Pagination.test.jsx` | Tranches affichees, cas vide, bornes desactivees |
| `utils.test.js` | Formatage et couverture des libelles face aux enums du backend |

Deux points valent d'etre connus :

- **La garde ADMIN n'est pas decorative.** Le serveur accepte volontairement la connexion
  d'un client ou d'un transporteur — c'est bien cette verification cote console qui
  bloque l'acces, d'ou trois tests dessus.
- **Le motif de refus est impose avant l'appel.** Le serveur repond 400 sans motif ;
  sans cette validation locale, l'administrateur recevrait une erreur brute sans savoir
  quoi corriger.

Ces tests tournent en integration continue a chaque push
(`.github/workflows/truckspot.yml`), avant le build de production.

## Connexion

L'accès est réservé aux comptes dont le rôle est `ADMIN` : toute autre connexion est
refusée côté client et le jeton n'est pas conservé.

Identifiants du compte administrateur créé par le script de seed du backend :

```
admin@truckspot.dz
Password123!
```

## Fonctionnalités

- **Tableau de bord** — indicateurs clés (utilisateurs, transporteurs, camions,
  trajets, missions), répartition des missions par statut et taux de complétion.
  Le compteur de dossiers en attente renvoie vers la liste filtrée.
- **Transporteurs** — filtres par statut, recherche temporisée, pagination,
  vérification et refus (motif obligatoire, exigé par l'API).
- **Détail transporteur** — informations société, responsable, compteurs d'activité
  et pièces justificatives (aperçu inline pour les images, lien pour les autres
  formats).
- **Trajets / Missions** — listes paginées avec filtres par statut et badges colorés.
- **Utilisateurs** — filtre par rôle, recherche et activation/désactivation des
  comptes avec confirmation.

## Notes d'implémentation

- Le jeton et l'utilisateur sont persistés dans `localStorage` via le middleware
  `persist` de Zustand. Au démarrage, la session est revalidée avec `GET /auth/me`.
- Les paramètres de requête sont nettoyés avant envoi : l'API valide les query
  strings avec des schémas stricts et rejette les clés inconnues comme les valeurs
  vides.
- L'API n'expose pas de route `GET /admin/transporters/:id` ; la page de détail
  résout donc le profil en parcourant la liste paginée.
- `PATCH /admin/users/:id/active` renvoie un utilisateur partiel ; la réponse est
  fusionnée dans la ligne existante plutôt que substituée.
