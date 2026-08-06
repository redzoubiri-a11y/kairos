import { supabase } from '../../supabase';

// Chaque notification a deux canaux : une ligne in-app dans `notifications`
// et un push Expo via l'edge function `push-manager`. Les deux sont
// systématiquement envoyés ensemble — d'où ce helper unique, appelé par les
// hooks, plutôt qu'une paire insert + invoke recopiée à chaque site.
//
// Les échecs sont silencieux : une notification perdue ne doit jamais faire
// échouer l'action métier (confirmer une réservation, etc.).

async function insertRow(recipientId, type, title, body) {
  if (!recipientId) return;
  await supabase.from('notifications').insert({
    recipient_id:   recipientId,
    recipient_type: 'user',
    type,
    title,
    body,
  });
}

function push(reservationId, to, title, body, data) {
  return supabase.functions.invoke('push-manager', {
    body: { reservation_id: reservationId, to, title, body, data },
  });
}

// Notifie le client d'une réservation. `userId` est le `users.id` du client.
export async function notifyClient({ reservationId, userId, type, title, body, data }) {
  try { await insertRow(userId, type, title, body); } catch (_) {}
  try { await push(reservationId, 'client', title, body, data); } catch (_) {}
}

// Notifie le restaurant d'une réservation. Le compte destinataire de la ligne
// in-app est résolu depuis le propriétaire du restaurant.
export async function notifyRestaurant({ reservationId, restaurantId, type, title, body, data }) {
  try {
    const { data: owners } = await supabase
      .from('restaurant_owners').select('auth_id')
      .eq('restaurant_id', restaurantId).limit(1);
    const authId = owners?.[0]?.auth_id;
    if (authId) {
      const { data: mgr } = await supabase
        .from('users').select('id').eq('auth_id', authId).maybeSingle();
      await insertRow(mgr?.id, type, title, body);
    }
  } catch (_) {}
  try { await push(reservationId, 'restaurant', title, body, data); } catch (_) {}
}
