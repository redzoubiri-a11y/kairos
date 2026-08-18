# Tasalle — Système de design

> Vos célébrations, notre passion
> **Tasalle · Algérie**

Référence unique et exhaustive du système visuel de Tasalle — l'équivalent
TheFork pour la réservation de salles des fêtes en Algérie. Chaque valeur ici
est **celle que le code exécute réellement** : elle vient de `src/theme.js`
et `src/lib/monogramme.js`, pas d'une réécriture séparée. Aucune couleur,
aucun espacement, aucun tracé de lettre ne peut diverger entre ce document et
l'application.

Ce document se suffit à lui-même : il peut servir de brief à un·e designer,
de mémoire de référence, ou être collé tel quel comme prompt de contexte pour
un outil de génération visuelle.

---

## 1 · Identité de marque

**Positionnement.** Application mobile et back-office de réservation de
salles des fêtes (mariages, fiançailles, anniversaires, conférences) pour le
marché algérien. Gratuite pour les familles ; 500 DA/mois par **propriétaire**
(et non par salle) après 90 jours d'essai.

**Ton.** Direct et graphique plutôt que cérémonieux — la marque suit le
système « Modernist » : un rouge vif unique sur un fond ivoire, une grille
franche, des angles droits partout (aucun rayon sauf les formes réellement
circulaires), une typo grotesque en capitales serrées pour les titres. Le
vocabulaire de l'interface est en français exclusivement — aucune traduction
anglaise ou arabe, aucun sens de lecture inversé.

**Verrouillage de marque.**

```
        ╭─────────╮
        │    TS   │      ← monogramme, filet circulaire + lettres en rouge
        ╰─────────╯
        T A S A L L E     ← mot-symbole, interlettrage large, encre de texte
        ───────────
          ALGÉRIE          ← mention pays, capitales, en rouge de marque
```

- Le **T** et le **S** se chevauchent : le S descend sous la ligne du T et
  mord sur son pied — un chevauchement de dessin, impossible à obtenir par un
  simple interlettrage.
- Les lettres sont des **tracés vectoriels** (glyphes de Liberation Serif,
  extraits en contours — hérités d'une piste visuelle antérieure abandonnée,
  jamais redessinés depuis car déjà soignés), jamais du texte rendu : une
  marque ne peut pas dépendre des polices installées sur l'appareil qui
  l'affiche. Le même fichier (`src/lib/monogramme.js`) alimente l'app, les
  gabarits PDF (contrat, planning, facture) et le générateur d'icônes des
  stores — un seul dessin, trois sorties. Seules la couleur (`logoInk`) et la
  police du mot-symbole (Archivo, comme le reste de l'app) suivent Modernist
  — la marque et l'interface parlent désormais d'une seule voix.
- Repère de coordonnées : carré `0 0 100 100`. Filet circulaire : centre
  `(50, 50)`, rayon `47.2`, épaisseur de trait `1.6`.
- **Lisible jusqu'à 20 px.** En dessous, le filet se referme visuellement —
  utiliser le mot-symbole seul.
- Le mot-symbole porte un **interlettrage large** (signature du verrouillage)
  et un **filet horizontal** séparant « TASALLE » de « ALGÉRIE ».
- **Exemption WCAG** : le monogramme est un logotype, exempté du critère de
  contraste 1.4.3. Son rouge (`logoInk`, 3,76:1 sur le fond clair) ne doit
  **jamais** migrer vers une couleur de texte d'interface — voir §2.1.

---

## 2 · Palette

### 2.1 · La règle des rôles du rouge

La palette est celle de Modernist : **mono-teinte**, un seul rouge de marque
décliné en rôles, plus des neutres chauds. (Les jetons gardent leurs noms
historiques `gold`/`goldText`/`goldMark` — hérités d'une palette dorée
antérieure — mais portent aujourd'hui le rouge `#EC3013`, pas de l'or ; ne
pas se fier au nom du jeton pour deviner la teinte.)

Le rouge de marque, `#EC3013`, ne peut pas tout faire : en aplat portant le
texte de fond (la vraie recette de `.btn-primary` de Modernist) il ne tient
que **3,76:1**, sous le seuil de 4,5:1 que WCAG 2.1 demande à du texte de
corps. D'où **des jetons distincts** pour chaque rôle :

| Jeton | Rôle | Peut être utilisé pour… |
|---|---|---|
| `primary` / `gold` | **Décor et aplats** | Fonds de boutons pleins, logo, grands éléments — jamais du texte de corps |
| `primaryInk` (`#AE1800`) | **Ce qui s'écrit** | Texte de marque, montants, onglet actif — 5,91:1 sur les cartes |
| `goldText` (`#7C1405`) | **Texte sur fond pâle** | La vraie couleur de texte de `.tag-accent` — 9,59:1 sur le fond de page |
| `goldMark` (`#DD2B0F`) | **Objets graphiques porteurs d'information** | Étoiles de notation, barres de graphique, puces — 3,91:1, au-dessus du seuil non-texte de 1.4.11 |
| `accent` / `accentInk` | **Erreur, refus, annulation** | Rouge distinct du rouge de marque (voir §2.2) — `accent` reste l'aplat, `accentInk` porte le texte/les icônes |

Un test verrouille cette frontière **dans les deux sens** : `logoInk` doit
rester sous le seuil des composants (pour ne jamais devenir un texte lisible
par erreur), `goldText` doit rester au-dessus. Promouvoir l'un à la place de
l'autre fait échouer la suite (`src/theme.test.js`).

### 2.2 · Thème clair

**Primaires — le rouge de marque en aplat**

| Jeton | Valeur | Contraste | Usage |
|---|---|---|---|
| `primary` | `#EC3013` | 3,76:1 (texte de fond dessus) | Aplats de boutons pleins |
| `primaryDark` | `#AE1800` | — | État pressé (`:active`) |
| `onPrimary` | `#F3F2F2` | — | Ce qui s'inscrit sur un aplat `primary` — le fond clair de la marque, pas du blanc en dur |
| `primaryLight` | `#FFF2EF` | — | Fond doux (badges, zones actives) |
| `primaryInk` | `#AE1800` | 5,91:1 (sur `surface`) / 6,41:1 (sur `cream`) | Texte de marque, montants, liens |

**Rouge de la marque (jetons nommés « gold », historiques)**

| Jeton | Valeur | Contraste | Usage |
|---|---|---|---|
| `gold` | `#EC3013` | 3,47:1 (sur `surface`) / 4,20:1 (blanc dessus) | **Décor et logo uniquement** |
| `goldMark` | `#DD2B0F` | 3,91:1 (sur `surface`) / 4,34:1 (sur `goldLight`) | Étoiles, barres, puces porteuses d'info |
| `goldText` | `#7C1405` | 9,59:1 (sur `cream`) | Texte sur fond pâle (`.tag-accent`) |
| `goldLight` | `#FFF2EF` | — | Fond de badge « premium » |

**Secondaires et accents**

| Jeton | Valeur | Contraste | Usage |
|---|---|---|---|
| `secondary` | `#71261B` | 8,69:1 (sur `surface`) | Brun-rouge, assez sombre pour du texte |
| `secondaryLight` | `#FFF2EF` | — | Fond associé |
| `accent` | `#B3341F` | 5,06:1 (sur `surface`) / 6,13:1 (blanc dessus) | Aplat plein (bouton « accent », badge de notif) |
| `accentInk` | `#B3341F` | *(même valeur qu'`accent` en clair)* | Texte/icônes d'erreur — se sépare d'`accent` en thème sombre, voir §2.3 |
| `accentLight` | `#FDECEA` | — | Fond d'alerte douce |
| `info` | `#3B82F6` | 3,04:1 (sur `surface`) | Liens informatifs |

> `accent` n'existe pas dans Modernist (un kit générique n'a pas de rôle
> « danger ») — seul jeton de cette liste qui n'est pas repris tel quel d'un
> fichier source. Assombri à `#B3341F` pour tenir 4,5:1 en texte de corps et
> rester distinct du rouge de marque.

**Neutres**

| Jeton | Valeur | Contraste | Usage |
|---|---|---|---|
| `dark` | `#201E1D` | 14,86:1 (sur `cream`) | Texte principal |
| `warmGray` | `rgba(32,30,29,0.55)` | ≈3,66:1 (sur `cream`) | Texte secondaire, placeholders |
| `border` | `rgba(32,30,29,0.4)` | — | Séparateurs — une superposition translucide, pas un gris plat |
| `cream` | `#F3F2F2` | — | Fond de page |
| `surface` | `#EAE9E9` | 1,08:1 vs `cream` | Fond de carte — une nuance à peine plus grise que le fond de page ; les cartes n'ont **pas** de bordure (voir §4), c'est cette légère différence de teinte + l'ombre qui les détache |
| `surfaceElevated` | `#F8F4F4` | — | Fond légèrement surélevé (lignes alternées) |

**Dérivés (fonds de badge)**

| Jeton | Valeur |
|---|---|
| `successBg` | `rgba(174,24,0,0.10)` |
| `warningBg` | `rgba(236,48,19,0.18)` |
| `dangerBg` | `rgba(179,52,31,0.12)` |
| `infoBg` | `rgba(59,130,246,0.12)` |
| `overlay` | `rgba(0,0,0,0.55)` |
| `skeleton` | `#EAE7E7` |

**Marque (logo)**

| Jeton | Valeur | Usage |
|---|---|---|
| `logoInk` | `#EC3013` | Monogramme et filet — identique à `gold`/`primary`, 3,76:1, exempté (logotype, WCAG 1.4.3) |
| `logoWordmark` | `#201E1D` | Mot-symbole « TASALLE » — 14,86:1 sur `cream` |
| `logoCanvas` | `#F8F4F4` | Fond des icônes de store et de l'écran de lancement |

**Graphiques**

| Jeton | Valeur | Note |
|---|---|---|
| `chartInk` | `#AE1800` | Toutes les séries dans la **même** encre — 5,91:1 sur `surface` |
| `chartGrid` | `rgba(32,30,29,0.08)` | Grille discrète |

> Les répartitions (camemberts, séries) sont rendues en **lignes libellées
> mono-teinte**, jamais en palette catégorielle : Modernist n'a qu'une seule
> couleur de marque, il n'y a pas de palette catégorielle à disposition.
> L'identité de la donnée passe par le texte, pas la couleur.

### 2.3 · Thème sombre

Modernist ne publie pas de variante sombre — ce thème est une extrapolation,
construite sur les mêmes paliers de rampe que le clair (`accent-100…900`),
pas sur des valeurs inventées. **Les rôles s'inversent** : un aplat rouge
profond se fondrait sur fond sombre, donc un palier clair de la rampe
remplit, et le texte sombre s'y inscrit.

| Jeton | Valeur | Contraste | Note |
|---|---|---|---|
| `primary` | `#FFC4B8` (accent-300) | 10,94:1 (aplat/`onPrimary`) | Un palier clair remplit les aplats |
| `onPrimary` | `#201E1D` | 10,94:1 | Le texte sombre s'y inscrit |
| `primaryDark` | `#FF9783` (accent-400) | — | |
| `primaryInk` | `#FFC4B8` | 9,28:1 (sur `surface`) / 10,94:1 (sur `cream`) | |
| `secondary` | `#FFC4B8` | — | Éclairci pour rester lisible |
| `goldMark` | `#FF9783` | 6,71:1 (sur `surface`) / 7,91:1 (sur `cream`) | |
| `goldText` | `#FFC4B8` | 9,66:1 (sur `goldLight`) / 9,31:1 (sur `warningBg`) | Sinon le texte se fondrait dans son propre fond assombri — bug réel corrigé le 18/08/2026 |
| `accent` | `#B3341F` *(inchangé)* | 6,13:1 (blanc dessus) | **Reste sombre** : seul jeton de cette liste qui NE s'inverse PAS — il sert d'aplat plein portant du texte blanc (bouton « accent », badge de notif), inverser l'aurait cassé |
| `accentInk` | `#FF9783` (accent-400) | 7,30:1 (sur `dangerBg`) / 6,92:1 (sur `accentLight`) / 6,71:1 (sur `surface`) | Porte le rôle d'encre (texte, icônes, badge « danger ») là où `accent` ne peut pas s'inverser |
| `chartInk` | `#FFC4B8` | 9,28:1 (sur `surface`) | |
| `dark` | `#F8F4F4` | 15,21:1 (sur `cream`) | Texte principal |
| `surface` | `#2D2B2B` | | |
| `surfaceElevated` | `#201E1D` | | |
| `border` | `#444141` | | |
| `cream` | `#201E1D` | | Fond de page |
| `warmGray` | `#9B9797` | 4,87:1 (sur `surface`) | |
| `logoWordmark` | `#F8F4F4` | 15,21:1 (sur `cream`) | Le mot-symbole s'inverse : sombre devient clair |
| `logoCanvas` | `#201E1D` | | |
| `logoInk` | *(non redéfini — reste `#EC3013`)* | 3,95:1 (sur `cream` sombre) | Le monogramme garde la même teinte dans les deux thèmes, comme toute marque |

**Piège vérifié par les tests** : un même jeton ne peut pas toujours
s'inverser en bloc. `accent` joue deux rôles incompatibles — aplat plein
(besoin de rester sombre pour porter du blanc) et encre de texte (besoin de
s'éclaircir pour rester lisible sur son fond assombri). D'où le jeton
`accentInk`, séparé, qui porte spécifiquement le second rôle. Voir
`src/theme.test.js`, describe `'contraste du thème sombre'`.

### 2.4 · Dégradés de repli (photos de salle)

Quand une salle n'a pas de photo, un dégradé déterministe (fonction de hash
sur l'identifiant) porte son initiale — jamais deux salles voisines avec le
même fond, jamais de flash de contenu au chargement (`src/components/SallePhoto.js`) :

```
#8B6914 → #BE9A5E     #C8956C → #E0B48F     #BE9A5E → #E8C989
#3A2E14 → #8C6D4A     #6B5B4A → #A89684     #5C4A2E → #A8834A
```

Cette palette de repli reste dans une gamme chaude ambrée héritée d'une
itération antérieure — délibérément **distincte** du rouge vif de l'interface
Modernist : un dégradé de la même intensité que le rouge de marque aurait
été trop criard répété sur toute une grille de cartes. Un bleu franc,
testé plus tôt, jurait au milieu des cartes ; celui-ci reste écarté.

---

## 3 · Typographie

**Archivo (Google Fonts), embarquée** — `@expo-google-fonts/archivo`,
chargée dans `ThemeContext.js`. Une seule famille pour toute l'app, y
compris le mot-symbole de la marque (voir §1) : l'interface et la marque
parlent désormais d'une seule voix, depuis l'abandon d'une piste visuelle
antérieure qui donnait une police serif distincte au logo.

Trois graisses réellement utilisées dans le code — `Archivo_400Regular`,
`Archivo_600SemiBold`, `Archivo_800ExtraBold` — jamais de 500 ni de 700 :

| Jeton | Taille | Poids | Interligne | Usage |
|---|---|---|---|---|
| `hero` | 42 px | 800 | 46 px | Écrans de succès, montants héros |
| `h1` | 32 px | 800 | 37 px | Titres d'écran majeurs |
| `h2` | 25 px | 800 | 30 px | Titres de section |
| `h3` | 20 px | 800 | 26 px | Sous-titres, clavier PIN |
| `title` | 17 px | 800 | 20 px | Titres de carte, noms de salle |
| `body` | 15 px | 400 | 23 px | Texte courant |
| `secondary` | 14 px | 400 | 21 px | Texte de support, métadonnées |
| `caption` | 13 px | 400 | 18 px | Étiquettes, badges, légendes |

Ces huit rôles viennent directement de `styles.css` (Modernist) : `h1`…`h4`
pour `hero`…`h3`, `.card-title` pour `title`, `body` pour `body`.

**600 SemiBold, hors du tableau de rôles** : utilisé à la pièce (pas un
jeton `typography` dédié) pour des éléments courts et denses — badge de
notification, note en étoile, prix affiché, numéro d'étape, initiale
d'avatar. Toujours `Archivo_600SemiBold`, jamais un poids intermédiaire
improvisé.

**800 ExtraBold est aussi la police des boutons** (`.btn { font-family:
var(--font-heading); font-weight: var(--font-heading-weight) }` dans
Modernist) — tous les boutons prennent la graisse des titres, jamais celle
du corps de texte.

---

## 4 · Espacements, rayons, élévation

**Espacements** — une échelle unique de 4 à 32 px, aucune valeur de mise en
page ne sort de cette table :

| `xs` | `sm` | `md` | `lg` | `xl` | `xxl` | `xxxl` |
|---|---|---|---|---|---|---|
| 4 px | 8 px | 12 px | 16 px | 20 px | 24 px | 32 px |

**Rayons** — Modernist n'arrondit rien : `--radius-sm/md/lg: 0px` les trois,
sans exception, dans le fichier source. Tout est carré, y compris boutons et
champs de saisie :

| `xs` | `sm` | `md` | `lg` | `xl` | `xxl` | `pill` |
|---|---|---|---|---|---|---|
| 0 px | 0 px | 0 px | 0 px | 0 px | 0 px | 999 px |

`pill` (999) n'existe pas dans la source Modernist — elle ne sert plus qu'aux
formes réellement circulaires (avatars, pastilles), jamais aux capsules de
texte, puisque Modernist n'a aucune forme en pilule.

**Élévation** — deux ombres, teintées d'encre plutôt que de noir pur
(`shadowColor: #2D2B2B`, le neutre le plus sombre de la rampe — « soft
ink-tinted shadows », comme le dit `styles.css`). Les cartes n'ont **pas**
de bordure (la source ne leur en donne aucune) : c'est la légère différence
de teinte `surface`/`cream` (§2.2) plus cette ombre qui les détachent du
fond — pas un contour.

| Nom | Usage | Spec |
|---|---|---|
| `card` | Carte au-dessus du fond de page | `shadowColor #2D2B2B, opacity .16, radius 10, offset (0,3), elevation 3` |
| `sticky` | Barre collée en bas d'écran | `shadowColor #2D2B2B, opacity .22, radius 32, offset (0,-12), elevation 8` |

**Tailles de référence**

| Jeton | Valeur | Usage |
|---|---|---|
| `cardPhoto` | 140 px | Photo dans la carte de salle (grille) |
| `rowPhoto` | 140 px | Photo dans la ligne de salle (liste de recherche) |
| `galleryHeight` | 260 px | Galerie de la fiche salle |
| `avatar` | 40 px | Avatar utilisateur |
| `tabBar` | 62 px | Hauteur de la barre d'onglets |

---

## 5 · Iconographie

Ionicons (jeu *outline*), 24×24, traits arrondis, épaisseur 2. Aucune fonte
d'icônes en dur dans les couleurs de marque : les icônes héritent toujours
la couleur du texte qui les accompagne (`currentColor`).

> Note pour toute prévisualisation HTML/statique du système : embarquer les
> 390 Ko de la fonte Ionicons par page serait disproportionné. Un jeu de
> substitution en SVG inline, au même style (contour, extrémités arrondies),
> suffit à juger la mise en forme — ce n'est pas la fonte réelle, seule
> l'application la charge.

---

## 6 · Composants

Vingt objets couvrent l'interface, en trois familles.

**Fondations** — couleurs · typographie · espacements et rayons · marque

**Composants génériques**

| Composant | Variantes / états couverts |
|---|---|
| Boutons | 5 tons (primary, secondary, accent, ghost, gold) × 3 tailles, avec icône, désactivé, pleine largeur |
| Champs de saisie | repos, focus (contour rouge de marque), erreur (contour rouge d'erreur), avec aide, avec icône, fantôme |
| Badges et puces | 6 tons de badge (succès, attente, danger, info, or, neutre) ; puces de filtre actives/inactives |
| Cartes et listes | carte simple, carte plate à lignes séparées, titre de section |
| États d'écran | chargement, vide, erreur, bandeau hors ligne horodaté |
| Progression | barre de progression (3 tons), fil d'étapes (Date → Formule → Infos → Envoi) |
| Notation | étoiles pleines/vides (jamais la couleur seule), répartition par note |
| Code PIN | points de progression (vide/rempli/erreur), clavier 3×4 |
| Calendrier | grille lundi-first sur 6 semaines, 5 états de jour, légende |
| Sélecteur de salle | fermé / ouvert, coche sur la salle active — masqué sous 2 salles |

**Composants métier**

| Composant | Rôle |
|---|---|
| Carte de salle | Unité de la recherche et de l'accueil ; dégradé de repli si pas de photo |
| Ligne de salle | Variante horizontale, résultats de recherche, favori en cœur plein/creux |
| Carte de réservation | Porte ses propres actions (confirmer/refuser/appeler) — la liste ne se déplie pas |
| Indicateurs | KPI, histogramme mensuel, répartition par type d'événement — mono-teinte, jamais catégoriel |
| Code promo | Saisie, refus, application — la remise affichée est un aperçu, jamais la source de vérité du montant facturé |
| Parrainage | Code à alphabet restreint (voir §7), récompense conditionnée à la validation |

---

## 7 · Principes de conception

1. **Aucune couleur en dur.** Toute valeur de style vient de `src/theme.js` ;
   c'est vérifié par des tests, pas seulement recommandé.
2. **La teinte et l'ombre font le relief, pas le contour.** Modernist ne
   donne aucune bordure à ses cartes ; c'est une nuance de gris à peine plus
   soutenue (`surface` vs `cream`) plus une ombre teintée d'encre qui les
   détache du fond (§4) — l'inverse de l'ancienne convention « contour sans
   ombre » de ce projet.
3. **La couleur n'est jamais seule porteuse de sens.** Étoiles : forme
   (pleine/vide) + couleur. Statuts : libellé en toutes lettres + badge,
   jamais une pastille seule. Séries de graphique : libellé + une seule
   encre.
4. **Un seul rouge, des rôles distincts** (§2.1) — la distinction la plus
   spécifique de ce système, verrouillée par des tests dans les deux sens
   pour le thème clair ET le thème sombre (où certains rôles s'inversent et
   d'autres non — §2.3).
5. **Français exclusivement.** Pas de bilinguisme français/arabe, pas de
   mécanique RTL : le public cible est francophone, et une langue que
   personne ne lit coûte à chaque écran sans rien apporter. Le passage par
   une fonction `t()` est conservé malgré la langue unique, pour garder tout
   texte visible dans un seul fichier — un test vérifie qu'aucun libellé
   n'est écrit en dur dans le JSX.
6. **Un alphabet de code sans ambiguïté.** Les codes qui se dictent au
   téléphone ou se recopient d'un SMS (parrainage) excluent `0`/`O` et
   `1`/`I`/`L` — la confusion visuelle ou orale entre ces caractères a un
   coût direct en support.
7. **Une donnée périmée le dit.** Un écran qui affiche une copie hors ligne
   porte la date de cette copie ; sans elle, un utilisateur ne saurait pas
   si ce qu'il lit est encore vrai.
8. **Accessibilité WCAG 2.1 AA**, vérifiée et non supposée : texte ≥ 4,5:1,
   composants et objets graphiques porteurs d'information ≥ 3:1 (1.4.11),
   logotypes exemptés (1.4.3) mais jamais promus en couleur de texte. Vérifié
   séparément pour le thème clair et le thème sombre — un jeton qui tient le
   seuil en clair peut y échouer en sombre si son fond s'inverse et pas lui
   (§2.3).

---

*Généré à partir de `src/theme.js` et `src/lib/monogramme.js` — toute
modification de la palette ou des tracés doit se faire dans ces fichiers ;
ce document n'est qu'une lecture. Dernière synchronisation : 18/08/2026,
après l'abandon de la piste « Broadsheet » et la correction du contraste en
thème sombre.*
