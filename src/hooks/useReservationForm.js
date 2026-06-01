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
  const [date,     setDate]     = useState(() => existingResa?.date || null);
  const [heure,    setHeure]    = useState(() => existingResa?.time_slot?.slice(0, 5) || null);
  const [adults,   setAdults]   = useState(() => existingResa?.nb_adults ?? 2);
  const [children, setChildren] = useState(() => existingResa?.nb_children ?? 0);
  const [occasion, setOccasion] = useState(() => parseInitial(existingResa).occasion);
  const [notes,    setNotes]    = useState(() => parseInitial(existingResa).notes);
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

      if (existingResa) {
        const { error: resaErr } = await supabase.from('reservations').update({
          date, time_slot: heure, nb_adults: adults, nb_children: children, notes: noteText,
        }).eq('id', existingResa.id);
        if (resaErr) { setError(resaErr.message); return; }
        try {
          await supabase.from('notifications').insert({
            recipient_id:   uid,
            recipient_type: 'user',
            type:           'new_resa',
            title:          'Réservation modifiée',
            body:           `Votre réservation chez ${restaurant.name} a été modifiée : ${formatDateLong(date)} à ${heure} pour ${adults} personne${adults > 1 ? 's' : ''}.`,
          });
        } catch (_) {}
        try {
          const { data: owner } = await supabase
            .from('restaurant_owners').select('auth_id')
            .eq('restaurant_id', restaurant.id).maybeSingle();
          if (owner?.auth_id) {
            const { data: mgr } = await supabase
              .from('users').select('id')
              .eq('auth_id', owner.auth_id).maybeSingle();
            if (mgr) {
              await supabase.from('notifications').insert({
                recipient_id:   mgr.id,
                recipient_type: 'user',
                type:           'new_resa',
                title:          'Réservation modifiée',
                body:           `Modification pour le ${formatDateLong(date)} à ${heure} · ${adults} couvert${adults > 1 ? 's' : ''}.`,
              });
            }
          }
          supabase.functions.invoke('push-manager', {
            body: {
              restaurant_id: restaurant.id,
              title: 'Réservation modifiée',
              body:  `${formatDateLong(date)} à ${heure} · ${adults} couvert${adults > 1 ? 's' : ''}.`,
            },
          });
        } catch (_) {}
      } else {
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
        try {
          await supabase.from('notifications').insert({
            recipient_id:   uid,
            recipient_type: 'user',
            type:           'new_resa',
            title:          'Demande envoyée',
            body:           `Votre réservation chez ${restaurant.name} le ${formatDateLong(date)} à ${heure} pour ${adults} personne${adults > 1 ? 's' : ''} est en attente de confirmation.`,
          });
        } catch (_) {}
        try {
          const { data: owner } = await supabase
            .from('restaurant_owners').select('auth_id')
            .eq('restaurant_id', restaurant.id).maybeSingle();
          if (owner?.auth_id) {
            const { data: mgr } = await supabase
              .from('users').select('id')
              .eq('auth_id', owner.auth_id).maybeSingle();
            if (mgr) {
              await supabase.from('notifications').insert({
                recipient_id:   mgr.id,
                recipient_type: 'user',
                type:           'new_resa',
                title:          'Nouvelle réservation',
                body:           `Demande pour le ${formatDateLong(date)} à ${heure} · ${adults} couvert${adults > 1 ? 's' : ''}.`,
              });
            }
          }
          supabase.functions.invoke('push-manager', {
            body: {
              restaurant_id: restaurant.id,
              title: 'Nouvelle réservation 📅',
              body:  `Demande pour le ${formatDateLong(date)} à ${heure} · ${adults} couvert${adults > 1 ? 's' : ''}.`,
            },
          });
        } catch (_) {}
      }

      onSuccess?.();
    } catch (e) {
      setError(e?.message || 'Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);
    }
  }, [date, heure, restaurant, occasion, occasionObj, notes, adults, children, existingResa, triggerShake]);

  return {
    date, setDate, heure, setHeure,
    adults, setAdults, children, setChildren,
    occasion, setOccasion, notes, setNotes,
    loading, error,
    occasionObj, shakeTranslate,
    confirmer,
  };
}
