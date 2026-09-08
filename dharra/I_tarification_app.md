# Dharra — Livrable I : Structure tarifaire de l'app

> Dernière marche du funnel (livrable C) : convertir le contact possédé en **abonné payant**,
> puis le **retenir**. Le revenu prévisible (MRR de l'app) est ce qui rend Dharra viable —
> **jamais** le seul RPM YouTube (cf. audit B & funnel C).
> Contexte marché : cœur de cible **Algérie/Maghreb** (sensible au prix, paiement local difficile)
> + relais **Golfe & diaspora** (pouvoir d'achat élevé, subventionnent l'économie — cf. B).

---

## I.1 — Le modèle : Freemium + essai, pas paywall sec

Le marché arabe (surtout DZ) est **sensible au prix** et **méfiant du paiement en ligne**.
On ne met donc pas un mur : on **prouve la valeur gratuitement**, puis on convertit les plus engagés.

```
GRATUIT (toujours) ──► ESSAI (7 j, sans friction) ──► ABONNEMENT (MRR)
   masse, confiance        les plus motivés            le revenu réel
```

## I.2 — Les 3 paliers

| Palier | Prix | Contenu | Rôle |
|---|---|---|---|
| **Dharra Gratuit** | 0 | La « Dharra du jour » (1 micro-pratique/j) · quelques parcours d'entrée · versets/audios courts | Acquisition + habitude quotidienne (le crochet) |
| **Dharra Plus** | abonnement (voir I.3) | Bibliothèque complète des parcours (30 jours) · audios longs · suivi de progression/streaks · contenu membres · hors-ligne | **Le produit qui monétise** |
| **Dharra Ihsân** *(optionnel, plus tard)* | premium annuel majoré | Tout Plus + lives/Q&R communauté · accompagnement · accès anticipé | LTV, super-fans, mécène-friendly |

> On lance avec **Gratuit + Plus**. « Ihsân » vient après, quand la communauté existe.

## I.3 — Le prix (ancrage local + capture du Golfe)

Principe : **un prix psychologiquement bas en DZ**, mais une **grille par région** pour capter
le pouvoir d'achat du Golfe et de la diaspora sans exclure le cœur de cible.

| Zone | Mensuel (repère) | Annuel (repère, ~2 mois offerts) | Logique |
|---|---|---|---|
| **Algérie / Maghreb** | ~ 500–800 DZD/mois (≈ 3–5 $) | ~ 5 000–7 000 DZD/an | Prix d'un café/2 — friction minimale |
| **Golfe** | ~ 15–25 SAR/AED (≈ 4–7 $) | remise annuelle | Pouvoir d'achat élevé, subventionne |
| **Diaspora / international** | ~ 5–7 €/$/mois | ~ 50–60 €/$/an | Aligné aux apps de bien-être occidentales |

> ⚠️ Ce sont des **repères de cadrage**, pas des prix figés : à **tester** (voir I.6). La règle :
> **l'annuel doit être le choix évident** (2 mois « offerts ») car il stabilise le MRR et
> réduit le churn.

### Ancrage de valeur (le message, pas le chiffre)
- « Moins qu'un café par semaine pour un travail intérieur que la plupart ne font jamais. »
- Comparer non pas à d'autres apps mais au **coût de ne rien changer** (rester bloqué entre savoir et agir).

## I.4 — La friction paiement (le vrai obstacle en DZ)

C'est **le** point qui peut tuer la conversion. À traiter sérieusement :

| Problème | Réponse |
|---|---|
| Cartes internationales rares en DZ | Intégrer **paiement mobile/local** (ex. Edahabia/CIB via passerelle DZ), pas seulement Visa/Mastercard |
| Méfiance du paiement en ligne | **Essai 7 j sans CB** si possible · prix affiché en monnaie locale · réassurance visible |
| Stores (commission 15–30 %) | Proposer aussi le paiement **web** (hors store) quand les règles le permettent → meilleure marge |
| Diaspora vs local | Détection région → grille adaptée automatiquement |

> Recommandation : **paiement web-first avec option locale DZ**, l'app store en complément.
> Résoudre le paiement local est autant un travail produit qu'un travail de prix.

## I.5 — Rétention = la vraie rentabilité (cf. C, étage 4)

Un abonné qui reste 12 mois vaut 6× un abonné qui part au bout de 2. On investit donc dans
la rétention **autant** que dans l'acquisition :
- **Habitude quotidienne** : « Dharra du jour » + notification douce (pas culpabilisante).
- **Streaks & progression** visibles (psychologie de la constance = istiqâma).
- **Parcours 30 jours** avec fin claire → puis un nouveau proposé (boucle).
- **Contenu membres régulier** → l'abonnement reste « vivant », pas une bibliothèque figée.
- **Winback** : séquence pour les abonnés qui décrochent (« reprends là où tu t'es arrêté »).

## I.6 — Ce qu'on teste (ne pas figer le prix au lancement)

| Test | Ce qu'on mesure |
|---|---|
| **Prix DZ** (500 vs 700 vs 900 DZD) | conversion × volume = revenu, pas juste le taux |
| **Essai avec/sans CB** | volume d'essais vs qualité de conversion post-essai |
| **Mensuel-first vs annuel-first** | impact sur MRR et churn |
| **Longueur d'essai** (7 vs 14 j) | activation (a-t-il *fini* un parcours pendant l'essai ?) |

> Métrique nord : **taux de conversion essai → payant** et **churn mensuel**. Le reste en découle.

## I.7 — KPI économiques à suivre

| Métrique | Pourquoi |
|---|---|
| **MRR** (revenu mensuel récurrent) | la santé réelle de Dharra |
| Conversion **gratuit → essai → payant** | efficacité du funnel BOFU |
| **Churn** mensuel | < 5–7 % = sain pour une app d'habitude |
| **LTV / CAC** | le CAC est ~gratuit (YouTube organique) → avantage structurel énorme |
| Part **annuel vs mensuel** | plus d'annuel = MRR plus stable |

> Avantage clé de Dharra : le **CAC est quasi nul** (acquisition par contenu organique via la
> chaîne). Chaque vue YouTube nourrit gratuitement le haut du funnel → l'économie tient **si**
> la conversion et la rétention sont soignées.

## I.8 — Séquence de lancement recommandée

1. **Phase 1 (S1–S8 du calendrier F)** : app en **gratuit only** → construire l'habitude + la base.
2. **Phase 2 (autour de S9, épisode « 30 jours »)** : activer **Plus** avec essai 7 j → première conversion.
3. **Phase 3** : introduire l'**annuel** en offre par défaut + résoudre le paiement local DZ.
4. **Phase 4** : lancer **Ihsân** (communauté/lives) quand la base d'abonnés le justifie.

---

## Ce que ce livrable verrouille
- Un modèle **freemium + essai** adapté à un marché sensible au prix, pas un paywall qui exclut.
- Une **grille régionale** qui protège le cœur DZ tout en captant Golfe & diaspora.
- Le traitement frontal du **vrai obstacle** (paiement local) et le rappel que **la rétention**,
  pas l'acquisition, fait la rentabilité — avec un **CAC quasi nul** grâce au funnel YouTube.

---

# Récapitulatif de la série de livrables

| # | Livrable | Fichier |
|---|---|---|
| C | Funnel d'Akhdar décortiqué | `dharra/C-D-E_funnel_charte_noms.md` |
| D | Charte visuelle (palette, typo, miniature) | `dharra/C-D-E_funnel_charte_noms.md` |
| E | Scan de disponibilité des noms | `dharra/C-D-E_funnel_charte_noms.md` |
| F | Calendrier éditorial 12 semaines | `dharra/F_calendrier_editorial_12s.md` |
| G | Kit de production faceless | `dharra/G_kit_production_faceless.md` |
| H | Landing + lead magnet « 7 leviers » | `dharra/H_landing_lead_magnet.md` |
| I | Structure tarifaire de l'app | `dharra/I_tarification_app.md` |

**Le système complet est bouclé** : autorité (chaîne) → capture (lead magnet/landing) →
habitude (WhatsApp + gratuit) → conversion (app) → rétention (parcours/streaks), le tout
porté par une identité faceless reproductible et un CAC quasi nul.
