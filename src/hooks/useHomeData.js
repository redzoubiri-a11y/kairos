import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';

export const CITIES = [
  { id: 'alger',       label: 'Alger',        emoji: '🏛️', count: '20+' },
  { id: 'oran',        label: 'Oran',          emoji: '🌊', count: '10+' },
  { id: 'constantine', label: 'Constantine',   emoji: '🌉', count: '10+' },
  { id: 'tizi_ouzou',  label: 'Tizi Ouzou',    emoji: '⛰️', count: '5+'  },
  { id: 'bejaia',      label: 'Béjaïa',        emoji: '🌅', count: '5+'  },
  { id: 'setif',       label: 'Sétif',         emoji: '🌾', count: '5+'  },
  { id: 'annaba',      label: 'Annaba',        emoji: '🌺', count: '5+'  },
  { id: 'tlemcen',     label: 'Tlemcen',       emoji: '🕌', count: '5+'  },
  { id: 'nearby',      label: 'Autour de moi', emoji: '📍', count: ''    },
];

export const CATEGORIES = [
  { id: 'all',           label: 'Tout',       emoji: '✦',  cuisine: null            },
  { id: 'algerien',      label: 'Algérien',   emoji: '🥘', cuisine: 'algerien'      },
  { id: 'mediterraneen', label: 'Méditerra.', emoji: '🐟', cuisine: 'mediterraneen' },
  { id: 'francais',      label: 'Français',   emoji: '🍷', cuisine: 'francais'      },
  { id: 'libanais',      label: 'Libanais',   emoji: '🌿', cuisine: 'libanais'      },
];

export const QUICK_FILTERS = [
  { id: 'rating', label: 'Top noté',      emoji: '⭐' },
  { id: 'fast',   label: 'Dispo ce soir', emoji: '🌙' },
  { id: 'budget', label: 'Petit budget',  emoji: '💰' },
];

function eveningSlots() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const all = ['19h00', '19h30', '20h00', '20h30', '21h00', '21h30'];
  if (h >= 22) return [];
  if (h < 17) return all;
  return all.filter(s => {
    const [sh, sm] = s.replace('h', ':').split(':').map(Number);
    return sh > h || (sh === h && sm > m);
  });
}

export default function useHomeData() {
  const [city,         setCity]         = useState('alger');
  const [category,     setCategory]     = useState('all');
  const [restaurants,  setRestaurants]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [userName,     setUserName]     = useState('');
  const [userInitial,  setUserInitial]  = useState('?');
  const [avatarUrl,    setAvatarUrl]    = useState(null);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [quickFilter,  setQuickFilter]  = useState(null);

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
        .eq('auth_id', u.id).single();
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
      let q = supabase.from('restaurants')
        .select('id,name,cuisine_type,quartier,avg_rating,avg_ticket,photos,review_count,city')
        .eq('status', 'active').limit(20).order('avg_rating', { ascending: false });
      if (city !== 'nearby') q = q.eq('city', city);
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
  }, [city]);

  const featured = useMemo(
    () => [...restaurants].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0)).slice(0, 6),
    [restaurants],
  );

  const filtered = useMemo(() => {
    const cuisine = CATEGORIES.find(c => c.id === category)?.cuisine;
    let result = category === 'all' ? restaurants : restaurants.filter(r => r.cuisine_type === cuisine);
    if (quickFilter === 'rating') result = [...result].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    if (quickFilter === 'budget') result = [...result].sort((a, b) => (a.avg_ticket || 9999) - (b.avg_ticket || 9999));
    return result;
  }, [restaurants, category, quickFilter]);

  const topCount = useMemo(
    () => restaurants.filter(r => (r.avg_rating || 0) >= 4).length,
    [restaurants],
  );

  const slots   = useMemo(() => eveningSlots(), []);
  const cityObj = useMemo(() => CITIES.find(c => c.id === city) || CITIES[0], [city]);

  return {
    city, setCity,
    category, setCategory,
    restaurants,
    loading,
    userName, userInitial, avatarUrl,
    unreadNotifs,
    quickFilter, setQuickFilter,
    featured, filtered, topCount,
    slots, cityObj,
    fadeAnim, slideAnim,
  };
}
