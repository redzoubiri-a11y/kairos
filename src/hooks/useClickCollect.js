import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';

export default function useClickCollect(restaurantId) {
  const [dishes,  setDishes]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!restaurantId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('dishes')
        .select('id, name, description, price, category, is_available, photo')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .order('category');
      setDishes(data ?? []);
      setLoading(false);
    })();
  }, [restaurantId]);

  const submitOrder = useCallback(async (items, notes) => {
    if (!items || items.length === 0) return { error: 'Votre panier est vide.' };
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
      }).select('id').single();
      if (orderErr) return { error: orderErr.message };

      const rows = items.map(i => ({
        order_id: order.id, dish_id: i.dish_id, dish_name: i.name, price: i.price, quantity: i.quantity,
      }));
      const { error: itemsErr } = await supabase.from('order_items').insert(rows);
      if (itemsErr) return { error: itemsErr.message };

      try {
        await supabase.from('notifications').insert({
          recipient_id: userRow.id, recipient_type: 'user', type: 'new_order',
          title: 'Commande envoyée', body: 'Votre commande à emporter a été envoyée, en attente de confirmation du restaurant.',
        });
        supabase.functions.invoke('push-manager', {
          body: { user_id: userRow.id, title: 'Commande envoyée ✅', body: 'En attente de confirmation du restaurant.' },
        }).catch(() => {});

        const { data: ownerRows } = await supabase
          .from('restaurant_owners').select('auth_id')
          .eq('restaurant_id', restaurantId).limit(1);
        const owner = ownerRows?.[0] ?? null;
        if (owner?.auth_id) {
          const { data: mgr } = await supabase.from('users').select('id').eq('auth_id', owner.auth_id).maybeSingle();
          if (mgr) {
            await supabase.from('notifications').insert({
              recipient_id: mgr.id, recipient_type: 'user', type: 'new_order',
              title: 'Nouvelle commande 🛍️',
              body: `Commande à emporter · ${total.toLocaleString('fr-FR')} DA`,
            });
          }
        }
        supabase.functions.invoke('push-manager', {
          body: {
            restaurant_id: restaurantId,
            title: 'Nouvelle commande 🛍️',
            body: `Commande à emporter · ${total.toLocaleString('fr-FR')} DA`,
          },
        }).catch(() => {});
      } catch (_) {}

      return { orderId: order.id };
    } finally {
      setSubmitting(false);
    }
  }, [restaurantId]);

  return { dishes, loading, submitting, submitOrder };
}
