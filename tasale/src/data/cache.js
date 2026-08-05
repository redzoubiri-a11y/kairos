// Cache de consultation hors ligne (§1.4).
//
// Le cahier des charges impose que le planning pro reste consultable sans
// connexion : un propriétaire qui vérifie une date dans sa salle, au sous-sol
// ou en déplacement, ne doit pas tomber sur un écran d'erreur.
//
// Le principe est volontairement simple : on écrit la dernière réponse réussie,
// on la relit quand l'appel échoue. Aucune synchronisation différée — les
// écritures (confirmer, bloquer un jour) exigent toujours le réseau, car les
// rejouer à l'aveugle risquerait de confirmer deux réservations le même jour.

import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'tasale.cache.';

/** Durée au-delà de laquelle une donnée en cache est jugée trop vieille. */
export const MAX_AGE_MS = 7 * 24 * 3600 * 1000;

export function cacheKey(...parts) {
  return PREFIX + parts.filter((p) => p != null).join(':');
}

export async function cacheSet(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ at: new Date().toISOString(), value }));
    return true;
  } catch {
    // Un cache qui n'a pas pu s'écrire ne doit jamais faire échouer l'appel.
    return false;
  }
}

/** Renvoie { value, at } ou null si absent, illisible ou périmé. */
export async function cacheGet(key, { maxAge = MAX_AGE_MS } = {}) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !('value' in parsed)) return null;

    const age = Date.now() - new Date(parsed.at).getTime();
    if (Number.isNaN(age) || age > maxAge) return null;

    return { value: parsed.value, at: parsed.at };
  } catch {
    return null;
  }
}

export async function cacheClear() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mine = keys.filter((k) => k.startsWith(PREFIX));
    if (mine.length) await AsyncStorage.multiRemove(mine);
    return mine.length;
  } catch {
    return 0;
  }
}

/**
 * Exécute `fetcher`, met le résultat en cache, et retombe sur la dernière
 * réponse connue si l'appel échoue.
 *
 * Renvoie { data, at } — `at` est nul quand la donnée est fraîche, et porte
 * l'horodatage de la mise en cache quand elle vient du cache.
 * Si l'appel échoue et qu'aucun cache n'existe, l'erreur est propagée : mieux
 * vaut un écran d'erreur qu'un planning vide qu'on croirait à jour.
 */
export async function withCache(key, fetcher, options) {
  try {
    const data = await fetcher();
    await cacheSet(key, data);
    return { data, at: null };
  } catch (error) {
    const hit = await cacheGet(key, options);
    if (!hit) throw error;
    return { data: hit.value, at: hit.at };
  }
}
