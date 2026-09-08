# Kairos Studio — Phase 1

Moteur marketing du groupe. Il lit les applications **en lecture seule**, écrit
dans son propre projet Supabase, et produit un texte et un visuel par entité.

Première application branchée : **Mida**.

---

## La spec est une reconstitution

`KAIROS_STUDIO_SPEC.md` est **dans ce dossier**, mais ce n'est pas l'original :
celui-ci est resté sur le poste de Redouane, et il est absent des deux dépôts,
toutes branches, vérifié le 2026-09-08.

Les trois sections citées par la commande ont donc été écrites **à partir du
code livré et du schéma réel de Mida** :

| Section | Ce qu'elle fixe | Implémentation |
|---|---|---|
| 3.1 | `AppConnector`, forme normalisée, 5 règles | `src/connectors/types.ts`, `src/types.ts` |
| 3.3 | les 7 champs, leurs bornes, le prompt | `src/generators/text.ts` |
| 6 | les 6 tables, les 2 seaux, le verrou de consentement | `db/migrations/` |

**Si l'original refait surface, il gagne** — le préambule de la spec pose la
règle. Les en-têtes des fichiers ci-dessus pointent dessus, donc l'écart se voit
au moment de le combler.

Le reste — connecteur Mida, rôle `studio_reader`, gabarit, rendu, MCP — ne
dépend d'aucune hypothèse : il s'appuie sur des faits vérifiés en base.

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

### 3. Le consentement des fondateurs

`db/kairos/0003_consent_founders.sql` porte les **sept** fiches créées à la main
avant l'import Google Places — liste confirmée par Redouane le 2026-09-08.
Aucun drapeau « fondateur » n'existe dans le schéma de Mida, et rien dans le
dépôt ne trace une signature : c'est ce fichier, et lui seul, qui fait foi.

Il se vérifie lui-même et échoue si un slug est introuvable ou si un fondateur
n'est pas en `status = 'active'` — dans ce second cas son accord serait
enregistré mais `studio_read` ne le verrait pas, un silence plutôt qu'une
erreur.

⚠️ L'exécuter est un acte juridique, pas un réglage : il autorise le studio à
nommer ces restaurants et à republier leurs photos. Renseigner `evidence`.

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

## Intégration continue

`.github/workflows/studio.yml`, filtré sur `studio/**` comme les workflows des
autres projets du dépôt. Deux jobs, aucun secret :

- **Types et rendu visuel** — `npm ci`, `typecheck`, `render:smoke`. Les quatre
  visuels produits sont joints au job : une relecture de gabarit se fait en les
  regardant, pas en lisant le SVG.
- **Migrations et verrou de consentement** — rejoue `db/migrations/` sur un
  PostgreSQL neuf, puis lance `db/tests/consent_lock.sql`.

Les scripts de `db/kairos/` ne sont pas couverts : ils s'appuient sur le schéma
de Mida, que la CI n'a pas. `0003` a été vérifié à la main contre une
reproduction minimale de `public.restaurants` — les sept accords posés, et les
deux garde-fous confirmés en échec (slug absent, fondateur non actif).

Ce second job mérite un mot. Les migrations ne sont appliquées nulle part —
le projet Supabase « studio » n'existe pas encore — donc la CI est le seul
endroit qui prouve qu'elles s'exécutent, et dans cet ordre. Et vérifier que le
SQL se parse ne dit rien de son efficacité : les assertions vérifient que le
verrou **refuse** une pièce sans consentement, et qu'un accord retiré bloque
tout nouveau rattachement. Retirer le déclencheur fait échouer le job.

`db/tests/00_supabase_stub.sql` fournit le `storage.buckets` que Supabase donne
et qu'un PostgreSQL nu n'a pas. Il est volontairement minimal : une migration
qui utiliserait d'autres colonnes échouerait ici, ce qui est voulu — mieux vaut
un bouchon qui casse qu'un bouchon qui ment.

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

**Next.js n'est toujours pas là.** Le studio web reste à faire ; c'est lui qui
apportera les policies RLS que `0004` laisse délibérément vides.

**Remotion est arrivé en Phase 2**, pour la vidéo — voir plus bas.

---

## La vidéo — Phase 2

Format **story/reel, 1080 × 1920, 6 s** : celui qui compte sur Instagram et
TikTok. Le pied du gabarit est remonté à 240 px du bas, la bande où ces deux
applications posent leur propre interface — un appel à l'action qui s'y cache
ne sert à rien.

```
remotion/
├── index.ts                    point d'entrée registerRoot
├── Root.tsx                    déclaration des compositions
├── fonts.ts                    Work Sans + interruption si elle manque
└── compositions/MidaStory.tsx  le gabarit
src/render/video.ts             bundle + renderMedia, jumeau de static.ts
```

Mêmes entrées que le gabarit statique (spec § 3.3) : ce qui tient dans un carré
tient dans une story. Aucune image n'est fabriquée — la photo du restaurant est
recadrée et lentement rapprochée, 4 % sur les 6 secondes, et tout le reste est
du texte et des aplats.

**Le même piège qu'en Phase 1, dans un autre moteur.** Chromium ne signale pas
une police absente : il retombe sur son serif par défaut et la vidéo sort dans
la mauvaise typographie sans que rien n'échoue. Constaté en construisant le
gabarit — le premier essai est sorti en Times. D'où `delayRender()` : le rendu
attend le chargement de Work Sans, et `cancelRender()` l'interrompt si elle
n'arrive pas. Un rendu qui s'arrête vaut mieux qu'un rendu qui ment.

Les `.ttf` viennent du paquet que charge déjà l'application, recopiés dans
`remotion/public/fonts/` par `npm run prepare:fonts` — jamais versionnés.
`bundle()` reçoit explicitement ce `publicDir` : sans lui, Remotion cherche un
`public/` à la racine du projet et sert des 404.

Chromium est cherché dans `PLAYWRIGHT_BROWSERS_PATH` s'il existe, sinon
Remotion télécharge le sien. `STUDIO_CHROMIUM` force un chemin.

```bash
npm run video:smoke   # 2 vidéos dans out/, sans base ni clé API
npm run remotion      # l'aperçu interactif
```

## Cohabitation avec Mida

`studio/` est un paquet npm autonome dans le monorepo, comme `tasalle/`. Il ne
touche ni `App.js`, ni `supabase.js`, ni aucun fichier de Mida.

**Vérifié le 2026-09-08** : `npx expo start` à la racine, puis un bundle Android
complet demandé au serveur — 1436 modules, aucun avertissement, aucune collision
de noms Haste, et rien de `studio/` dans le bundle produit.

Mesuré à froid (`--clear`, cache vidé), avec et sans `studio/node_modules` :

| | Bundle | Modules |
|---|---|---|
| avec | 16 628 ms | 1436 |
| sans | 18 018 ms | 1436 |

Le second est le plus lent des deux : l'écart est du bruit de mesure, pas un
coût. **Aucun `blockList` n'est nécessaire dans `metro.config.js`**, et donc
aucune modification de Mida.

(À noter pour qui rejouerait la vérification depuis un environnement au réseau
restreint : `expo start` échoue au démarrage s'il ne peut pas joindre
`api.expo.dev` pour valider les versions — l'erreur est un `SyntaxError` sur du
JSON, trompeuse. `EXPO_OFFLINE=1` la contourne.)
