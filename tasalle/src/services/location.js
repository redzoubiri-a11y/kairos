// Position de l'utilisateur, pour calculer les distances réelles.
//
// Entièrement facultatif : un refus d'autorisation ou un appareil sans GPS ne
// dégrade que l'affichage de la distance. Aucun écran n'en dépend.

import * as Location from 'expo-location';

let derniere = null;

/**
 * Position approximative de l'utilisateur, ou null.
 * La précision « basse » suffit : on affiche des kilomètres, pas des mètres,
 * et elle consomme nettement moins de batterie.
 */
export async function getUserPosition({ askPermission = true } = {}) {
  try {
    const existante = await Location.getForegroundPermissionsAsync();
    let accordee = existante.granted;

    if (!accordee && askPermission && existante.canAskAgain) {
      const demande = await Location.requestForegroundPermissionsAsync();
      accordee = demande.granted;
    }
    if (!accordee) return null;

    const position = await Location.getLastKnownPositionAsync().catch(() => null);
    const source =
      position ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));

    derniere = {
      latitude: source.coords.latitude,
      longitude: source.coords.longitude,
      at: new Date().toISOString(),
    };
    return derniere;
  } catch {
    // Service désactivé, appareil sans capteur, délai dépassé : sans position,
    // l'app fonctionne exactement pareil en masquant la distance.
    return null;
  }
}

/** Dernière position obtenue dans la session, sans nouvel appel système. */
export function getCachedPosition() {
  return derniere;
}

export function clearCachedPosition() {
  derniere = null;
}
