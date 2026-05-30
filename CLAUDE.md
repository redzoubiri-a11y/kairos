# MIDA — Brief Claude Code

## Projet
Application mobile de réservation de restaurants à Alger.
Équivalent TheFork pour le marché algérien.
Site actuel : mida-food.com

## Stack technique
- React Native 0.81.5 + Expo 54
- React Navigation (Stack + Bottom Tabs)
- Supabase (auth + PostgreSQL)
- Mapbox / React Native Maps
- TypeScript
- AsyncStorage

## Structure des fichiers
```
App.js                        ← Navigation principale (NE PAS MODIFIER)
supabase.js                   ← Config Supabase (NE PAS MODIFIER)
screens/
  AuthScreen.js               ← Connexion + Inscription
  OnboardingScreen.js         ← Introduction app
  HomeScreen.js               ← Accueil client
  SearchScreen.js             ← Recherche
  ExplorerScreen.js           ← Exploration carte
  MapScreen.js                ← Vue carte
  RestaurantScreen.js         ← Fiche restaurant
  ReservationScreen.js        ← Réservations
  ReservationFormScreen.js    ← Formulaire réservation
  FavorisScreen.js            ← Favoris
  NotificationsScreen.js      ← Notifications
  ProfilScreen.js             ← Profil utilisateur
  ProDashboard.js             ← Dashboard restaurateur
  ProComptoir.js              ← Gestion réservations pro
  ProInscriptionScreen.js     ← Inscription restaurateur
wireframes/
  mida-wireframes.jsx               ← Écrans principaux
  mida-auth-wireframes.jsx          ← Auth & accès
  mida-client-wireframes.jsx        ← Côté client
  mida-restaurateur-wireframes.jsx  ← Côté restaurateur
  mida-transversal-wireframes.jsx   ← Transversal
```

## Règles absolues
1. NE JAMAIS modifier App.js (navigation) ni supabase.js
2. NE JAMAIS supprimer la logique métier existante (appels Supabase, state, fonctions)
3. TOUJOURS garder les props et callbacks existants
4. UNIQUEMENT modifier le JSX retourné et les styles
5. Utiliser EXCLUSIVEMENT les tokens de src/theme.js pour les styles
6. Tous les nouveaux composants dans src/components/

## Design de référence
Les wireframes dans /wireframes/ sont la référence visuelle.
Palette dans src/theme.js — NE JAMAIS utiliser de couleurs en dur.

## Rôles utilisateur
- "client" → TabNavigator avec tabs : Accueil, Recherche, Favoris, Profil
- "pro" → TabNavigator avec tabs : Dashboard, Réservations, Menu, Profil

## Ordre de travail recommandé
1. src/theme.js (design tokens)
2. src/components/ (composants de base)
3. AuthScreen + OnboardingScreen
4. HomeScreen + SearchScreen
5. RestaurantScreen + ReservationFormScreen
6. FavorisScreen + NotificationsScreen + ProfilScreen
7. ProDashboard + ProComptoir + ProInscriptionScreen
8. MapScreen + ExplorerScreen
