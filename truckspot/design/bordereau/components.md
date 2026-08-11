# Bordereau — bibliothèque de composants

Direction validée, tampon vert conservé. Ce document décrit chaque composant
état par état, en référençant les tokens de `tokens.mobile.js` /
`tokens.admin.css` — rien ici n'est une valeur libre, tout pointe vers un
rôle déjà nommé.

Principe transversal : **rien ne s'arrondit au-delà de `radii.sm` (3px)**,
sauf la pilule d'avatar. Un bordereau ne flotte pas : les cartes se
distinguent par leur bordure (`colors.border`), pas par une ombre — seule une
feuille modale, qui recouvre réellement le contenu, reçoit `shadows.sheet`.

## Boutons

| Variante | Repos | Survol/pressé | Désactivé | Chargement |
|---|---|---|---|---|
| Primaire | fond `primary`, texte `textInverse`, `radii.xs` | fond `primaryDark` | opacité 0.4, pas de curseur | libellé remplacé par un indicateur, largeur figée pour ne pas sauter |
| Contour | fond transparent, bordure 1px `primary`, texte `primary` | fond `primarySoft` | bordure `border`, texte `textMuted` | idem primaire, indicateur `primary` |
| Texte (destructif) | texte `danger`, aucune bordure | soulignement `danger` | texte `textMuted` | — (jamais utilisé pour une action bloquante) |

Cible tactile minimum 44px de hauteur côté mobile, quelle que soit la
variante — hérité du brief initial, aucune direction n'a de raison d'y
déroger.

## Champs de saisie

- Étiquette au-dessus du champ, `typography.caption` (majuscules, lettre
  espacée) — c'est le vocabulaire du bordereau, l'étiquette de champ n'est
  jamais un placeholder.
- Repos : bordure 1px `border`, fond `surface`.
- Focus : bordure 1.5px `primary`, pas d'ombre de halo (une bordure plus
  épaisse suffit dans ce langage, un halo flouté romprait la logique "papier
  net").
- Erreur : bordure `danger`, message sous le champ en `typography.small`
  couleur `danger` — jamais seulement une bordure rouge sans texte.
- Désactivé : fond `surfaceMuted`, texte `textMuted`, bordure `border`.
- Recherche : même traitement, icône de loupe en `textMuted`, croix
  d'effacement seulement quand le champ n'est pas vide.

## Cartes / champs de document

Le composant central de cette direction : un groupe de champs encadrés,
étiquette au-dessus de la valeur, sur le modèle du mockup de comparaison
(route Alger → Oran).

- Conteneur : fond `surface`, bordure 1px `border`, `radii.sm`.
- Grille de champs internes : chaque champ a sa propre bordure `border`
  (grille pleine, pas de gouttière) — c'est ce qui fait lire "formulaire"
  plutôt que "liste".
- Chiffres (poids, volume, prix, kilométrage, immatriculation) toujours en
  `font-variant-numeric: tabular-nums`, jamais en police à chasse variable.
- État vide (aucun trajet, aucune mission) : même gabarit de carte, contenu
  remplacé par un message centré `textMuted` — ne pas faire disparaître le
  cadre, un bordereau vide reste un bordereau.

## Badges de statut

Deux traitements selon la règle de décision définie dans `tokens.mobile.js`
(`statusColors[...].sealed`) :

- **Non scellé** (`PENDING`, `IN_PROGRESS`, `SCHEDULED`, `CANCELLED`) —
  étiquette plate : bordure 1px `border`, texte dans la couleur sémantique du
  statut, fond transparent. Aucune rotation, aucun accent visuel au-delà de la
  couleur du texte.
- **Scellé** (`ACCEPTED`, `REJECTED`, `COMPLETED`, `VERIFIED`) — traitement
  "tampon" : bordure 1.5px dans la couleur sémantique, texte assorti,
  `transform: rotate(-2deg)`. Un seul tampon visible par écran — s'il y a une
  légende listant les autres statuts possibles, elle reste en traitement plat
  même pour un statut normalement scellé, pour ne pas multiplier l'effet.

Ne jamais coloriser le fond d'un badge dans cette direction (pas de
`successSoft` en fond de badge) : c'est le langage des directions A et C, pas
celui-ci — ici la couleur porte le texte et la bordure, jamais un aplat.

## Modales et feuilles

- Back-office : modale centrée, fond `surface`, bordure 1px `border`,
  `shadows.sheet` — c'est le seul endroit de l'interface où l'ombre
  apparaît, parce que l'élément recouvre réellement le contenu en dessous.
- Mobile : feuille remontant du bas (bottom sheet), même traitement d'ombre,
  poignée de tirage en `border`.
- Confirmation destructive (refuser un dossier, désactiver un compte) :
  même gabarit, le bouton de confirmation passe en variante "texte
  destructif" plutôt qu'en bouton primaire plein — la couleur d'alerte ne
  doit jamais porter le même poids visuel que l'action principale du
  bordereau.

## Bannières d'erreur / d'information

- Fond `dangerSoft` (seul endroit où un aplat de couleur douce est légitime
  dans cette direction — un avertissement n'est pas un statut, il n'a pas de
  vocation à ressembler à un tampon), bordure `danger`, icône et texte
  `danger`.
- Avec action de reprise : bouton "Réessayer" en variante contour, jamais
  primaire — l'action de reprise ne doit pas concurrencer l'action
  principale de l'écran.
- Sans action : texte seul, `typography.small`.

## Navigation

- Mobile (onglets bas) : icône + libellé, actif en `primary`, inactif en
  `textMuted`. Pas de pastille pleine derrière l'icône active — un simple
  changement de couleur suffit, cohérent avec le refus des aplats décoratifs.
- Back-office (barre latérale) : libellé + icône, ligne active signalée par
  une bordure gauche 2px `primary` (seul "rail" toléré dans toute cette
  direction, parce qu'il joue un rôle de repère de navigation, pas un
  repère de statut).

## Tableaux et pagination (back-office)

- En-tête de colonne : `typography.caption`, fond `surfaceMuted`, bordure
  basse 1px `borderDark`.
- Ligne : bordure basse 1px `border`, survol fond `surfaceHover`
  (`--surface-hover`).
- Chiffres alignés à droite, `tabular-nums`.
- Pied de pagination : numéros de page en boutons contour, page courante en
  bouton primaire plein — seule utilisation d'un fond primaire plein en
  dehors des boutons d'action.

## Indicateurs de chargement

- Spinner : trait `primary` sur fond transparent, pas de fond circulaire.
- Squelette de liste : blocs `surfaceMuted` de la hauteur d'une ligne de
  champ, pas d'animation de balayage lumineux (incompatible avec un
  vocabulaire "papier" — le papier ne scintille pas).
- Pied de défilement infini : même spinner, centré, `spacing.lg` de
  padding vertical.

## Notes de migration

- Composants mobile à ajuster en premier, par ordre de dépendance :
  `Badge.js`, `Button.js`, `Card.js`, `Input.js` — tous les écrans en
  héritent.
- Composants back-office équivalents : `Badge.jsx`, `Button.jsx`,
  `DataTable.jsx`, `SearchInput.jsx`.
- `TruckPin.js` et `TruckMap.js` (marqueur de camion sur la carte) n'ont pas
  d'équivalent direct dans cette direction — à concevoir séparément : un
  tampon rotatif n'a pas de sens épinglé sur une carte, il faudra une
  variante propre au marqueur plutôt qu'un réemploi du badge de statut.
