import { useState, useCallback, useRef, useMemo } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';
import { colors } from '../theme';

export const STATUS_CFG = {
  pending:   { label: 'EN ATTENTE', color: colors.accent,    bg: colors.accentSoft, border: 'rgba(232,160,69,0.35)'  },
  confirmed: { label: 'CONFIRMÉE',  color: colors.green,     bg: colors.greenSoft,  border: 'rgba(76,175,130,0.35)'  },
  cancelled: { label: 'ANNULÉE',    color: colors.red,       bg: colors.redSoft,    border: 'rgba(224,90,90,0.35)'   },
  arrived:   { label: 'ARRIVÉ',     color: colors.blue,      bg: colors.blueSoft,   border: 'rgba(90,155,224,0.35)'  },
  no_show:   { label: 'NO SHOW',    color: colors.textMuted, bg: colors.cardBorder, border: colors.cardBorder        },
};

export function clientName(resa) {
  const u = resa.users;
  if (!u) return 'Client';
  const full = `${u.first_name || ''} ${u.last_name || ''}`.trim();
  return full || (u.email ? u.email.split('@')[0] : 'Client');
}

function todayStr() { return new Date().toISOString().split('T')[0]; }

export default function useComptoir() {
  const [restaurant,     setRestaurant]     = useState(null);
  const [reservations,   setReservations]   = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [acting,         setActing]         = useState(new Set());
  const [selectedResaId, setSelectedResaId] = useState(null);
  const autoRefreshRef = useRef(null);

  const selectedResa = useMemo(
    () => reservations.find(r => r.id === selectedResaId) ?? null,
    [reservations, selectedResaId],
  );

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: ownerRow } = await supabase
        .from('restaurant_owners')
        .select('restaurant_id')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (!ownerRow?.restaurant_id) return;

      const { data: resto } = await supabase
        .from('restaurants')
        .select('id, name, city')
        .eq('id', ownerRow.restaurant_id)
        .maybeSingle();
      if (resto) setRestaurant(resto);

      const { data: res } = await supabase
        .from('reservations')
        .select('id, date, time_slot, nb_adults, nb_children, notes, status, user_id')
        .eq('restaurant_id', ownerRow.restaurant_id)
        .eq('date', todayStr())
        .order('time_slot', { ascending: true });

      const rows = res ?? [];
      const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))];
      let usersMap = {};
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .in('id', userIds);
        (usersData || []).forEach(u => { usersMap[u.id] = u; });
      }
      setReservations(rows.map(r => ({ ...r, users: usersMap[r.user_id] || null })));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    autoRefreshRef.current = setInterval(() => load(), 120000);
    return () => clearInterval(autoRefreshRef.current);
  }, [load]));

  const act = useCallback(async (id, fn) => {
    setActing(prev => new Set(prev).add(id));
    try { await fn(); }
    finally { setActing(prev => { const s = new Set(prev); s.delete(id); return s; }); }
  }, []);

  const confirm = useCallback((resa) => {
    Alert.alert('Confirmer', `Confirmer la réservation de ${clientName(resa)} à ${resa.time_slot?.slice(0, 5)} ?`, [
      { text: 'Non', style: 'cancel' },
      { text: 'Confirmer', onPress: () => act(resa.id, async () => {
        await supabase.from('reservations').update({ status: 'confirmed' }).eq('id', resa.id);
        setReservations(prev => prev.map(r => r.id === resa.id ? { ...r, status: 'confirmed' } : r));
        if (resa.user_id) {
          const date = new Date(resa.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
          const notifTitle = 'Réservation confirmée ✓';
          const notifBody  = `Votre réservation chez ${restaurant?.name} le ${date} à ${resa.time_slot?.slice(0, 5)} a été confirmée.`;
          try {
            await supabase.from('notifications').insert({
              recipient_id:   resa.user_id,
              recipient_type: 'user',
              type:           'resa_confirmed',
              title:          notifTitle,
              body:           notifBody,
            });
          } catch (_) {}
          supabase.functions.invoke('push-manager', {
            body: { user_id: resa.user_id, title: notifTitle, body: notifBody },
          }).catch(() => {});
        }
      })},
    ]);
  }, [act, restaurant]);

  const arrive = useCallback((resa) => {
    Alert.alert('Marquer arrivé', `${clientName(resa)} est arrivé ?`, [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui, arrivé', onPress: () => act(resa.id, async () => {
        await supabase.from('reservations').update({ status: 'arrived' }).eq('id', resa.id);
        setReservations(prev => prev.map(r => r.id === resa.id ? { ...r, status: 'arrived' } : r));
      })},
    ]);
  }, [act]);

  const cancel = useCallback((resa) => {
    Alert.alert('Annuler', `Annuler la réservation de ${clientName(resa)} à ${resa.time_slot?.slice(0, 5)} ?`, [
      { text: 'Non', style: 'cancel' },
      { text: 'Annuler la réservation', style: 'destructive', onPress: () => act(resa.id, async () => {
        await supabase.from('reservations')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('id', resa.id);
        setReservations(prev => prev.map(r => r.id === resa.id ? { ...r, status: 'cancelled' } : r));
        if (resa.user_id) {
          const date = new Date(resa.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
          const notifTitle = 'Réservation annulée';
          const notifBody  = `Votre réservation chez ${restaurant?.name} le ${date} à ${resa.time_slot?.slice(0, 5)} a été annulée par le restaurant.`;
          try {
            await supabase.from('notifications').insert({
              recipient_id:   resa.user_id,
              recipient_type: 'user',
              type:           'resa_cancelled',
              title:          notifTitle,
              body:           notifBody,
            });
          } catch (_) {}
          supabase.functions.invoke('push-manager', {
            body: { user_id: resa.user_id, title: notifTitle, body: notifBody },
          }).catch(() => {});
        }
      })},
    ]);
  }, [act, restaurant]);

  const stats = useMemo(() => {
    let confirmed = 0, pending = 0, arrived = 0, covers = 0;
    for (const r of reservations) {
      if (r.status === 'confirmed') confirmed++;
      if (r.status === 'pending')   pending++;
      if (r.status === 'arrived')   arrived++;
      if (r.status === 'confirmed' || r.status === 'arrived' || r.status === 'pending') {
        covers += (r.nb_adults || 0) + (r.nb_children || 0);
      }
    }
    return { total: reservations.length, confirmed, pending, arrived, covers };
  }, [reservations]);

  const selectResa = useCallback((id) => setSelectedResaId(id), []);

  const emptyDateStr = useMemo(
    () => new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
    [],
  );

  return {
    restaurant,
    reservations,
    loading, refreshing,
    acting,
    selectedResa, selectedResaId,
    stats,
    emptyDateStr,
    load,
    confirm, arrive, cancel,
    selectResa,
  };
}
