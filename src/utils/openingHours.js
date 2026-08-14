// Utilitaires partagés pour restaurants.opening_hours — utilisé par useExplorer.js
// (filtre "Ouvert") et RestaurantInfosTab.js (bandeau horaires de la Fiche Restaurant),
// regroupés ici pour éviter la duplication entre un hook et un composant écran.

export function fmtHours(oh) {
  if (!oh) return null;
  if (typeof oh === 'string') return oh;
  if (!Array.isArray(oh) || oh.length === 0) return null;
  const hm = s => (s || '').replace(':', 'h');
  if (typeof oh[0].day === 'number') {
    const opens  = [...new Set(oh.map(d => d.open))];
    const closes = [...new Set(oh.map(d => d.close))];
    if (opens.length === 1 && closes.length === 1)
      return `Tous les jours  ${hm(opens[0])} – ${hm(closes[0])}`;
    const minOpen  = oh.reduce((mn, d) => d.open  < mn ? d.open  : mn, oh[0].open);
    const maxClose = oh.reduce((mx, d) => d.close > mx ? d.close : mx, oh[0].close);
    return `Lun–Sam  ${hm(minOpen)} – ${hm(maxClose)}`;
  }
  return oh.map(d => `${d.day}  ${hm(d.open)} – ${hm(d.close)}`).join('  ·  ');
}

// Horaires du jour (pas de fmtHours, qui résume toute la semaine) — pour le
// bandeau "Ouvert aujourd'hui" de la Fiche Restaurant. Le modèle de données
// actuel ne stocke qu'un seul créneau par jour (pas de split midi/soir) : on
// n'affiche donc pas l'exemple "12:00–15:00 · 19:00–23:00" de la maquette,
// qui suppose un modèle multi-créneaux inexistant côté données.
export function todaysHours(oh) {
  if (!oh || typeof oh === 'string' || !Array.isArray(oh) || oh.length === 0) return null;
  const day = new Date().getDay();
  const today = oh.find(d => d.day === day);
  if (!today) return null;
  const hm = s => (s || '').replace(':', 'h');
  return `${hm(today.open)} – ${hm(today.close)}`;
}

export function isOpenNow(oh) {
  if (!oh || typeof oh === 'string' || !Array.isArray(oh) || oh.length === 0) return null;
  const now = new Date();
  const day = now.getDay();
  const today = oh.find(d => d.day === day);
  if (!today) return null;
  const toMin = s => { const [h, m] = (s || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= toMin(today.open) && nowMin <= toMin(today.close);
}
