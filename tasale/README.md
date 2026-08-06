# Tasalle

> Vos célébrations, notre passion
>
> **Tasalle · Algérie**

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

### Photos des salles

`src/data/photos.json` associe un identifiant de salle à une liste d'URL. Il
est **vide par défaut** : les salles s'affichent alors avec un dégradé portant
leur initiale, et l'app reste utilisable hors ligne. Renseignez-le pour voir
de vraies photos :

```json
"salles": {
  "salle-003": {
    "credit": "Pexels — Prénom Nom",
    "urls": ["https://images.pexels.com/photos/XXXXX/pexels-photo-XXXXX.jpeg?w=1200"]
  }
}
```

Le mélange fonctionne : une salle renseignée montre sa photo, les autres
gardent leur dégradé.

**Où prendre les images.** Uniquement des sources autorisant l'usage
commercial — [Pexels](https://www.pexels.com/license/) et
[Unsplash](https://unsplash.com/license) le permettent sans attribution — ou
les photos que les propriétaires envoient eux-mêmes depuis l'app, ce qui est
le fonctionnement prévu en production.

Ne reprenez pas d'images d'Instagram, de Facebook, de Google Images ou des
sites des salles : elles appartiennent à leurs auteurs, et leur réutilisation
dans une application commerciale est une contrefaçon. Le risque est d'autant
moins théorique que ce sont ces mêmes propriétaires que Tasalle démarche.

### Comptes de démonstration

Le code SMS est toujours `123456`.

| Rôle | Téléphone | Contenu |
|------|-----------|---------|
| **Pro** | `0555 10 00 01` | Karim Belkacem — **deux salles** : El Widad (7 réservations, 2 en attente, 1 avis à modérer) et Espace Andalous (vide). Essai à J+45, un seul pour les deux |
| **Client** | `0661 23 45 67` | Amina Cherif — 1 réservation confirmée, 1 événement passé à évaluer, 2 favoris |
| *Autres pros* | `0555 10 00 02` … `0555 10 00 11` | Propriétaires mono-salle : le sélecteur de salle ne s'affiche pas chez eux |
| **Admin** | `0555 00 00 00` | Équipe Tasalle — 1 salle à valider, 1 avis signalé |
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

Appliquer le schéma, dans l'ordre :

```bash
psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql       # tables, RLS, RPC
psql "$DATABASE_URL" -f supabase/migrations/0002_lifecycle.sql  # tâches quotidiennes
psql "$DATABASE_URL" -f supabase/migrations/0003_storage.sql    # buckets d'images
psql "$DATABASE_URL" -f supabase/migrations/0004_cron.sql       # planification
psql "$DATABASE_URL" -f supabase/migrations/0005_delivery.sql   # file d'expédition
psql "$DATABASE_URL" -f supabase/migrations/0006_admin.sql      # console d'administration
psql "$DATABASE_URL" -f supabase/migrations/0007_geo.sql        # position des salles
psql "$DATABASE_URL" -f supabase/migrations/0008_multi_salles.sql # plusieurs salles par propriétaire
psql "$DATABASE_URL" -f supabase/migrations/0009_francais_seul.sql # retrait de la préférence de langue
```

`0003` suppose le schéma `storage` : il ne s'applique que sur Supabase.
`0004` demande `pg_cron` et `pg_net` (Database → Extensions) ; sans elles il
n'échoue pas, il signale simplement qu'il n'a rien planifié. Tous les fichiers
sont rejouables.

### Envoi des SMS

L'authentification par téléphone de Supabase n'accepte qu'une liste fermée de
fournisseurs. Le **Send SMS Hook** contourne cette limite : Supabase délègue
l'envoi du code à une fonction, ce qui permet d'utiliser un opérateur algérien
sans toucher au flux d'authentification.

```bash
supabase functions deploy send-sms-hook
supabase secrets set SEND_SMS_HOOK_SECRET='v1,whsec_...' \
                     SMS_PROVIDER=http \
                     SMS_HTTP_URL='https://passerelle.example/envoi' \
                     SMS_HTTP_TOKEN='...'
```

Puis **Authentication → Hooks → Send SMS**, en pointant sur la fonction.

`SMS_PROVIDER` vaut `log` par défaut : rien n'est envoyé, tout est journalisé.
C'est volontaire — la chaîne se vérifie de bout en bout sans coût ni risque
avant de brancher un vrai opérateur. `twilio` et `http` (routeur GSM ou
passerelle d'opérateur) sont les deux autres modes.

### Expédition des notifications

```bash
supabase functions deploy dispatch-notifications
```

Le worker lit les notifications arrivées à échéance et les envoie — SMS via le
même adaptateur, push via le service d'Expo. Il ne rejuge rien : les règles
d'heure et de quota ont déjà fixé `sent_at`. Trois tentatives par message, puis
abandon sans suppression.

Pour le planifier toutes les 5 minutes :

```sql
alter database postgres set app.settings.dispatch_url =
    'https://<ref>.supabase.co/functions/v1/dispatch-notifications';
alter database postgres set app.settings.service_key = '<clé service_role>';
```

puis rejouer `0004_cron.sql`.

---

## Tests

```bash
npm test                                                    # 200 tests JS (jest-expo)
psql "$DATABASE_URL" -f supabase/tests/business_rules.sql   # 17 assertions SQL
psql "$DATABASE_URL" -f supabase/tests/lifecycle.sql        # 16 assertions SQL
psql "$DATABASE_URL" -f supabase/tests/admin.sql            # 14 assertions SQL
psql "$DATABASE_URL" -f supabase/tests/multi_salles.sql     # 10 assertions SQL
```

Les suites SQL tournent aussi sur un PostgreSQL nu, sans projet Supabase :
`supabase/tests/_bootstrap_local.sql` recrée d'abord le schéma `auth`, la
fonction `auth.uid()` et les rôles `anon` / `authenticated` / `service_role`
que Supabase fournit d'office. À appliquer avant les migrations, et seulement
en local.

```bash
createdb tasale && export DATABASE_URL=postgres:///tasale
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/_bootstrap_local.sql
```

| Suite | Portée |
|-------|--------|
| `src/services/notify.test.js` (24) | Heures calmes 22 h–08 h, report au lendemain, quota journalier, blackout Ramadan, troncature à 160 caractères, priorités d'envoi |
| `src/data/local.test.js` (72) | Backend local : authentification, disponibilités, création et annulation, signature PIN, acompte, avis et modération, quota SMS, photos, favoris, recherche, tableau de bord, planning, abonnement, messagerie, cloisonnement entre propriétaires |
| `src/lib/storage.test.js` (10) | Décodage base64 des images (les 256 valeurs d'octet), unicité et extension des chemins de destination |
| `src/data/cache.test.js` (11) | Cache hors ligne : repli sur la dernière réponse connue, refus d'une donnée périmée, propagation de l'erreur quand aucun cache n'existe |
| `src/services/pdfTemplates.test.js` (31) | Contrat, planning et facture : montants et solde, mention de signature, salles couvertes par l'abonnement, échappement HTML d'un nom de client piégé, traduction des énumérations |
| `src/lib/geo.test.js` (26) | Distance orthodromique vérifiée sur des écarts connus (Alger–Oran, un degré de latitude), tri par proximité, liens d'itinéraire par plateforme |
| `src/i18n/i18n.test.js` (7) | Chaque clé appelée dans le code existe — une clé absente s'afficherait telle quelle à l'écran, sans erreur — et aucun libellé n'est écrit en dur dans le JSX |
| `src/theme.test.js` (18) | Contrastes calculés selon WCAG 2.1 : encre de marque ≥ 4,5:1 dans les deux thèmes, libellé lisible sur les aplats — y compris après l'inversion des rôles en thème sombre — rouge d'erreur tenant dans ses deux emplois, et l'or de marque verrouillé **sous** le seuil, pour qu'il ne devienne jamais une couleur de texte |
| `supabase/tests/business_rules.sql` (17) | Les mêmes règles §10, mais côté PostgreSQL : unicité du jour confirmé, PIN, délai d'avis, publication automatique, agrégats, absence de policy `DELETE` sur les avis |
| `supabase/tests/admin.sql` (14) | Autorisations de la console : un client n'obtient pas les chiffres, un pro ne valide pas sa propre salle, un avis retiré reste en base |
| `supabase/tests/lifecycle.sql` (16) | Clôture des événements passés, rappel J-1, demande d'avis à J+48 h, rappels et expiration d'essai — chaque tâche vérifiée aussi pour son idempotence |
| `supabase/tests/multi_salles.sql` (10) | Un propriétaire ne lit ni ne modifie la salle d'un autre, un seul abonnement par propriétaire, le tableau de bord et les statistiques restent cloisonnés par salle |

Les règles critiques sont vérifiées **dans les deux implémentations**, ce qui
garantit que passer du mode démo à Supabase ne change pas le comportement.

---

## Architecture

```
tasale/
├── App.js                    Navigation : auth → inscription → onglets client ou pro
├── src/
│   ├── theme.js              Tokens du design system (§3), clair + sombre
│   ├── i18n/                 Tous les textes de l'interface, en français
│   ├── lib/                  Constantes métier, formatage DA et calendrier
│   ├── data/
│   │   ├── index.js          Sélection de l'adaptateur
│   │   ├── local.js          Backend de démonstration (règles §10 appliquées)
│   │   ├── remote.js         Backend Supabase (mêmes signatures)
│   │   └── seed.js           Jeu de données algérien
│   ├── services/
│   │   ├── notify.js         Décision d'envoi : canaux, quotas, heures calmes
│   │   └── push.js           Enregistrement de l'appareil pour les push
│   ├── context/              Thème, authentification, favoris, salle courante
│   ├── components/           Design system + composants métier
│   └── screens/
│       ├── auth/             Onboarding, téléphone, OTP, rôle, inscription salle
│       ├── client/           Accueil, recherche, fiche salle, réservation, avis…
│       ├── pro/              Tableau de bord, planning, réservations, statistiques…
│       └── shared/           Notifications, messagerie, profil
└── supabase/
    ├── migrations/           Schéma §8, RLS, RPC §9, cycle de vie, expédition
    ├── functions/
    │   ├── _shared/sms.ts    Adaptateur d'opérateur (log / twilio / http)
    │   ├── send-sms-hook/    Hook OTP de Supabase Auth
    │   └── dispatch-notifications/  Worker : vide la file échue
    └── tests/                Vérification des règles §10 et du cycle de vie
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
- **§12 Phase 3 — finitions** — export PDF (planning, contrat, **facture
  d'abonnement**), mode hors ligne du planning, réponses rapides de la
  messagerie adaptées au rôle, filtres avancés, console
  d'administration
- **§12 Phase 4 — plusieurs salles par propriétaire** — un sélecteur en tête de
  l'espace pro, chaque écran cloisonné sur la salle choisie, choix mémorisé
  d'une session à l'autre. L'abonnement reste **par propriétaire** : ajouter
  une salle ne relance pas l'essai et ne double pas les 500 DA

### Non livré

- **Contrat opérateur SMS.** Toute la chaîne est écrite — décision d'envoi,
  hook OTP, worker d'expédition, adaptateur de fournisseur — mais aucun compte
  opérateur n'est ouvert. Il reste à souscrire chez un opérateur algérien (ou
  Twilio) et à renseigner `SMS_PROVIDER` et ses variables. Aucun code à écrire.
- **Fonctions Edge non exécutées.** `send-sms-hook` et `dispatch-notifications`
  sont écrites mais n'ont jamais tourné : cet environnement n'a pas Deno et le
  proxy bloque les hôtes externes. Elles demandent une première exécution
  attentive.
- **Prélèvement de l'abonnement.** La méthode de paiement se configure,
  l'historique s'affiche, et l'essai bascule automatiquement en abonnement
  actif à son terme ; le prélèvement CCP/BaridiMob suppose une intégration
  bancaire hors application.

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

**L'or de la marque n'est pas une couleur d'interface.** Le monogramme et le
filet circulaire sont dans l'or du document de marque, `#BE9A5E`, qui ne fait
que 2,63:1 sur blanc. WCAG 2.1 exempte les logotypes de son critère de
contraste (1.4.3), donc c'est admis — pour le logo seul. Partout ailleurs,
l'or lisible est `goldText` (`#8B6914`, 5,09:1). Un test fige cette frontière
dans les deux sens, de sorte que promouvoir `logoInk` en couleur de texte
échoue au lieu de passer inaperçu.

**Le monogramme est tracé, pas composé.** Le T et le S se chevauchent : le S
descend sous la ligne du T et mord sur son pied. Un interlettrage négatif les
laisserait côte à côte, alors le composant les pose séparément dans un SVG de
100 × 100. Le générateur d'icônes (`assets/`) reprend exactement les mêmes
proportions, pour que la marque de l'application et celle des stores soient
la même. Les lettres s'appuient encore sur le serif du système : les fondre
en tracés — ou embarquer la fonte du document de marque — reste à faire si
l'on veut une identité au pixel près sur les trois plateformes.

**La palette est celle du logo.** L'émeraude du cahier des charges a été
écartée : la marque ne la porte pas. Restent le noir du mot-symbole et l'or.

L'or ne peut pas tout faire — `#BE9A5E` ne fait que 2,63:1 sur blanc. D'où
trois jetons là où le vert n'en demandait qu'un : `primary` remplit les aplats
(noir, blanc dessus à 17,4:1), `primaryInk` écrit (or profond `#8B6914`,
5,09:1), `gold` décore. En thème sombre les rôles s'inversent — un aplat noir
y disparaîtrait, c'est donc l'or qui remplit et le noir qui s'y inscrit — d'où
le jeton `onPrimary`, sans lequel le libellé serait resté blanc en dur, à
2,63:1 sur l'or.

Les répartitions restent rendues en lignes libellées mono-teinte : les teintes
chaudes de la marque sont trop proches (ΔE < 15) pour qu'une palette
catégorielle soit lisible.

**Impression web sans `expo-print`.** La version web d'`expo-print` ignore le
HTML qu'on lui passe et appelle `window.print()` : elle imprime l'écran de
l'application, pas le document. Le back-office pro tournant dans un navigateur,
`exportToPdf` y monte le document dans un cadre hors écran et imprime celui-ci.
Sur iOS et Android, `printToFileAsync` fait bien son travail et reste utilisé.

**Français seul.** Le cahier des charges prévoyait une interface bilingue
français/arabe avec sens de lecture inversé (§1.4). C'est écarté : l'app
s'adresse à un public francophone, et une seconde langue sans personne pour la
lire coûte à chaque écran sans rien apporter. Le dictionnaire arabe, le
sélecteur de langue, la colonne `preferred_language` et toute la mécanique RTL
— `dir`, `align`, `isRTL` — ont été retirés, soit 254 substitutions dans
55 fichiers.

Le passage par `t()` est conservé malgré la langue unique : il garde tous les
textes visibles dans un seul fichier, ce qu'un test vérifie, et rendrait une
seconde langue possible sans rouvrir chaque écran.

---

## Vérification effectuée

- `npm test` — 200 tests au vert
- `npx expo export --platform web` — 917 modules, aucune erreur
- Parcours pro complet en navigateur (Playwright) : connexion OTP → tableau de
  bord → confirmation d'une demande avec acompte et signature PIN → planning →
  statistiques → abonnement
- Parcours client complet : connexion → recherche → fiche salle → réservation
  en 4 étapes → écran de succès avec référence `TAS-2026-XXXX`
- Export PDF vérifié dans le navigateur : le document produit est bien la
  facture ou le planning, et non une capture de l'écran
- Multi-salles en navigateur : le sélecteur n'apparaît qu'à partir de deux
  salles, le tableau de bord, le planning et « Ma salle » suivent la salle
  choisie, et celle-ci survit à un rechargement
- Zéro erreur console sur les trois parcours
- Schéma appliqué sur PostgreSQL 16 : 23 policies RLS, 33 assertions SQL au vert
- File d'expédition vérifiée : un message échu sort de la file, un message
  futur ou écarté par le quota n'en sort pas, et la livraison le retire
  (17 règles métier + 16 tâches de cycle de vie)
- Icônes générées aux formats exigés : `icon.png` 1024² sans canal alpha comme
  l'impose Apple, avant-plan adaptatif Android transparent, favicon, splash

Non vérifié : rendu sur appareils iOS/Android réels (bundle web uniquement),
et comportement contre une instance Supabase réelle — `src/data/remote.js`
n'est validé qu'indirectement, à travers le schéma que ses appels RPC ciblent.
