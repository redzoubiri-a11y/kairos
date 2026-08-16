// Statut d'une ligne `promotions` (is_paused/start_date/end_date) — partagé entre
// la gestion Pro (useProPromos) et l'affichage client (badge promo sur Explorer).
export function computePromoStatus(p) {
  if (p.is_paused) return 'paused';
  const today = new Date().toISOString().slice(0, 10);
  if (p.end_date && p.end_date < today) return 'ended';
  if (p.start_date && p.start_date > today) return 'scheduled';
  return 'active';
}
