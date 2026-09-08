/**
 * Section 3.1 — l'interface qu'une application doit présenter au studio.
 *
 * ⚠️ Contrat INFÉRÉ : voir l'avertissement de src/types.ts.
 *
 * Un connecteur ne fait que trois choses : dire ce qu'il sait faire, chercher,
 * et rendre une fiche. Il ne génère rien, ne stocke rien, n'écrit jamais chez
 * l'application — la lecture seule n'est pas une convention de code ici, elle
 * est portée par le rôle Postgres (voir db/kairos/0002_studio_reader.sql) et
 * revérifiée à la connexion.
 */

import type { AppEntity, AppEntitySummary, EntityKind } from '../types.ts';

export interface FindQuery {
  kind: EntityKind;
  /** Recherche libre sur le nom. */
  search?: string;
  city?: string;
  cuisine?: string;
  /**
   * Par défaut true : le studio ne s'intéresse qu'aux entités qui ont donné
   * leur accord. Le passer à false sert à mesurer le reste à aller chercher,
   * pas à produire.
   */
  consentedOnly?: boolean;
  /** Filtre utile en pratique : sans photo, pas de visuel. */
  minPhotos?: number;
  limit?: number;
}

export interface AppConnector {
  /** Identifiant stable, celui de la colonne apps.key. */
  readonly key: string;
  /** Ce que ce connecteur sait rendre. */
  readonly kinds: readonly EntityKind[];

  /** Vérifie l'accès et refuse de continuer si la connexion n'est pas en lecture seule. */
  check(): Promise<ConnectorHealth>;

  find(query: FindQuery): Promise<AppEntitySummary[]>;

  /** null si l'entité n'existe pas, n'est pas publiée, ou n'est pas lisible. */
  get(kind: EntityKind, externalId: string): Promise<AppEntity | null>;

  close(): Promise<void>;
}

export interface ConnectorHealth {
  ok: boolean;
  /** Le rôle réellement utilisé — sert à prouver qu'on n'est pas connecté en postgres. */
  role: string;
  readOnly: boolean;
  details: string;
}
