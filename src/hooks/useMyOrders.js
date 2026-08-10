import { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';

export default function useMyOrders() {
  const [userId,     setUserId]     = useState(null);
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(new Set());
  const channelRef = useRef(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: userRow } = await supabase.from('users').select('id').eq('auth_id', user.id).maybeSingle();
      if (!userRow) return;
      setUserId(userRow.id);

      const { data } = await supabase
        .from('orders')
        .select('id, status, notes, total_amount, created_at, restaurant_id, order_items(id, dish_name, price, quantity), restaurants(id, name, photos, quartier, phone)')
        .eq('user_id', userRow.id)
        .order('created_at', { ascending: false });
      setOrders(data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = useCallback(() => load(true), [load]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('my_orders_' + userId)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, status: payload.new.status } : o));
      })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const cancel = useCallback((orderId) => {
    setCancelling(p => new Set(p).add(orderId));
    (async () => {
      const { error } = await supabase.from('orders').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', orderId);
      if (!error) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      setCancelling(p => { const n = new Set(p); n.delete(orderId); return n; });
    })();
  }, []);

  const active  = orders.filter(o => ['pending', 'confirmed', 'ready'].includes(o.status));
  const history = orders.filter(o => ['collected', 'cancelled'].includes(o.status));

  return { loading, refreshing, active, history, cancelling, onRefresh, cancel };
}
