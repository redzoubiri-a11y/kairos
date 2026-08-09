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
