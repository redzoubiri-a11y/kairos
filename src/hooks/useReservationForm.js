import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Animated } from 'react-native';
import { supabase } from '../../supabase';
import { notifyClient, notifyRestaurant } from '../utils/notify';

export const MIDI_SLOTS = [
  { h:'12:00' }, { h:'12:30' }, { h:'13:00', badge:'Populaire' },
  { h:'13:30', badge:'Populaire' }, { h:'14:00', badge:'Dernières places' },
];
export const SOIR_SLOTS = [
  { h:'19:00' }, { h:'19:30', badge:'Populaire' },
  { h:'20:00', badge:'Populaire' }, { h:'20:30' },
  { h:'21:00' }, { h:'21:30', badge:'Dernières places' }, { h:'22:00' },
];

export const OCCASIONS = [
  { id:'normal',     label:'Repas normal', icon:'🍽️' },
  { id:'anniv',      label:'Anniversaire', icon:'🎂' },
  { id:'romantique', label:'Romantique',   icon:'💑' },
  { id:'affaires',   label:'Affaires',     icon:'💼' },
  { id:'famille',    label:'Famille',      icon:'👨‍👩‍👧' },
  { id:'fete',       label:'Célébration',  icon:'🥂' },
];

function buildDays() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dow = d.getDay(); // 0=Sunday … 6=Saturday
    days.push({
      dayName:    d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').toUpperCase(),
      dayNum:     d.getDate(),
      month:      d.toLocaleDateString('fr-FR', { month: 'short' }),
      value:      d.toISOString().split('T')[0],
      isToday:    i === 0,
      isWeekend:  [0, 6].includes(dow),
      dayOfWeek:  dow,
    });
  }
  return days;
}
export const DAYS = buildDays();

function buildSlots(start, end, duration) {
  if (!start || !end) return [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin += 24 * 60; // horaire qui passe minuit (ex: 18h30 → 01h00)
  const slots = [];
  let cur = startMin;
  while (cur < endMin) {
    slots.push({ h: `${String(Math.floor(cur / 60) % 24).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}` });
    cur += duration;
  }
  return slots;
}

export function formatDateLong(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function parseInitial(r) {
  if (!r) return { occasion: 'normal', notes: '' };
  const raw = r.notes || '';
  const match = raw.match(/^Occasion : (.+?)(?:\n|$)([\s\S]*)/);
  if (match) {
    const occ = OCCASIONS.find(o => o.label === match[1]);
    return { occasion: occ?.id || 'normal', notes: (match[2] || '').trim() };
  }
  return { occasion: 'normal', notes: raw.trim() };
}

export default function useReservationForm(restaurant, onSuccess, existingResa = null) {
  const [date,        setDate]        = useState(() => existingResa?.date || null);
  const [heure,       setHeure]       = useState(() => existingResa?.time_slot?.slice(0, 5) || null);
  const [adults,      setAdults]      = useState(() => existingResa?.nb_adults ?? 2);
  const [children,    setChildren]    = useState(() => existingResa?.nb_children ?? 0);
  const [occasion,    setOccasion]    = useState(() => parseInitial(existingResa).occasion);
  const [notes,       setNotes]       = useState(() => parseInitial(existingResa).notes);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [scheduleMap, setScheduleMap] = useState(null);

  useEffect(() => {
    if (!restaurant?.id) return;
    supabase
      .from('restaurant_schedules')
      .select('day_of_week, is_open, lunch_start, lunch_end, dinner_start, dinner_end, slot_duration')
      .eq('restaurant_id', restaurant.id)
      .then(({ data }) => {
        if (!data?.length) return;
        const m = {};
        data.forEach(r => {
          m[r.day_of_week] = {
            is_open:      r.is_open,
            lunch_start:  r.lunch_start  ? String(r.lunch_start).slice(0, 5)  : null,
            lunch_end:    r.lunch_end    ? String(r.lunch_end).slice(0, 5)    : null,
            dinner_start: r.dinner_start ? String(r.dinner_start).slice(0, 5) : null,
            dinner_end:   r.dinner_end   ? String(r.dinner_end).slice(0, 5)   : null,
            slot_duration: r.slot_duration,
          };
        });
        setScheduleMap(m);
      });
  }, [restaurant?.id]);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const occasionObj    = useMemo(() => OCCASIONS.find(o => o.id === occasion), [occasion]);
  const shakeTranslate = useMemo(() => shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }), [shakeAnim]);

  // Days filtered to restaurant's open days (fallback = all days)
  const availableDays = useMemo(() => {
    if (!scheduleMap) return DAYS;
    return DAYS.filter(d => scheduleMap[d.dayOfWeek]?.is_open !== false);
  }, [scheduleMap]);

  // Schedule for the currently selected date
  const daySchedule = useMemo(() => {
    if (!scheduleMap || !date) return null;
    const d = DAYS.find(d => d.value === date);
    return d ? scheduleMap[d.dayOfWeek] : null;
  }, [scheduleMap, date]);

  const midiSlots = useMemo(() => {
    if (!daySchedule) return MIDI_SLOTS;
    return buildSlots(daySchedule.lunch_start, daySchedule.lunch_end, daySchedule.slot_duration || 30);
  }, [daySchedule]);

  const soirSlots = useMemo(() => {
    if (!daySchedule) return SOIR_SLOTS;
    return buildSlots(daySchedule.dinner_start, daySchedule.dinner_end, daySchedule.slot_duration || 30);
  }, [daySchedule]);

  const confirmer = useCallback(async () => {
    if (!date || !heure) {
      setError('Choisissez une date et une heure pour continuer.');
      triggerShake();
      return;
    }
    if (!restaurant.id) { setError('Restaurant introuvable.'); return; }

    setLoading(true);
    setError('');
    try {
      const { data: authData } = await supabase.auth.getUser();
      const u = authData?.user;
      if (!u) { setError('Connectez-vous pour réserver.'); return; }
      const { data: userRow } = await supabase.from('users').select('id').eq('auth_id', u.id).maybeSingle();
      if (!userRow) { setError('Compte introuvable.'); return; }
      const uid = userRow.id;

      const noteText = [
        occasion !== 'normal' ? `Occasion : ${occasionObj?.label}` : null,
        notes.trim() || null,
      ].filter(Boolean).join('\n') || null;

      let resaId;
      if (existingResa) {
        const { error: resaErr } = await supabase.from('reservations').update({
          date, time_slot: heure, nb_adults: adults, nb_children: children, notes: noteText,
        }).eq('id', existingResa.id);
        if (resaErr) { setError(resaErr.message); return; }
        resaId = existingResa.id;
      } else {
        const { data: newResa, error: resaErr } = await supabase.from('reservations').insert({
          user_id:       uid,
          restaurant_id: restaurant.id,
          date,
          time_slot:     heure,
          nb_adults:     adults,
          nb_children:   children,
          notes:         noteText,
          status:        'pending',
        }).select('id').single();
        if (resaErr) { setError(resaErr.message); return; }
        resaId = newResa.id;
      }

      const quand    = `${formatDateLong(date)} à ${heure}`;
      const personnes = `${adults} personne${adults > 1 ? 's' : ''}`;
      const couverts  = `${adults} couvert${adults > 1 ? 's' : ''}`;
      const copy = existingResa
        ? {
            clientTitle: 'Réservation modifiée ✅',
            clientBody:  `Chez ${restaurant.name} · ${quand} pour ${personnes}.`,
            proTitle:    'Réservation modifiée',
            proBody:     `${quand} · ${couverts}.`,
          }
        : {
            clientTitle: 'Demande envoyée ✅',
            clientBody:  `Chez ${restaurant.name} · ${quand} pour ${personnes}. En attente de confirmation.`,
            proTitle:    'Nouvelle réservation 📅',
            proBody:     `Demande pour le ${quand} · ${couverts}.`,
          };

      // Les notifications ne doivent pas retarder la confirmation à l'écran :
      // elles avalent leurs propres erreurs, on ne les attend pas.
      notifyClient({
        reservationId: resaId, userId: uid, type: 'new_resa',
        title: copy.clientTitle, body: copy.clientBody,
      });
      notifyRestaurant({
        reservationId: resaId, restaurantId: restaurant.id, type: 'new_resa',
        title: copy.proTitle, body: copy.proBody,
      });

      onSuccess?.();
    } catch (e) {
      setError(e?.message || 'Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);
    }
  }, [date, heure, restaurant, occasion, occasionObj, notes, adults, children, existingResa, onSuccess, triggerShake]);

  return {
    date, setDate, heure, setHeure,
    adults, setAdults, children, setChildren,
    occasion, setOccasion, notes, setNotes,
    loading, error,
    occasionObj, shakeTranslate,
    confirmer,
    availableDays, midiSlots, soirSlots,
  };
}
