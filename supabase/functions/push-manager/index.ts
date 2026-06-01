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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { restaurant_id, user_id, title, body, data } = await req.json();

    if (!title || !body) {
      return new Response(
        JSON.stringify({ ok: false, error: "title et body requis" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const tokens: string[] = [];

    // Notifier le restaurateur (par restaurant_id)
    if (restaurant_id) {
      const { data: owner } = await admin
        .from("restaurant_owners")
        .select("push_token")
        .eq("restaurant_id", restaurant_id)
        .not("push_token", "is", null)
        .maybeSingle();
      if (owner?.push_token) tokens.push(owner.push_token);
    }

    // Notifier le client (par users.id)
    if (user_id) {
      const { data: user } = await admin
        .from("users")
        .select("push_token")
        .eq("id", user_id)
        .not("push_token", "is", null)
        .maybeSingle();
      if (user?.push_token) tokens.push(user.push_token);
    }

    const pushResult = await sendExpoPush(tokens, title, body, data);

    return new Response(
      JSON.stringify({ ok: true, ...pushResult }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
