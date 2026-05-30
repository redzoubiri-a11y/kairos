# MIDA — Roadmap Redesign

## Contexte
L'app Mida existe déjà avec toute la logique métier (Supabase, navigation, APIs).
L'objectif est de refactoriser UNIQUEMENT le design en suivant les wireframes.

## Règle d'or
> Un écran à la fois. Tester sur téléphone avant de passer au suivant.

---

## PHASE 1 — Fondations (Jour 1)
**Objectif : Poser le design system avant de toucher aux écrans**

- [ ] Créer `src/theme.js` avec tous les tokens
- [ ] Créer `src/components/MButton.js` (4 variantes)
- [ ] Créer `src/components/MTag.js` (badges colorés)
- [ ] Créer `src/components/MInput.js` (champ de saisie)
- [ ] Créer `src/components/MCard.js` (carte restaurant)
- [ ] Créer `src/components/MToggle.js` (interrupteur)
- [ ] Créer `src/components/MNavBar.js` (tab bar custom)
- [ ] Créer `src/components/MHeader.js` (header d'écran)
- [ ] Créer `src/components/MStars.js` (notation étoiles)
- [ ] Créer `src/components/MLoader.js` (skeleton loading)

**Référence wireframe :** mida-transversal-wireframes.jsx → Design System

---

## PHASE 2 — Auth & Onboarding (Jour 2)
**Objectif : Premier contact avec l'app**

- [ ] `screens/OnboardingScreen.js` → 3 slides + choix type compte
- [ ] `screens/AuthScreen.js` → Login, Register (3 étapes), Verify SMS
- [ ] `screens/AuthScreen.js` → Mot de passe oublié + Reset

**Référence wireframe :** mida-auth-wireframes.jsx

---

## PHASE 3 — Côté Client Principal (Jours 3-4)
**Objectif : L'expérience principale du client**

- [ ] `screens/HomeScreen.js`
  - Header personnalisé
  - Filtres cuisine horizontaux
  - Cards restaurants "Disponible ce soir"
  - Section tendances
- [ ] `screens/SearchScreen.js`
  - Barre de recherche active
  - Filtres avancés (budget slider, note, cuisine, dispo)
  - Liste résultats avec tri
  - Suggestions intelligentes
- [ ] `screens/RestaurantScreen.js`
  - Photo hero + infos
  - Localisation avec carte
  - Menu populaire
  - Avis certifiés
  - Bouton réservation

**Référence wireframe :** mida-wireframes.jsx + mida-transversal-wireframes.jsx

---

## PHASE 4 — Réservation (Jour 4)
**Objectif : Le tunnel de conversion principal**

- [ ] `screens/ReservationFormScreen.js`
  - Étape 1 : Date / Heure / Couverts
  - Étape 2 : Coordonnées + récapitulatif
  - Étape 3 : Confirmation avec code
  - Gestion promo (-20%)
  - Politique d'annulation

**Référence wireframe :** mida-wireframes.jsx → ReservationScreen

---

## PHASE 5 — Profil Client (Jour 5)
**Objectif : Fidélisation et gestion du compte**

- [ ] `screens/FavorisScreen.js`
  - Liste favoris avec toggle dispo
  - État vide
- [ ] `screens/NotificationsScreen.js`
  - Notifications catégorisées
  - Badges non lus
  - État vide
- [ ] `screens/ProfilScreen.js`
  - Jauge de points + niveau
  - Historique réservations
  - Bons disponibles
  - Paramètres + déconnexion

**Référence wireframe :** mida-client-wireframes.jsx

---

## PHASE 6 — Dashboard Restaurateur (Jours 6-7)
**Objectif : Outil de gestion pro complet**

- [ ] `screens/ProDashboard.js`
  - KPIs du soir (réservations, couverts, CA)
  - Plan de salle interactif
  - Navigation vers sous-sections
- [ ] `screens/ProComptoir.js`
  - Liste réservations du jour
  - Filtres (à venir, en attente, passées)
  - Confirmer / Refuser
- [ ] Nouvel écran : `screens/ProMenuScreen.js`
  - Liste plats par catégorie
  - Toggle dispo/indispo
  - Ajouter / Modifier plat
- [ ] Nouvel écran : `screens/ProPromosScreen.js`
  - Créer promotion (%, montant, offert)
  - Activer / Suspendre
- [ ] Nouvel écran : `screens/ProAvisScreen.js`
  - Avis certifiés à répondre
  - Partage réseaux sociaux

**Référence wireframe :** mida-restaurateur-wireframes.jsx

---

## PHASE 7 — Carte & Transversal (Jour 8)
**Objectif : Finitions et états système**

- [ ] `screens/MapScreen.js` → Markers + bottom sheet
- [ ] `screens/ExplorerScreen.js` → Vue carte + liste
- [ ] États d'erreur (404, réseau, serveur)
- [ ] Écran de chargement (skeleton)
- [ ] Paramètres (langue, notifications, CGU)
- [ ] Aide & Support (FAQ + chat)

**Référence wireframe :** mida-transversal-wireframes.jsx

---

## PHASE 8 — Tests & Déploiement (Jour 9)
- [ ] Test complet sur iOS (Expo Go)
- [ ] Test complet sur Android (Expo Go)
- [ ] Test sur web (localhost:8081)
- [ ] Vérifier tous les flux Supabase
- [ ] Build de production : `npx expo build`
- [ ] Déploiement

---

## Prompt de démarrage pour Claude Code

```
Lis CLAUDE.md pour comprendre le projet.
Lis les wireframes dans /wireframes/ pour la référence visuelle.

Commence par la PHASE 1 :
1. Place le fichier theme.js fourni dans src/theme.js
2. Crée src/components/ avec les composants de base listés dans ROADMAP.md
3. Base-toi sur le Design System dans mida-transversal-wireframes.jsx

Règles :
- NE PAS modifier App.js ni supabase.js
- Garder toute la logique métier existante
- Utiliser uniquement les tokens de theme.js
- Tester chaque composant avant de passer au suivant
```
