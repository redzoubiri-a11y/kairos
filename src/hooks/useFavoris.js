import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';

export default function useFavoris() {
  const [favorites,  setFavorites]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const onRefresh = useCallback(() => load(true), [load]);

  return { favorites, loading, refreshing, onRefresh };
}
