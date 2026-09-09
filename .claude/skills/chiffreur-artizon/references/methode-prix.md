# Du déboursé au prix de vente

Référence de calcul du chiffreur Artizon. Marché français.

## 1. Les cinq niveaux de prix

| Niveau | Contenu | Sert à |
| --- | --- | --- |
| Déboursé sec (DS) | Fournitures + main-d'œuvre + matériel affecté | Base de tout calcul |
| Prix de revient chantier (PR) | DS + frais de chantier | Savoir ce que coûte le chantier |
| Prix plancher | PR + frais généraux | Limite basse absolue de négociation |
| Prix de vente (PV) | PR + FG + aléas + marge | Ce qu'on remet |
| Prix marché | Ce que la concurrence remet | Arbitrage commercial |

Confondre prix de revient et prix plancher est l'erreur qui fait travailler
gratuitement : au prix de revient, les frais de structure ne sont pas payés.

## 2. Composition du déboursé sec

### Fournitures rendues chantier

```
Prix fournisseur HT
− remise négociée
+ transport / livraison
+ déchargement et manutention
+ pertes et chutes (poste de métré, cf. ratios-metre.md)
= fourniture rendue chantier
```

Le prix catalogue n'est jamais le prix de revient. Un carrelage à 22 €/m² catalogue,
avec 12 % de remise, 1,10 €/m² de livraison et 9 % de chutes, revient à ~22,3 €/m².

### Main-d'œuvre

```
MO = temps unitaire (h/unité) × coût horaire entreprise (€/h)
```

Le **coût horaire entreprise** n'est pas le taux horaire du salarié. Il agrège :

- salaire brut
- charges patronales
- congés payés du BTP (caisse) et jours d'intempéries
- paniers repas et indemnités de trajet / grands déplacements
- mutuelle, prévoyance, formation
- temps improductif (transferts, réunions de chantier, aléas)

Il est **paramétré une fois par exercice** dans la fiche entreprise et repris tel
quel. Le recalculer à chaque devis est la porte ouverte aux écarts.

Ordre de grandeur France 2026, ouvrier qualifié second œuvre, tout compris :
**38 à 48 €/h**. Compagnon très qualifié ou région tendue : au-delà. Ce chiffre
est un repère de contrôle, pas une donnée de calcul : la donnée est celle
d'Artizon.

### Matériel affecté

Ne mettre au déboursé que le matériel **affectable à l'ouvrage** : location de
nacelle pour un poste précis, consommables (disques, lames, mèches), carburant.
Le petit outillage courant et les véhicules relèvent des frais généraux, pas
du déboursé : les compter deux fois gonfle le prix et fait perdre l'affaire.

## 3. Frais de chantier

Les frais de chantier sont **liés au chantier mais pas à un ouvrage** :

- installation et repli (base vie, clôture, signalisation)
- encadrement (conducteur de travaux, chef de chantier, au prorata du temps passé)
- échafaudage, protections, étaiement
- bennes et évacuation, nettoyage
- énergie de chantier, eau
- coordination SPS, plan de prévention

Deux méthodes, à ne jamais mélanger :

| Méthode | Quand | Comment |
| --- | --- | --- |
| **En postes** | Chantier > 50 k€, ou frais spécifiques importants | Chiffrés ligne à ligne dans le devis |
| **En pourcentage** | Petits chantiers, chiffrage rapide | 5 à 12 % du DS selon la nature |

Si les frais de chantier sont chiffrés en postes, le `%FC` de la formule est **0**.
Les compter en postes *et* en pourcentage double la facture.

Ordres de grandeur du `%FC` quand il est forfaitisé :

| Type de chantier | %FC sur DS |
| --- | --- |
| Neuf, plateau accessible | 4 – 7 % |
| Rénovation logement occupé | 8 – 14 % |
| Site industriel / ERP en activité | 12 – 20 % |

## 4. La formule

```
PR = DS × (1 + %FC)

PV = PR / (1 − (%FG + %aléas + %marge))

k  = PV / DS
```

**Pourquoi une division.** Les frais généraux et la marge se définissent en
pourcentage du chiffre d'affaires — donc du prix de vente, qui est l'inconnue.
Poser `PV = PR + %FG × PV + %marge × PV` et résoudre donne la division.
Multiplier par `(1 + %FG + %marge)` calcule ces pourcentages sur le prix de
revient, c'est-à-dire sur une base plus petite : la marge obtenue est
mécaniquement inférieure à celle visée.

### Écart des deux méthodes

DS = 100 €, FC = 8 %, FG = 12 %, aléas = 3 %, marge = 8 % :

| | PV | FG encaissés | Marge réelle |
| --- | --- | --- | --- |
| Multiplication | 132,84 € | 15,94 € | **5,9 %** |
| Division | 140,26 € | 16,83 € | 8,0 % |

Plus la somme `%FG + %aléas + %marge` est élevée, plus l'écart se creuse. À 35 %
cumulés, la méthode fausse perd plus de 5 points de marge.

## 5. Calage des taux

### Frais généraux

Le `%FG` se **constate** sur le compte de résultat de l'exercice précédent :

```
%FG = charges de structure de l'année / chiffre d'affaires de l'année
```

Charges de structure = loyers, administratif, direction, comptabilité, assurances,
véhicules, petit outillage, commercial, informatique, frais de chiffrage (le
temps passé à répondre aux appels d'offres perdus est un frais général).

Fourchettes observées : **8 à 14 %** pour une entreprise artisanale, **12 à 20 %**
pour une PME structurée avec bureau d'études.

Un `%FG` choisi au doigt mouillé rend tout le chiffrage faux, dans un sens
comme dans l'autre.

### Aléas

L'aléa couvre le risque **identifié mais non chiffrable**. Il n'est pas de la marge
déguisée, et il n'est jamais nul en rénovation.

| Situation | Aléa |
| --- | --- |
| Neuf, dossier complet, plans d'exécution validés | 1 – 2 % |
| Rénovation, existant sondé et diagnostiqué | 3 – 5 % |
| Rénovation, existant non sondé | 6 – 10 % |
| Prix fermes non révisables sur chantier > 12 mois | +2 – 4 % |
| Sous-sol non reconnu, absence d'étude géotechnique | 8 % et plus, ou réserve |

Un risque **identifié et chiffrable** ne va pas dans l'aléa : il va dans un poste.
L'aléa ne sert pas à couvrir un oubli de métré.

### Marge

La marge est une décision de direction, pas un calcul. Repères :

| Contexte | Marge visée |
| --- | --- |
| Marché public très concurrentiel | 3 – 6 % |
| Marché privé standard | 7 – 12 % |
| Technicité forte, peu de concurrents | 12 – 20 % |
| Client difficile, chantier contraint | +3 points minimum |

## 6. Lecture inverse : que reste-t-il à un prix donné ?

Question permanente en négociation : « le client veut 180 k€, on peut ? »

```
marge restante = 1 − %FG − %aléas − (PR / PV_cible)
```

Si `PV_cible < PR / (1 − %FG)`, l'affaire est **sous le prix plancher** : les frais
généraux ne sont pas couverts, chaque euro facturé creuse le résultat. Réponse : non.

Cette lecture doit accompagner toute demande de remise. Un rabais annoncé en
pourcentage du prix (« −5 % ») est presque toujours perçu comme anodin ; traduit
en points de marge (« la marge passe de 9 % à 3,4 % »), il devient une décision.

## 7. Cas particuliers

**Prix unitaires d'un BPU.** Ils sont imposés : on ne les recalcule pas, on vérifie
qu'ils couvrent le déboursé. Un BPU dont plusieurs lignes sont sous le déboursé
Artizon est un marché à refuser ou à compenser sur les quantités attendues (DQE).

**Marché à bons de commande.** Le montant du DQE est indicatif. Chiffrer en
supposant les quantités réalisées est une erreur : caler les prix pour qu'ils
tiennent **ligne à ligne**, y compris si une seule ligne est commandée.

**Forfait global.** Le risque de quantité est intégralement à l'entreprise. Le
métré doit être plus fin que sur un marché à prix unitaires, et l'aléa plus élevé.

**Variantes.** Chiffrer la variante avec la même rigueur que la solution de base.
Une variante mal chiffrée qui est retenue est le pire des cas.

**Travaux modificatifs en cours de chantier.** Chiffrés avec le même coefficient
que le marché de base, sauf clause contraire du CCAP. Les brader casse la
cohérence de l'affaire et se retourne au décompte général.
