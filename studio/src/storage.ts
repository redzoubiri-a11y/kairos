/**
 * Dépôt des pièces produites dans le Storage du studio.
 *
 * Le chemin est déterministe — campagne / entité / type — donc rejouer une
 * campagne écrase ses propres fichiers au lieu d'en accumuler des variantes.
 * C'est ce qui rend une reprise après échec sans conséquence.
 */

import { createHash } from 'node:crypto';
import { studioDb } from './db.ts';

export interface StoredAsset {
  bucket: string;
  path: string;
  mime: string;
  bytes: number;
  checksum: string;
}

export function assetPath(
  campaignSlug: string,
  entitySlugOrId: string,
  extension: string,
): string {
  return `${campaignSlug}/${entitySlugOrId}.${extension}`;
}

export async function putAsset(
  bucket: string,
  path: string,
  body: Buffer | string,
  mime: string,
): Promise<StoredAsset> {
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');

  const { error } = await studioDb()
    .storage.from(bucket)
    .upload(path, buffer, { contentType: mime, upsert: true });

  if (error) {
    throw new Error(`Dépôt impossible (${bucket}/${path}) : ${error.message}`);
  }

  return {
    bucket,
    path,
    mime,
    bytes: buffer.byteLength,
    checksum: createHash('sha256').update(buffer).digest('hex'),
  };
}

/**
 * Les seaux sont privés : rien n'est servi sans signature. La durée par défaut
 * couvre une session de relecture, pas un partage public.
 */
export async function signedUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const { data, error } = await studioDb()
    .storage.from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) {
    throw new Error(`URL signée impossible (${bucket}/${path}) : ${error?.message}`);
  }
  return data.signedUrl;
}
