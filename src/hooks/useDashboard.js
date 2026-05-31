import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';
import { colors } from '../theme';
import { clientName } from './useComptoir';

export { clientName };

export const STATUS = {
  pending:   { label:'EN ATTENTE', color: colors.accent, bg: colors.accentSoft, border: 'rgba(232,160,69,0.3)'  },
  confirmed: { label:'CONFIRMÉE',  color: colors.green,  bg: colors.greenSoft,  border: 'rgba(76,175,130,0.3)'  },
  cancelled: { label:'ANNULÉE',    color: colors.red,    bg: colors.redSoft,    border: 'rgba(224,90,90,0.3)'   },
  completed: { label:'TERMINÉE',   color: colors.textDim,bg: colors.cardBorder, border: colors.cardBorder       },
  arrived:   { label:'ARRIVÉ',     color: colors.blue,   bg: colors.blueSoft,   border: 'rgba(90,155,224,0.3)'  },
  no_show:   { label:'NO SHOW',    color: colors.red,    bg: colors.redSoft,    border: 'rgba(224,90,90,0.3)'   },
};

export const FILTERS      = ['Tout','En attente','Confirmées','Annulées'];
export const FILTER_MAP   = { 'En attente':'pending', 'Confirmées':'confirmed', 'Annulées':'cancelled' };
export const DATE_FILTERS = ["Aujourd'hui",'Demain','Cette semaine','Tout'];

export const AVATAR_COLORS = [colors.accent, colors.blue, colors.green, colors.purple, colors.accentDim, colors.textMuted];
export function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name||'').length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(h)];
}

export function formatDate(iso) {
  if (!iso) return '—';
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function todayStr()    { return new Date().toISOString().split('T')[0]; }
function tomorrowStr() { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0]; }
function weekEndStr()  { const d = new Date(); d.setDate(d.getDate()+6); return d.toISOString().split('T')[0]; }
function greeting()    { const h = new Date().getHours(); return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'; }

async function sendNotification(users, type, title, body) {
  if (!users?.id) return;
  await supabase.from('notifications').insert({ recipient_id: users.id, recipient_type: 'user', type, title, body });
}

export default function useDashboard() {
  const [restaurant,   setRestaurant]   = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [filter,       setFilter]       = useState('Tout');
  const [dateFilter,   setDateFilter]   = useState('Tout');
  const [acting,       setActing]       = useState(new Set());

  const addActing    = useCallback(id => setActing(p => new Set(p).add(id)), []);
  const removeActing = useCallback(id => setActing(p => { const s = new Set(p); s.delete(id); return s; }), []);

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
      const restaurantId = ownerRow.restaurant_id;

      const { data: resto } = await supabase
        .from('restaurants')
        .select('id, name, city, quartier, cuisine_type, photos, avg_rating, avg_ticket, capacity')
        .eq('id', restaurantId)
        .maybeSingle();
      if (resto) setRestaurant(resto);

      const { data: res } = await supabase
        .from('reservations')
        .select('id, date, time_slot, nb_adults, nb_children, notes, status, created_at, user_id')
        .eq('restaurant_id', restaurantId)
        .order('date', { ascending: true })
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

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirm = useCallback((resa) => {
    Alert.alert(
      'Confirmer la réservation',
      `${clientName(resa)} · ${formatDate(resa.date)} à ${resa.time_slot?.slice(0,5)}\n${resa.nb_adults} adulte${resa.nb_adults > 1 ? 's' : ''}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer ✓', onPress: async () => {
          addActing(resa.id);
          try {
            const { error } = await supabase.from('reservations').update({ status: 'confirmed' }).eq('id', resa.id);
            if (error) throw error;
            await sendNotification(
              resa.users, 'confirm', 'Réservation confirmée ✅',
              `Votre table chez ${restaurant?.name} le ${formatDate(resa.date)} à ${resa.time_slot?.slice(0,5)} est confirmée.`,
            );
          } catch {
            Alert.alert('Erreur', 'Impossible de confirmer la réservation. Vérifiez votre connexion.');
          } finally {
            removeActing(resa.id);
            load();
          }
        }},
      ]
    );
  }, [addActing, removeActing, load, restaurant]);

  const cancel = useCallback((resa) => {
    Alert.alert(
      'Refuser la réservation',
      `${clientName(resa)} · ${formatDate(resa.date)} à ${resa.time_slot?.slice(0,5)}`,
      [
        { text: 'Retour', style: 'cancel' },
        { text: 'Refuser ✕', style: 'destructive', onPress: async () => {
          addActing(resa.id);
          try {
            const { error } = await supabase.from('reservations')
              .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
              .eq('id', resa.id);
            if (error) throw error;
            await sendNotification(
              resa.users, 'cancellation', 'Réservation annulée',
              `Votre réservation chez ${restaurant?.name} le ${formatDate(resa.date)} n'a pas pu être confirmée.`,
            );
          } catch {
            Alert.alert('Erreur', 'Impossible de refuser la réservation. Vérifiez votre connexion.');
          } finally {
            removeActing(resa.id);
            load();
          }
        }},
      ]
    );
  }, [addActing, removeActing, load, restaurant]);

  const markArrived = useCallback(async (resa) => {
    addActing(resa.id);
    try {
      await supabase.from('reservations').update({ status: 'arrived' }).eq('id', resa.id);
    } finally {
      removeActing(resa.id);
      load();
    }
  }, [addActing, removeActing, load]);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  const { t, tm, we } = useMemo(() => ({ t: todayStr(), tm: tomorrowStr(), we: weekEndStr() }), []);

  const todayResas = useMemo(
    () => reservations.filter(r => r.date === t),
    [reservations, t],
  );
  const pendingAll = useMemo(
    () => reservations.filter(r => r.status === 'pending'),
    [reservations],
  );
  const confirmedToday = useMemo(
    () => todayResas.filter(r => r.status === 'confirmed' || r.status === 'arrived'),
    [todayResas],
  );
  const totalCovers = useMemo(
    () => confirmedToday.reduce((acc, r) => acc + (r.nb_adults || 0) + (r.nb_children || 0), 0),
    [confirmedToday],
  );
  const revenue = useMemo(
    () => restaurant?.avg_ticket > 0 ? totalCovers * restaurant.avg_ticket : null,
    [totalCovers, restaurant],
  );
  const upcomingCount = useMemo(() => {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const soon      = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const future    = new Date(now.getTime() + 60 * 60 * 1000);
    const soonLimit = `${pad(future.getHours())}:${pad(future.getMinutes())}`;
    return confirmedToday.filter(r => {
      const ts = r.time_slot?.slice(0, 5) || '00:00';
      return ts >= soon && ts <= soonLimit;
    }).length;
  }, [confirmedToday]);

  const filtered = useMemo(() => reservations.filter(r => {
    const statusOk = filter === 'Tout' || r.status === FILTER_MAP[filter];
    let dateOk = true;
    if      (dateFilter === "Aujourd'hui")   dateOk = r.date === t;
    else if (dateFilter === 'Demain')        dateOk = r.date === tm;
    else if (dateFilter === 'Cette semaine') dateOk = r.date >= t && r.date <= we;
    return statusOk && dateOk;
  }), [reservations, filter, dateFilter, t, tm, we]);

  const showGroups = useMemo(() => dateFilter === "Aujourd'hui" && filter === 'Tout', [dateFilter, filter]);
  const midi = useMemo(
    () => filtered.filter(r => parseInt((r.time_slot || '00:00').split(':')[0]) < 17),
    [filtered],
  );
  const soir = useMemo(
    () => filtered.filter(r => parseInt((r.time_slot || '00:00').split(':')[0]) >= 17),
    [filtered],
  );

  const greetingTxt = useMemo(() => greeting(), []);
  const onRefresh   = useCallback(() => load(true), [load]);

  return {
    restaurant, reservations, loading, refreshing,
    filter, setFilter, dateFilter, setDateFilter,
    acting,
    confirm, cancel, markArrived, signOut, onRefresh,
    todayResas, pendingAll, confirmedToday, totalCovers, revenue, upcomingCount,
    filtered, showGroups, midi, soir,
    greetingTxt, t,
  };
}
