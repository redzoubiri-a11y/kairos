// Worker d'expédition des notifications.
//
// Les règles métier (§6.3, §10.4) décident *quand* chaque message doit
// partir et l'écrivent dans `notifications.sent_at`. Cette fonction se
// contente de vider la file arrivée à échéance : elle ne rejuge rien.
//
// À planifier toutes les 5 minutes (pg_cron + pg_net, ou un ordonnanceur
// externe). L'appel exige la clé de service.
//
// Un SMS dont `sent_at` est nul a été écarté par le quota journalier : il
// reste en base pour l'historique et ne part jamais.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendSms } from '../_shared/sms.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  body: string | null;
  data: Record<string, unknown> | null;
  channel: 'sms' | 'push' | 'email' | 'in_app';
};

/** Envoi via le service push d'Expo : pas de clé FCM/APNs à gérer. */
async function sendPush(tokens: string[], notification: Notification) {
  if (tokens.length === 0) return { ok: false, error: 'aucun appareil enregistré' };

  const messages = tokens.map((to) => ({
    to,
    sound: 'default',
    title: notification.title ?? 'Tasalle',
    body: notification.body ?? '',
    data: notification.data ?? {},
  }));

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    return { ok: false, error: `Expo ${response.status}: ${(await response.text()).slice(0, 200)}` };
  }

  // Expo répond 200 même quand un jeton individuel est invalide : il faut
  // inspecter chaque ticket pour savoir ce qui est réellement parti.
  const payload = await response.json();
  const tickets: Array<{ status: string; message?: string }> = payload?.data ?? [];
  const errors = tickets.filter((t) => t.status === 'error');

  if (errors.length === tickets.length && tickets.length > 0) {
    return { ok: false, error: errors[0].message ?? 'tous les jetons ont été rejetés' };
  }
  return { ok: true };
}

Deno.serve(async () => {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Environnement Supabase incomplet' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(url, serviceKey);

  const { data: pending, error } = await supabase.rpc('due_notifications', { p_limit: 100 });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const notifications: Notification[] = pending ?? [];
  let delivered = 0;
  let failed = 0;

  // Les jetons push sont relus une fois par destinataire, pas par message.
  const tokenCache = new Map<string, string[]>();
  const tokensFor = async (userId: string) => {
    if (!tokenCache.has(userId)) {
      const { data } = await supabase.rpc('push_tokens_of', { p_user: userId });
      tokenCache.set(userId, (data ?? []).map((row: unknown) =>
        typeof row === 'string' ? row : (row as { token: string }).token
      ));
    }
    return tokenCache.get(userId) ?? [];
  };

  for (const n of notifications) {
    let result: { ok: boolean; error?: string };

    if (n.channel === 'sms') {
      const { data: profile } = await supabase
        .from('users')
        .select('phone')
        .eq('id', n.user_id)
        .maybeSingle();

      result = profile?.phone
        ? await sendSms(profile.phone, n.body ?? '')
        : { ok: false, error: 'numéro de téléphone introuvable' };
    } else {
      result = await sendPush(await tokensFor(n.user_id), n);
    }

    if (result.ok) {
      await supabase.rpc('mark_notification_delivered', { p_id: n.id });
      delivered += 1;
    } else {
      // Trois tentatives au maximum : `due_notifications` cesse ensuite de
      // remonter le message, sans le supprimer.
      await supabase.rpc('mark_notification_failed', {
        p_id: n.id,
        p_error: result.error ?? 'erreur inconnue',
      });
      failed += 1;
    }
  }

  return new Response(
    JSON.stringify({ examined: notifications.length, delivered, failed, at: new Date().toISOString() }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
