# Handoff: Fennec — Design System (app d'anglais pour enfants algériens 7-10 ans)

## Overview
Système de design pour Fennec, PWA mobile-first d'apprentissage de l'anglais (compagnon quotidien de 15 min). Public : enfants arabophones, niveau vrai zéro. UI en arabe, contenu pédagogique en anglais. Palette recolorée aux couleurs du drapeau américain (marine/rouge/blanc) sur demande — variante "1d".

## About the Design Files
Les fichiers de ce dossier sont des **références de design en HTML** (prototypes visuels), pas du code de production. La tâche est de **recréer ces designs dans l'environnement du projet cible** (React Native/Expo, React web, Flutter, etc. selon la stack retenue), en utilisant les patterns et librairies déjà en place — ou en choisissant le framework le plus adapté si le projet démarre de zéro. Ne pas copier le HTML tel quel dans le produit final.

## Fidelity
**Haute fidélité (hifi)** : couleurs, typographie, espacements et layout sont définitifs. Recréer pixel-perfect dans l'environnement cible.

## Design Tokens

### Couleurs
- `bg-base` #F5F3EE — fond d'écran (jour uniquement, pas de dark mode)
- `surface-card` #FFFFFF — cartes, options, clavier
- `ink` #0A3161 — texte principal
- `primary / succès` #0A3161, soft `#E8EEF6` — réussite, progression, bouton "Vrai"
- `accent / mascotte / CTA` #B22234, soft `#FBE4E4` — haut-parleur, CTA principal, badges nouveauté
- `micro / action vive` #8C1D2C — bouton micro
- `erreur-douce` #EDEFF3 (fond) / #C7D0DE (bordure) — jamais rouge, neutre bleuté non punitif
- `border/ligne` #E3DFD6

### Typographie
- Baloo 2 (500/600/700/800) — tout texte visible
  - display-lg 28px/800, heading 20px/700, body 16px/600, caption 13px/600
- IBM Plex Mono (500/600) — réservé aux méta-infos (phases, compteurs), 11px/600 uppercase

### Espacement (base 4px)
xs 4 · sm 8 · md 16 · lg 24 · xl 32

### Rayons / ombres
- Cartes : radius 14-22px
- Boutons circulaires (haut-parleur/micro) : `box-shadow: 0 6px 0 <couleur foncée>` (effet bouton 3D pressable), état pressé = ombre réduite + translateY(4px)
- Bordures cartes-options : 3px solid

## Screens / Views
Voir le fichier HTML — 9 écrans + gabarits :
1. **Accueil de session** — mascotte fennec, titre, CTA plein largeur en bas
2. **Écoute → touche** — bouton haut-parleur circulaire en haut, grille 2×2 d'images-options
3. **Vrai / Faux** — carte phrase centrale, 2 boutons pleine largeur (vert-marine/rouge)
4. **Dire un mot** — mot cible, bouton micro circulaire avec halo actif, jauge vocale (barres)
5. **Construire une phrase** — emplacements en haut (dashed = vide), chips de mots à glisser en bas
6. **Phonics** — lettre en fond clair + tracé pointillé animé à suivre du doigt
7. **Victoire** — mascotte, compteur mots + précision, badge flamme hebdomadaire
8. **Fin de Boss réussi** — trophée, carte "message au parent" en arabe (RTL), CTA partage
9. **Boss à rejouer** — état neutre "marché fermé", barre panier partiellement remplie, CTA reprendre

### Gabarit commun (écran de session)
Haut : barre de progression en pastilles + bouton d'aide "؟" circulaire (bascule un encart en darja, RTL, fond `accent-soft`).
Centre : zone de contenu unique (un seul point d'action).
Bas : action principale pleine largeur.

### Gabarit Boss (distinct)
Bandeau plein marine avec ⭐ + compteur "x/12", barre "panier" à 12 cases en rouge qui se remplit, CTA en rouge — même famille visuelle, mode clairement différencié.

## Interactions & Behavior
- Bouton haut-parleur : tap → lecture audio, état pressé (ombre réduite, translateY)
- Carte-option : tap → si correct, bordure/fond passent à `primary-soft` + `primary`; si incorrect, la bonne réponse se montre en `erreur-douce` (jamais rouge, jamais croix, pas de son d'échec) puis reprise encourageante
- Micro : tap pour démarrer/arrêter l'enregistrement, halo `accent-soft` pendant l'écoute active, jauge vocale anime les barres en temps réel
- Chips de mots : drag-and-drop dans les emplacements ; CTA "Vérifier" désactivé (opacité 0.4) jusqu'à emplacements remplis
- Bouton "؟" : toggle d'un encart d'aide en arabe/darja, RTL
- Boss : progression alimente la barre panier (12 cases) ; à 12/12 → écran victoire Boss ; échec → écran "marché fermé", reprise le jour suivant ou après entraînement

## State Management
- Progression de session (index de phase courante / total)
- État de chaque exercice : non répondu / réussi / erreur montrée
- Compteurs cumulés : mots appris, précision %, série de jours (flamme)
- État Boss : cases remplies (0-12), disponibilité du Boss (quotidien/hebdo)
- Préférence langue d'interface (arabe fixe pour ce projet)

## Assets
Émojis utilisés comme placeholders d'illustration (🦊 mascotte, 🐱🐶🐦🐟 animaux, 🔊🎙️ icônes). À remplacer par les illustrations finales de la mascotte fennec et des scènes illustrées lors de l'implémentation — les émojis ne sont pas destinés à la production.

## Files
- `Fennec Design System - Complete.dc.html` — design système complet (tokens, composants avec états, gabarits, 9 écrans)
