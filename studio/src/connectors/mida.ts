/**
 * Connecteur Mida — lecture seule de la base Kairos.
 *
 * Il ne parle qu'au schéma `studio_read`, qui n'expose que des vues en colonnes
 * explicites : ni claim_token, ni user_id, ni avis non modéré. Voir
 * db/kairos/0002_studio_reader.sql pour le détail et les raisons.
 */

import postgres from 'postgres';
import { midaDatabaseUrl } from '../config.ts';
import type {
  AppEntity,
  AppEntitySummary,
  EntityKind,
  EntityPhoto,
  EntityPromotion,
  EntityReview,
  MarketingScope,
} from '../types.ts';
import type { AppConnector, ConnectorHealth, FindQuery } from './types.ts';

/** Combien d'avis et de photos on remonte : au-delà, on encombre le prompt sans le nourrir. */
const MAX_REVIEWS = 5;
const MAX_PHOTOS = 6;

type RestaurantRow = {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  cuisine_type: string | null;
  quartier: string | null;
  city: string | null;
  address: string | null;
  avg_rating: number | string | null;
  review_count: number | null;
  avg_ticket: number | string | null;
  capacity: number | null;
  terrasse: boolean | null;
  parking: boolean | null;
  click_collect_enabled: boolean | null;
  photo_count: number | null;
  consent_granted: boolean | null;
  consent_scopes: string[] | null;
  consent_granted_at: Date | null;
};

const num = (v: number | string | null): number | null =>
  v === null || v === undefined ? null : typeof v === 'number' ? v : Number(v);

export class MidaConnector implements AppConnector {
  readonly key = 'mida';
  readonly kinds = ['restaurant'] as const satisfies readonly EntityKind[];

  #sql: postgres.Sql;

  constructor(connectionString: string = midaDatabaseUrl()) {
    this.#sql = postgres(connectionString, {
      ssl: 'require',
      max: 4,
      idle_timeout: 20,
      connect_timeout: 15,
      // Le studio n'a aucune raison d'ouvrir une transaction en écriture. Si le
      // rôle fourni n'applique pas déjà cette contrainte, on la pose ici aussi.
      connection: { application_name: 'kairos-studio' },
      onnotice: () => {},
    });
  }

  /**
   * Refuse de servir une connexion qui pourrait écrire.
   *
   * Le rôle studio_reader porte `default_transaction_read_only = on`. Si la
   * chaîne de connexion pointe ailleurs — un `postgres` de dépannage laissé
   * dans un .env, par exemple — on s'arrête ici plutôt que de découvrir le
   * problème le jour où un bug tente un UPDATE.
   */
  async check(): Promise<ConnectorHealth> {
    const [row] = await this.#sql<
      { role: string; read_only: string | null }[]
    >`select current_user as role,
             current_setting('default_transaction_read_only', true) as read_only`;

    const role = row?.role ?? 'inconnu';
    const readOnly = row?.read_only === 'on';

    if (!readOnly) {
      return {
        ok: false,
        role,
        readOnly: false,
        details:
          `La connexion Mida tourne sous « ${role} » sans default_transaction_read_only. ` +
          `Le studio n'écrit jamais sur Kairos : utiliser le rôle studio_reader ` +
          `(db/kairos/0002_studio_reader.sql), pas un rôle applicatif.`,
      };
    }

    const [probe] = await this.#sql<{ n: number }[]>`
      select count(*)::int as n from studio_read.restaurants`;

    return {
      ok: true,
      role,
      readOnly: true,
      details: `${probe?.n ?? 0} restaurants actifs visibles depuis studio_read.`,
    };
  }

  async find(query: FindQuery): Promise<AppEntitySummary[]> {
    this.#assertKind(query.kind);

    const sql = this.#sql;
    const consentedOnly = query.consentedOnly ?? true;
    const minPhotos = query.minPhotos ?? 0;
    const limit = Math.min(Math.max(query.limit ?? 25, 1), 200);

    const rows = await sql<
      {
        id: string;
        name: string;
        slug: string | null;
        city: string | null;
        quartier: string | null;
        photo_count: number | null;
        consent_granted: boolean | null;
      }[]
    >`
      select r.id, r.name, r.slug, r.city, r.quartier, r.photo_count,
             coalesce(mp.granted, false) as consent_granted
      from studio_read.restaurants r
      left join studio_read.marketing_permissions mp on mp.restaurant_id = r.id
      where true
        ${query.search ? sql`and r.name ilike ${'%' + query.search + '%'}` : sql``}
        ${query.city ? sql`and r.city ilike ${query.city}` : sql``}
        ${query.cuisine ? sql`and r.cuisine_type ilike ${query.cuisine}` : sql``}
        ${consentedOnly ? sql`and coalesce(mp.granted, false)` : sql``}
        ${minPhotos > 0 ? sql`and coalesce(r.photo_count, 0) >= ${minPhotos}` : sql``}
      order by coalesce(mp.granted, false) desc, r.name asc
      limit ${limit}`;

    return rows.map((r) => ({
      externalId: r.id,
      kind: 'restaurant' as const,
      name: r.name,
      slug: r.slug,
      city: r.city,
      neighbourhood: r.quartier,
      photoCount: r.photo_count ?? 0,
      consentGranted: r.consent_granted ?? false,
    }));
  }

  async get(kind: EntityKind, externalId: string): Promise<AppEntity | null> {
    this.#assertKind(kind);
    const sql = this.#sql;

    const [row] = await sql<RestaurantRow[]>`
      select r.id, r.slug, r.name, r.description, r.cuisine_type, r.quartier,
             r.city, r.address, r.avg_rating, r.review_count, r.avg_ticket,
             r.capacity, r.terrasse, r.parking, r.click_collect_enabled,
             r.photo_count,
             mp.granted    as consent_granted,
             mp.scopes     as consent_scopes,
             mp.granted_at as consent_granted_at
      from studio_read.restaurants r
      left join studio_read.marketing_permissions mp on mp.restaurant_id = r.id
      where r.id = ${externalId}`;

    if (!row) return null;

    const scopes = (row.consent_scopes ?? []) as MarketingScope[];
    const granted = row.consent_granted ?? false;

    const [photoRows, promoRows, reviewRows] = await Promise.all([
      scopes.includes('photos')
        ? sql<{ url: string; position: number }[]>`
            select url, position from studio_read.restaurant_photos
            where restaurant_id = ${externalId}
            order by position asc limit ${MAX_PHOTOS}`
        : Promise.resolve([] as { url: string; position: number }[]),

      scopes.includes('promotions')
        ? sql<
            {
              title: string;
              description: string | null;
              type: string;
              percent_value: number | null;
              fixed_value: number | null;
              start_date: Date | null;
              end_date: Date | null;
            }[]
          >`
            select title, description, type, percent_value, fixed_value,
                   start_date, end_date
            from studio_read.promotions
            where restaurant_id = ${externalId}
            order by start_date asc nulls first`
        : Promise.resolve([]),

      scopes.includes('reviews')
        ? sql<{ rating: number; comment: string | null; created_at: Date }[]>`
            select rating, comment, created_at from studio_read.reviews
            where restaurant_id = ${externalId} and comment is not null
            order by rating desc, created_at desc limit ${MAX_REVIEWS}`
        : Promise.resolve([]),
    ]);

    const photos: EntityPhoto[] = photoRows.map((p) => ({
      url: p.url,
      position: p.position,
    }));

    const promotions: EntityPromotion[] = promoRows.map((p) => ({
      title: p.title,
      description: p.description,
      type: p.type,
      percentValue: p.percent_value,
      fixedValue: p.fixed_value,
      startDate: p.start_date?.toISOString().slice(0, 10) ?? null,
      endDate: p.end_date?.toISOString().slice(0, 10) ?? null,
    }));

    const reviews: EntityReview[] = reviewRows.map((r) => ({
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at.toISOString(),
    }));

    const amenities: string[] = [];
    if (row.terrasse) amenities.push('terrasse');
    if (row.parking) amenities.push('parking');
    if (row.click_collect_enabled) amenities.push('click_and_collect');

    return {
      externalId: row.id,
      kind: 'restaurant',
      name: row.name,
      slug: row.slug,
      city: row.city,
      neighbourhood: row.quartier,
      photoCount: row.photo_count ?? 0,
      consentGranted: granted,
      description: row.description,
      cuisine: row.cuisine_type,
      address: row.address,
      rating: num(row.avg_rating),
      reviewCount: row.review_count,
      averageTicket: num(row.avg_ticket),
      capacity: row.capacity,
      amenities,
      photos,
      promotions,
      reviews,
      consent: {
        granted,
        scopes,
        grantedAt: row.consent_granted_at?.toISOString() ?? null,
      },
      fetchedAt: new Date().toISOString(),
    };
  }

  async close(): Promise<void> {
    await this.#sql.end({ timeout: 5 });
  }

  #assertKind(kind: EntityKind): void {
    if (!this.kinds.includes(kind)) {
      throw new Error(`Le connecteur Mida ne sait pas rendre « ${kind} ».`);
    }
  }
}
