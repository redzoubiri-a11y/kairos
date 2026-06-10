import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';

export const DOW_FULL   = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
export const DOW_SHORT  = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
// French display order: Mon first
export const DOW_ORDER  = [1, 2, 3, 4, 5, 6, 0];

function cleanTime(t) {
  return t ? String(t).slice(0, 5) : null;
}

function makeDefault(dow) {
  return {
    day_of_week:   dow,
    is_open:       false,
    lunch_start:   null,
    lunch_end:     null,
    dinner_start:  null,
    dinner_end:    null,
    slot_duration: 30,
    slot_capacity: null,
  };
}

export default function useSchedule() {
  const [restaurantId, setRestaurantId] = useState(null);
  const [schedule,     setSchedule]     = useState([0,1,2,3,4,5,6].map(makeDefault));
  const [slotDuration, setSlotDuration] = useState(30);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: owner } = await supabase
        .from('restaurant_owners')
        .select('restaurant_id')
        .eq('auth_id', session.user.id)
        .maybeSingle();
      if (!owner?.restaurant_id) return;
      setRestaurantId(owner.restaurant_id);
      const { data: rows } = await supabase
        .from('restaurant_schedules')
        .select('*')
        .eq('restaurant_id', owner.restaurant_id)
        .order('day_of_week');
      if (rows?.length) {
        const cleaned = rows.map(r => ({
          ...r,
          lunch_start:  cleanTime(r.lunch_start),
          lunch_end:    cleanTime(r.lunch_end),
          dinner_start: cleanTime(r.dinner_start),
          dinner_end:   cleanTime(r.dinner_end),
        }));
        setSchedule(cleaned);
        const first = cleaned.find(d => d.is_open);
        if (first) setSlotDuration(first.slot_duration);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const setDay = useCallback((dow, patch) => {
    setSchedule(prev => prev.map(d => d.day_of_week === dow ? { ...d, ...patch } : d));
  }, []);

  const save = useCallback(async () => {
    if (!restaurantId) return;
    setSaving(true);
    setError('');
    try {
      const rows = schedule.map(d => ({
        restaurant_id: restaurantId,
        day_of_week:   d.day_of_week,
        is_open:       d.is_open,
        lunch_start:   d.is_open ? (d.lunch_start  || null) : null,
        lunch_end:     d.is_open ? (d.lunch_end    || null) : null,
        dinner_start:  d.is_open ? (d.dinner_start || null) : null,
        dinner_end:    d.is_open ? (d.dinner_end   || null) : null,
        slot_duration: slotDuration,
        slot_capacity: d.slot_capacity,
      }));
      const { error: err } = await supabase
        .from('restaurant_schedules')
        .upsert(rows, { onConflict: 'restaurant_id,day_of_week' });
      if (err) throw err;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [restaurantId, schedule, slotDuration]);

  return { schedule, slotDuration, setSlotDuration, loading, saving, saved, error, setDay, save };
}
