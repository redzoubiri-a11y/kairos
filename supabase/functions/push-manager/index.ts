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

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
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

// Un client et un restaurant sont « en relation » des qu'une reservation ou une
// commande les lie. Les deux tables portent les memes deux colonnes, d'ou la
// meme requete jouee deux fois plutot qu'un `or` sur une jointure.
async function relationExiste(userId: string | null, restaurantIds: string[]) {
  if (!userId || restaurantIds.length === 0) return false;

  const [resas, commandes] = await Promise.all([
    admin.from("reservations").select("id")
      .eq("user_id", userId).in("restaurant_id", restaurantIds).limit(1),
    admin.from("orders").select("id")
      .eq("user_id", userId).in("restaurant_id", restaurantIds).limit(1),
  ]);

  return (resas.data?.length ?? 0) > 0 || (commandes.data?.length ?? 0) > 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    if (!jwt) return reply({ ok: false, error: "Non autorise." }, 401);

    // L'authentification et la lecture du corps ne dependent pas l'une de l'autre.
    const [{ data: { user: caller }, error: authErr }, payload] = await Promise.all([
      admin.auth.getUser(jwt),
      req.json(),
    ]);
    if (authErr || !caller) return reply({ ok: false, error: "Non autorise." }, 401);

    const { restaurant_id, user_id, title, body, data } = payload;
    if (!title || !body) {
      return reply({ ok: false, error: "title et body requis" }, 400);
    }
    if (!restaurant_id && !user_id) {
      return reply({ ok: false, error: "restaurant_id ou user_id requis" }, 400);
    }

    // Qui appelle : sa ligne `users` d'un cote, les restaurants qu'il possede
    // de l'autre. Un compte peut n'etre ni l'un ni l'autre.
    const [{ data: appelant }, { data: possedes }] = await Promise.all([
      admin.from("users").select("id").eq("auth_id", caller.id).maybeSingle(),
      admin.from("restaurant_owners").select("restaurant_id").eq("auth_id", caller.id),
    ]);
    const appelantId: string | null = appelant?.id ?? null;
    const mesRestaurants: string[] = (possedes ?? [])
      .map((r: { restaurant_id: string | null }) => r.restaurant_id)
      .filter((id): id is string => Boolean(id));

    const tokens: string[] = [];

    // Notifier le restaurateur : l'appelant doit posseder ce restaurant, ou y
    // avoir reserve / commande.
    if (restaurant_id) {
      const autorise = mesRestaurants.includes(restaurant_id)
        || await relationExiste(appelantId, [restaurant_id]);
      if (!autorise) return reply({ ok: false, error: "Acces refuse." }, 403);

      const { data: owner } = await admin
        .from("restaurant_owners")
        .select("push_token")
        .eq("restaurant_id", restaurant_id)
        .not("push_token", "is", null)
        .maybeSingle();
      if (owner?.push_token) tokens.push(owner.push_token);
    }

    // Notifier un client : l'appelant doit etre ce client, ou le restaurateur
    // d'un etablissement ou ce client a reserve / commande.
    if (user_id) {
      const autorise = user_id === appelantId
        || await relationExiste(user_id, mesRestaurants);
      if (!autorise) return reply({ ok: false, error: "Acces refuse." }, 403);

      const { data: user } = await admin
        .from("users")
        .select("push_token")
        .eq("id", user_id)
        .not("push_token", "is", null)
        .maybeSingle();
      if (user?.push_token) tokens.push(user.push_token);
    }

    const pushResult = await sendExpoPush(tokens, title, body, data);

    return reply({ ok: true, ...pushResult });
  } catch (err) {
    // Le detail part dans les logs, pas dans la reponse.
    console.error("push-manager:", err);
    return reply({ ok: false, error: "Erreur interne." }, 500);
  }
});
