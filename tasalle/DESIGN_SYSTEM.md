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

**Ton.** Sobre et chaleureux plutôt qu'ostentatoire. La marque évoque la
cérémonie et la fête sans tomber dans le doré criard : un noir profond, un or
mesuré, beaucoup de blanc. Le vocabulaire de l'interface est en français
exclusivement — aucune traduction anglaise ou arabe, aucun sens de lecture
inversé.

**Verrouillage de marque.**

```
        ╭─────────╮
        │    TS   │      ← monogramme, filet circulaire + lettres en or
        ╰─────────╯
        T A S A L L E     ← mot-symbole, interlettrage large, encre de texte
        ───────────
          ALGÉRIE          ← mention pays, capitales, en or
```

- Le **T** et le **S** se chevauchent : le S descend sous la ligne du T et
  mord sur son pied — un chevauchement de dessin, impossible à obtenir par un
  simple interlettrage.
- Les lettres sont des **tracés vectoriels** (glyphes de Liberation Serif,
  extraits en contours), jamais du texte rendu : une marque ne peut pas
  dépendre des polices installées sur l'appareil qui l'affiche. Le même
  fichier (`src/lib/monogramme.js`) alimente l'app, les gabarits PDF
  (contrat, planning, facture) et le générateur d'icônes des stores — un seul
  dessin, trois sorties.
- Repère de coordonnées : carré `0 0 100 100`. Filet circulaire : centre
  `(50, 50)`, rayon `47.2`, épaisseur de trait `1.6`.
- **Lisible jusqu'à 20 px.** En dessous, le filet se referme visuellement —
  utiliser le mot-symbole seul.
- Le mot-symbole porte un **interlettrage large** (signature du verrouillage)
  et un **filet horizontal** séparant « TASALLE » de « ALGÉRIE ».
- **Exemption WCAG** : le monogramme est un logotype, exempté du critère de
  contraste 1.4.3. Son or (`logoInk`, 2,63:1 sur blanc) ne doit **jamais**
  migrer vers une couleur de texte d'interface — voir §3.4.

---

## 2 · Palette

### 2.1 · La règle des trois ors

La palette est celle du logo : **noir et or**, rien d'autre. (L'émeraude du
cahier des charges d'origine a été écartée — la marque ne la porte pas.)

L'or de marque, `#BE9A5E`, ne peut pas tout faire : il ne fait que **2,63:1**
sur blanc, bien sous le seuil de 4,5:1 que WCAG 2.1 demande à du texte. D'où
**trois jetons distincts** là où une palette plus permissive n'en
demanderait qu'un :

| Jeton | Rôle | Peut être utilisé pour… |
|---|---|---|
| `primary` (noir) | **Aplats** | Fonds de boutons, d'onglets actifs — porte du blanc à 17,4:1 |
| `primaryInk` / `goldText` (or profond) | **Ce qui s'écrit** | Texte de marque, montants, liens, icônes actives — 5,09:1 |
| `gold` (or de marque) | **Décor et logo uniquement** | Le monogramme, un filet, un dégradé — jamais du texte, jamais un composant porteur d'information |
| `goldMark` (or assombri) | **Objets graphiques porteurs d'information** | Étoiles de notation, barres de graphique, puces — 3,49:1, au-dessus du seuil non-texte de 1.4.11 |

Un test verrouille cette frontière **dans les deux sens** : `logoInk` doit
rester sous le seuil des composants (pour ne jamais devenir un texte lisible
par erreur), `goldText` doit rester au-dessus. Promouvoir l'un à la place de
l'autre fait échouer la suite.

### 2.2 · Thème clair

**Primaires — le noir du mot-symbole**

| Jeton | Valeur | Contraste | Usage |
|---|---|---|---|
| `primary` | `#1A1A1A` | 17,4:1 (sur blanc) | Aplats de boutons, onglet actif |
| `primaryDark` | `#000000` | 21:1 | Variante la plus sombre |
| `onPrimary` | `#FFFFFF` | — | Texte/icônes sur un aplat `primary` |
| `primaryLight` | `#F7F2E8` | 1,12:1 | Fond doux (badges, zones actives) |
| `primaryInk` | `#8B6914` | 5,09:1 | Texte de marque, montants, liens |

**Or de la marque**

| Jeton | Valeur | Contraste | Usage |
|---|---|---|---|
| `gold` | `#BE9A5E` | 2,63:1 | **Décor et logo uniquement** |
| `goldMark` | `#A8834A` | 3,49:1 | Étoiles, barres, puces porteuses d'info |
| `goldText` | `#8B6914` | 5,09:1 | Texte doré (= `primaryInk`) |
| `goldLight` | `#FAF5EC` | 1,09:1 | Fond de badge « premium » |

**Secondaires et accents**

| Jeton | Valeur | Contraste | Usage |
|---|---|---|---|
| `secondary` | `#8C6D4A` | 4,77:1 | Brun doré, assez sombre pour du texte |
| `secondaryLight` | `#F6F0E7` | 1,13:1 | Fond associé |
| `accent` | `#C0392B` | 5,44:1 (texte et aplat) | Erreur, refus, annulation |
| `accentLight` | `#FDECEA` | 1,14:1 | Fond d'alerte douce |
| `info` | `#3B82F6` | 3,68:1 | Liens informatifs, badge « terminé » |

> `accent` a été assombri de `#D94E3B` (4,12:1, sous le seuil) à `#C0392B`
> (5,44:1) — l'ancien rouge échouait aussi bien en texte sur blanc qu'en
> aplat portant du blanc.

**Neutres**

| Jeton | Valeur | Contraste | Usage |
|---|---|---|---|
| `dark` | `#1A1A1A` | 17,4:1 | Texte principal |
| `warmGray` | `#8B7E72` | 3,94:1 | Texte secondaire, placeholders |
| `border` | `#E8E4DF` | 1,27:1 | Contours 1 px (cartes, champs) |
| `cream` / `surface` | `#FFFFFF` | — | Fond de page et fond de carte — **identiques** ; c'est le contour qui détache une carte, pas une ombre |
| `surfaceElevated` | `#FAFAF8` | 1,05:1 | Fond légèrement surélevé (lignes alternées) |

**Dérivés (fonds de badge)**

| Jeton | Valeur |
|---|---|
| `successBg` | `rgba(139,105,20,0.10)` |
| `warningBg` | `rgba(190,154,94,0.18)` |
| `dangerBg` | `rgba(192,57,43,0.12)` |
| `infoBg` | `rgba(59,130,246,0.12)` |
| `overlay` | `rgba(0,0,0,0.55)` |
| `skeleton` | `#EFEBE5` |

**Marque (logo)**

| Jeton | Valeur | Usage |
|---|---|---|
| `logoInk` | `#BE9A5E` | Monogramme et filet — 2,63:1, exempté (logotype, WCAG 1.4.3) |
| `logoWordmark` | `#1A1A1A` | Mot-symbole « TASALLE » |
| `logoCanvas` | `#F1EFEA` | Fond des icônes de store et de l'écran de lancement |

**Graphiques**

| Jeton | Valeur | Note |
|---|---|---|
| `chartInk` | `#8B6914` | Toutes les séries dans la **même** encre |
| `chartGrid` | `rgba(26,26,26,0.08)` | Grille discrète |

> Les répartitions (camemberts, séries) sont rendues en **lignes libellées
> mono-teinte**, jamais en palette catégorielle : les teintes chaudes de la
> marque sont trop proches (ΔE < 15 en vision normale) pour être
> distinguées à l'œil. L'identité de la donnée passe par le texte, pas la
> couleur.

### 2.3 · Thème sombre

Seuls les neutres changent ; les accents (`accent`, `info`) restent
identiques. **Les rôles de la marque s'inversent** : un aplat noir
disparaîtrait sur fond sombre, donc c'est l'or qui remplit, et le noir qui
s'y inscrit.

| Jeton | Valeur | Contraste | Note |
|---|---|---|---|
| `primary` | `#BE9A5E` | 6,61:1 (sur fond) | L'or remplit les aplats |
| `onPrimary` | `#1A1A1A` | 6,61:1 | Le noir s'y inscrit |
| `primaryDark` | `#A8834A` | — | |
| `primaryInk` | `#BE9A5E` | 6,61:1 / 5,45:1 sur carte | L'or de marque devient lisible en texte sur fond sombre |
| `secondary` | `#C9A96A` | — | Éclairci pour rester lisible |
| `goldMark` | `#BE9A5E` | largement > 3:1 | Les étoiles reprennent la teinte pleine |
| `dark` | `#FFFFFF` | | Texte principal |
| `surface` | `#2A2A2A` | | |
| `surfaceElevated` | `#1A1A1A` | | |
| `border` | `#3A3A3A` | | |
| `cream` | `#1A1A1A` | | Fond de page |
| `warmGray` | `#A9A099` | | |
| `logoWordmark` | `#FFFFFF` | | Le mot-symbole s'inverse : noir devient blanc |
| `logoCanvas` | `#1A1A1A` | | |
| `logoInk` | *(non redéfini — reste `#BE9A5E`)* | | Le monogramme garde le même or dans les deux thèmes, comme toute marque — il y gagne même en lisibilité |

Fonds de badge en thème sombre : `primaryLight` / `secondaryLight` /
`goldLight` deviennent `rgba(190,154,94,0.20 / 0.14 / 0.14)` ;
`accentLight` devient `rgba(192,57,43,0.20)` ; `successBg` / `warningBg`
convergent toutes deux vers `rgba(190,154,94,0.18)`.

### 2.4 · Dégradés de repli (photos de salle)

Quand une salle n'a pas de photo, un dégradé déterministe (fonction de hash
sur l'identifiant) porte son initiale — jamais deux salles voisines avec le
même fond, jamais de flash de contenu au chargement :

```
#8B6914 → #BE9A5E     #C8956C → #E0B48F     #BE9A5E → #E8C989
#3A2E14 → #8C6D4A     #6B5B4A → #A89684     #5C4A2E → #A8834A
```

Toutes dans la gamme chaude de la marque — un bleu franc, hérité d'une
première itération, jurait au milieu des cartes.

---

## 3 · Typographie

**Police système uniquement — aucune fonte n'est embarquée.** Sur un parc
d'appareils Android d'entrée de gamme et des connexions lentes (le cœur de
cible), chaque fonte téléchargée retarde le premier affichage.

| Jeton | Taille | Poids | Interligne | Usage |
|---|---|---|---|---|
| `hero` | 42 px | 500 | 46 px | Écrans de succès, montants héros |
| `h1` | 32 px | 500 | 37 px | Titres d'écran majeurs |
| `h2` | 24 px | 500 | 29 px | Titres de section |
| `h3` | 20 px | 500 | 26 px | Sous-titres, clavier PIN |
| `title` | 17 px | 500 | 24 px | Titres de carte, noms de salle |
| `body` | 16 px | 400 | 24 px | Texte courant |
| `secondary` | 14 px | 400 | 21 px | Texte de support, métadonnées |
| `caption` | 12 px | 500 | 17 px | Étiquettes, badges, légendes |

Aucun poids en dehors de 400/500 : pas de gras appuyé, cohérent avec le ton
sobre de la marque.

---

## 4 · Espacements, rayons, élévation

**Espacements** — une échelle unique de 4 à 32 px, aucune valeur de mise en
page ne sort de cette table :

| `xs` | `sm` | `md` | `lg` | `xl` | `xxl` | `xxxl` |
|---|---|---|---|---|---|---|
| 4 px | 8 px | 12 px | 16 px | 20 px | 24 px | 32 px |

**Rayons** — sept valeurs, du carré adouci à la pastille :

| `xs` | `sm` | `md` | `lg` | `xl` | `xxl` | `pill` |
|---|---|---|---|---|---|---|
| 4 px | 6 px | 8 px | 10 px | 12 px | 16 px | 999 px |

**Élévation** — deux ombres seulement, et l'usage par défaut est de **ne pas
en mettre** : le fond de page et le fond des cartes sont tous deux blancs en
thème clair, c'est un contour de 1 px (`border`) qui détache une carte, pas
une ombre. Le choix vient des écrans bon marché, où une ombre légère
disparaît ou se pixellise.

| Nom | Usage | Spec |
|---|---|---|
| `card` | Carte au-dessus d'un fond non blanc, élément pressé | `shadowOpacity .08, radius 12, offset (0,4), elevation 3` |
| `sticky` | Barre collée en bas d'écran | `shadowOpacity .10, radius 16, offset (0,-2), elevation 8` |

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
| Champs de saisie | repos, focus (contour or), erreur (contour rouge), avec aide, avec icône, fantôme |
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
2. **Le contour fait le relief, pas l'ombre.** Compatible avec des écrans bon
   marché et des rendus dégradés.
3. **La couleur n'est jamais seule porteuse de sens.** Étoiles : forme
   (pleine/vide) + couleur. Statuts : libellé en toutes lettres + badge,
   jamais une pastille seule. Séries de graphique : libellé + une seule
   encre.
4. **Trois ors, un seul rôle chacun** (§2.1) — la distinction la plus
   spécifique de ce système, verrouillée par des tests dans les deux sens.
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
   logotypes exemptés (1.4.3) mais jamais promus en couleur de texte.

---

*Généré à partir de `src/theme.js` et `src/lib/monogramme.js` — toute
modification de la palette ou des tracés doit se faire dans ces fichiers ;
ce document n'est qu'une lecture.*
