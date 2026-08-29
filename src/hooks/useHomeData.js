import { useState, useCallback, useRef } from 'react';
import { Animated, Platform } from 'react-native';
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

  // L'animation d'entree ne part plus au montage de l'ecran : a cet instant la
  // liste "Les plus consultes" n'est pas encore rendue (squelettes en cours), et
  // l'animation se terminait AVANT que la vue existe. Elle restait alors figee
  // sur ses valeurs de depart -- opacity 0 -- donc invisible, avec un blanc a la
  // place des restaurants. C'est a l'ecran d'appeler playEntrance() quand son
  // contenu est pret.
  const playEntrance = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      // Pas de pilote natif sur le web : react-native-web n'en a pas, et la
      // valeur n'etait jamais repercutee sur le noeud du DOM.
      Animated.timing(fadeAnim,  { toValue: 1, duration: 420, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return {
    unreadNotifs,
    fadeAnim, slideAnim, playEntrance,
  };
}
