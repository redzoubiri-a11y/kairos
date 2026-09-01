import { useState, useCallback } from 'react';
import { Alert, AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';
import { colors } from '../theme';

// Libellés littéraux d'OrderCard.dc.html (vocabulaire commande, distinct du
// vocabulaire réservation EN ATTENTE/CONFIRMÉE/ANNULÉE de la section 06 du
// design system) : NOUVELLE → EN PRÉPARATION → PRÊTE → RÉCUPÉRÉE.
export const ORDER_STATUS = {
  pending:   { label: 'NOUVELLE',        color: colors.statusPendingText,   bg: colors.statusPendingBg,   border: 'transparent' },
  confirmed: { label: 'EN PRÉPARATION',  color: colors.statusPendingText,   bg: colors.statusPendingBg,   border: 'transparent' },
  ready:     { label: 'PRÊTE',           color: colors.statusConfirmedText, bg: colors.statusConfirmedBg, border: 'transparent' },
  collected: { label: 'RÉCUPÉRÉE',       color: colors.textMuted,           bg: colors.tagNeutralBg,      border: 'transparent' },
  cancelled: { label: 'ANNULÉE',         color: colors.statusCancelledText, bg: colors.statusCancelledBg, border: 'transparent' },
};

// Une commande à emporter arrive pendant que le restaurateur a déjà l'écran sous
// les yeux : sans rechargement périodique il ne la voit jamais apparaître, seul le
// push l'avertit (constaté en test réel le 01/09/2026 chez Terraza).
const REFRESH_MS = 30000;

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

  // mode : 'initial' (écran de chargement) | 'refresh' (pull-to-refresh) |
  // 'silent' (rechargement de fond, aucun indicateur visible).
  const load = useCallback(async (mode = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else if (mode === 'initial') setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: ownerRows } = await supabase
        .from('restaurant_owners').select('restaurant_id')
        .eq('auth_id', session.user.id).limit(1);
      const rid = ownerRows?.[0]?.restaurant_id;
      if (!rid) return;
      setRestaurantId(rid);

      const { data, error } = await supabase
        .from('orders')
        .select('id, status, notes, total_amount, created_at, user_id, order_items(id, dish_name, price, quantity), users(first_name, last_name, phone)')
        .eq('restaurant_id', rid)
        .order('created_at', { ascending: false });
      // Un hoquet réseau ne doit pas vider la liste déjà affichée — d'autant que
      // ce chargement tourne maintenant en boucle en tâche de fond.
      if (error) return;
      setOrders(data ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    // Tant que l'écran est ouvert : relecture régulière, plus une relecture
    // immédiate au retour au premier plan (téléphone reverrouillé/déverrouillé).
    const timer = setInterval(() => load('silent'), REFRESH_MS);
    const sub   = AppState.addEventListener('change', st => { if (st === 'active') load('silent'); });
    return () => { clearInterval(timer); sub.remove(); };
  }, [load]));
  const onRefresh = useCallback(() => load('refresh'), [load]);

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
