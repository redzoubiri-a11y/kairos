# CLAUDE.md — Mida

## Contexte
- Quoi : app de réservation de restaurants (marché algérien, B2B restaurateurs + B2C clients)
- Stack : Expo / React Native, Supabase (projet "Kairos", ref rghjgyzpdadapmktislv), domaine mida-food.com
- Racine : ~/Desktop/KAIROS/APP
- Compte GitHub : redzoubiri-a11y/kairos (monorepo — contient aussi allotruck/ et tasalle/, sans rapport avec Mida) — compte Expo : zlabia
- Bundle : iOS com.kairos.mida (App Store "MIDA DZ", ASC ID 6776171199) — Android com.midadz.app
- État : en production (Android test fermé + soumission App Store en revue), catalogue multi-villes en cours de peuplement

## Fichiers protégés — NE JAMAIS modifier
- App.js (point d'entrée)
- supabase.js (config client)
Si une tâche semble l'exiger : s'arrêter et me prévenir.

## Architecture obligatoire
- Pattern hook `useX` + composant : logique/données dans `src/hooks/useX.js`, affichage dans le composant
- Styles : UNIQUEMENT via `src/theme.js` — jamais de hex ou de taille en dur
- Un composant = un fichier, PascalCase. Hooks : `useNomFonctionnel.js`
- Écran qui grossit → découper (hook + sous-composants)

## Vérification (définition de "fini")
- `npx expo start` démarre sans erreur rouge
- Aucun fichier protégé modifié
- Nouvelles données → hook dédié, pas de fetch dans le composant

## Spécifique projet
- Identité visuelle (rebrand du 18/08/2026) : accent rouge-terracotta `#D8432B` (`theme.colors.primary`), vert `#13502E` en secondaire, fond clair `#F5F5F3` — ne pas réintroduire l'ancienne palette vert sapin/doré ni proposer un thème cyan/magenta sans demande explicite
- Décision explicite : garder le logo plat 2D (icône/splash), pas de rendu 3D (ni image figée ni WebGL live) — ne pas reproposer sans nouvelle demande
- Le dossier `android/` est natif, gitignored, jamais régénéré automatiquement depuis `app.json` — un comportement natif qui persiste malgré un code JS/app.json corrects vient souvent de là (AndroidManifest.xml)
- Edge Function `send-reminders` tourne via pg_cron (J-1 à 17h UTC/18h Alger, H-2 toutes les 30 min) — ne pas toucher sans vérifier `cron.job`/`cron.job_run_details` en base, pas seulement le code
- 93 restaurants multi-villes ajoutés en `status='active'` avant revendication réelle par les restaurateurs (décision produit assumée) — bandeau "fiche non revendiquée" géré par `useRestaurant.js`/`isUnclaimed`
