import { useState, useRef, useCallback, useMemo } from 'react';
import { Animated } from 'react-native';
import { supabase } from '../../supabase';

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
    days.push({
      dayName:   d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '').toUpperCase(),
      dayNum:    d.getDate(),
      month:     d.toLocaleDateString('fr-FR', { month: 'short' }),
      value:     d.toISOString().split('T')[0],
      isToday:   i === 0,
      isWeekend: [0, 6].includes(d.getDay()),
    });
  }
  return days;
}
export const DAYS = buildDays();

export function formatDateLong(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function useReservationForm(restaurant, onSuccess) {
  const [date,     setDate]     = useState(null);
  const [heure,    setHeure]    = useState(null);
  const [adults,   setAdults]   = useState(2);
  const [children, setChildren] = useState(0);
  const [occasion, setOccasion] = useState('normal');
  const [notes,    setNotes]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

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
      const { data: userRow } = await supabase.from('users').select('id').eq('auth_id', u.id).single();
      if (!userRow) { setError('Compte introuvable.'); return; }
      const uid = userRow.id;

      const noteText = [
        occasion !== 'normal' ? `Occasion : ${occasionObj?.label}` : null,
        notes.trim() || null,
      ].filter(Boolean).join('\n') || null;

      const { error: resaErr } = await supabase.from('reservations').insert({
        user_id:       uid,
        restaurant_id: restaurant.id,
        date,
        time_slot:     heure,
        nb_adults:     adults,
        nb_children:   children,
        notes:         noteText,
        status:        'pending',
      });

      if (resaErr) { setError(resaErr.message); return; }

      supabase.from('notifications').insert({
        recipient_id:   uid,
        recipient_type: 'user',
        type:           'new_resa',
        title:          'Demande envoyée',
        body:           `Votre réservation chez ${restaurant.name} le ${formatDateLong(date)} à ${heure} pour ${adults} personne${adults > 1 ? 's' : ''} est en attente de confirmation.`,
      }).catch(() => {});

      onSuccess?.();
    } catch (e) {
      setError(e?.message || 'Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);
    }
  }, [date, heure, restaurant, occasion, occasionObj, notes, adults, children, triggerShake]);

  return {
    date, setDate, heure, setHeure,
    adults, setAdults, children, setChildren,
    occasion, setOccasion, notes, setNotes,
    loading, error,
    occasionObj, shakeTranslate,
    confirmer,
  };
}
