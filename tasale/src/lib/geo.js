// Géolocalisation — distances et liens de cartographie.
// Module pur : aucune dépendance à React Native, donc testable directement.

const RAYON_TERRE_KM = 6371;

const enRadians = (deg) => (deg * Math.PI) / 180;

/** Une paire de coordonnées est-elle exploitable ? */
export function hasCoords(point) {
  return (
    point != null &&
    Number.isFinite(Number(point.latitude)) &&
    Number.isFinite(Number(point.longitude))
  );
}

/**
 * Distance orthodromique entre deux points, en kilomètres (formule de
 * haversine). C'est une distance à vol d'oiseau : le trajet routier réel est
 * toujours plus long, ce que l'affichage doit laisser entendre.
 * Renvoie null si l'un des points est inexploitable.
 */
export function distanceKm(a, b) {
  if (!hasCoords(a) || !hasCoords(b)) return null;

  const lat1 = enRadians(Number(a.latitude));
  const lat2 = enRadians(Number(b.latitude));
  const dLat = lat2 - lat1;
  const dLon = enRadians(Number(b.longitude) - Number(a.longitude));

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * RAYON_TERRE_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Distance lisible : sous 10 km on donne une décimale, au-delà l'arrondi
 * suffit — annoncer « 412,3 km » suggèrerait une précision qu'on n'a pas.
 */
export function formatDistance(km) {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

/** Ordonne des salles de la plus proche à la plus lointaine, sans coordonnées en dernier. */
export function sortByDistance(salles, origine) {
  if (!hasCoords(origine)) return salles;

  return [...salles].sort((a, b) => {
    const da = distanceKm(origine, a);
    const db = distanceKm(origine, b);
    if (da == null && db == null) return 0;
    if (da == null) return 1;
    if (db == null) return -1;
    return da - db;
  });
}

/**
 * Lien d'itinéraire vers l'application de cartes de l'appareil.
 * `geo:` sur Android, `maps://` sur iOS, Google Maps sur le web — aucune clé
 * d'API n'est nécessaire, ce qui rend l'itinéraire toujours disponible.
 */
export function directionsUrl({ latitude, longitude, label, platform }) {
  if (!hasCoords({ latitude, longitude })) return null;

  const coords = `${latitude},${longitude}`;
  const nom = encodeURIComponent(label || 'Destination');

  if (platform === 'ios') return `maps://?daddr=${coords}&q=${nom}`;
  if (platform === 'android') return `geo:${coords}?q=${coords}(${nom})`;
  return `https://www.google.com/maps/dir/?api=1&destination=${coords}`;
}

/**
 * Vignette cartographique statique (API Mapbox), ou null sans jeton.
 * Une image statique évite d'embarquer un moteur de carte pour un aperçu.
 */
export function staticMapUrl({ latitude, longitude, token, width = 640, height = 320, zoom = 14 }) {
  if (!token || !hasCoords({ latitude, longitude })) return null;

  const marqueur = `pin-l+0B6E5F(${longitude},${latitude})`;
  return (
    'https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/' +
    `${marqueur}/${longitude},${latitude},${zoom},0/${width}x${height}@2x` +
    `?access_token=${token}`
  );
}
