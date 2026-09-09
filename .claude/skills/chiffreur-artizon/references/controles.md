# Contrôles avant remise

La passe de contrôle est systématique. Elle prend vingt minutes et sauve des
affaires entières. Son résultat s'affiche dans le livrable, même quand il est bon.

## 1. Bloquants — l'offre ne part pas

| # | Contrôle | Comment le vérifier |
| --- | --- | --- |
| B1 | Total = somme des lots = somme des postes | Recalcul intégral, jamais de report manuel |
| B2 | Aucune ligne du DPGF client vide | Balayage ligne à ligne du cadre fourni |
| B3 | Unité cohérente avec l'ouvrage | m² pour une surface, ml pour un linéaire, m³ pour un volume, U pour un objet |
| B4 | Aucune quantité nulle ou négative non justifiée | Une ligne « pour mémoire » se marque `PM`, pas `0` |
| B5 | Aucun prix unitaire nul non justifié | Un poste offert se déclare comme tel |
| B6 | Coefficient de vente ≥ 1,35 | k = PV / DS, poste par poste et global |
| B7 | Marge nette positive après aléas | Y compris après remise commerciale |
| B8 | Pièces exigées par le RC toutes présentes | Check-list du RC, cochée une par une |
| B9 | Date et heure limites de remise respectées | En public, une minute de retard = offre rejetée |
| B10 | Montant de l'acte d'engagement = montant du DPGF | Le premier fait foi, l'écart est fatal |

## 2. Alertes — l'offre part avec justification écrite

| # | Contrôle | Seuil |
| --- | --- | --- |
| A1 | Ratio € / m² dans la fourchette du lot | cf. `ratios-metre.md` §4 |
| A2 | Répartition MO / fournitures plausible | cf. `ratios-metre.md` §5 |
| A3 | Écart entre postes techniquement voisins | > 25 % |
| A4 | Part de postes `[ESTIMÉ]` | > 15 % du montant |
| A5 | Écart métré Artizon / DPGF client | > 10 % |
| A6 | Coefficient de vente élevé | k > 1,95 |
| A7 | Aléa nul en rénovation | Toujours une alerte |
| A8 | Frais de chantier comptés en postes **et** en pourcentage | Double comptage |
| A9 | Validité de l'offre > 3 mois sans clause de révision | Risque matière non couvert |
| A10 | Un seul devis fournisseur sur un poste majeur | > 10 % du montant du lot |
| A11 | Offre sous-traitant à plus de 25 % sous la moyenne | Prestation manquante probable |
| A12 | Poste dont le prix vient d'un chantier de plus de 18 mois | Prix périmé |
| A13 | Poste sans déboursé renseigné, alors qu'un prix de vente est posé | La marge affichée est surestimée |

Deux garde-fous sur ces deux derniers contrôles, sans quoi ils produisent du
bruit plutôt que de l'information :

- **A1 ne s'applique qu'à un lot déclaré complet.** Un ratio € / m² habitable
  calculé sur un lot partiel — trois cloisons dans un appartement — ne veut rien
  dire et ferait crier au loup à chaque devis.
- **A2 ne porte que sur la part du déboursé réellement décomposée.** Un poste
  repris en bloc (sous-traitance, prix fournisseur global) n'a pas de part de
  main-d'œuvre connue : le compter pour zéro tirerait le ratio vers le bas.

## 3. Les oublis qui coûtent le plus cher

Check-list à passer sur **tout** chiffrage, quel que soit le lot. L'expérience
dit que ces postes représentent 5 à 15 % du montant d'un chantier et sont la
première cause de dérive de marge.

### Préparation et installation
- installation de chantier, base vie, clôture, signalisation
- branchements provisoires eau et électricité, consommation
- protection des existants, des sols, des accès communs
- constat d'huissier avant travaux si mitoyenneté ou site sensible
- autorisations : voirie, benne sur domaine public, échafaudage, ascenseur d'immeuble

### Exécution
- études et plans d'exécution, calepinage, notes de calcul
- échafaudage, étaiement, nacelle, moyens de levage
- manutention et approvisionnement, notamment sans ascenseur
- percements, rebouchages, calfeutrements, reprises après passage des autres lots
- travaux induits (une rénovation énergétique entraîne des reprises de finition)
- essais, mise en service, réglages, DAAF et organes de sécurité

### Repli et livraison
- évacuation des gravats, bennes, tri et traitement des déchets, bordereaux
- nettoyage de fin de chantier
- repli d'installation
- DOE, notices, PV d'essais, attestations, fiches techniques
- levée des réserves après réception (prévoir le temps, il n'est jamais gratuit)

### Administratif et financier
- assurance de responsabilité décennale et RC, primes affectées
- compte prorata
- garantie de parfait achèvement (retour sur site pendant un an)
- retenue de garantie ou caution bancaire, et son coût de trésorerie
- coût du crédit interentreprises si les délais de paiement sont longs
- révision ou actualisation des prix
- frais de dossier et de réponse à l'appel d'offres

## 4. Contrôles spécifiques par corps d'état

**Gros œuvre.** Étude de sol présente ? Niveau de la nappe ? Évacuation des terres
avec foisonnement ? Aciers chiffrés au poids réel et non forfaitairement ?

**Plâtrerie.** Hauteur sous plafond réelle relevée (pas celle du plan) ? Locaux
humides en plaque hydrofuge ? Renforts pour équipements suspendus ? Traitement
acoustique exigé par le CCTP ?

**Carrelage.** Support préparé et compris (ragréage, primaire) ? Étanchéité sous
carrelage en locaux humides ? Calepinage imposé qui augmente les chutes ? Plinthes,
nez de marche, joints de fractionnement, profilés ?

**Peinture.** État du support réellement constaté ou supposé ? Nombre de couches
du CCTP respecté ? Préparation et enduit comptés ? Protection et masquage ?
Reprises après les autres corps d'état ?

**Électricité.** Nombre de points au plan ou au CCTP ? Tableau, disjoncteur de
branchement, mise à la terre, consuel ? Saignées et rebouchages ? Courants faibles
et VDI ? Conformité NF C 15-100 sur le nombre de circuits.

**Plomberie.** Réseaux d'alimentation **et** d'évacuation ? Pentes réalisables ?
Appareils sanitaires fournis par qui ? Robinetterie ? Production d'eau chaude ?
Désembouage sur installation existante ?

**Menuiserie extérieure.** Dépose totale ou rénovation ? Dimensions relevées sur
site et non sur plan ? Étanchéité, habillages, seuils, occultations ? Accès et
moyen de levage pour les grands vitrages ?

**Démolition.** Diagnostic amiante et plomb avant travaux ? Repérage des réseaux ?
Structure porteuse identifiée ? Traitement et traçabilité des déchets ?

## 5. Audit d'un chiffrage existant

Quand la demande est de vérifier un chiffrage déjà fait, procéder dans cet ordre —
du plus rentable au plus fin :

1. **Arithmétique** : recalculer tous les totaux. Les erreurs de report et de
   formule sont les plus fréquentes et les plus faciles à trouver.
2. **Unités** : balayer la colonne des unités. Une confusion m² / ml sur un poste
   important suffit à ruiner une affaire.
3. **Complétude** : passer la check-list du §3 contre le devis.
4. **Chaîne de prix** : vérifier que FG et marge sont en division, pas en
   multiplication (§5 du SKILL). C'est l'erreur structurelle la plus courante.
5. **Plausibilité** : ratios €/m² et répartition MO / fournitures.
6. **Métré** : recalculer les trois postes les plus lourds en valeur. S'ils sont
   justes, la probabilité que le reste le soit est forte.
7. **Contractuel** : pénalités, retenue de garantie, révision, validité.

Restituer les erreurs **classées par impact en euros**, pas par ordre d'apparition.
Une faute de 40 € et une faute de 12 000 € ne se présentent pas au même niveau.

## 6. Forme du rapport de contrôle

```
CONTRÔLES — 14 passés · 2 alertes · 0 bloquant

ALERTE A1  Lot peinture à 19 €/m², sous la fourchette 25–45 €/m²
           → cause probable : préparation du support non chiffrée
           → impact estimé : +3 200 € HT

ALERTE A4  Postes [ESTIMÉ] = 22 % du montant (seuil 15 %)
           → consultations à lancer : menuiseries intérieures, serrurerie
           → remise possible sous réserve, ou sous 4 jours après retours

VERDICT    À COMPLÉTER
```

Un contrôle qui ne remonte rien s'affiche aussi : `CONTRÔLES — 16 passés · 0 alerte
· 0 bloquant · REMETTABLE`. Le silence n'est pas une preuve de vérification.
