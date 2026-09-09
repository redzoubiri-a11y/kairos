# Utiliser le moteur de chiffrage

Le dépôt contient un moteur de calcul, `artizon/`, qui applique la chaîne de prix
du SKILL §5 et passe les contrôles du §8. **Dès qu'un chiffrage dépasse quelques
postes, il passe par le moteur** — pas par un calcul de tête ni par un tableau
improvisé. Une addition mentale de trente lignes est une erreur en attente.

## Ce que le moteur fait à ta place

| Risque | Ce que le moteur garantit |
| --- | --- |
| Frais généraux appliqués en multiplication | La division est la seule implémentée |
| Total qui ne tombe pas juste | Tous les totaux sont recalculés depuis les postes |
| Marge trop belle | Un poste sans déboursé est signalé, jamais compté zéro |
| Prix sans origine | Un composant sans `source` lève une erreur |
| Contrôle oublié | Les contrôles non évaluables sont listés, pas passés sous silence |
| Métré non vérifiable | Chaque calcul renvoie son détail ligne à ligne |

## Les trois commandes

```bash
# Chiffrer une affaire décrite en JSON : devis + TVA + contrôles
node artizon/cli/chiffrer.js <affaire.json>

# Sous-détail d'un poste, et effet réel d'une remise en points de marge
node artizon/cli/chiffrer.js <affaire.json> --sous-detail 05.01 --remise 4

# Comparer des offres fournisseurs sur base identique
node artizon/cli/comparer.js <consultation.json>
```

Exemples complets à copier : `artizon/exemples/renovation-appartement.json` et
`artizon/exemples/consultation-platrerie.json`.

## Méthode de travail

1. **Faire le métré d'abord**, à la main ou avec `metre.js`, et l'écrire. Le
   moteur ne devine pas les quantités : il les prend.
2. **Décrire l'affaire en JSON** : lots, postes, paramètres, conditions. Chaque
   poste référence soit un `ouvrage` de la bibliothèque, soit un prix libre qui
   porte sa `source`.
3. **Lancer `chiffrer`** et lire les contrôles avant de lire le total.
4. **Traiter les bloquants**, puis justifier ou corriger chaque alerte.
5. **Traiter les « non évalués » à la main** : ce sont les contrôles que le
   moteur n'a pas pu faire faute de donnée, pas des contrôles réussis.
6. **Renseigner les champs qui débloquent des contrôles** dès qu'ils existent :
   `quantiteDPGF`, `consultations`, `debourseTotal`, `dateSource`,
   `lot.complet`, `dossier.piecesRequises`.

## Depuis du code

```js
import {
  chiffrerOuvrage, construireDevis, controler,
  surfaceMurs, prixDeVente, margeRestante, comparerOffres,
  formaterDevis, formaterControles,
} from './artizon/src/index.js';
```

Fonctions les plus utiles en cours de chiffrage :

| Besoin | Appel |
| --- | --- |
| Surface de murs, ouvertures déduites | `surfaceMurs({ longueur, largeur, hauteur, ouvertures })` |
| Déboursé → prix de vente, décomposé | `prixDeVente(debourse, parametres)` |
| « Le client veut 180 k€, on peut ? » | `margeRestante({ prixCible, debourseSec, parametres })` |
| Effet réel d'une remise | `effetRemise({ prixVente, debourseSec, parametres, remise })` |
| Sous-détail d'un poste | `sousDetail(chiffrerOuvrage(ouvrage, quantite, parametres))` |
| Taux de TVA et conditions | `tauxApplicable({ typeLocal, ageLogementAnnees, natureTravaux })` |

## Limites à connaître

- La **bibliothèque de prix** couvre le second œuvre courant. Pour le gros œuvre
  ou les lots techniques, les postes se saisissent en prix libres, avec source.
- Les **fourchettes de contrôle** sont des repères de marché, pas l'historique
  d'Artizon. Une alerte de ratio est une invitation à justifier, pas un verdict.
- Le moteur **propose** un taux de TVA et liste les conditions à faire attester ;
  il ne tranche pas.
- Les **prix de la bibliothèque sont datés**. Au-delà de 18 mois, ils sont
  signalés comme périmés : reconsulter avant de remettre.

Si le moteur et ton intuition divergent, cherche l'erreur dans les deux — mais
ne remets jamais une offre sur une intuition contredite par un calcul écrit.
