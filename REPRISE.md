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
| Import de `theme` dans les écrans | 26 / 27 |

Les phases 1 à 7 du `ROADMAP.md` sont donc couvertes au niveau des fichiers.

## Reste à faire

### Écart identifié

- `screens/MapScreen.web.js` — stub de 15 lignes, seul écran à ne pas importer
  `theme` et à porter une couleur en dur (`#fff`, ligne 14). À reprendre avec
  les tokens de `src/theme.js`, en cohérence avec `MapScreen.js`.

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
