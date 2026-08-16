import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Animated } from 'react-native';
import { supabase } from '../../supabase';

export const CUISINE_EMOJI = {
  algerien:'🥘', mediterraneen:'🐟', fast_casual:'☕',
  italien:'🍕', japonais:'🍣', turc:'🍢', libanais:'🌿', francais:'🍷', autre:'🍽️',
};

export default function useRestaurant(restaurantProp) {
  const [tab,            setTab]            = useState('Infos');
  const [reviews,        setReviews]        = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [dbDishes,       setDbDishes]       = useState([]);
  const [clickCollectEnabled, setClickCollectEnabled] = useState(false);
  // Champs pas forcément sélectionnés par l'écran appelant (ex. Accueil ne les
  // demande pas) — refetchés ici pour que la fiche reste correcte quelle que
  // soit la provenance de la navigation.
  const [extraFields, setExtraFields] = useState({});
  const restaurant = useMemo(() => ({ ...restaurantProp, ...extraFields }), [restaurantProp, extraFields]);
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
    if (restaurant.id) {
      // Compteur de vues de fiche (Lot 1) — RPC SECURITY DEFINER : un simple update
      // échouerait sous RLS, seul le propriétaire/admin peut UPDATE restaurants directement.
      supabase.rpc('increment_restaurant_views', { p_restaurant_id: restaurant.id }).then(() => {});

      (async () => {
        const { data } = await supabase.from('dishes')
          .select('id, name, description, price, category, is_dish_of_day, photo')
          .eq('restaurant_id', restaurant.id)
          .eq('is_available', true)
          .order('created_at', { ascending: true });
        if (data?.length > 0) setDbDishes(data);
      })();

      (async () => {
        const { data } = await supabase.from('restaurants')
          .select('click_collect_enabled, espace_famille, terrasse, parking, salle_fete, address, phone, quartier, city, avg_ticket')
          .eq('id', restaurant.id).maybeSingle();
        setClickCollectEnabled(!!data?.click_collect_enabled);
        if (data) setExtraFields(data);
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

  const switchTab = useCallback((t) => {
    Animated.timing(tabAnim, { toValue: 0, duration: 80, useNativeDriver: true }).start(() => {
      setTab(t);
      Animated.timing(tabAnim, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    });
  }, [tabAnim]);

  return {
    restaurant,
    tab, reviews, loadingReviews,
    tabAnim, photos, menu, rating, cuisineEmoji, desc,
    switchTab, clickCollectEnabled,
  };
}
