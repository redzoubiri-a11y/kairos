# Kairos Studio — Phase 1

Moteur marketing du groupe. Il lit les applications **en lecture seule**, écrit
dans son propre projet Supabase, et produit un texte et un visuel par entité.

Première application branchée : **Mida**.

---

## ⚠️ La spec n'a pas pu être lue

`KAIROS_STUDIO_SPEC.md` n'existe ni dans ce dépôt ni dans `fz-consulting`. Les
sections citées par la commande — **3.1** (interface `AppConnector`), **3.3**
(sortie JSON), **6** (schéma studio) — ont donc été **reconstituées** d'après le
besoin réel et le schéma constaté de Mida.

Trois fichiers portent l'avertissement en tête, ce sont ceux à confronter à la
spec avant de geler quoi que ce soit :

| Section | Fichier | Ce qui est inféré |
|---|---|---|
| 3.1 | `src/connectors/types.ts` | la forme de `AppConnector`, `FindQuery` |
| 3.3 | `src/generators/text.ts` | les sept champs de `CampaignCopySchema` |
| 6 | `db/migrations/` | les six tables du studio |

Le reste — connecteur Mida, rôle `studio_reader`, gabarit, rendu, MCP — s'appuie
sur des faits vérifiés en base, pas sur des hypothèses.

---

## Mise en route

L'ordre compte : chaque étape suppose la précédente.

### 1. Projet Supabase « studio »

Créer le projet, puis appliquer `db/migrations/` dans l'ordre numérique.
`0004` pose les deux seaux privés, `0005` enregistre l'application `mida`.

### 2. Base Kairos — le rôle de lecture

Sur le projet **Kairos** (celui de Mida), dans l'éditeur SQL :

```
db/kairos/0001_marketing_permissions.sql   la table de consentement
db/kairos/0002_studio_reader.sql           le schéma studio_read + le rôle
```

Puis, **séparément** — le mot de passe n'est dans aucun fichier versionné :

```sql
alter role studio_reader with password '<openssl rand -base64 32>';
```

Vérifier, connecté en `studio_reader` :

```sql
select count(*) from studio_read.restaurants;   -- répond
select count(*) from public.restaurants;        -- refuse
create table t(i int);                          -- refuse
```

### 3. Le consentement des cinq fondateurs

`db/kairos/0003_consent_founders.sql` attend **cinq vrais slugs**. Aucun drapeau
« fondateur » n'existe dans le schéma de Mida : la liste n'est nulle part dans
le dépôt, elle doit être renseignée à la main.

### 4. Variables

Copier `.env.example` en `.env.local` et remplir. `MIDA_DB_URL` est la chaîne du
rôle `studio_reader`, jamais celle de `postgres`.

### 5. Vérifier

```bash
npm install
npm run typecheck        # aucune erreur attendue
npm run render:smoke     # 4 visuels dans out/, sans base ni clé API
npm run e2e              # la chaîne complète, secrets requis
```

---

## Ce qui garantit la lecture seule

L'interdiction d'écrire sur Kairos n'est pas une consigne, elle est posée à
quatre endroits qui se recouvrent :

1. **Le rôle** n'a aucun droit sur `public` — il ne voit que les vues de
   `studio_read`.
2. **`default_transaction_read_only = on`** sur le rôle : même si un droit
   fuyait, l'écriture échouerait.
3. **`MidaConnector.check()`** refuse de servir une connexion dont la session
   n'est pas en lecture seule — un `postgres` laissé dans un `.env` est rejeté
   avant la première requête.
4. **Le connecteur n'expose aucune méthode d'écriture** : l'interface `AppConnector`
   n'en a pas.

Et pour le consentement, deux couches : le connecteur ne rend photos, promotions
et avis que dans les portées accordées, et un **déclencheur SQL** refuse toute
pièce de campagne portant sur une entité sans accord.

---

## Choix qui méritent d'être discutés

**`restaurant_photos` n'existe pas dans Mida.** Les photos sont un `text[]` sur
`restaurants.photos`, plus le seau Storage `restaurant-photos`. La vue
`studio_read.restaurant_photos` déplie le tableau pour rendre la forme attendue.

**Vues plutôt que `grant select` sur les tables.** `restaurants` porte
`claim_token`, qui suffit à revendiquer une fiche ; `reviews` porte `user_id` et
se joint à `users`. Un moteur marketing n'a besoin d'aucun des deux, et ce qu'il
ne reçoit pas ne peut pas fuir dans un journal.

**Le visuel sort en JPEG 1080×1080, qualité 88.** Le fond est une photo : le PNG
serait trois fois plus lourd sans gain visible.

**Les polices sont résolues par une configuration fontconfig dédiée.** Sans
elle, librsvg retombe silencieusement sur la police système et le visuel sort
dans la mauvaise typographie sans que rien ne le signale.
`assertWorkSansAvailable()` compare deux rendus pour le détecter et échoue
plutôt que de livrer.

**Le repli des lignes est estimé, pas mesuré.** librsvg n'expose pas de mesure
de texte : les largeurs de glyphe sont approchées (`ADVANCE` dans
`render/static.ts`), volontairement un peu larges. C'est pourquoi les longueurs
sont contraintes dans le schéma de sortie plutôt que laissées libres.

**Pas de Remotion ni de Next.js en Phase 1.** Aucun des sept livrables n'en a
besoin — le livrable 5 est explicitement statique et il n'y a pas d'interface.
Ils viennent en Phase 2 avec la vidéo et le studio web.

---

## Cohabitation avec Mida

`studio/` est un paquet npm autonome dans le monorepo, comme `tasalle/`. Il ne
touche ni `App.js`, ni `supabase.js`, ni aucun fichier de Mida.

⚠️ **Non vérifié** : `npx expo start` à la racine avec `studio/node_modules`
présent. Metro surveille tout le dépôt ; si le démarrage ralentit, ajouter
`studio/` à `config.resolver.blockList` dans `metro.config.js` — modification de
Mida, donc à valider avant.
