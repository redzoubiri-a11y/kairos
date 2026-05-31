import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';
import { colors } from '../theme';

export const TYPE_CFG = {
  confirm:      { icon: '✅', color: colors.green,  label: 'Confirmation', group: 'resa' },
  cancellation: { icon: '❌', color: colors.red,    label: 'Annulation',   group: 'resa' },
  new_resa:     { icon: '📅', color: colors.blue,   label: 'Réservation',  group: 'resa' },
  reminder:     { icon: '⏰', color: colors.accent, label: 'Rappel',       group: 'rappel' },
  review_ask:   { icon: '⭐', color: colors.accent,  label: 'Avis',         group: 'rappel' },
};

export const TABS = [
  { id: 'all',    label: 'Tout' },
  { id: 'resa',   label: 'Réservations' },
  { id: 'rappel', label: 'Rappels' },
];

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)   return "à l'instant";
  if (m < 60)  return `il y a ${m} min`;
  if (h < 24)  return `il y a ${h}h`;
  if (d === 1) return 'hier';
  if (d < 7)   return `il y a ${d} jours`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function grouped(notifs) {
  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today.getTime() - 6 * 86400000);
  const out = [
    { label: "Aujourd'hui",   items: [] },
    { label: 'Cette semaine', items: [] },
    { label: 'Plus ancien',   items: [] },
  ];
  notifs.forEach(n => {
    const d = new Date(n.sent_at);
    if (d >= today)        out[0].items.push(n);
    else if (d >= weekAgo) out[1].items.push(n);
    else                   out[2].items.push(n);
  });
  return out.filter(g => g.items.length > 0);
}

export default function useNotifications() {
  const [notifs,     setNotifs]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId,     setUserId]     = useState(null);
  const [tab,        setTab]        = useState('all');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      if (!u) return;
      const { data: row } = await supabase.from('users').select('id').eq('auth_id', u.id).single();
      if (row) setUserId(row.id);
    })();
  }, []);

  const load = useCallback(async (refresh = false) => {
    if (!userId) return;
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .eq('recipient_type', 'user')
        .order('sent_at', { ascending: false });
      setNotifs(data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const markRead = useCallback(async (n) => {
    if (n.is_read) return;
    await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
    setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await supabase.from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('recipient_type', 'user')
      .eq('is_read', false);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  }, [userId]);

  const deleteNotif = useCallback((n) => {
    Alert.alert('Supprimer', 'Supprimer cette notification ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          await supabase.from('notifications').delete().eq('id', n.id);
          setNotifs(prev => prev.filter(x => x.id !== n.id));
        },
      },
    ]);
  }, []);

  const filtered = useMemo(
    () => notifs.filter(n => tab === 'all' || (TYPE_CFG[n.type]?.group || 'autre') === tab),
    [notifs, tab],
  );

  const { unread, unreadResa, unreadRappel } = useMemo(() => {
    let unread = 0, unreadResa = 0, unreadRappel = 0;
    for (const n of notifs) {
      if (n.is_read) continue;
      unread++;
      const group = TYPE_CFG[n.type]?.group;
      if (group === 'resa')   unreadResa++;
      if (group === 'rappel') unreadRappel++;
    }
    return { unread, unreadResa, unreadRappel };
  }, [notifs]);

  const groups    = useMemo(() => grouped(filtered), [filtered]);
  const onRefresh = useCallback(() => load(true), [load]);

  return {
    loading, refreshing, tab, setTab,
    filtered, unread, unreadResa, unreadRappel, groups,
    markRead, markAllRead, deleteNotif, onRefresh,
  };
}
