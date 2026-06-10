import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../supabase';

export const SETUP_STEPS = [
  { key: 'info',     icon: '✏️', label: 'Informations',  desc: 'Cuisine, adresse, description',      screen: 'ProInfo' },
  { key: 'photos',   icon: '📷', label: 'Photos',         desc: 'Ajoutez des photos attrayantes',     screen: 'ProPhotos' },
  { key: 'menu',     icon: '🍽️', label: 'Menu',           desc: 'Créez vos plats et tarifs',          screen: 'ProMenu' },
  { key: 'horaires', icon: '🕐', label: 'Horaires',       desc: "Définissez vos heures d'ouverture",  screen: 'ProHoraires' },
];

export default function useProOnboarding() {
  const [userId,  setUserId]  = useState(null);
  const [visible, setVisible] = useState(false);
  const [visited, setVisited] = useState({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const uid = session.user.id;
      setUserId(uid);
      AsyncStorage.getItem('@mida_setup_' + uid).then(val => {
        const saved = val ? JSON.parse(val) : {};
        const savedVisited = saved.visited || {};
        setVisited(savedVisited);
        const allDone = SETUP_STEPS.every(s => savedVisited[s.key]);
        if (!allDone) setVisible(true);
      });
    });
  }, []);

  const markVisited = useCallback(async (key) => {
    setVisited(prev => {
      const next = { ...prev, [key]: true };
      if (userId) AsyncStorage.setItem('@mida_setup_' + userId, JSON.stringify({ visited: next, dismissed: false })).catch(() => {});
      return next;
    });
  }, [userId]);

  const dismiss = useCallback(async () => {
    const allDone = SETUP_STEPS.every(s => visited[s.key]);
    setVisible(false);
    if (userId) {
      await AsyncStorage.setItem('@mida_setup_' + userId, JSON.stringify({
        visited,
        dismissed: allDone,
      })).catch(() => {});
    }
  }, [userId, visited]);

  const reset = useCallback(async () => {
    setVisited({});
    setVisible(true);
    if (userId) await AsyncStorage.removeItem('@mida_setup_' + userId).catch(() => {});
  }, [userId]);

  return { visible, visited, markVisited, dismiss, reset };
}
