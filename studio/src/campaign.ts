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
import { generateText, PROMPT_VERSION } from './generators/text.ts';
import { renderStatic } from './render/static.ts';
import { assetPath, putAsset, signedUrl } from './storage.ts';
import type { AppEntity } from './types.ts';

export interface CreateCampaignInput {
  appKey: string;
  slug: string;
  name: string;
  objective: string;
  externalIds: string[];
  template?: string;
  locale?: 'fr' | 'ar';
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
  photoMissing: boolean;
  repaired: boolean;
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
    .select('id, slug, objective, template')
    .eq('id', campaignId)
    .single();
  if (campaignError) throw new Error(`Campagne introuvable : ${campaignError.message}`);

  const { data: items, error: itemsError } = await db
    .from('campaign_items')
    .select('id, entity_id, entities(name, slug, payload)')
    .eq('campaign_id', campaignId);
  if (itemsError) throw new Error(`Pièces illisibles : ${itemsError.message}`);

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
        entity,
        objective: campaign.objective as string,
      });

      await db.from('generations').insert({
        campaign_item_id: row.id,
        kind: 'text',
        model: generated.model,
        prompt_version: PROMPT_VERSION,
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
    copy: Record<string, unknown> | null;
  }[];
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

    const { data: generation } = await db
      .from('generations')
      .select('output')
      .eq('campaign_item_id', item.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    preview.push({
      entityName: item.entities.name,
      status: item.status,
      error: item.error,
      visualUrl: image ? await signedUrl(image.bucket, image.path) : null,
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
