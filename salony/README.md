# Salony — Réservation salons coiffure / beauté / soins (Algérie & Maghreb)

Scaffold React Native / Expo + Supabase, structuré comme Mida.

## Mise en route

1. `npm install`
2. Créer un projet Supabase, puis exécuter les migrations dans l'ordre :
   - `supabase/migrations/0001_init.sql` (tables, RLS, moteur de disponibilité)
   - `supabase/migrations/0002_paiements_rappels.sql` (paiements, rappels)
   - `supabase/migrations/0003_creneaux_salon.sql` (créneaux « sans préférence »)
   - `supabase/migrations/0004_annulation_remboursement.sql` (annulation, remboursement, score de fiabilité)
   - `supabase/migrations/0005_staff_role_storage.sql` (rôle employé, bucket photos)
   - `supabase/migrations/0006_geoloc_finitions.sql` (géolocalisation exploitable, recherche par proximité, avis)
   - `supabase/migrations/0007_admin.sql` (rôle administrateur, modération des salons)
3. Déployer les Edge Functions (voir section dédiée ci-dessous)
4. Renseigner les variables d'environnement (fichier `.env`, voir `.env.example` ci-dessous)
5. `npm start`

```
# .env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxx
```

## Contenu de ce scaffold

- `supabase/migrations/` — schéma Supabase complet : tables, RLS, moteur de disponibilité (`get_available_slots`), table `payments`, colonnes de suivi des rappels
- `supabase/functions/` — Edge Functions : `create-satim-payment`, `satim-webhook`, `refund-satim`, `send-booking-reminders`
- `App.js` — navigation (onboarding → auth → tabs client/pro selon le rôle)
- `supabase.js` — client Supabase
- `src/theme.js` — tokens de design (palette, spacing, typo)
- `src/i18n/` — moteur de traduction (fr.js, ar.js, provider + hooks)
- `src/SalonContext.js` — salon actif du compte pro ; `src/annulation.js` — annulation partagée client/pro ; `src/photos.js` — upload vers Storage
- `src/components/` — Button, Card, Badge, Avatar, RatingStars, SalonCard, ServiceListItem, TimeSlotButton, EmptyState
- `screens/` — 28 écrans : client (Auth, Onboarding, Home, Search, Salon, StaffSelect, BookingForm, Acompte, Map, Reservations, Favoris, Notifications, Profil, ReviewForm), pro (Dashboard, Agenda, Comptoir, Services, Staff, StaffForm, Availability, Reviews, Settings, Location, SalonSelect, Inscription), employé (StaffAgenda) et admin (Modération)

## Paiement d'acompte (CIB / Edahabia via SATIM)

SATIM est l'opérateur qui traite les paiements par carte CIB/Edahabia en Algérie ; c'est la seule voie réaliste pour un paiement carte in-app localement (pas de Stripe/PayPal opérationnels pour les commerçants algériens à ce jour).

- Ouvrir un compte marchand SATIM (convention avec votre banque) pour obtenir `SATIM_MERCHANT_ID` / `SATIM_MERCHANT_PASSWORD`
- Le flux : `AcompteScreen` → Edge Function `create-satim-payment` (crée la commande via `register.do`, retourne une `formUrl`) → WebView in-app → retour détecté → `satim-webhook` revérifie le statut réel via `getOrderStatus.do` avant de marquer `bookings.acompte_paye = true`
- Le client peut toujours choisir **"Payer en espèces sur place"** : le pro marque alors l'acompte reçu manuellement dans `ProComptoir`, ce qui reste le mode par défaut le plus réaliste tant que le compte marchand SATIM n'est pas actif
- Secrets à configurer : `supabase secrets set SATIM_API_URL=... SATIM_MERCHANT_ID=... SATIM_MERCHANT_PASSWORD=... SATIM_RETURN_URL=...`

**Non testé en conditions réelles** — l'implémentation suit le protocole documenté de la passerelle SATIM (register.do / getOrderStatus.do) mais n'a pas pu être validée avec de vrais identifiants marchands dans cet environnement.

## Rappels automatiques WhatsApp

- Utilise l'API WhatsApp Cloud de Meta (accessible depuis l'Algérie), pas Twilio
- Nécessite un compte WhatsApp Business + un template de message pré-approuvé par Meta (obligatoire pour tout message hors fenêtre de conversation de 24h)
- `supabase/functions/send-booking-reminders` envoie les rappels à J-24h et J-2h, marque `bookings.rappel_24h_envoye` / `rappel_2h_envoye` pour éviter les doublons, et loggue dans `notifications`
- Planification : activer `pg_cron` + `pg_net` puis exécuter le `cron.schedule(...)` commenté en bas de `0002_paiements_rappels.sql` (toutes les 15 min)
- Secrets à configurer : `supabase secrets set WHATSAPP_TOKEN=... WHATSAPP_PHONE_NUMBER_ID=... WHATSAPP_TEMPLATE_NAME=...`

## Déployer les Edge Functions

```
supabase functions deploy create-satim-payment
supabase functions deploy satim-webhook --no-verify-jwt
supabase functions deploy send-booking-reminders --no-verify-jwt
supabase functions deploy refund-satim
```

## Carte et géolocalisation

- Le pro place son salon sur la carte via Réglages → « Placer sur la carte » (`ProLocationScreen`, marqueur déplaçable). Sans cette étape le salon n'apparaît pas sur la carte des clients
- `MapScreen` affiche les salons autour de l'utilisateur, triés par distance réelle via PostGIS (`salons_a_proximite`, rayon 25 km), avec repli sur la liste complète si la permission de localisation est refusée
- **Point technique important** : les coordonnées sont stockées en clair dans `salons.latitude` / `longitude`, et `salons.location` (PostGIS) est maintenue par trigger. PostgREST sérialise une colonne `geography` en WKB hexadécimal, illisible côté app — d'où ce doublon assumé, qui garde les recherches par distance côté base
- `ExplorerScreen` (carte + filtres avancés) n'a pas été dupliqué : `MapScreen` couvre le besoin MVP, à enrichir plutôt que maintenir deux écrans redondants

## Avis et favoris

- Un avis n'est possible qu'après un RDV `termine`, une seule fois par réservation (contrainte unique sur `reviews.booking_id`, doublée d'un contrôle RLS). Bouton « Laisser un avis » dans Réservations, écran `ReviewFormScreen`
- La note moyenne du salon et son nombre d'avis sont recalculés par trigger à chaque avis — c'est ce qui alimente le tri de l'accueil
- Les 5 derniers avis (avec réponse du salon si elle existe) sont affichés sur la fiche salon
- Le pro répond publiquement depuis l'onglet Avis (`ProReviewsScreen`)
- Favori : cœur en surimpression sur la photo de la fiche salon, avec mise à jour optimiste

## Réservation « sans préférence »

Quand le client ne choisit pas de praticien dans `StaffSelectScreen`, `BookingFormScreen` appelle `get_salon_available_slots` (migration 0003) au lieu de `get_available_slots` :

- La RPC agrège les créneaux de **tous les praticiens éligibles** du salon et déduplique par horaire
- Pour chaque créneau, elle retient le praticien **le moins chargé ce jour-là**, ce qui répartit la charge dans l'équipe plutôt que de saturer le premier de la liste
- L'éligibilité se base sur `staff_services` (le praticien doit assurer toutes les prestations demandées). Choix volontaire : un praticien **sans aucune liaison** `staff_services` est considéré polyvalent, pour qu'un salon qui n'a pas encore rempli cette matrice ne se retrouve pas avec zéro créneau réservable
- Le nom du praticien retenu est affiché au client avant confirmation, et c'est ce `staff_id` qui est inséré dans `bookings`

## Annulation et remboursement d'acompte

- Chaque salon fixe son `delai_annulation_h` (défaut : 24 h). Au-delà de ce délai, l'annulation est gratuite ; en deçà, l'acompte reste acquis au salon — c'est sa raison d'être
- La RPC `cancel_booking` applique la règle côté base et retourne si l'acompte est remboursable. Elle tourne en `SECURITY INVOKER`, donc les RLS s'appliquent : seul le client concerné ou le propriétaire du salon peut annuler
- Si remboursable, l'app appelle l'Edge Function `refund-satim` (opération `refund.do`). Elle **revérifie systématiquement les conditions côté serveur** — jamais sur la seule parole du client. Un acompte réglé en espèces est marqué comme à restituer au salon plutôt que remboursé en ligne
- Le propriétaire du salon peut forcer un remboursement hors délai (geste commercial) : la vérification du délai ne s'applique qu'aux annulations initiées par le client
- Logique partagée dans `src/annulation.js`, utilisée par `ReservationsScreen` (client) et `ProComptoir` (pro)
- **Score de fiabilité** : un trigger pénalise de −0,5 chaque no-show et récompense de +0,1 chaque RDV honoré (borné 0–5). C'est ce score que le pro voit pour repérer les clients à risque

## Comptes pro multi-salons

- Un compte pro peut détenir plusieurs salons (`salons.owner_id`). Le salon actif est porté par `src/SalonContext.js` plutôt que par les params de navigation — ça évite les avertissements React Navigation sur les valeurs non sérialisables et permet d'en changer depuis n'importe quel écran
- Sélection automatique s'il n'y a qu'un seul salon validé ; sinon `ProSalonSelectScreen` demande de choisir, en affichant le statut de chacun (les salons non validés ne sont pas sélectionnables)
- Changement de salon depuis Profil → « Changer de salon ». Le `key={salonId}` sur `ProTabs` force le remontage des onglets, `initialParams` étant figé après le premier rendu

## Administration (modération des salons)

Un salon inscrit reste en `en_attente` et invisible des clients jusqu'à validation.

- **Créer le premier admin** (unique geste manuel en base, une seule fois) :
  ```sql
  update public.profiles set role = 'admin' where telephone = '0…';
  ```
- Ce compte accède ensuite à `AdminScreen` : file d'attente par statut, fiche complète (photos, adresse, registre de commerce, propriétaire), et actions Valider / Refuser / Suspendre
- `moderer_salon` notifie automatiquement le propriétaire du changement de statut
- Les policies admin s'ajoutent aux existantes — PostgreSQL combine les policies permissives avec un OU, rien n'est retiré aux autres rôles

## Rôle employé (`staff`)

Quatre rôles coexistent : `client`, `pro` (gérant, propriétaire d'un ou plusieurs salons), `staff` (employé) et `admin`.

- Le gérant ajoute un praticien dans l'onglet Équipe, puis saisit le téléphone de l'employé pour **rattacher son compte** (RPC `lier_staff_a_profil`). L'employé doit s'être inscrit au préalable avec ce numéro
- La fiche praticien porte aussi la **matrice `staff_services`** : cocher les prestations qu'il assure. Aucune coche = polyvalent (proposé pour tout), ce qui évite qu'un salon non configuré n'affiche zéro créneau
- Le rôle passe de `client` à `staff` au rattachement. Un compte déjà `pro` n'est jamais rétrogradé : un gérant peut être praticien dans son propre salon sans perdre ses droits
- `StaffAgendaScreen` ne montre que ses propres rendez-vous, et c'est garanti **au niveau base** par les RLS (`current_staff_ids()`), pas seulement par un filtre côté app. Il peut clôturer un RDV ou signaler une absence, mais ne voit ni le chiffre d'affaires, ni l'agenda des collègues
- Retirer un praticien le **désactive** (`actif = false`) plutôt que de le supprimer : `bookings.staff_id` est en `on delete restrict`, l'historique des RDV doit rester intact

## Paramètres du salon et photos

- `ProSettingsScreen` (onglet Réglages) : coordonnées, délai d'annulation, horaires d'ouverture jour par jour, et gestion des photos
- Les horaires d'ouverture affichés aux clients sont distincts des disponibilités réservables, qui dépendent de chaque praticien — l'écran le rappelle explicitement pour éviter la confusion
- Les photos passent par le bucket Storage `photos` (public en lecture). Les RLS imposent que le premier segment du chemin soit l'id de l'utilisateur (`<user_id>/<dossier>/<timestamp>.<ext>`), logique centralisée dans `src/photos.js`

## Multilingue français / arabe (RTL)

- Les libellés vivent dans `src/i18n/fr.js` et `src/i18n/ar.js` — **276 clés, parité stricte** entre les deux fichiers. Une clé absente retombe sur le français puis sur la clé elle-même : un libellé manquant n'affiche jamais de vide et ne fait jamais planter un écran
- Usage : `const t = useT()` puis `t('salon.prestations')`, avec interpolation `t('recherche.distance', { n: 3 })`. `useI18n()` donne en plus `locale` (pour `toLocaleTimeString`), `langue` et `estRTL`
- Le choix de langue est dans Profil. Il est persisté dans AsyncStorage **et** dans `profiles.langue` — cette seconde copie sert aux rappels WhatsApp, envoyés côté serveur dans la langue du client
- **RTL** : passer en arabe appelle `I18nManager.forceRTL`, qui ne prend effet **qu'au redémarrage de l'app** (contrainte React Native, pas un oubli) — l'utilisateur en est averti par une alerte. Les styles directionnels utilisent les variantes logiques (`marginStart`, `end`, `borderStartWidth`) qui s'inversent automatiquement ; `marginLeft`/`right` ne l'auraient pas fait
- **Ce que RTL n'inverse pas** : la liste des propriétés retournées est fermée. Ni les **caractères**, ni `transform` n'en font partie. Une flèche « ← » écrite en dur continue donc de pointer à gauche en arabe, à contresens de la mise en page. D'où `FLECHE_RETOUR`, `FLECHE_AVANT` et `CHEVRON`, exportées par `src/i18n` — à utiliser systématiquement. Elles se lisent depuis `I18nManager.isRTL`, jamais depuis la langue choisie : `forceRTL` n'agissant qu'au redémarrage, se fier à la langue retournerait le glyphe alors que la mise en page, elle, n'a pas encore basculé
- `npm run check:i18n` garde les deux règles : parité stricte fr/ar, et aucun glyphe directionnel en dur hors du module i18n. Retirer une clé arabe ou réécrire « ← » dans un écran fait échouer la commande

**Limite connue** : les messages renvoyés par les RPC PostgreSQL (`cancel_booking`, `moderer_salon`, `lier_staff_a_profil`) sont rédigés en français **en base** et s'affichent tels quels. Les traduire suppose de renvoyer des codes plutôt que des phrases — refonte à prévoir si l'arabe devient la langue principale.

**La traduction arabe n'a pas été relue par un locuteur natif.** C'est de l'arabe standard ; certaines formulations gagneraient à être adaptées aux usages algériens avant publication.

## Points d'attention avant mise en prod

- `SATIM_RETURN_URL` doit contenir un identifiant détectable côté WebView (`SATIM_RETURN_HOST` dans `AcompteScreen.js`) pour déclencher la vérification du paiement au retour — à adapter selon l'URL réelle fournie par votre configuration SATIM
- Le double-booking d'un praticien est bloqué au niveau base (contrainte `exclude` PostgreSQL sur `bookings`), donc même en cas de concurrence entre deux clients, un seul créneau sera confirmé

## Reste en V2 / non couvert

- `ExplorerScreen` dédié avec filtres avancés sur la carte
- Notifications push (Expo Notifications) en complément des rappels WhatsApp
- Statistiques réelles dans `ProDashboard` : le CA de la semaine et le taux d'absence sont affichés à 0 (l'écran ne calcule que le nombre de RDV du jour)
- Modification d'une réservation existante (changer d'horaire sans annuler puis re-réserver)
- Relecture de la traduction arabe par un locuteur natif, et messages d'erreur serveur multilingues
