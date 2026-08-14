import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';

export const FILTERS = [
  { id: 'all',     label: 'Tout' },
  { id: 'open',    label: 'Ouvert' },
  { id: 'terrace', label: 'Terrasse' },
  { id: 'promo',   label: 'Promo' },
];

export default function useHomeData() {
  const [restaurants,  setRestaurants]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [quickFilter,  setQuickFilter]  = useState('all');
  const [promoRestaurants, setPromoRestaurants] = useState([]);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useFocusEffect(useCallback(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) return;

      const { data: row } = await supabase.from('users')
        .select('id')
        .eq('auth_id', u.id).maybeSingle();
      if (!row) return;

      const { count } = await supabase.from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', row.id).eq('recipient_type', 'user').eq('is_read', false);
      setUnreadNotifs(count ?? 0);
    })();
  }, []));

  useEffect(() => {
    (async () => {
      setLoading(true);
      fadeAnim.setValue(0);
      slideAnim.setValue(20);
      const RESTO_FIELDS = 'id,name,cuisine_type,quartier,avg_rating,avg_ticket,photos,review_count,city,opening_hours,amenities,phone,capacity,address';
      const q = supabase.from('restaurants')
        .select(RESTO_FIELDS)
        .eq('status', 'active').limit(20).order('avg_rating', { ascending: false });
      // Cherche parmi TOUS les restaurants actifs (pas seulement le top 20 ci-dessus) —
      // un resto avec une promo active peut être mal noté et absent du top 20.
      const promoQ = supabase.from('promotions')
        .select(`title, start_date, end_date, restaurants!restaurant_id (${RESTO_FIELDS})`)
        .eq('is_paused', false);
      try {
        const [{ data }, { data: promoRows }] = await Promise.all([q, promoQ]);
        setRestaurants(data ?? []);
        const today = new Date().toISOString().slice(0, 10);
        const promoMap = new Map();
        (promoRows ?? [])
          .filter(p => p.restaurants && (!p.start_date || p.start_date <= today) && (!p.end_date || p.end_date >= today))
          .forEach(p => promoMap.set(p.restaurants.id, { ...p.restaurants, promoLabel: p.title }));
        setPromoRestaurants(Array.from(promoMap.values()));
        Animated.parallel([
          Animated.timing(fadeAnim,  { toValue: 1, duration: 420, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
        ]).start();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // "Ouvert" n'a pas encore de données réelles (open_time/close_time jamais renseignés
  // par les restaurateurs) — traité comme "Tout" pour l'instant, cohérent avec le badge
  // "Ouvert" déjà décoratif ailleurs dans l'app (RestaurantScreen).
  const list = useMemo(() => {
    if (quickFilter === 'terrace') {
      return restaurants.filter(r => (r.amenities || []).map(a => String(a).toLowerCase()).includes('terrasse'));
    }
    if (quickFilter === 'promo') return promoRestaurants;
    return restaurants;
  }, [restaurants, quickFilter, promoRestaurants]);

  return {
    restaurants,
    loading,
    unreadNotifs,
    quickFilter, setQuickFilter,
    list,
    fadeAnim, slideAnim,
  };
}
