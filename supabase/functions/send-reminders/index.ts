import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Infra ────────────────────────────────────────────────────────────────────

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const ULTRAMSG_INSTANCE = Deno.env.get("ULTRAMSG_INSTANCE_ID")!;
const ULTRAMSG_TOKEN    = Deno.env.get("ULTRAMSG_TOKEN")!;
const SITE_URL          = Deno.env.get("SITE_URL") ?? "https://mida-food.com";

type ReminderMode = "j1" | "h2";

// ── Helpers ──────────────────────────────────────────────────────────────────

function algerianToInternational(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("213")) return digits;
  if (digits.startsWith("0"))   return "213" + digits.slice(1);
  return "213" + digits;
}

function fmtTime(d: Date): string {
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}:00`;
}

// Retourne { dateStr, windowStart, windowEnd } pour le mode H-2.
// Algiers = UTC+1.
// Slot Algiers cible = now_utc + 3h  →  time_slot stocké en heure locale Algiers.
// Fenêtre ±15 min autour de la cible (le cron tourne toutes les 30 min).
function h2Window(): { dateStr: string; windowStart: string; windowEnd: string } {
  const nowMs    = Date.now();
  const algiers  = new Date(nowMs + 3_600_000);              // "aujourd'hui" côté Algiers
  const dateStr  = algiers.toISOString().split("T")[0];
  const center   = new Date(nowMs + 3 * 3_600_000);          // UTC + 3h = slot Algiers cible
  const wStart   = new Date(center.getTime() - 15 * 60_000); // − 15 min
  const wEnd     = new Date(center.getTime() + 15 * 60_000); // + 15 min
  return { dateStr, windowStart: fmtTime(wStart), windowEnd: fmtTime(wEnd) };
}

// Génère ou récupère le token self-service d'une réservation.
async function getOrCreateToken(
  resaId: string,
  date: string,
  timeSlot: string,
): Promise<string | null> {
  const expiresAt = new Date(
    `${date}T${timeSlot.slice(0, 5)}:00+01:00`,
  ).toISOString();

  // Récupérer un token valide existant
  const { data: existing } = await supabase
    .from("reservation_tokens")
    .select("token")
    .eq("reservation_id", resaId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.token) return existing.token;

  // Créer un nouveau token (le DEFAULT SQL génère les 12 chars hex)
  const { data: created } = await supabase
    .from("reservation_tokens")
    .insert({ reservation_id: resaId, expires_at: expiresAt })
    .select("token")
    .single();

  return created?.token ?? null;
}

async function sendWhatsApp(
  phone: string,
  message: string,
  reservationId: string,
): Promise<boolean> {
  try {
    const to   = algerianToInternational(phone);
    const body = new URLSearchParams({
      token: ULTRAMSG_TOKEN,
      to,
      body:  message,
    });
    const res  = await fetch(
      `https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body:    body.toString(),
      },
    );
    const json = await res.json();
    const ok   = json?.sent === true || res.ok;

    await supabase.from("notification_logs").insert({
      reservation_id: reservationId,
      channel:        "whatsapp",
      status:         ok ? "sent" : "failed",
      error_message:  ok ? null : JSON.stringify(json),
    });
    return ok;
  } catch (e) {
    await supabase.from("notification_logs").insert({
      reservation_id: reservationId,
      channel:        "whatsapp",
      status:         "failed",
      error_message:  String(e),
    });
    return false;
  }
}

async function sendPush(
  pushToken: string | null,
  title: string,
  body: string,
  reservationId: string,
): Promise<boolean> {
  if (!pushToken) return false;

  try {
    const res  = await fetch("https://exp.host/--/api/v2/push/send", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        to:    pushToken,
        title,
        body,
        data:  { reservation_id: reservationId },
      }),
    });
    const json = await res.json();
    const ok   = json?.data?.status === "ok" || res.ok;

    await supabase.from("notification_logs").insert({
      reservation_id: reservationId,
      channel:        "push",
      status:         ok ? "sent" : "failed",
      error_message:  ok ? null : JSON.stringify(json),
    });
    return ok;
  } catch (e) {
    await supabase.from("notification_logs").insert({
      reservation_id: reservationId,
      channel:        "push",
      status:         "failed",
      error_message:  String(e),
    });
    return false;
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const { mode = "j1" }: { mode?: ReminderMode } =
    await req.json().catch(() => ({}));

  try {
    // ── Construire la requête selon le mode ──────────────────────────────────
    const baseSelect = `
      id, date, time_slot, nb_adults, nb_children,
      users!user_id   (first_name, phone, expo_push_token),
      restaurants!restaurant_id (name)
    `;

    let reservations: Record<string, unknown>[] | null = null;
    let queryError: unknown = null;

    if (mode === "j1") {
      const tomorrow    = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("reservations")
        .select(baseSelect)
        .eq("date", tomorrowStr)
        .eq("status", "confirmed")
        .or("reminder_whatsapp_sent.eq.false,reminder_push_sent.eq.false");

      reservations = data;
      queryError   = error;
    } else {
      const { dateStr, windowStart, windowEnd } = h2Window();

      const { data, error } = await supabase
        .from("reservations")
        .select(baseSelect)
        .eq("date", dateStr)
        .eq("status", "confirmed")
        .gt("time_slot", windowStart)
        .lte("time_slot", windowEnd)
        .or("reminder_h2_whatsapp_sent.eq.false,reminder_h2_push_sent.eq.false");

      reservations = data;
      queryError   = error;
    }

    if (queryError) throw queryError;

    if (!reservations?.length) {
      return new Response(
        JSON.stringify({ ok: true, mode, processed: 0, message: "Aucune réservation à rappeler." }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    let processed = 0;

    for (const resa of reservations) {
      const user:       any = resa.users;
      const restaurant: any = resa.restaurants;

      const firstName      = user?.first_name    ?? "Cher client";
      const phone          = user?.phone          ?? "";
      const pushToken      = user?.expo_push_token ?? null;
      const restaurantName = restaurant?.name     ?? "votre restaurant";
      const timeSlot       = (resa.time_slot as string).slice(0, 5);
      const total          = (resa.nb_adults as number ?? 0) + (resa.nb_children as number ?? 0);

      // Générer ou récupérer le token self-service
      const selfToken = await getOrCreateToken(
        resa.id as string,
        resa.date as string,
        resa.time_slot as string,
      );
      const selfLink = selfToken ? `${SITE_URL}/r/${selfToken}` : null;
      const linkLine = selfLink
        ? `\nUn empêchement ? Modifiez ou annulez ici :\n${selfLink}`
        : "";

      // ── Messages selon le mode ───────────────────────────────────────────
      let waMsg: string;
      let pushTitle: string;
      let pushBody: string;

      if (mode === "j1") {
        waMsg =
          `Bonjour ${firstName} 👋\n` +
          `Rappel : votre réservation chez ${restaurantName} est demain à ${timeSlot} ` +
          `pour ${total} personne(s).` +
          linkLine +
          `\n\nÀ demain ! 🍽️\n— L'équipe Mida`;

        pushTitle = "Rappel Mida 🍽️";
        pushBody  = `Votre réservation chez ${restaurantName} est demain à ${timeSlot}`;
      } else {
        waMsg =
          `Bonjour ${firstName} 👋\n` +
          `Votre réservation chez ${restaurantName} est dans 2h à ${timeSlot} ` +
          `pour ${total} personne(s).` +
          linkLine +
          `\n\nÀ tout à l'heure ! 🍽️\n— L'équipe Mida`;

        pushTitle = "Dans 2h chez Mida 🍽️";
        pushBody  = `Votre table chez ${restaurantName} est à ${timeSlot} — à tout à l'heure !`;
      }

      // ── Envoi en parallèle (Promise.allSettled préservé) ─────────────────
      const [waResult, pushResult] = await Promise.allSettled([
        phone ? sendWhatsApp(phone, waMsg, resa.id as string) : Promise.resolve(false),
        sendPush(pushToken, pushTitle, pushBody, resa.id as string),
      ]);

      const waSent   = waResult.status   === "fulfilled" && waResult.value   === true;
      const pushSent = pushResult.status === "fulfilled" && pushResult.value === true;

      // Mise à jour des flags selon le mode
      const updates: Record<string, boolean> = {};
      if (mode === "j1") {
        if (waSent)   updates.reminder_whatsapp_sent = true;
        if (pushSent) updates.reminder_push_sent     = true;
      } else {
        if (waSent)   updates.reminder_h2_whatsapp_sent = true;
        if (pushSent) updates.reminder_h2_push_sent     = true;
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from("reservations").update(updates).eq("id", resa.id);
      }

      processed++;
      console.log(`[${mode}][${resa.id}] wa=${waSent} push=${pushSent} link=${!!selfLink}`);
    }

    return new Response(
      JSON.stringify({ ok: true, mode, processed }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

  } catch (e) {
    console.error(`send-reminders [${mode}] error:`, e);
    return new Response(
      JSON.stringify({ ok: false, mode, error: String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
