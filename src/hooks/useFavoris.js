import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';
import { typeErreur } from '../utils/typeErreur';

export default function useFavoris() {
  const [favorites,  setFavorites]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erreur,     setErreur]     = useState(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setErreur(null);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const u = authData?.user;
      if (!u) return;
      const { data: userRow } = await supabase.from('users').select('id').eq('auth_id', u.id).maybeSingle();
      if (!userRow) return;

      const { data, error } = await supabase
        .from('favorites')
        .select('id, created_at, restaurant_id, restaurants(id, name, cuisine_type, quartier, city, avg_rating, avg_ticket, photos, review_count)')
        .eq('user_id', userRow.id)
        .order('created_at', { ascending: false });
      if (error) { setErreur(typeErreur(error)); setFavorites([]); return; }
      setFavorites(data ?? []);
    } catch (e) {
      setErreur(typeErreur(e));
      setFavorites([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(() => load(true), [load]);

  const removeFavorite = useCallback(async (favId) => {
    // L'écran retirait le favori avant même de savoir si la suppression
    // avait réussi : en cas d'échec il réapparaissait au rechargement
    // suivant, sans explication.
    const avant = favorites;
    setFavorites(prev => prev.filter(f => f.id !== favId));
    const { error } = await supabase.from('favorites').delete().eq('id', favId);
    if (error) {
      setFavorites(avant);
      Alert.alert('Erreur', "Le favori n'a pas pu être retiré. Vérifiez votre connexion et réessayez.");
    }
  }, [favorites]);

  return { favorites, loading, refreshing, erreur, reessayer: load, onRefresh, removeFavorite };
}
