import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../supabase';
import { isOpenNow } from '../utils/openingHours';

const INTENT_KEY = '@mida_home_intent';

const RESTO_FIELDS = 'id,name,cuisine_type,quartier,avg_rating,avg_ticket,photos,'
  + 'review_count,city,opening_hours,amenities,phone,capacity,address,'
  + 'espace_famille,terrasse,parking,salle_fete,click_collect_enabled,view_count';

// Puces filtres d'usage — volontairement 5, pas plus (Lot 1)
export const USAGE_FILTERS = [
  { id: 'open_now',       label: 'Ouvert maintenant' },
  { id: 'espace_famille', label: 'Espace famille' },
  { id: 'terrasse',       label: 'Terrasse' },
  { id: 'parking',        label: 'Parking' },
  { id: 'salle_fete',     label: 'Salle fête' },
];

const DB_FILTER_COLUMNS = new Set(['espace_famille', 'terrasse', 'parking', 'salle_fete']);

export default function useHomeSearch() {
  const [mode,    setModeState] = useState('reserve'); // 'reserve' | 'order'
  const [query,   setQuery]     = useState('');
  const [filters, setFilters]   = useState(new Set());
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(INTENT_KEY).catch(() => null);
      if (saved === 'reserve' || saved === 'order') setModeState(saved);
    })();
  }, []);

  const setMode = useCallback((m) => {
    setModeState(m);
    AsyncStorage.setItem(INTENT_KEY, m).catch(() => {});
  }, []);

  const toggleFilter = useCallback((id) => {
    setFilters(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        let req = supabase.from('restaurants').select(RESTO_FIELDS)
          .eq('status', 'active')
          .or(`name.ilike.%${q}%,quartier.ilike.%${q}%,cuisine_type.ilike.%${q}%`)
          .limit(25);

        if (mode === 'order') req = req.eq('click_collect_enabled', true);
        for (const f of filters) {
          if (DB_FILTER_COLUMNS.has(f)) req = req.eq(f, true);
        }

        const { data, error } = await req;
        let list = error ? [] : (data ?? []);
        if (filters.has('open_now')) list = list.filter(r => isOpenNow(r.opening_hours));
        setResults(list);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, mode, filters]);

  const activeFilterIds = useMemo(() => [...filters], [filters]);

  return {
    mode, setMode,
    query, setQuery,
    filters: activeFilterIds, toggleFilter,
    results, loading, searching: query.trim().length > 0,
  };
}
