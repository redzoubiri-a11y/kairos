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
  const [userName,     setUserName]     = useState('');
  const [userInitial,  setUserInitial]  = useState('?');
  const [avatarUrl,    setAvatarUrl]    = useState(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [quickFilter,  setQuickFilter]  = useState('all');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useFocusEffect(useCallback(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) return;
      if (u.email) setUserInitial(u.email[0].toUpperCase());

      const { data: row } = await supabase.from('users')
        .select('id, avatar_url, first_name')
        .eq('auth_id', u.id).maybeSingle();
      if (!row) return;

      setAvatarUrl(row.avatar_url ?? null);
      setUserName(row.first_name || u.email?.split('@')[0] || '');

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
      const q = supabase.from('restaurants')
        .select('id,name,cuisine_type,quartier,avg_rating,avg_ticket,photos,review_count,city,opening_hours,amenities,phone,capacity,address')
        .eq('status', 'active').limit(20).order('avg_rating', { ascending: false });
      try {
        const { data } = await q;
        setRestaurants(data ?? []);
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
  // "Promo" n'a aucune table de données ce jour — retourne une liste vide (honnête,
  // se remplira automatiquement le jour où un système de promotions existera).
  const list = useMemo(() => {
    if (quickFilter === 'terrace') {
      return restaurants.filter(r => (r.amenities || []).map(a => String(a).toLowerCase()).includes('terrasse'));
    }
    if (quickFilter === 'promo') return [];
    return restaurants;
  }, [restaurants, quickFilter]);

  return {
    restaurants,
    loading,
    userName, userInitial, avatarUrl,
    unreadNotifs,
    quickFilter, setQuickFilter,
    list,
    fadeAnim, slideAnim,
  };
}
