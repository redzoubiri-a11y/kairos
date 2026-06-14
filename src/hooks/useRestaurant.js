import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Animated } from 'react-native';
import { supabase } from '../../supabase';

export const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷', autre:'🍽️',
};

export default function useRestaurant(restaurant) {
  const [tab,            setTab]            = useState('Menu');
  const [photoIndex,     setPhotoIndex]     = useState(0);
  const [isFav,          setIsFav]          = useState(false);
  const [favId,          setFavId]          = useState(null);
  const [favLoading,     setFavLoading]     = useState(false);
  const [userId,         setUserId]         = useState(null);
  const [reviews,        setReviews]        = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [dbDishes,       setDbDishes]       = useState([]);
  const tabAnim = useRef(new Animated.Value(1)).current;

  const photos = useMemo(
    () => restaurant.photos?.length > 0 ? restaurant.photos
      : restaurant.photo_url ? [restaurant.photo_url] : null,
    [restaurant.photos, restaurant.photo_url],
  );
  const menu = useMemo(() => {
    if (dbDishes.length > 0) {
      const cats = [...new Set(dbDishes.map(d => d.category).filter(Boolean))];
      return cats.map(cat => ({
        cat,
        items: dbDishes
          .filter(d => d.category === cat)
          .map(d => ({
            nom:     d.name,
            desc:    d.description || '',
            prix:    Number(d.price),
            popular: d.is_dish_of_day,
            photo:   d.photo || null,
          })),
      }));
    }
    return [];
  }, [dbDishes]);
  const rating       = useMemo(() => restaurant.avg_rating > 0 ? Number(restaurant.avg_rating).toFixed(1) : null, [restaurant.avg_rating]);
  const cuisineEmoji = useMemo(() => CUISINE_EMOJI[restaurant.cuisine_type] || '🍽️', [restaurant.cuisine_type]);
  const desc         = useMemo(() => restaurant.description || null, [restaurant.description]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) return;
      const { data: row } = await supabase.from('users').select('id').eq('auth_id', u.id).maybeSingle();
      if (!row) return;
      setUserId(row.id);
      if (!restaurant.id) return;
      const { data: fav } = await supabase.from('favorites')
        .select('id').eq('user_id', row.id).eq('restaurant_id', restaurant.id).maybeSingle();
      if (fav) { setIsFav(true); setFavId(fav.id); }
    })();

    if (restaurant.id) {
      (async () => {
        const { data } = await supabase.from('dishes')
          .select('id, name, description, price, category, is_dish_of_day, photo')
          .eq('restaurant_id', restaurant.id)
          .eq('is_available', true)
          .order('created_at', { ascending: true });
        if (data?.length > 0) setDbDishes(data);
      })();

      setLoadingReviews(true);
      (async () => {
        try {
          const { data } = await supabase.from('reviews')
            .select('id, rating, comment, created_at, users(first_name, last_name)')
            .eq('restaurant_id', restaurant.id)
            .eq('moderation_status', 'approved')
            .order('created_at', { ascending: false })
            .limit(20);
          if (data?.length > 0) {
            setReviews(data.map(r => ({
              id:         r.id,
              note:       r.rating,
              first_name: r.users?.first_name,
              last_name:  r.users?.last_name,
              comment:    r.comment,
              created_at: r.created_at,
            })));
          }
        } finally {
          setLoadingReviews(false);
        }
      })();
    }
  }, [restaurant.id]);

  const toggleFav = useCallback(async () => {
    if (!userId || !restaurant.id || favLoading) return;
    setFavLoading(true);
    try {
      if (isFav) {
        const { error } = await supabase.from('favorites').delete().eq('id', favId);
        if (!error) { setIsFav(false); setFavId(null); }
      } else {
        const { data, error } = await supabase.from('favorites')
          .upsert({ user_id: userId, restaurant_id: restaurant.id }, { onConflict: 'user_id,restaurant_id' })
          .select('id');
        if (error) {
        } else {
          const id = data?.[0]?.id;
          if (id) {
            setIsFav(true); setFavId(id);
          } else {
            const { data: f } = await supabase.from('favorites')
              .select('id').eq('user_id', userId).eq('restaurant_id', restaurant.id).maybeSingle();
            if (f) { setIsFav(true); setFavId(f.id); }
          }
        }
      }
    } finally {
      setFavLoading(false);
    }
  }, [userId, favLoading, isFav, favId, restaurant.id]);

  const switchTab = useCallback((t) => {
    Animated.timing(tabAnim, { toValue: 0, duration: 80, useNativeDriver: true }).start(() => {
      setTab(t);
      Animated.timing(tabAnim, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    });
  }, [tabAnim]);

  return {
    tab, photoIndex, setPhotoIndex,
    isFav, favLoading, reviews, loadingReviews,
    tabAnim, photos, menu, rating, cuisineEmoji, desc,
    toggleFav, switchTab,
  };
}
