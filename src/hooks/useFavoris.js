import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';

export const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷', autre:'🍽️',
};

export const SORT_OPTIONS = [
  { id: 'recent', label: 'Récents' },
  { id: 'rating', label: 'Mieux notés' },
  { id: 'alpha',  label: 'A → Z' },
];

export function timeAdded(iso) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Ajouté aujourd'hui";
  if (d === 1) return 'Ajouté hier';
  if (d < 30)  return `Ajouté il y a ${d} j`;
  return `Ajouté le ${new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
}

export default function useFavoris() {
  const [favorites,  setFavorites]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removing,   setRemoving]   = useState(new Set());
  const [search,     setSearch]     = useState('');
  const [sort,       setSort]       = useState('recent');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const u = authData?.user;
      if (!u) return;
      const { data: userRow } = await supabase.from('users').select('id').eq('auth_id', u.id).maybeSingle();
      if (!userRow) return;

      const { data } = await supabase
        .from('favorites')
        .select('id, created_at, restaurant_id, restaurants(id, name, cuisine_type, quartier, city, avg_rating, avg_ticket, photos, review_count)')
        .eq('user_id', userRow.id)
        .order('created_at', { ascending: false });
      setFavorites(data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const removeFavorite = useCallback((fav) => {
    Alert.alert(
      'Retirer des favoris',
      `Retirer ${fav.restaurants?.name || 'ce restaurant'} de vos favoris ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer', style: 'destructive',
          onPress: async () => {
            setRemoving(prev => new Set(prev).add(fav.id));
            try {
              await supabase.from('favorites').delete().eq('id', fav.id);
              setFavorites(prev => prev.filter(f => f.id !== fav.id));
            } finally {
              setRemoving(prev => { const next = new Set(prev); next.delete(fav.id); return next; });
            }
          },
        },
      ]
    );
  }, []);

  const filtered = useMemo(() => favorites
    .filter(f => {
      if (!search) return true;
      const q = search.toLowerCase();
      const r = f.restaurants || {};
      return (r.name || '').toLowerCase().includes(q)
        || (r.cuisine_type || '').toLowerCase().includes(q)
        || (r.quartier || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === 'rating') return (b.restaurants?.avg_rating || 0) - (a.restaurants?.avg_rating || 0);
      if (sort === 'alpha')  return (a.restaurants?.name || '').localeCompare(b.restaurants?.name || '');
      return 0;
    }), [favorites, search, sort]);

  const rows = useMemo(() => {
    const out = [];
    for (let i = 0; i < filtered.length; i += 2) out.push([filtered[i], filtered[i + 1] || null]);
    return out;
  }, [filtered]);

  const avgRating = useMemo(
    () => favorites.length > 0
      ? (favorites.reduce((acc, f) => acc + (f.restaurants?.avg_rating || 0), 0) / favorites.length).toFixed(1)
      : '—',
    [favorites],
  );

  const cuisineCount = useMemo(
    () => [...new Set(favorites.map(f => f.restaurants?.cuisine_type).filter(Boolean))].length,
    [favorites],
  );

  const clearSearch = useCallback(() => setSearch(''), []);
  const cycleSort   = useCallback(() => setSort(cur => {
    const idx = SORT_OPTIONS.findIndex(o => o.id === cur);
    return SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length].id;
  }), []);
  const onRefresh = useCallback(() => load(true), [load]);

  return {
    favorites, loading, refreshing, removing,
    search, setSearch, sort,
    filtered, rows, avgRating, cuisineCount,
    removeFavorite, clearSearch, cycleSort, onRefresh,
  };
}
