# Kairos Studio — spécification

> **Statut : reconstitution.** Ce document n'est pas la spec d'origine.
>
> Le `KAIROS_STUDIO_SPEC.md` de référence est resté sur le poste de Redouane ;
> il n'a jamais été accessible depuis l'environnement où la Phase 1 a été
> écrite, et il est absent des deux dépôts (`kairos`, `fz-consulting`), toutes
> branches confondues, vérifié le 2026-09-08.
>
> Les trois sections ci-dessous — **3.1**, **3.3** et **6** — ont donc été
> écrites **à partir du code livré et du schéma réel de Mida**, pas l'inverse.
> Elles décrivent exactement ce qui tourne.
>
> **Règle de préséance :** si l'original refait surface, il gagne. Ce fichier
> devient alors le relevé de l'écart à combler, pas la référence. Les numéros de
> section sont ceux de l'original pour que la confrontation soit directe ; les
> sections non reprises ici (1, 2, 3.2, 4, 5, 7…) ne sont pas perdues, elles
> n'ont simplement jamais été lues.

---

## 3.1 — `AppConnector`

L'interface qu'une application du groupe présente au studio. Un connecteur fait
trois choses : dire ce qu'il sait rendre, chercher, rendre une fiche.

### Ce qu'il ne fait pas

Il ne génère rien, ne stocke rien, et **n'écrit jamais chez l'application**.
L'interface n'expose aucune méthode d'écriture — c'est la première des quatre
couches qui portent cette garantie (voir `README.md`, « Ce qui garantit la
lecture seule »).

### Contrat

```ts
type EntityKind = 'restaurant';                 // Phase 1

interface AppConnector {
  readonly key: string;                          // = apps.key
  readonly kinds: readonly EntityKind[];

  check(): Promise<ConnectorHealth>;
  find(query: FindQuery): Promise<AppEntitySummary[]>;
  get(kind: EntityKind, externalId: string): Promise<AppEntity | null>;
  close(): Promise<void>;
}

interface ConnectorHealth {
  ok: boolean;
  role: string;        // le rôle Postgres réellement utilisé
  readOnly: boolean;
  details: string;
}

interface FindQuery {
  kind: EntityKind;
  search?: string;         // recherche libre sur le nom
  city?: string;
  cuisine?: string;
  consentedOnly?: boolean; // défaut true
  minPhotos?: number;
  limit?: number;          // défaut 25, plafond 200
}
```

### Règles que tout connecteur doit tenir

1. **`check()` avant toute lecture.** Il rend `ok: false` si la session n'est
   pas en lecture seule. Un appelant qui ignore ce retour est un bug : le
   serveur MCP et `createCampaign` s'arrêtent dessus.
2. **`consentedOnly` vaut `true` par défaut.** Le studio ne s'intéresse qu'aux
   entités qui ont donné leur accord ; le passer à `false` sert à mesurer le
   reste à aller chercher, pas à produire.
3. **La portée du consentement filtre la fiche, elle ne la vide pas.** `get()`
   ne rend photos, promotions et avis que si les portées correspondantes sont
   accordées. Ce qui n'est pas autorisé est **absent**, pas vide : le générateur
   doit pouvoir distinguer « pas de promotion » de « promotions non
   communiquées » (voir 3.3).
4. **`get()` rend `null`** si l'entité n'existe pas, n'est pas publiée, ou n'est
   pas lisible. Jamais une exception pour un simple « pas trouvé ».
5. **`close()` est toujours appelé**, y compris sur erreur.

### Forme normalisée rendue

Volontairement indépendante du schéma de l'application source : le générateur et
le gabarit ne doivent rien savoir des colonnes de Mida, sinon brancher une
deuxième application demandera de les réécrire.

```ts
interface AppEntitySummary {
  externalId: string; kind: EntityKind; name: string; slug: string | null;
  city: string | null; neighbourhood: string | null;
  photoCount: number; consentGranted: boolean;
}

interface AppEntity extends AppEntitySummary {
  description: string | null;
  cuisine: string | null;
  address: string | null;
  rating: number | null;          // sur 5
  reviewCount: number | null;
  averageTicket: number | null;   // en DA
  capacity: number | null;
  amenities: string[];            // 'terrasse' | 'parking' | 'click_and_collect'
  photos: { url: string; position: number }[];      // position 1 = couverture
  promotions: EntityPromotion[];
  reviews: EntityReview[];
  consent: {
    granted: boolean;
    scopes: ('name'|'photos'|'logo'|'promotions'|'reviews')[];
    grantedAt: string | null;
  };
  fetchedAt: string;              // ISO 8601
}
```

`implémentation` — `src/connectors/types.ts`, `src/types.ts`,
`src/connectors/mida.ts`, résolution par `src/connectors/registry.ts`.

---

## 3.3 — Sortie du générateur de texte

Sept champs, tous obligatoires. **Clés en anglais** parce qu'elles forment un
contrat entre modules ; **contenu exclusivement en français** — c'est la langue
de l'application, de ses restaurateurs et de ses clients. La Phase 1 ne produit
pas d'arabe (voir 6, `campaigns.locale`).

| Champ | Type | Bornes | Destination |
|---|---|---|---|
| `headline` | `string` | 8 – 42 signes | le visuel, en Work Sans ExtraBold 76 px |
| `subline` | `string` | 10 – 70 signes | le visuel, sous le titre |
| `badge` | `string` | 3 – 22 signes | le visuel, étiquette en capitales |
| `caption` | `string` | 120 – 700 signes | le texte de la publication |
| `hashtags` | `string[]` | 3 à 6 entrées, `^#[\p{L}\p{N}_]{2,28}$` | la publication |
| `call_to_action` | `string` | 6 – 60 signes | le visuel, en pied |
| `alt_text` | `string` | 20 – 200 signes | accessibilité |

### Pourquoi des bornes, et pourquoi celles-là

Elles ne sont pas décoratives. `headline`, `subline`, `badge` et
`call_to_action` sont posés dans un carré de 1080 px par un gabarit qui ne sait
pas se réduire, et librsvg n'expose aucune mesure de texte : le repli des lignes
est **estimé**, pas mesuré (`ADVANCE` dans `src/render/static.ts`). Les bornes
sont ce qui rend l'estimation sûre. Les élargir sans revoir le gabarit fait
déborder le visuel.

### Deux garde-fous, parce qu'un texte marketing faux coûte plus cher qu'un texte absent

1. **La forme est contrainte par le modèle** — `output_config.format` via
   `zodOutputFormat`, appelé par `client.messages.parse()`.
2. **Les bornes sont revalidées localement**, avec **une** reprise si elles sont
   franchies. La contrainte de format garantit la structure du JSON, pas le
   respect d'un « 42 signes maximum » : les deux ne se remplacent pas.

Une deuxième sortie invalide échoue la pièce, elle ne dégrade pas le résultat.
Un `stop_reason: "refusal"` échoue aussi, en nommant la catégorie.

### Ce que le prompt système impose

- **Français seulement**, mots-dièse compris. Français d'Algérie.
- **Aucun fait hors des données fournies** : ni note, ni prix, ni capacité, ni
  promotion, ni plat, ni chef, ni récompense qui n'y soit. Un fait absent n'est
  pas une invitation à le supposer — le restaurateur lit la publication, et
  c'est son établissement qui est nommé.
- **Ce qui n'a pas été autorisé est déclaré au modèle**, explicitement. Sans ça
  il lit un silence comme une absence de donnée et brode pour compenser.
- Pas de superlatif creux, pas de question rhétorique en ouverture, au plus une
  émoji dans la publication et aucune dans le visuel.

### Traçabilité

Chaque appel écrit une ligne dans `generations` : modèle servi, version de
prompt (`PROMPT_VERSION`), entrée, sortie, jetons, latence. Sans elle, un texte
douteux n'est pas re-diagnosticable trois semaines plus tard.

`implémentation` — `src/generators/text.ts`.

---

## 6 — Schéma du projet Supabase « studio »

Projet **distinct** des projets applicatifs. C'est le seul que le moteur écrit.

### Principe

Le studio ne lit jamais une base applicative au moment de produire : il en prend
un **instantané**, daté, et travaille dessus. Trois raisons — une campagne doit
être rejouable à l'identique même si la fiche a bougé ; la base source est
distante et en lecture seule, on ne la sollicite pas une fois par génération ; et
le consentement est figé avec la donnée qu'il autorise.

### Tables

| Table | Rôle |
|---|---|
| `apps` | applications branchées. `key`, `name`, `connector`, `is_active` |
| `entities` | instantané d'une entité distante, `payload` en forme normalisée (3.1), plus `marketing_ok` / `marketing_scopes` / `marketing_checked_at`. Unique `(app_id, kind, external_id)` |
| `campaigns` | `slug` (unique par application), `name`, `objective`, `locale`, `template`, `params`, `status` |
| `campaign_items` | une entité dans une campagne — l'unité de production. Unique `(campaign_id, entity_id)` |
| `generations` | un appel de modèle : entrée, sortie, jetons, latence, erreur |
| `assets` | pièce produite, référencée par son chemin Storage. Unique `(bucket, path)` |

`campaigns.status` : `draft` → `generating` → `ready` \| `failed`, plus
`archived`. `campaign_items.status` : `pending` → `generating` → `ready` \|
`failed`.

### Le verrou de consentement

Un déclencheur `before insert or update of entity_id on campaign_items` refuse
toute pièce portant sur une entité dont `marketing_ok` est faux.

La règle « on ne publie pas sans accord » ne tient pas si elle vit seulement
dans le code applicatif : un script de reprise, un import manuel ou un bug la
contournent. Elle est donc posée sur le chemin d'écriture, en base.
`createCampaign` filtre **en plus**, en amont — non pas pour remplacer le
déclencheur, mais pour pouvoir dire *qui* a été écarté et *pourquoi* au lieu de
faire échouer la campagne entière sur la première exclusion.

### Storage

Deux seaux **privés**, aucune policy de lecture : `campaign-visuals`,
`campaign-texts`. Rien n'est servi à `anon` ni à `authenticated` ; la relecture
passe par URL signée, une heure par défaut. Un visuel de campagne non encore
publiée ne doit pas être devinable par son chemin.

Chemin déterministe : `<campaign.slug>/<entity.slug ?? externalId>.<ext>`.
Rejouer une campagne écrase ses propres fichiers au lieu d'en accumuler des
variantes — c'est ce qui rend une reprise après échec sans conséquence.

### RLS

Active sur les six tables, **aucune policy**. Ce n'est pas un oubli : le studio
est un moteur serveur, il se connecte en `service_role`, qui contourne RLS, et
aucun navigateur ne parle à cette base. Le jour où une interface web arrive
(Phase 2), elle apportera ses policies avec son modèle d'utilisateurs.

### Limites assumées de la Phase 1

- ~~`generations.kind` n'accepte que `'text'`.~~ **Levé en Phase 2** :
  `0006_video.sql` étend `generations.kind` et `assets.kind` à `'video'`.
- `campaigns.locale` accepte `fr` et `ar`, mais **seul `fr` est produit** : le
  générateur est mono-langue et `runCampaign` refuse explicitement une campagne
  qui ne serait pas en français, plutôt que de rendre du français sous une
  étiquette arabe.
- `entities` n'a pas de purge. Un instantané reste jusqu'à suppression manuelle
  de sa campagne.

`implémentation` — `db/migrations/0001` à `0005`.
