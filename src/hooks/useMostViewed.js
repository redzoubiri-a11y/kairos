import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { isOpenNow } from '../utils/openingHours';

const RESTO_FIELDS = 'id,name,cuisine_type,quartier,avg_rating,avg_ticket,photos,'
  + 'review_count,city,opening_hours,amenities,phone,capacity,address,'
  + 'espace_famille,terrasse,parking,salle_fete,click_collect_enabled,view_count';

const DB_FILTER_COLUMNS = new Set(['espace_famille', 'terrasse', 'parking', 'salle_fete']);

// "Les plus consultés à Alger" — Lot 1, ville fixée par le titre de la section.
export default function useMostViewed({ mode = 'reserve', filters = [] } = {}) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let req = supabase.from('restaurants').select(RESTO_FIELDS)
          .eq('status', 'active')
          .eq('city', 'alger')
          .order('view_count', { ascending: false })
          .limit(20);

        if (mode === 'order') req = req.eq('click_collect_enabled', true);
        for (const f of filters) {
          if (DB_FILTER_COLUMNS.has(f)) req = req.eq(f, true);
        }

        const { data, error } = await req;
        let list = error ? [] : (data ?? []);
        if (filters.includes('open_now')) list = list.filter(r => isOpenNow(r.opening_hours));
        if (!cancelled) setRestaurants(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [mode, filters.join(',')]);

  return { restaurants, loading };
}
