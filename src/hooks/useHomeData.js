import { useState, useEffect, useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';

export default function useHomeData() {
  const [unreadNotifs, setUnreadNotifs] = useState(0);

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
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, []);

  return {
    unreadNotifs,
    fadeAnim, slideAnim,
  };
}
