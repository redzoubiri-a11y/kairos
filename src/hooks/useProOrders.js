import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';
import { colors } from '../theme';

export const ORDER_STATUS = {
  pending:   { label: 'EN ATTENTE',  color: colors.accent, bg: colors.accentSoft, border: 'rgba(232,160,69,0.3)' },
  confirmed: { label: 'CONFIRMÉE',   color: colors.blue,   bg: colors.blueSoft,   border: 'rgba(90,155,224,0.3)' },
  ready:     { label: 'PRÊTE',       color: colors.green,  bg: colors.greenSoft,  border: 'rgba(76,175,130,0.3)' },
  collected: { label: 'RÉCUPÉRÉE',   color: colors.textDim,bg: colors.cardBorder, border: colors.cardBorder },
  cancelled: { label: 'ANNULÉE',     color: colors.red,    bg: colors.redSoft,    border: 'rgba(224,90,90,0.3)' },
};

const NEXT_STATUS = { pending: 'confirmed', confirmed: 'ready', ready: 'collected' };
const NEXT_LABEL  = { pending: 'Confirmer', confirmed: 'Marquer prête', ready: 'Marquer récupérée' };

async function notifyClient(userId, title, body) {
  if (!userId) return;
  await supabase.from('notifications').insert({ recipient_id: userId, recipient_type: 'user', type: 'order_update', title, body }).catch(() => {});
  supabase.functions.invoke('push-manager', { body: { user_id: userId, title, body } }).catch(() => {});
}

export default function useProOrders() {
  const [restaurantId, setRestaurantId] = useState(null);
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting,     setActing]     = useState(new Set());

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: ownerRows } = await supabase
        .from('restaurant_owners').select('restaurant_id')
        .eq('auth_id', session.user.id).limit(1);
      const rid = ownerRows?.[0]?.restaurant_id;
      if (!rid) return;
      setRestaurantId(rid);

      const { data } = await supabase
        .from('orders')
        .select('id, status, notes, total_amount, created_at, user_id, order_items(id, dish_name, price, quantity), users(first_name, last_name, phone)')
        .eq('restaurant_id', rid)
        .order('created_at', { ascending: false });
      setOrders(data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = useCallback(() => load(true), [load]);

  const advance = useCallback((order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setActing(p => new Set(p).add(order.id));
    (async () => {
      const { error } = await supabase.from('orders').update({ status: next, updated_at: new Date().toISOString() }).eq('id', order.id);
      if (!error) {
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: next } : o));
        const clientName = [order.users?.first_name, order.users?.last_name].filter(Boolean).join(' ') || 'Client';
        const messages = {
          confirmed: 'Votre commande a été confirmée par le restaurant.',
          ready:     'Votre commande est prête ! Vous pouvez venir la récupérer.',
          collected: 'Commande récupérée. Merci !',
        };
        notifyClient(order.user_id, `Commande ${ORDER_STATUS[next].label.toLowerCase()}`, messages[next] || '');
      }
      setActing(p => { const n = new Set(p); n.delete(order.id); return n; });
    })();
  }, []);

  const cancel = useCallback((order) => {
    Alert.alert('Annuler la commande', 'Le client sera notifié.', [
      { text: 'Retour', style: 'cancel' },
      { text: 'Annuler la commande', style: 'destructive', onPress: async () => {
        setActing(p => new Set(p).add(order.id));
        const { error } = await supabase.from('orders').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', order.id);
        if (!error) {
          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o));
          notifyClient(order.user_id, 'Commande annulée', 'Votre commande a été annulée par le restaurant.');
        }
        setActing(p => { const n = new Set(p); n.delete(order.id); return n; });
      }},
    ]);
  }, []);

  return {
    restaurantId, orders, loading, refreshing, acting,
    onRefresh, advance, cancel,
    NEXT_LABEL,
  };
}
