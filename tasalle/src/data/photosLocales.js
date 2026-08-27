/**
 * Photos de salles embarquées dans l'app (`assets/salles/<id>/`).
 *
 * Complète `photos.json`, qui ne sait référencer que des URL distantes : ici
 * les fichiers sont bundlés, donc affichés hors ligne et sans latence. Les
 * deux sources sont concaténées par `photosOf()` dans `seed.js`, les locales
 * d'abord.
 *
 * Metro résout les `require` d'images à la compilation : chaque fichier doit
 * être écrit en toutes lettres, un chemin construit dynamiquement ne marche
 * pas. Pour ajouter une salle : déposer les fichiers dans
 * `assets/salles/<id>/` puis ajouter la ligne correspondante ci-dessous.
 *
 * Format attendu (Annexe A) : 1200 px de large, ratio 4:3, JPEG.
 * Provenance : photos fournies par le propriétaire de la salle. Ne pas
 * reprendre d'images de Google/Instagram/Facebook — voir le `_lisezmoi` de
 * photos.json.
 */
export const LOCAL_SALLE_PHOTOS = {
  // 'salle-001': [require('../../assets/salles/salle-001/photo-1.jpg')],
};

/** Photos embarquées d'une salle, dans l'ordre d'affichage de la galerie. */
export function localPhotosOf(salleId) {
  return LOCAL_SALLE_PHOTOS[salleId] ?? [];
}
