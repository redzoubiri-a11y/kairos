import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';
import { computeCompletion } from '../utils/restaurantCompletion';

export default function useAdminValidation() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [acting,      setActing]      = useState(new Set());

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const { data: restos } = await supabase
        .from('restaurants')
        .select('id, name, city, quartier, description, cuisine_type, avg_ticket, phone, photos, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      const rows = restos ?? [];
      const withCompletion = await Promise.all(rows.map(async (r) => {
        const [dishRes, schedRes] = await Promise.all([
          supabase.from('dishes').select('id', { count: 'exact', head: true }).eq('restaurant_id', r.id),
          supabase.from('restaurant_schedules').select('id', { count: 'exact', head: true }).eq('restaurant_id', r.id),
        ]);
        const completion = computeCompletion({
          ...r,
          dishCount: dishRes.count || 0,
          scheduleCount: schedRes.count || 0,
        });
        return { ...r, completion };
      }));

      setRestaurants(withCompletion);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(() => load(true), [load]);

  const activate = useCallback((r) => {
    Alert.alert('Activer ce restaurant', `${r.name} sera visible par tous les clients.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Activer', onPress: async () => {
        setActing(p => new Set(p).add(r.id));
        const { error } = await supabase.from('restaurants').update({ status: 'active' }).eq('id', r.id);
        if (error) Alert.alert('Erreur', error.message);
        else setRestaurants(prev => prev.filter(x => x.id !== r.id));
        setActing(p => { const next = new Set(p); next.delete(r.id); return next; });
      }},
    ]);
  }, []);

  const reject = useCallback((r) => {
    Alert.alert('Rejeter ce restaurant', `${r.name} sera suspendu et restera invisible aux clients.`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Rejeter', style: 'destructive', onPress: async () => {
        setActing(p => new Set(p).add(r.id));
        const { error } = await supabase.from('restaurants').update({ status: 'suspended' }).eq('id', r.id);
        if (error) Alert.alert('Erreur', error.message);
        else setRestaurants(prev => prev.filter(x => x.id !== r.id));
        setActing(p => { const next = new Set(p); next.delete(r.id); return next; });
      }},
    ]);
  }, []);

  const quickEdit = useCallback(async (id, fields) => {
    setActing(p => new Set(p).add(id));
    const { error } = await supabase.from('restaurants').update(fields).eq('id', id);
    if (!error) await load();
    setActing(p => { const next = new Set(p); next.delete(id); return next; });
    return { error };
  }, [load]);

  return { restaurants, loading, refreshing, acting, onRefresh, activate, reject, quickEdit, reload: load };
}
