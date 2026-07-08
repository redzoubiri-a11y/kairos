import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Infra ────────────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL       = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY        = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ULTRAMSG_INSTANCE  = Deno.env.get("ULTRAMSG_INSTANCE_ID")!;
const ULTRAMSG_TOKEN_ENV = Deno.env.get("ULTRAMSG_TOKEN")!;
const SITE_URL           = Deno.env.get("SITE_URL") ?? "https://mida-food.com";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function algerianToInternational(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("213")) return digits;
  if (digits.startsWith("0"))   return "213" + digits.slice(1);
  return "213" + digits;
}

async function sendWhatsApp(phone: string, message: string): Promise<void> {
  const to   = algerianToInternational(phone);
  const body = new URLSearchParams({
    token: ULTRAMSG_TOKEN_ENV,
    to,
    body: message,
  });
  await fetch(
    `https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`,
    {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    body.toString(),
    },
  ).catch((err) => console.error("WhatsApp send failed:", err));
}

function reply(body: object, status = 200) {
  return new Response(
    JSON.stringify(body),
    { status, headers: { ...CORS, "Content-Type": "application/json" } },
  );
}

// ── Handler ──────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // ── 1. Auth : le caller doit être le pro du restaurant ───────────────────
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    if (!jwt) return reply({ ok: false, error: "Non autorisé." }, 401);

    const { data: { user }, error: authErr } = await admin.auth.getUser(jwt);
    if (authErr || !user) return reply({ ok: false, error: "Non autorisé." }, 401);

    // ── 2. Payload ───────────────────────────────────────────────────────────
    const { reservation_id, resend = false } = await req.json();
    if (!reservation_id) return reply({ ok: false, error: "reservation_id requis." }, 400);

    // ── 3. Charger la réservation avec client + restaurant ───────────────────
    const { data: resa } = await admin
      .from("reservations")
      .select(`
        id, date, time_slot, nb_adults, nb_children, status, restaurant_id, user_id,
        users!user_id (first_name, phone),
        restaurants!restaurant_id (name)
      `)
      .eq("id", reservation_id)
      .maybeSingle();

    if (!resa)
      return reply({ ok: false, error: "Réservation introuvable." }, 404);

    if (resa.status === "cancelled" || resa.status === "no_show")
      return reply({ ok: false, error: "Cette réservation est clôturée." }, 400);

    // ── 4. Vérifier que le caller est bien owner de ce restaurant ────────────
    const { data: ownerCheck } = await admin
      .from("restaurant_owners")
      .select("id")
      .eq("auth_id", user.id)
      .eq("restaurant_id", resa.restaurant_id)
      .maybeSingle();

    if (!ownerCheck)
      return reply({ ok: false, error: "Accès refusé." }, 403);

    // ── 5. Token existant valide ? (idempotent si resend = false) ────────────
    let token: string;
    let expiresAt: string;
    let reused = false;

    if (!resend) {
      const { data: existing } = await admin
        .from("reservation_tokens")
        .select("token, expires_at")
        .eq("reservation_id", reservation_id)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        token     = existing.token;
        expiresAt = existing.expires_at;
        reused    = true;
      }
    }

    // ── 6. Créer un nouveau token si nécessaire ──────────────────────────────
    if (!reused!) {
      // Expiry = datetime du créneau (Alger UTC+1) — inutile après le slot
      const slotIso = new Date(
        `${resa.date}T${resa.time_slot.slice(0, 5)}:00+01:00`,
      ).toISOString();

      const { data: tokenRow, error: tokenErr } = await admin
        .from("reservation_tokens")
        .insert({ reservation_id, expires_at: slotIso })
        .select("token, expires_at")
        .single();

      if (tokenErr || !tokenRow) {
        console.error("Token insert error:", tokenErr);
        return reply({ ok: false, error: "Erreur création du token." }, 500);
      }

      token     = tokenRow.token;
      expiresAt = tokenRow.expires_at;
    }

    // ── 7. Envoyer le lien WhatsApp au client ────────────────────────────────
    const link  = `${SITE_URL}/resa/${token!}`;
    const user_ = resa.users as { first_name: string; phone: string } | null;
    const resto = resa.restaurants as { name: string } | null;
    const phone = user_?.phone ?? null;

    if (phone) {
      const party     = (resa.nb_adults ?? 0) + (resa.nb_children ?? 0);
      const timeLabel = resa.time_slot.slice(0, 5);
      const prenom    = user_?.first_name ?? "cher client";
      const restoName = resto?.name ?? "le restaurant";

      const message =
        `Bonjour ${prenom} 👋\n` +
        `Voici votre lien pour gérer votre réservation chez ${restoName} ` +
        `(${resa.date} à ${timeLabel}, ${party} pers.) :\n` +
        `${link}\n\n` +
        `Depuis ce lien, vous pouvez annuler ou modifier votre réservation.` +
        `\n— L'équipe Mida`;

      await sendWhatsApp(phone, message);
    }

    return reply({
      ok:         true,
      token:      token!,
      link,
      expires_at: expiresAt!,
      sms_sent:   !!phone,
      reused,
    });

  } catch (err) {
    console.error("generate-token:", err);
    return reply({ ok: false, error: "Erreur interne." }, 500);
  }
});
