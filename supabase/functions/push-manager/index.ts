import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function reply(body: object, status = 200) {
  return new Response(
    JSON.stringify(body),
    { status, headers: { ...CORS, "Content-Type": "application/json" } },
  );
}

async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  const valid = tokens.filter(t => t?.startsWith("ExponentPushToken"));
  if (valid.length === 0) return { sent: 0 };

  const messages = valid.map(to => ({
    to,
    title,
    body,
    data: data ?? {},
    sound: "default",
    badge: 1,
    channelId: "default",
  }));

  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  const result = await res.json().catch(() => ({}));
  return { sent: valid.length, result };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    if (!jwt) return reply({ ok: false, error: "Non autorisé." }, 401);

    // Auth et parsing du corps sont indépendants
    const [{ data: { user: caller }, error: authErr }, payload] = await Promise.all([
      admin.auth.getUser(jwt),
      req.json(),
    ]);
    if (authErr || !caller) return reply({ ok: false, error: "Non autorisé." }, 401);

    const { reservation_id, to, title, body, data } = payload;
    if (!reservation_id || !title || !body) {
      return reply({ ok: false, error: "reservation_id, title et body requis" }, 400);
    }
    if (to !== "client" && to !== "restaurant") {
      return reply({ ok: false, error: "to doit valoir 'client' ou 'restaurant'" }, 400);
    }

    // Le destinataire est dérivé de la réservation, jamais fourni par l'appelant.
    const { data: resa } = await admin
      .from("reservations")
      .select("id, restaurant_id, users!user_id (auth_id, push_token)")
      .eq("id", reservation_id)
      .maybeSingle();
    if (!resa) return reply({ ok: false, error: "Réservation introuvable." }, 404);

    const client = resa.users as { auth_id: string; push_token: string | null } | null;

    const { data: owners } = await admin
      .from("restaurant_owners")
      .select("auth_id, push_token")
      .eq("restaurant_id", resa.restaurant_id);

    // Seuls le client de la réservation et les propriétaires du restaurant
    // peuvent déclencher une notification sur cette réservation.
    const isClient = client?.auth_id === caller.id;
    const isOwner  = (owners ?? []).some(o => o.auth_id === caller.id);
    if (!isClient && !isOwner) return reply({ ok: false, error: "Accès refusé." }, 403);

    const token = to === "client"
      ? client?.push_token
      : (owners ?? []).find(o => o.push_token)?.push_token;

    const pushResult = await sendExpoPush(token ? [token] : [], title, body, data);

    return reply({ ok: true, ...pushResult });
  } catch (err) {
    console.error("push-manager:", err);
    return reply({ ok: false, error: "Erreur interne." }, 500);
  }
});
