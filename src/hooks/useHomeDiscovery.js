import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabase';
import { CUISINE_OPTIONS } from './useProInfo';
import { QUARTIER_PHOTOS, CUISINE_PHOTOS } from '../data/discoveryPhotos';

const CUISINE_LABELS = Object.fromEntries(CUISINE_OPTIONS.map(o => [o.value, o.label]));

// Dégradés de repli pour les tuiles quartier/cuisine — la maquette Accueil.dc.html
// utilise des blocs de couleur unis (aucune vraie photo par quartier/catégorie
// dans le modèle de données), reproduits ici tels quels.
const TILE_GRADIENTS = [
  ['#D8C8A8', '#B79A6E'],
  ['#C9BFAC', '#8C8477'],
  ['#D3B7A0', '#9A6E4F'],
  ['#BFC9AC', '#7E8C6B'],
  ['#E0B26A', '#A8722E'],
  ['#8FBFC9', '#3E6F7A'],
  ['#C98F8F', '#7A3E3E'],
  ['#C9C08F', '#7A6E3E'],
];

// Quartiers/cuisines populaires de l'Accueil — pas de RPC dédiée, agrégation
// client-side sur la liste des restaurants actifs (~90 lignes, volume négligeable).
export default function useHomeDiscovery(cityId) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let req = supabase.from('restaurants').select('id, quartier, cuisine_type').eq('status', 'active');
        if (cityId) req = req.eq('city_id', cityId);
        const { data } = await req;
        if (!cancelled) setRestaurants(data ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cityId]);

  const topQuartiers = useMemo(() => {
    const counts = {};
    for (const r of restaurants) {
      if (!r.quartier) continue;
      counts[r.quartier] = (counts[r.quartier] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([quartier, count], i) => ({
        id: quartier, label: quartier, count, gradient: TILE_GRADIENTS[i], photo: QUARTIER_PHOTOS[quartier],
      }));
  }, [restaurants]);

  const topCuisines = useMemo(() => {
    const counts = {};
    for (const r of restaurants) {
      if (!r.cuisine_type) continue;
      counts[r.cuisine_type] = (counts[r.cuisine_type] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([cuisine, count], i) => ({
        id: cuisine, label: CUISINE_LABELS[cuisine] || cuisine, count,
        gradient: TILE_GRADIENTS[i + 4], photo: CUISINE_PHOTOS[cuisine],
      }));
  }, [restaurants]);

  return { topQuartiers, topCuisines, loading };
}
