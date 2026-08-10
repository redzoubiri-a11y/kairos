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

Attention : importer `theme` ne signifie pas n'utiliser que des tokens. Voir la
dette ci-dessous.

## Reste à faire

### Dette — couleurs en dur

La règle 5 de `CLAUDE.md` (« NE JAMAIS utiliser de couleurs en dur ») n'est pas
tenue. Audit du 10 août 2026 sur `screens/*.js` et `src/components/*.js` :

| Mesure | Valeur |
| --- | --- |
| Occurrences de littéraux `#…` / `rgba(…)` | 533 → **392** |
| Fichiers concernés à l'audit | 24 écrans sur 27, 35 composants sur 56 |
| Couleurs distinctes à l'audit | 164 |

141 occurrences ont été remplacées par des tokens (46 fichiers). Toutes les
substitutions portent sur des valeurs strictement identiques : le refactor est
un no-op visuel. Deux tokens ont été ajoutés à `src/theme.js` pour couvrir des
usages qui n'en avaient pas :

- `colors.onDark` — texte ou icône sur fond sombre ou coloré (bouton, badge,
  carte pleine). Même valeur que `colors.bg`, intention inverse.
- `colors.shadow` — couleur de projection des ombres (`shadowColor`).

Deux natures de dette, à traiter séparément :

1. **156 occurrences (13 couleurs) ont déjà un token équivalent** — surtout
   `#FFFFFF` (52), `#000000` (46, essentiellement des `shadowColor`), `#c8975a`
   (20 → `colors.gold`), `#c87860` (14 → `colors.resa`). Remplacement
   mécanique, mais à faire au cas par cas : un `#FFFFFF` peut être `colors.bg`
   comme un blanc littéral posé sur un fond sombre, ce qui n'est pas le même
   token.
2. **377 occurrences (151 couleurs) n'ont aucun équivalent dans `theme.js`** —
   dont `#f5f2ec` (18), `#006233` (17), `#c4b8c8` / `#8b9bb4` / `#6b7f9e` (11
   chacune). Les absorber suppose d'étendre la palette de `src/theme.js`, donc
   une décision design en amont, pas un simple remplacement.

Les 392 occurrences restantes relèvent surtout du point 2, plus la palette
privée en dur de `src/components/BottomTabBar.js` (`C` / `C_DARK`, lignes 5-15)
qui double le thème au lieu de l'utiliser.

### Thème sombre implicite

`src/theme.js` a migré vers un thème blanc (`colors.bg: '#FFFFFF'`), mais trois
écrans sont restés sombres : `ProDashboard.js` et `ProComptoir.js`
(`#0D1B2A` en dur) et `HomeScreen.js` (`colors.noir`). Les composants à texte
clair leur sont bien réservés — vérifié, aucun n'est partagé avec un écran
clair, donc pas de bug de contraste. Mais ce fond navy n'a pas de token :
à nommer dans `theme.js` si ces écrans doivent rester sombres.

### Lisibilité du WeekStrip — réglé

`src/components/WeekStrip.js` écrivait `color: 'colors.primary'` en chaîne de
caractères : valeur non parsable par React Native, style ignoré, texte rendu en
noir par défaut sur le fond navy de `ProDashboard` (1,21:1).

Le repère « aujourd'hui » est désormais `colors.green` (`#4CAF82`) sur ses
quatre points d'usage — les trois libellés et la barre — soit 6,43:1 sur
`#0D1B2A`, au-dessus du seuil WCAG AA. `colors.primary` (`#0D6B3F`), la valeur
d'origine, plafonnait à 2,64:1.

### Phase 8 — Tests & déploiement

Seule phase du `ROADMAP.md` encore entièrement ouverte :

- [ ] Test complet sur iOS (Expo Go)
- [ ] Test complet sur Android (Expo Go)
- [ ] Test sur web (`localhost:8081`)
- [ ] Vérifier tous les flux Supabase
- [ ] Build de production
- [ ] Déploiement

### À valider avant de continuer

Le contrôle ci-dessus porte sur la présence des fichiers et l'usage de
`theme`. Il ne dit pas si chaque écran est conforme à son wireframe de
référence dans `/wireframes/`. Un passage écran par écran reste à faire pour
confirmer la Phase 8, en suivant la règle d'or du `ROADMAP.md` : un écran à la
fois, testé sur téléphone avant de passer au suivant.
