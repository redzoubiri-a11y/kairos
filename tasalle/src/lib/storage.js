// Envoi des images vers Supabase Storage.
// En mode démo (aucune URL Supabase configurée), l'URI locale est renvoyée
// telle quelle : les écrans fonctionnent à l'identique, sans réseau.

import { supabase, hasSupabase } from '../data/client';

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Décode une chaîne base64 en octets.
 * `atob` n'est pas garanti sur tous les moteurs React Native et
 * `Buffer` n'existe pas : ce décodeur évite d'ajouter une dépendance.
 */
export function base64ToBytes(b64) {
  const clean = String(b64).replace(/[\r\n\s]/g, '');
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  const core = padding ? clean.slice(0, -padding) : clean;

  const bytes = new Uint8Array(Math.floor((core.length * 6) / 8));
  let buffer = 0;
  let bits = 0;
  let out = 0;

  for (let i = 0; i < core.length; i += 1) {
    const value = B64.indexOf(core[i]);
    if (value === -1) throw new Error('BASE64_INVALIDE');

    buffer = (buffer << 6) | value;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      bytes[out] = (buffer >> bits) & 0xff;
      out += 1;
    }
  }
  return bytes;
}

/** Extension de fichier déduite du type MIME, avec repli sur jpg. */
function extensionOf(mimeType) {
  if (!mimeType) return 'jpg';
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';
  if (mimeType.includes('heic')) return 'heic';
  return 'jpg';
}

/** Chemin unique et non devinable, pour éviter les collisions et l'énumération. */
export function buildPath(prefix, mimeType) {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}/${stamp}-${rand}.${extensionOf(mimeType)}`;
}

/**
 * Envoie une image choisie via expo-image-picker et renvoie son URL publique.
 * L'appelant doit demander `base64: true` au sélecteur.
 */
export async function uploadImage({ bucket, prefix, asset }) {
  if (!asset?.uri) throw new Error('IMAGE_MANQUANTE');

  // Mode démo : rien à envoyer, l'URI locale s'affiche directement.
  if (!hasSupabase) return asset.uri;

  if (!asset.base64) {
    throw new Error("L'image doit être sélectionnée avec l'option base64");
  }

  const path = buildPath(prefix, asset.mimeType);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, base64ToBytes(asset.base64), {
      contentType: asset.mimeType || 'image/jpeg',
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export const BUCKETS = { SALLES: 'salles', AVIS: 'avis' };
