import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';

const RESTO_FIELDS = 'id,name,cuisine_type,quartier,avg_rating,avg_ticket,photos,'
  + 'review_count,city,view_count';

// "Les plus consultés" — Accueil, scope sur la ville sélectionnée dans les
// onglets de zone (ou tout le pays pour "Près de moi", pas de vrai tri géo).
export default function useMostViewed(cityId) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let req = supabase.from('restaurants').select(RESTO_FIELDS)
          .eq('status', 'active')
          .order('view_count', { ascending: false })
          .limit(20);
        if (cityId) req = req.eq('city_id', cityId);

        const { data, error } = await req;
        if (!cancelled) setRestaurants(error ? [] : (data ?? []));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cityId]);

  return { restaurants, loading };
}
