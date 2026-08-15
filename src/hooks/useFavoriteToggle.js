import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';

// Favori autonome par carte/écran — chaque instance vérifie et bascule son propre état,
// pas besoin que l'écran parent charge la liste des favoris pour toute une liste de restos.
export default function useFavoriteToggle(restaurantId) {
  const [isFav,      setIsFav]      = useState(false);
  const [favId,      setFavId]      = useState(null);
  const [favLoading, setFavLoading] = useState(false);
  const [userId,     setUserId]     = useState(null);

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) return;
      const { data: row } = await supabase.from('users').select('id').eq('auth_id', u.id).maybeSingle();
      if (!row) return;
      setUserId(row.id);
      const { data: fav } = await supabase.from('favorites')
        .select('id').eq('user_id', row.id).eq('restaurant_id', restaurantId).maybeSingle();
      if (fav) { setIsFav(true); setFavId(fav.id); }
    })();
  }, [restaurantId]);

  const toggleFav = useCallback(async () => {
    if (!userId || !restaurantId || favLoading) return;
    setFavLoading(true);
    try {
      if (isFav) {
        const { error } = await supabase.from('favorites').delete().eq('id', favId);
        if (!error) { setIsFav(false); setFavId(null); }
      } else {
        const { data, error } = await supabase.from('favorites')
          .upsert({ user_id: userId, restaurant_id: restaurantId }, { onConflict: 'user_id,restaurant_id' })
          .select('id');
        if (!error) {
          const id = data?.[0]?.id;
          if (id) { setIsFav(true); setFavId(id); }
        }
      }
    } finally {
      setFavLoading(false);
    }
  }, [userId, favLoading, isFav, favId, restaurantId]);

  return { isFav, favLoading, toggleFav };
}
