import { supabase } from '../../supabase';

// 7 critères, chacun ~14.29% du score. `restaurant_schedules` (pas la
// colonne `opening_hours`, jamais écrite par l'app) fait foi pour les
// horaires — voir ProHorairesScreen/useSchedule.
export const COMPLETION_CRITERIA = [
  { key: 'photos',       label: '3 photos minimum',     check: (r) => (r.photos?.length || 0) >= 3 },
  { key: 'description',  label: 'Description',          check: (r) => !!r.description?.trim() },
  { key: 'cuisine_type', label: 'Type de cuisine',       check: (r) => !!r.cuisine_type },
  { key: 'menu',         label: 'Au moins 1 plat au menu', check: (r) => (r.dishCount || 0) >= 1 },
  { key: 'avg_ticket',   label: 'Prix moyen',            check: (r) => (r.avg_ticket || 0) > 0 },
  { key: 'schedule',     label: "Horaires d'ouverture",  check: (r) => (r.scheduleCount || 0) > 0 },
  { key: 'phone',        label: 'Téléphone',             check: (r) => !!r.phone?.trim() },
];

/**
 * Calcule le score de complétion d'une fiche restaurant.
 * `restaurant` doit inclure dishCount et scheduleCount (comptés à part,
 * ce sont des tables séparées) en plus des colonnes de `restaurants`.
 */
export function computeCompletion(restaurant) {
  const missing = COMPLETION_CRITERIA.filter(c => !c.check(restaurant));
  const done = COMPLETION_CRITERIA.length - missing.length;
  return {
    score: Math.round((done / COMPLETION_CRITERIA.length) * 100),
    done,
    total: COMPLETION_CRITERIA.length,
    missing: missing.map(c => ({ key: c.key, label: c.label })),
  };
}

/** Récupère les données nécessaires et calcule le score pour un restaurant donné. */
export async function fetchCompletion(restaurantId) {
  const [restoRes, dishRes, schedRes] = await Promise.all([
    supabase.from('restaurants')
      .select('photos, description, cuisine_type, avg_ticket, phone')
      .eq('id', restaurantId).maybeSingle(),
    supabase.from('dishes').select('id', { count: 'exact', head: true }).eq('restaurant_id', restaurantId),
    supabase.from('restaurant_schedules').select('id', { count: 'exact', head: true }).eq('restaurant_id', restaurantId),
  ]);

  return computeCompletion({
    ...(restoRes.data || {}),
    dishCount: dishRes.count || 0,
    scheduleCount: schedRes.count || 0,
  });
}
