import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';
import { colors } from '../theme';

export const SC = {
  confirmed: { label:'Confirmé',   color: colors.green,    bg: colors.greenSoft,  border:'rgba(76,175,130,0.3)'   },
  pending:   { label:'En attente', color: colors.accent,   bg: colors.accentSoft, border:'rgba(232,160,69,0.3)'   },
  arrived:   { label:'Arrivé',     color: colors.blue,     bg: colors.blueSoft,   border:'rgba(90,155,224,0.25)'  },
  no_show:   { label:'No Show',    color: colors.textMuted, bg:'rgba(138,154,176,0.1)', border:'rgba(138,154,176,0.2)' },
  cancelled: { label:'Annulé',     color: colors.red,      bg: colors.redSoft,    border:'rgba(224,90,90,0.25)'   },
  completed: { label:'Terminé',    color: colors.textDim,  bg:'rgba(74,74,74,0.1)', border:'rgba(74,74,74,0.2)'   },
};

export function statusCfg(s) { return SC[s] || SC.pending; }

export function fmtShort(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' });
}
export function fmtLong(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
}
export function fmtMonth(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { month:'long', year:'numeric' });
}
export function daysUntil(d) {
  const today = new Date(); today.setHours(0,0,0,0);
  const diff  = Math.round((new Date(d+'T00:00:00') - today) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'DEMAIN';
  if (diff > 1)  return `Dans ${diff} jours`;
  return `Il y a ${Math.abs(diff)} j`;
}

function todayStr() { return new Date().toISOString().split('T')[0]; }

export default function useReservations() {
  const [tab,          setTab]          = useState('avenir');
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [reservations, setReservations] = useState([]);
  const [reviewedIds,      setReviewedIds]      = useState(new Set());
  const [pendingReviewIds, setPendingReviewIds] = useState(new Set());

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: pu } = await supabase.from('users').select('id').eq('auth_id', session.user.id).maybeSingle();
      if (!pu) return;
      const { data } = await supabase
        .from('reservations')
        .select('*, restaurants(id, name, photos, cuisine_type, avg_rating, quartier, city)')
        .eq('user_id', pu.id)
        .order('date', { ascending: true })
        .order('time_slot', { ascending: true });
      const rows = data || [];
      setReservations(rows);

      if (rows.length > 0) {
        const { data: reviewRows } = await supabase
          .from('reviews')
          .select('reservation_id, moderation_status')
          .in('reservation_id', rows.map(r => r.id));
        setReviewedIds(new Set((reviewRows || []).filter(r => r.moderation_status === 'approved').map(r => r.reservation_id)));
        setPendingReviewIds(new Set((reviewRows || []).filter(r => r.moderation_status === 'pending').map(r => r.reservation_id)));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const cancelResa = useCallback((r) => {
    Alert.alert(
      'Annuler la réservation',
      `Annuler chez ${r.restaurants?.name || 'ce restaurant'} le ${fmtShort(r.date)} à ${r.time_slot?.slice(0,5)} ?`,
      [
        { text: 'Non', style: 'cancel' },
        { text: 'Oui, annuler', style: 'destructive',
          onPress: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            await supabase.from('reservations')
              .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
              .eq('id', r.id);

            // Notification de confirmation au client
            try {
              const { data: pu } = await supabase.from('users').select('id').eq('auth_id', session.user.id).maybeSingle();
              if (pu) {
                await supabase.from('notifications').insert({
                  recipient_id:   pu.id,
                  recipient_type: 'user',
                  type:           'resa_cancelled',
                  title:          'Réservation annulée',
                  body:           `Votre réservation chez ${r.restaurants?.name || 'le restaurant'} le ${fmtShort(r.date)} à ${r.time_slot?.slice(0,5)} a bien été annulée.`,
                });
              }
            } catch (_) {}

            // Notification au manager
            try {
              const { data: owner } = await supabase
                .from('restaurant_owners')
                .select('auth_id')
                .eq('restaurant_id', r.restaurant_id)
                .maybeSingle();
              if (owner) {
                const { data: managerUser } = await supabase
                  .from('users')
                  .select('id')
                  .eq('auth_id', owner.auth_id)
                  .maybeSingle();
                if (managerUser) {
                  await supabase.from('notifications').insert({
                    recipient_id:   managerUser.id,
                    recipient_type: 'user',
                    type:           'resa_cancelled',
                    title:          'Réservation annulée',
                    body:           `La réservation du ${fmtShort(r.date)} à ${r.time_slot?.slice(0,5)} (${(r.nb_adults||0)+(r.nb_children||0)} pers.) a été annulée par le client.`,
                  });
                }
              }
            } catch (_) {}

            load(true);
          },
        },
      ]
    );
  }, [load]);

  const today = useMemo(() => todayStr(), []);

  const aVenir = useMemo(
    () => reservations.filter(r => r.date >= today && ['confirmed','pending'].includes(r.status)),
    [reservations, today],
  );

  const historique = useMemo(
    () => reservations.filter(r => !aVenir.find(a => a.id === r.id)),
    [reservations, aVenir],
  );

  const { next, later } = useMemo(() => ({ next: aVenir[0], later: aVenir.slice(1) }), [aVenir]);
  const pending = useMemo(() => aVenir.filter(r => r.status === 'pending').length, [aVenir]);

  const histByMonth = useMemo(() => {
    const groups = {};
    historique.forEach(r => {
      const key = fmtMonth(r.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return groups;
  }, [historique]);

  const onRefresh = useCallback(() => load(true), [load]);

  const submitReview = useCallback(async (resa, rating, comment) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Non connecté');
    const { data: pu } = await supabase.from('users').select('id').eq('auth_id', session.user.id).maybeSingle();
    if (!pu) throw new Error('Utilisateur introuvable');
    const { error } = await supabase.from('reviews').insert({
      user_id:           pu.id,
      restaurant_id:     resa.restaurants.id,
      reservation_id:    resa.id,
      rating,
      comment:           comment || null,
      moderation_status: 'pending',
    });
    if (error) throw error;
    setPendingReviewIds(prev => new Set(prev).add(resa.id));
  }, []);

  return {
    tab, setTab, loading, refreshing,
    today, aVenir, historique, next, later, pending, histByMonth,
    reviewedIds, pendingReviewIds,
    cancelResa, submitReview, onRefresh,
  };
}
