# Artizon — moteur de chiffrage

Moteur de chiffrage BTP pour le marché français : métré, sous-détail de prix,
devis, contrôles avant remise, comparatif d'offres.

JavaScript pur, sans dépendance, sans couche d'interface. Il s'utilise depuis
Node, depuis une app React Native ou depuis un site — la logique métier ne sait
rien de l'affichage.

Il est le pendant exécutable de la skill `chiffreur-artizon`
(`.claude/skills/chiffreur-artizon/`), qui porte la méthode. Le SKILL dit
comment chiffrer ; ce moteur garantit que les nombres tombent juste.

## Démarrage

```bash
node artizon/cli/chiffrer.js artizon/exemples/renovation-appartement.json
node artizon/cli/chiffrer.js artizon/exemples/renovation-appartement.json --sous-detail 05.01 --remise 4
node artizon/cli/comparer.js artizon/exemples/consultation-platrerie.json
node --test artizon/tests/*.test.js
```

La commande `chiffrer` sort en code 1 si un contrôle bloquant est levé : elle
s'intègre telle quelle dans une vérification automatique.

## Ce que le moteur garantit

**Le passage au prix de vente est une division, pas une multiplication.**
Les frais généraux et la marge se définissent en pourcentage du prix de vente.
Les appliquer en multiplication du déboursé calcule ces taux sur une base plus
petite et fait perdre plusieurs points de marge — l'erreur structurelle la plus
répandue du métier.

```
PR = DS × (1 + %frais de chantier)
PV = PR / (1 − (%frais généraux + %aléas + %marge))
```

Sur un déboursé de 100 € avec 8 % de frais de chantier, 12 % de FG, 3 % d'aléas
et 8 % de marge : 140,26 € par la division, 132,84 € par la multiplication —
soit 5,9 % de marge réelle au lieu des 8 % visés.

**Aucun prix n'entre sans sa source.** Un composant sans `source` lève une
erreur. Les sources sont `BPU`, `FOURNISSEUR`, `BIBLIO`, `HISTORIQUE`, `ESTIME`,
et la fiabilité d'un ouvrage est celle de son composant le plus faible.

**Ce qui n'est pas connu n'est jamais compté comme zéro.** Un poste sans
déboursé renseigné ferait apparaître une marge trop belle : le moteur le
détecte, l'annonce (`synthese.debourseComplet`) et lève l'alerte A13. De même,
la répartition main-d'œuvre / fournitures ne se calcule que sur la part du
déboursé réellement décomposée.

**Les contrôles disent aussi ce qu'ils n'ont pas pu vérifier.** Le résultat de
`controler()` contient `nonEvalues` : les contrôles laissés en suspens faute de
donnée. Le silence n'est pas une preuve de vérification.

**Le métré est vérifiable.** Chaque fonction de métré renvoie le `detail` de son
calcul, ligne à ligne, et la convention de déduction appliquée.

## Modules

| Module | Rôle |
| --- | --- |
| `core/arrondi.js` | Arrondis monétaires, quantités au conditionnement |
| `core/prix.js` | Chaîne déboursé → prix de vente, coefficient, prix plancher, effet d'une remise |
| `core/metre.js` | Surfaces, volumes, pertes, cloison, carrelage, peinture, terrassement |
| `core/ouvrage.js` | Sous-détail de prix d'un ouvrage, fiabilité des sources |
| `core/tva.js` | Taux applicable et conditions, autoliquidation en sous-traitance |
| `core/devis.js` | Assemblage, ventilation de TVA, synthèse, remise commerciale |
| `core/controles.js` | Bloquants B1–B10, alertes A1–A13, verdict |
| `core/comparatif.js` | Comparatif d'offres sur base identique |
| `rendu.js` | Sortie texte des livrables |
| `affaire.js` | Chiffrage complet depuis une description JSON |
| `data/` | Paramètres d'entreprise, bibliothèque de prix, fourchettes de contrôle |

## Décrire une affaire

```json
{
  "reference": "D-2026-0142",
  "chantier": {
    "nature": "renovation",
    "surfaceHabitable": 68,
    "ageLogementAnnees": 52,
    "coefficientContexte": 1.2
  },
  "tva": { "natureTravaux": "amelioration" },
  "parametres": { "fraisChantier": 0, "fraisGeneraux": 0.12, "aleas": 0.05, "marge": 0.09 },
  "lots": [
    {
      "code": "03",
      "libelle": "Platrerie",
      "lot": "platrerie",
      "complet": true,
      "postes": [
        { "ouvrage": "03.01", "quantite": 28, "quantiteDPGF": 26, "consultations": 2 },
        {
          "code": "03.90",
          "libelle": "Ouvrage particulier",
          "unite": "ens",
          "quantite": 1,
          "prixUnitaire": 2400,
          "debourseTotal": 1700,
          "source": "ESTIME"
        }
      ]
    }
  ]
}
```

Un poste référence soit un `ouvrage` de la bibliothèque — il est alors développé
en sous-détail —, soit un prix libre, qui doit porter sa `source`.

Champs qui débloquent des contrôles supplémentaires :

| Champ | Niveau | Contrôle |
| --- | --- | --- |
| `lot.complet: true` | lot | ratio €/m² SHAB (A1) — sans lui, un ratio sur lot partiel n'a pas de sens |
| `poste.quantiteDPGF` | poste | écart avec le métré du client (A5) |
| `poste.consultations` | poste | consultation insuffisante sur un poste majeur (A10) |
| `poste.debourseTotal` | poste | fiabilité de la marge (A13) et coefficient du poste (B6) |
| `poste.dateSource` | poste | ancienneté du prix (A12) |
| `poste.pourMemoire` | poste | poste sans prix, légitimement hors totaux |
| `dossier.piecesRequises` | affaire | pièces exigées par le règlement de consultation (B8) |
| `dossier.dateLimiteRemise` | affaire | forclusion (B9) |
| `dossier.montantActeEngagement` | affaire | cohérence AE / DPGF (B10) |

## Données à recaler

Trois fichiers portent des valeurs qui doivent être ajustées aux chiffres réels
d'Artizon avant toute utilisation en production :

- `src/data/parametres.js` — coût horaire entreprise, frais généraux constatés
  au compte de résultat, marge visée. Les frais généraux se **constatent**, ils
  ne se devinent pas.
- `src/data/bibliotheque.js` — prix fournisseurs négociés et rendements observés
  sur les chantiers Artizon. Le champ `MISE_A_JOUR` est daté ; au-delà de
  18 mois, les contrôles signalent les prix comme périmés.
- `src/data/ratios.js` — fourchettes de plausibilité. Ce ne sont pas des prix :
  elles servent uniquement à détecter qu'un chiffrage sort des normes.

Les fourchettes livrées sont des repères de marché français. L'historique
d'Artizon doit les remplacer dès qu'il existe.

## Limites

- La bibliothèque couvre le second œuvre courant, pas le gros œuvre ni les lots
  techniques (CVC, ascenseur, désenfumage).
- Le moteur **propose** un taux de TVA et liste les conditions à faire attester
  par le client ; il ne tranche pas. Les cas d'exclusion (gros équipements)
  doivent être vérifiés dans leur version en vigueur.
- Les références juridiques de la skill sont des repères, pas un avis juridique.
- Aucun import de DPGF au format tableur : les quantités entrent par le JSON.
