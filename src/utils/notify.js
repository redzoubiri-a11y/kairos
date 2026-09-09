import { supabase } from '../../supabase';

// Chaque notification a deux canaux : une ligne in-app dans `notifications`
// et un push Expo via l'edge function `push-manager`. Les deux sont
// systématiquement envoyés ensemble — d'où ce helper unique, appelé par les
// hooks, plutôt qu'une paire insert + invoke recopiée à chaque site (onze
// fois, dans cinq hooks, au dernier compte).
//
// Contrat de push-manager : { user_id, title, body, data? } pour un client,
// { restaurant_id, title, body, data? } pour un restaurant — celui posé par
// la PR #20, qui dérive l'autorisation de la relation réservation/commande
// plutôt que d'un reservation_id explicite. Ce fichier n'introduit pas un
// second contrat : il factorise l'existant.
//
// Les échecs sont silencieux : une notification perdue ne doit jamais faire
// échouer l'action métier (confirmer une réservation, envoyer une commande).

async function insertRow(recipientId, type, title, body) {
  if (!recipientId) return;
  try {
    await supabase.from('notifications').insert({
      recipient_id:   recipientId,
      recipient_type: 'user',
      type,
      title,
      body,
    });
  } catch (_) {}
}

function pushClient(userId, title, body, data) {
  return supabase.functions.invoke('push-manager', {
    body: { user_id: userId, title, body, data },
  }).catch(() => {});
}

function pushRestaurant(restaurantId, title, body, data) {
  return supabase.functions.invoke('push-manager', {
    body: { restaurant_id: restaurantId, title, body, data },
  }).catch(() => {});
}

// Notifie un client. `userId` est le `users.id` du client, pas son `auth_id` —
// c'est ce que possèdent déjà tous les appelants (réservation ou commande).
export async function notifyClient({ userId, type, title, body, data }) {
  await insertRow(userId, type, title, body);
  await pushClient(userId, title, body, data);
}

// Notifie le restaurateur d'un établissement. Le compte destinataire de la
// ligne in-app est résolu depuis le propriétaire du restaurant, via une RPC
// dédiée plutôt qu'une lecture directe de `users` — verrouillée par RLS
// depuis 20260816_lock_down_users_pii.sql. Un restaurant sans propriétaire
// résolu ne reçoit que le push, jamais la ligne in-app : c'était déjà le
// comportement avant ce helper.
export async function notifyRestaurant({ restaurantId, type, title, body, data }) {
  try {
    const { data: owners } = await supabase
      .from('restaurant_owners').select('auth_id')
      .eq('restaurant_id', restaurantId).limit(1);
    const authId = owners?.[0]?.auth_id;
    if (authId) {
      const { data: mgrId } = await supabase.rpc('get_user_id_by_auth', { p_auth_id: authId });
      await insertRow(mgrId, type, title, body);
    }
  } catch (_) {}
  await pushRestaurant(restaurantId, title, body, data);
}
