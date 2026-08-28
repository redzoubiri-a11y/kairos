import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';

export default function useClickCollect(restaurantId) {
  const [dishes,  setDishes]  = useState([]);
  const [waitTimeEstimates, setWaitTimeEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!restaurantId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const [{ data: dishRows }, { data: restoRow }] = await Promise.all([
        supabase.from('dishes')
          .select('id, name, description, price, category, is_available, photo')
          .eq('restaurant_id', restaurantId)
          .eq('is_available', true)
          // Du plus cher au moins cher dans chaque catégorie, comme sur la
          // fiche restaurant et dans l'espace pro. Les plats sans prix
          // ferment la marche.
          .order('category')
          .order('price', { ascending: false, nullsFirst: false }),
        supabase.from('restaurants').select('wait_time_estimates').eq('id', restaurantId).maybeSingle(),
      ]);
      setDishes(dishRows ?? []);
      setWaitTimeEstimates(restoRow?.wait_time_estimates ?? []);
      setLoading(false);
    })();
  }, [restaurantId]);

  // mode: 'pickup' | 'table' — tableNumber requis uniquement en mode 'table'
  // (miroir de la contrainte orders_table_number_check en base).
  const submitOrder = useCallback(async (items, notes, { mode = 'pickup', tableNumber = null } = {}) => {
    if (!items || items.length === 0) return { error: 'Votre panier est vide.' };
    if (mode === 'table' && !tableNumber) return { error: 'Indiquez votre numéro de table.' };
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Connectez-vous pour commander.' };
      const { data: userRow } = await supabase.from('users').select('id').eq('auth_id', user.id).maybeSingle();
      if (!userRow) return { error: 'Compte introuvable.' };

      const total = items.reduce((s, i) => s + i.quantity * i.price, 0);

      const { data: order, error: orderErr } = await supabase.from('orders').insert({
        restaurant_id: restaurantId,
        user_id: userRow.id,
        notes: notes?.trim() || null,
        total_amount: total,
        mode,
        table_number: mode === 'table' ? tableNumber : null,
      }).select('id').single();
      if (orderErr) return { error: orderErr.message };

      const rows = items.map(i => ({
        order_id: order.id, dish_id: i.dish_id, dish_name: i.name, price: i.price, quantity: i.quantity,
      }));
      const { error: itemsErr } = await supabase.from('order_items').insert(rows);
      if (itemsErr) return { error: itemsErr.message };

      const modeLabel = mode === 'table' ? `Table n°${tableNumber}` : 'à emporter';

      try {
        await supabase.from('notifications').insert({
          recipient_id: userRow.id, recipient_type: 'user', type: 'new_order',
          title: 'Commande envoyée', body: `Votre commande (${modeLabel}) a été envoyée, en attente de confirmation du restaurant.`,
        });
        supabase.functions.invoke('push-manager', {
          body: { user_id: userRow.id, title: 'Commande envoyée ✅', body: 'En attente de confirmation du restaurant.' },
        }).catch(() => {});

        const { data: ownerRows } = await supabase
          .from('restaurant_owners').select('auth_id')
          .eq('restaurant_id', restaurantId).limit(1);
        const owner = ownerRows?.[0] ?? null;
        if (owner?.auth_id) {
          // RPC dédiée (pas de lecture directe de `users`, verrouillée par RLS) —
          // cf. supabase/migrations/20260816_lock_down_users_pii.sql
          const { data: mgrId } = await supabase.rpc('get_user_id_by_auth', { p_auth_id: owner.auth_id });
          if (mgrId) {
            await supabase.from('notifications').insert({
              recipient_id: mgrId, recipient_type: 'user', type: 'new_order',
              title: 'Nouvelle commande 🛍️',
              body: `${modeLabel} · ${total.toLocaleString('fr-FR')} DA`,
            });
          }
        }
        supabase.functions.invoke('push-manager', {
          body: {
            restaurant_id: restaurantId,
            title: 'Nouvelle commande 🛍️',
            body: `${modeLabel} · ${total.toLocaleString('fr-FR')} DA`,
          },
        }).catch(() => {});
      } catch (_) {}

      return { orderId: order.id };
    } finally {
      setSubmitting(false);
    }
  }, [restaurantId]);

  return { dishes, waitTimeEstimates, loading, submitting, submitOrder };
}
