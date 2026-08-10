# MIDA — Point de reprise

_Dernière vérification : 10 août 2026_

## Pourquoi ce fichier

Les cases à cocher de `ROADMAP.md` et l'« ordre de travail recommandé » de
`CLAUDE.md` décrivent la construction initiale du design system. Ce travail a
été réalisé : les relire comme une liste de tâches conduit à refaire
l'existant. Ce fichier note l'état constaté sur le dépôt et ce qui reste.

## État constaté

Vérification au niveau des fichiers (présence + import de `theme`), pas une
revue détaillée de la conformité aux wireframes.

| Élément | État |
| --- | --- |
| `src/theme.js` | présent |
| Composants Phase 1 (MButton, MTag, MInput, MCard, MToggle, MNavBar, MHeader, MStars, MLoader) | tous présents |
| `src/components/` | 56 composants |
| `screens/` | 27 écrans, dont les écrans pro ajoutés en Phase 6 (ProMenu, ProPromos, ProAvis) et les écrans transversaux de Phase 7 (Settings, Aide) |
| Import de `theme` dans les écrans | 27 / 27 |

Les phases 1 à 7 du `ROADMAP.md` sont donc couvertes au niveau des fichiers.

## Fait

### Couleurs en dur — réglé

La règle 5 de `CLAUDE.md` (« NE JAMAIS utiliser de couleurs en dur ») est
désormais tenue sur `screens/*.js` et `src/components/*.js`.

| Mesure | Valeur |
| --- | --- |
| Littéraux `#…` / `rgba(…)` | 533 → **0** |
| Fichiers touchés | 26 écrans, 32 composants |
| Tokens ajoutés à `src/theme.js` | 27 |

Les couleurs ne vivent plus qu'à un seul endroit : `src/theme.js`.

**Toutes les substitutions sont à valeur identique — aucun changement visuel**,
à la seule exception du `WeekStrip` ci-dessous. Vérifié fichier par fichier :
la séquence des couleurs effectivement produites est la même qu'avant, tokens
résolus des deux côtés.

Trois outils ont été introduits, parce qu'un token par couple (teinte, opacité)
aurait fait exploser la palette — `#E05A5A` seul apparaissait à 11 opacités
différentes :

- **`alpha(token, opacité)`** — décline un token en version translucide.
  `borderColor: alpha(colors.red, 0.3)` remplace un `rgba(224,90,90,0.3)`
  écrit à la main : la teinte reste pilotée par la palette, seule l'opacité est
  locale. Une valeur déjà translucide passe inchangée.
- **`gradients`** — dégradés partagés. `bgOverlay` était dupliqué à l'identique
  dans 11 écrans.
- **`avatarColors`** — palette de secours des avatars sans photo.

Tokens ajoutés, par famille : `onDark` / `shadow` / `black` (blancs et noirs
selon l'intention), `proBg` / `proBgDeep` / `navyInk` / `navyInkLight` (fonds
pro sombres), `ivory` / `sand` / `steel` / `greyMid` / `greyPlaceholder`
(neutres), `amber` / `gold` / `glow` (ambres), `dzGreen` / `greenLight` /
`forestDeep` / `forestDark` / `forestBtn` / `forestMid` (verts), `promo`,
`ink`, `violet`, `aqua`, `mistLight` / `mistMid` / `mistDeep`, `medalGold` /
`medalSilver` / `medalBronze`.

`src/components/BottomTabBar.js` n'importait pas le thème du tout et portait sa
propre palette (`C` / `C_DARK`) : elle est maintenant construite sur les
tokens. Sa variable locale `colors` a été renommée `palette`, car elle masquait
l'import et aurait piégé la prochaine modification.

### Lisibilité du WeekStrip — réglé

`src/components/WeekStrip.js` écrivait `color: 'colors.primary'` en chaîne de
caractères : valeur non parsable par React Native, style ignoré, texte rendu en
noir par défaut sur le fond navy de `ProDashboard` (1,21:1).

Le repère « aujourd'hui » est désormais `colors.green` (`#4CAF82`) sur ses
quatre points d'usage — les trois libellés et la barre — soit 6,43:1 sur
`#0D1B2A`, au-dessus du seuil WCAG AA. `colors.primary` (`#0D6B3F`), la valeur
d'origine, plafonnait à 2,64:1.

## Reste à faire

### Thème sombre implicite

`src/theme.js` a migré vers un thème blanc (`colors.bg: '#FFFFFF'`), mais trois
écrans sont restés sombres : `ProDashboard.js` et `ProComptoir.js`
(`colors.proBg`) et `HomeScreen.js` (`colors.noir`). Les composants à texte
clair leur sont bien réservés — vérifié, aucun n'est partagé avec un écran
clair, donc pas de bug de contraste.

Ces fonds ont désormais des tokens, mais le partage reste implicite : rien
n'empêche de poser demain un composant à texte `colors.ivory` sur un écran
clair. Un mécanisme explicite (variante de thème, ou préfixe de nommage sur les
tokens réservés au sombre) reste à décider.

### Phase 8 — Tests & déploiement

- [x] Test sur web — bundle Expo web : 914 modules, aucune erreur de
      compilation ; application chargée dans Chromium, aucune erreur JS
- [ ] Test complet sur iOS (Expo Go)
- [ ] Test complet sur Android (Expo Go)
- [ ] Vérifier tous les flux Supabase
- [ ] Build de production
- [ ] Déploiement

Le rendu web a servi à valider le refactor de tokens : la version d'avant
(`8ad5433`) et celle d'après ont été bundlées séparément, puis capturées sur le
même parcours. Comparaison pixel à pixel des quatre vues atteignables sans
réseau :

| Vue | Résultat |
| --- | --- |
| Inscription | identique, au pixel près |
| Accueil (thème sombre) | identique, au pixel près |
| Connexion | 84 px sur 329 160 (0,03 %), écart max 13/255 |
| Espace pro | 894 px sur 329 160 (0,27 %), écart max 12/255 |

Les deux écarts tiennent dans la même zone de 96×96 px, à l'emplacement du logo
animé. Contrôle : la même build capturée deux fois donne un écart du même ordre
au même endroit (887 px, écart max 35) — c'est la phase de l'animation, pas le
refactor.

Limites de ce test : Supabase et les images externes sont injoignables depuis
l'environnement, donc les écrans pilotés par les données restent en état de
chargement. `ProDashboard`, `ProComptoir` et le `WeekStrip` corrigé demandent
une session pro et n'ont pas pu être rendus — le contraste du repère
« aujourd'hui » reste calculé, pas constaté.

### À valider avant de continuer

Le contrôle ci-dessus porte sur la présence des fichiers et l'usage de
`theme`. Il ne dit pas si chaque écran est conforme à son wireframe de
référence dans `/wireframes/`. Un passage écran par écran reste à faire pour
confirmer la Phase 8, en suivant la règle d'or du `ROADMAP.md` : un écran à la
fois, testé sur téléphone avant de passer au suivant.
