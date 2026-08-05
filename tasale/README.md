# Tasale

> Vos célébrations, notre passion — احتفالاتكم، شغفنا

Application de réservation de salles des fêtes en Algérie, développée d'après
les *Spécifications Techniques Complètes v1.0.0*.

Une seule base de code sert les deux publics :

| Public | Accès | Tarif |
|--------|-------|-------|
| **Client** (familles) | iOS · Android · Web | Gratuit |
| **Pro** (propriétaires) | Back-office iOS · Android · Web | 90 jours offerts, puis 500 DA/mois |

---

## Démarrage

```bash
cd tasale
npm install
npm start          # Expo : QR code pour iOS/Android
npm run web        # back-office pro dans le navigateur
```

**Aucune configuration n'est nécessaire pour démarrer.** Sans variables
d'environnement Supabase, l'application bascule sur un backend local
(AsyncStorage) pré-rempli avec dix salles algériennes, des réservations, des
avis et un abonnement en cours d'essai.

### Comptes de démonstration

Le code SMS est toujours `123456`.

| Rôle | Téléphone | Contenu |
|------|-----------|---------|
| **Pro** | `0555 10 00 01` | Salle El Widad (Alger) — 7 réservations, 2 en attente, 1 avis à modérer, essai à J+45 |
| **Client** | `0661 23 45 67` | Amina Cherif — 1 réservation confirmée, 1 événement passé à évaluer, 2 favoris |
| *Autres pros* | `0555 10 00 02` … `0555 10 00 10` | Un propriétaire par salle du jeu de données |
| *Nouveau compte* | tout autre numéro valide | Parcours d'inscription complet (client ou pro) |

Le PIN de signature des comptes pro de démonstration est `1234`.

Un numéro algérien valide commence par 05, 06 ou 07 suivi de 8 chiffres.
« Réinitialiser les données de démo » dans le profil restaure l'état initial.

---

## Branchement sur Supabase

```bash
cp .env.example .env       # renseigner URL + clé anon
```

Dès que `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` sont
définies, l'application utilise Supabase sans autre changement : les deux
adaptateurs exposent la même interface (`src/data/index.js` choisit à
l'import).

Appliquer le schéma :

```bash
psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql
```

Puis activer l'authentification par téléphone (OTP SMS) dans le tableau de
bord Supabase.

---

## Tests

```bash
npm test                                            # 74 tests JS (jest-expo)
psql "$DATABASE_URL" -f supabase/tests/business_rules.sql   # 17 assertions SQL
```

| Suite | Portée |
|-------|--------|
| `src/services/notify.test.js` (24) | Heures calmes 22 h–08 h, report au lendemain, quota journalier, blackout Ramadan, troncature à 160 caractères, priorités d'envoi |
| `src/data/local.test.js` (50) | Backend local : authentification, disponibilités, création et annulation, signature PIN, acompte, avis et modération, quota SMS, favoris, recherche, tableau de bord, planning, abonnement, messagerie |
| `supabase/tests/business_rules.sql` (17) | Les mêmes règles §10, mais côté PostgreSQL : unicité du jour confirmé, PIN, délai d'avis, publication automatique, agrégats, absence de policy `DELETE` sur les avis |

Les règles critiques sont vérifiées **dans les deux implémentations**, ce qui
garantit que passer du mode démo à Supabase ne change pas le comportement.

---

## Architecture

```
tasale/
├── App.js                    Navigation : auth → inscription → onglets client ou pro
├── src/
│   ├── theme.js              Tokens du design system (§3), clair + sombre
│   ├── i18n/                 Français / arabe avec direction RTL (§1.4)
│   ├── lib/                  Constantes métier, formatage DA et calendrier
│   ├── data/
│   │   ├── index.js          Sélection de l'adaptateur
│   │   ├── local.js          Backend de démonstration (règles §10 appliquées)
│   │   ├── remote.js         Backend Supabase (mêmes signatures)
│   │   └── seed.js           Jeu de données algérien
│   ├── services/notify.js    Moteur de notifications : canaux, quotas, heures calmes
│   ├── context/              Thème, authentification, favoris
│   ├── components/           Design system + composants métier
│   └── screens/
│       ├── auth/             Onboarding, téléphone, OTP, rôle, inscription salle
│       ├── client/           Accueil, recherche, fiche salle, réservation, avis…
│       ├── pro/              Tableau de bord, planning, réservations, statistiques…
│       └── shared/           Notifications, messagerie, profil
└── supabase/
    ├── migrations/           Schéma §8 + index §8.2 + RLS + RPC §9
    └── tests/                Vérification des règles §10
```

### Deux backends, une interface

`src/data/index.js` réexporte les mêmes ~40 fonctions depuis `local.js` ou
`remote.js`. Aucun écran n'importe un adaptateur directement : passer de la
démo à la production ne touche pas une ligne d'interface.

Les règles sensibles sont appliquées **des deux côtés** : dans `local.js` en
JavaScript, et dans `0001_init.sql` en PL/pgSQL avec `SECURITY DEFINER`. Sur
Supabase, elles tiennent même face à un client modifié — l'unicité du jour
confirmé repose sur un index unique partiel, pas sur une vérification
applicative.

---

## Couverture des spécifications

### Livré

- **§3 Design system** — tokens exacts, mode sombre, boutons/inputs/badges/chips/cartes
- **§4 Parcours client** — accueil, recherche filtrée, fiche salle, réservation en 4 étapes, favoris avec comparatif, avis, notifications, profil
- **§5 Parcours pro** — tableau de bord (KPI, graphique, alertes), planning interactif, réservations avec confirmation/refus, ma salle (3 onglets), statistiques, abonnement
- **§6 Notifications** — centre in-app filtrable, templates SMS 160 caractères, priorités, heures calmes 22 h–08 h, quota de 3 SMS/jour, blackout Ramadan
- **§7 Avis** — dépôt noté par critère avec photos et consentement, modération pro, publication automatique à 24 h, badge « client confirmé », répartition des notes, réponse du propriétaire
- **§8 Modèle de données** — schéma complet, index recommandés, RLS
- **§9 Endpoints** — équivalents en RPC Supabase
- **§10 Règles métier** — les quatre familles de règles, testées
- **§11 Paiement** — workflow d'acompte complet (demande → SMS CCP → déclaration → vérification), configuration de l'abonnement

### Non livré

- **Envoi réel des SMS/push.** Le moteur `services/notify.js` décide *quoi*
  envoyer, *par quel canal* et *à quelle heure* (les règles §6.3 et §10.4 sont
  implémentées et les messages sont journalisés), mais aucun opérateur n'est
  branché. Il reste à connecter Djezzy/Ooredoo et Firebase Cloud Messaging
  dans un worker.
- **Prélèvement de l'abonnement.** La méthode de paiement se configure et
  l'historique s'affiche ; le prélèvement CCP/BaridiMob suppose une intégration
  bancaire hors application.
- **Cartographie.** La distance figure sur les fiches, sans carte Mapbox.
- **Upload des photos.** Les photos sont sélectionnées et affichées localement ;
  leur envoi vers S3/R2 reste à câbler.
- **Mode hors-ligne du planning pro** (§1.4) — le backend local fonctionne sans
  réseau, mais aucune synchronisation différée n'est implémentée pour Supabase.
- **Console admin Tasale** (§2.1 `apps/admin`).

---

## Choix techniques

**Une base de code au lieu de trois.** Les spécifications proposent React
Native pour le client, Next.js pour le pro et une console admin séparée. Expo
rend les trois cibles — iOS, Android, web — depuis le même code : le
back-office pro tourne dans le navigateur via `npm run web`, avec une grille
de KPI qui passe à 4 colonnes au-delà de 720 px. Cela évite de dupliquer le
design system, les types et la logique métier au prix d'un back-office qui
n'est pas une application web native.

**Supabase plutôt qu'une API maison.** Les spécifications décrivent PostgreSQL,
JWT et des rôles — exactement ce que Supabase fournit, avec en plus
l'authentification OTP SMS et le RLS. Les endpoints §9 deviennent des RPC.

**Couleurs des graphiques.** La palette de marque ne peut pas servir de palette
catégorielle : terracotta `#C8956C` et or `#D4A853` ne sont séparés que de
ΔE 6,8 en vision normale — un lecteur sans déficience de la vision des
couleurs ne les distingue pas. Les répartitions (types d'événements, sources,
occupation) sont donc rendues en lignes libellées mono-teinte, l'identité
étant portée par le texte. Sur fond sombre, l'émeraude passe à `#14A38C` :
`#0B6E5F` n'atteint que 2,83:1 de contraste.

**RTL sans redémarrage.** `I18nManager.forceRTL` impose un redémarrage natif.
La direction est appliquée dans les styles (`dir`, `align`, `writing`), ce qui
permet de basculer français/arabe instantanément, y compris sur le web. Les
champs téléphone restent en LTR conformément au §4.4.

---

## Vérification effectuée

- `npm test` — 74 tests au vert
- `npx expo export --platform web` — 752 modules, aucune erreur
- Parcours pro complet en navigateur (Playwright) : connexion OTP → tableau de
  bord → confirmation d'une demande avec acompte et signature PIN → planning →
  statistiques → abonnement
- Parcours client complet : connexion → recherche → fiche salle → réservation
  en 4 étapes → écran de succès avec référence `TAS-2026-XXXX`
- Bascule en arabe : accueil, recherche et barre d'onglets correctement inversés
- Zéro erreur console sur les trois parcours
- Schéma appliqué sur PostgreSQL 16 : 22 policies RLS, 17 assertions métier au vert

Non vérifié : rendu sur appareils iOS/Android réels (bundle web uniquement),
et comportement contre une instance Supabase réelle — `src/data/remote.js`
n'est validé qu'indirectement, à travers le schéma que ses appels RPC ciblent.
