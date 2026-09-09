/**
 * Orchestration d'une campagne : instantané → texte → visuel → dépôt.
 *
 * Tout passe par ici, y compris le serveur MCP et le test de bout en bout :
 * une seule définition de « produire une campagne », donc un seul endroit où la
 * règle de consentement peut être respectée ou trahie.
 */

import { studioDb, BUCKET_TEXTS, BUCKET_VISUALS } from './db.ts';
import { openConnector } from './connectors/registry.ts';
import type { AppConnector } from './connectors/types.ts';
import { generateText, PROMPT_VERSIONS } from './generators/text.ts';
import type { Locale } from './types.ts';
import { renderStatic } from './render/static.ts';
import { renderVideo } from './render/video.ts';
import { assetPath, putAsset, signedUrl } from './storage.ts';
import type { AppEntity } from './types.ts';

/**
 * Ce qu'une campagne produit par pièce.
 *
 * La vidéo est facultative et ne l'est pas par hasard : elle coûte une
 * trentaine de secondes par entité là où l'image en coûte moins d'une. Sept
 * fondateurs, c'est la différence entre dix secondes et quatre minutes.
 */
export type CampaignFormat = 'image' | 'video';

export const FORMATS_PAR_DEFAUT: CampaignFormat[] = ['image'];

export interface CreateCampaignInput {
  appKey: string;
  slug: string;
  name: string;
  objective: string;
  externalIds: string[];
  template?: string;
  locale?: Locale;
  /** Paramètres du gabarit, figés avec la campagne pour qu'elle reste rejouable. */
  params?: Record<string, unknown>;
  /** Formats produits. Défaut : l'image seule. */
  formats?: CampaignFormat[];
}

export interface CreateCampaignResult {
  campaignId: string;
  slug: string;
  included: { externalId: string; name: string }[];
  /** Nommés, avec la raison : une exclusion silencieuse est une exclusion qu'on refera. */
  excluded: { externalId: string; name: string; reason: string }[];
}

async function appIdFor(appKey: string): Promise<string> {
  const { data, error } = await studioDb()
    .from('apps')
    .select('id')
    .eq('key', appKey)
    .maybeSingle();

  if (error) throw new Error(`Lecture de l'application « ${appKey} » : ${error.message}`);
  if (!data) {
    throw new Error(
      `Application « ${appKey} » inconnue du studio. ` +
        `La migration 0005_seed_apps.sql a-t-elle été appliquée ?`,
    );
  }
  return data.id as string;
}

/** Recopie l'entité distante dans le miroir local et rend son identifiant studio. */
async function snapshotEntity(appId: string, entity: AppEntity): Promise<string> {
  const { data, error } = await studioDb()
    .from('entities')
    .upsert(
      {
        app_id: appId,
        kind: entity.kind,
        external_id: entity.externalId,
        slug: entity.slug,
        name: entity.name,
        payload: entity as unknown as Record<string, unknown>,
        marketing_ok: entity.consent.granted,
        marketing_scopes: entity.consent.scopes,
        marketing_checked_at: new Date().toISOString(),
        fetched_at: entity.fetchedAt,
      },
      { onConflict: 'app_id,kind,external_id' },
    )
    .select('id')
    .single();

  if (error) throw new Error(`Instantané de « ${entity.name} » : ${error.message}`);
  return data.id as string;
}

export async function createCampaign(
  input: CreateCampaignInput,
  connector?: AppConnector,
): Promise<CreateCampaignResult> {
  const ownConnector = connector ?? openConnector(input.appKey);
  const db = studioDb();

  try {
    const health = await ownConnector.check();
    if (!health.ok) throw new Error(health.details);

    const appId = await appIdFor(input.appKey);

    const included: CreateCampaignResult['included'] = [];
    const excluded: CreateCampaignResult['excluded'] = [];
    const entityIds: string[] = [];

    for (const externalId of input.externalIds) {
      const entity = await ownConnector.get('restaurant', externalId);

      if (!entity) {
        excluded.push({
          externalId,
          name: externalId,
          reason: 'introuvable ou fiche non active',
        });
        continue;
      }

      // Le déclencheur SQL refuserait la pièce de toute façon ; on filtre ici
      // pour pouvoir dire QUI a été écarté et pourquoi, au lieu de faire
      // échouer la campagne entière sur la première exclusion.
      if (!entity.consent.granted) {
        excluded.push({
          externalId,
          name: entity.name,
          reason: 'aucun accord de communication (marketing_permissions)',
        });
        continue;
      }

      entityIds.push(await snapshotEntity(appId, entity));
      included.push({ externalId, name: entity.name });
    }

    if (included.length === 0) {
      throw new Error(
        "Aucune entité retenue : la campagne n'est pas créée. " +
          excluded.map((e) => `${e.name} (${e.reason})`).join(' ; '),
      );
    }

    const { data: campaign, error: campaignError } = await db
      .from('campaigns')
      .upsert(
        {
          app_id: appId,
          slug: input.slug,
          name: input.name,
          objective: input.objective,
          locale: input.locale ?? 'fr',
          template: input.template ?? 'mida-square',
          params: { ...(input.params ?? {}), formats: input.formats ?? FORMATS_PAR_DEFAUT },
          status: 'draft',
        },
        { onConflict: 'app_id,slug' },
      )
      .select('id')
      .single();

    if (campaignError) {
      throw new Error(`Création de la campagne : ${campaignError.message}`);
    }

    const campaignId = campaign.id as string;

    const { error: itemsError } = await db.from('campaign_items').upsert(
      entityIds.map((entity_id) => ({ campaign_id: campaignId, entity_id })),
      { onConflict: 'campaign_id,entity_id' },
    );
    if (itemsError) {
      throw new Error(`Ajout des pièces : ${itemsError.message}`);
    }

    return { campaignId, slug: input.slug, included, excluded };
  } finally {
    if (!connector) await ownConnector.close();
  }
}

export interface ProducedItem {
  itemId: string;
  entityName: string;
  visual: { bucket: string; path: string; bytes: number };
  text: { bucket: string; path: string; bytes: number };
  /** Absente quand la campagne ne demande pas ce format. */
  video?: { bucket: string; path: string; bytes: number; durationInFrames: number };
  photoMissing: boolean;
  repaired: boolean;
}

/**
 * Relit les formats demandés par une campagne.
 *
 * `params` est du jsonb : le moteur l'écrit, mais rien n'empêche de l'éditer à
 * la main dans l'éditeur SQL. On valide plutôt que de faire confiance, et on
 * retombe sur l'image seule — le format qui ne coûte rien — plutôt que
 * d'échouer sur une campagne dont le reste est bon.
 */
function lireFormats(params: unknown): CampaignFormat[] {
  const brut = (params as { formats?: unknown } | null)?.formats;
  if (!Array.isArray(brut)) return FORMATS_PAR_DEFAUT;

  const connus = brut.filter(
    (f): f is CampaignFormat => f === 'image' || f === 'video',
  );
  return connus.length > 0 ? connus : FORMATS_PAR_DEFAUT;
}

/**
 * Produit toutes les pièces d'une campagne.
 *
 * Un échec sur une pièce n'arrête pas les autres : il est écrit sur la pièce
 * (`status = 'failed'`, `error`) et la campagne finit en 'failed' s'il en reste
 * au moins un. Cinq restaurants dont un sans photo joignable doivent donner
 * quatre visuels, pas zéro.
 */
export async function runCampaign(campaignId: string): Promise<{
  produced: ProducedItem[];
  failed: { itemId: string; entityName: string; error: string }[];
}> {
  const db = studioDb();

  const { data: campaign, error: campaignError } = await db
    .from('campaigns')
    .select('id, slug, objective, template, locale, params')
    .eq('id', campaignId)
    .single();
  if (campaignError) throw new Error(`Campagne introuvable : ${campaignError.message}`);

  // La langue vient de la campagne, décidée à sa création. Elle traverse tout :
  // l'invite, le texte, la police du visuel, le sens de lecture, la vidéo. Le
  // `check` de la colonne et le type Locale portent les deux mêmes valeurs, donc
  // une valeur inattendue en base serait un bogue, pas une entrée à valider.
  const locale = campaign.locale as Locale;

  const { data: items, error: itemsError } = await db
    .from('campaign_items')
    .select('id, entity_id, entities(name, slug, payload)')
    .eq('campaign_id', campaignId);
  if (itemsError) throw new Error(`Pièces illisibles : ${itemsError.message}`);

  const formats = lireFormats(campaign.params);

  await db.from('campaigns').update({ status: 'generating' }).eq('id', campaignId);

  const produced: ProducedItem[] = [];
  const failed: { itemId: string; entityName: string; error: string }[] = [];

  for (const item of items ?? []) {
    const row = item as unknown as {
      id: string;
      entity_id: string;
      entities: { name: string; slug: string | null; payload: AppEntity };
    };
    const entity = row.entities.payload;
    const key = entity.slug ?? entity.externalId;

    try {
      await db.from('campaign_items').update({ status: 'generating' }).eq('id', row.id);

      const generated = await generateText({
        locale,
        entity,
        objective: campaign.objective as string,
      });

      await db.from('generations').insert({
        campaign_item_id: row.id,
        kind: 'text',
        model: generated.model,
        prompt_version: PROMPT_VERSIONS[locale],
        input: { objective: campaign.objective, external_id: entity.externalId },
        output: generated.copy,
        input_tokens: generated.inputTokens,
        output_tokens: generated.outputTokens,
        latency_ms: generated.latencyMs,
      });

      const cover = entity.photos.find((p) => p.position === 1) ?? entity.photos[0];
      const visual = await renderStatic({
        headline: generated.copy.headline,
        subline: generated.copy.subline,
        badge: generated.copy.badge,
        cta: generated.copy.call_to_action,
        rating: entity.rating,
        photoUrl: cover?.url ?? null,
        locale,
      });

      const visualAsset = await putAsset(
        BUCKET_VISUALS,
        assetPath(campaign.slug as string, key, 'jpg'),
        visual.buffer,
        visual.mime,
      );

      const textAsset = await putAsset(
        BUCKET_TEXTS,
        assetPath(campaign.slug as string, key, 'json'),
        JSON.stringify({ entity: entity.name, ...generated.copy }, null, 2),
        'application/json; charset=utf-8',
      );

      // La vidéo n'est produite que si la campagne la demande : une trentaine
      // de secondes par entité, contre moins d'une pour l'image. Elle réutilise
      // le même texte — un visuel et une story qui ne diraient pas la même
      // chose seraient deux campagnes, pas une.
      let videoAsset: Awaited<ReturnType<typeof putAsset>> | null = null;
      let video: Awaited<ReturnType<typeof renderVideo>> | null = null;

      if (formats.includes('video')) {
        const debutRendu = Date.now();
        video = await renderVideo({
          headline: generated.copy.headline,
          subline: generated.copy.subline,
          badge: generated.copy.badge,
          cta: generated.copy.call_to_action,
          rating: entity.rating,
          photoUrl: cover?.url ?? null,
          locale,
        });

        videoAsset = await putAsset(
          BUCKET_VISUALS,
          assetPath(campaign.slug as string, key, 'mp4'),
          video.buffer,
          video.mime,
        );

        // Un rendu n'appelle aucun modèle : model et prompt_version restent
        // nuls (0007), et ce qu'il a produit est décrit dans input/output.
        await db.from('generations').insert({
          campaign_item_id: row.id,
          kind: 'video',
          input: { template: 'mida-story', external_id: entity.externalId },
          output: {
            largeur: video.width,
            hauteur: video.height,
            images: video.durationInFrames,
            fps: video.fps,
            octets: video.buffer.byteLength,
          },
          latency_ms: Date.now() - debutRendu,
        });
      }

      await db.from('assets').upsert(
        [
          {
            campaign_item_id: row.id,
            kind: 'image',
            ...visualAsset,
            width: visual.width,
            height: visual.height,
          },
          { campaign_item_id: row.id, kind: 'text', ...textAsset },
          ...(videoAsset && video
            ? [
                {
                  campaign_item_id: row.id,
                  kind: 'video',
                  ...videoAsset,
                  width: video.width,
                  height: video.height,
                },
              ]
            : []),
        ],
        { onConflict: 'bucket,path' },
      );

      await db
        .from('campaign_items')
        .update({ status: 'ready', error: null })
        .eq('id', row.id);

      produced.push({
        itemId: row.id,
        entityName: entity.name,
        visual: {
          bucket: visualAsset.bucket,
          path: visualAsset.path,
          bytes: visualAsset.bytes,
        },
        text: {
          bucket: textAsset.bucket,
          path: textAsset.path,
          bytes: textAsset.bytes,
        },
        ...(videoAsset && video
          ? {
              video: {
                bucket: videoAsset.bucket,
                path: videoAsset.path,
                bytes: videoAsset.bytes,
                durationInFrames: video.durationInFrames,
              },
            }
          : {}),
        photoMissing: visual.photoMissing,
        repaired: generated.repaired,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await db
        .from('campaign_items')
        .update({ status: 'failed', error: message })
        .eq('id', row.id);
      failed.push({ itemId: row.id, entityName: entity.name, error: message });
    }
  }

  await db
    .from('campaigns')
    .update({ status: failed.length > 0 ? 'failed' : 'ready' })
    .eq('id', campaignId);

  return { produced, failed };
}

export interface CampaignPreview {
  slug: string;
  name: string;
  status: string;
  items: {
    entityName: string;
    status: string;
    error: string | null;
    visualUrl: string | null;
    /** Nulle quand la campagne n'a pas demandé ce format. */
    videoUrl: string | null;
    copy: Record<string, unknown> | null;
  }[];
}

export interface CampaignSummary {
  id: string;
  slug: string;
  name: string;
  status: string;
  locale: Locale;
  createdAt: string;
  /** Nombre de pièces rattachées, tous états confondus. */
  items: number;
}

/**
 * Les campagnes, la plus récente d'abord. Le décompte des pièces vient d'un
 * count agrégé plutôt que d'une lecture des lignes : la liste n'a pas besoin
 * des pièces elles-mêmes, seulement de leur nombre.
 */
export async function listCampaigns(limit = 50): Promise<CampaignSummary[]> {
  const { data, error } = await studioDb()
    .from('campaigns')
    .select('id, slug, name, status, locale, created_at, campaign_items(count)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Campagnes illisibles : ${error.message}`);

  return (data ?? []).map((raw) => {
    const c = raw as unknown as {
      id: string;
      slug: string;
      name: string;
      status: string;
      locale: Locale;
      created_at: string;
      campaign_items: { count: number }[];
    };
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      status: c.status,
      locale: c.locale,
      createdAt: c.created_at,
      items: c.campaign_items?.[0]?.count ?? 0,
    };
  });
}

/** Relecture d'une campagne : le visuel par URL signée, le texte en clair. */
export async function previewCampaign(campaignId: string): Promise<CampaignPreview> {
  const db = studioDb();

  const { data: campaign, error } = await db
    .from('campaigns')
    .select('slug, name, status')
    .eq('id', campaignId)
    .single();
  if (error) throw new Error(`Campagne introuvable : ${error.message}`);

  const { data: items } = await db
    .from('campaign_items')
    .select('id, status, error, entities(name), assets(kind, bucket, path)')
    .eq('campaign_id', campaignId);

  const preview: CampaignPreview['items'] = [];

  for (const raw of items ?? []) {
    const item = raw as unknown as {
      id: string;
      status: string;
      error: string | null;
      entities: { name: string };
      assets: { kind: string; bucket: string; path: string }[];
    };

    const image = item.assets.find((a) => a.kind === 'image');
    const video = item.assets.find((a) => a.kind === 'video');

    const { data: generation } = await db
      .from('generations')
      .select('output')
      .eq('campaign_item_id', item.id)
      // Depuis 0006 cette table porte aussi les rendus vidéo : sans ce filtre,
      // « la plus récente » rendrait les dimensions du MP4 au lieu du texte.
      .eq('kind', 'text')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    preview.push({
      entityName: item.entities.name,
      status: item.status,
      error: item.error,
      visualUrl: image ? await signedUrl(image.bucket, image.path) : null,
      videoUrl: video ? await signedUrl(video.bucket, video.path) : null,
      copy: (generation?.output as Record<string, unknown> | undefined) ?? null,
    });
  }

  return {
    slug: campaign.slug as string,
    name: campaign.name as string,
    status: campaign.status as string,
    items: preview,
  };
}

/** La langue seule, pour les pages qui n'ont pas besoin du reste de la campagne. */
export async function langueCampagne(campaignId: string): Promise<Locale> {
  const { data, error } = await studioDb()
    .from('campaigns')
    .select('locale')
    .eq('id', campaignId)
    .single();
  if (error) throw new Error(`Campagne introuvable : ${error.message}`);
  return data.locale as Locale;
}
