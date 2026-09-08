/**
 * Résolution d'un connecteur par sa clé.
 *
 * Une seule application en Phase 1. Le registre existe quand même : c'est lui
 * qui garantit que rien d'autre dans le studio n'importe `MidaConnector`
 * directement, donc que brancher Sourcily demain ne demandera qu'une ligne ici.
 */

import type { AppConnector } from './types.ts';
import { MidaConnector } from './mida.ts';

type Factory = () => AppConnector;

const FACTORIES: Record<string, Factory> = {
  mida: () => new MidaConnector(),
};

export function connectorKeys(): string[] {
  return Object.keys(FACTORIES);
}

export function openConnector(key: string): AppConnector {
  const factory = FACTORIES[key];
  if (!factory) {
    throw new Error(
      `Aucun connecteur « ${key} ». Connus : ${connectorKeys().join(', ')}.`,
    );
  }
  return factory();
}

export type { AppConnector, ConnectorHealth, FindQuery } from './types.ts';
