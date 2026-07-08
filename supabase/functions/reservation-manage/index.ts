import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Infra ────────────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ── Helpers ──────────────────────────────────────────────────────────────────

// Algiers = UTC+1 toute l'année (pas de DST)
function slotToUtc(date: string, timeSlot: string): Date {
  return new Date(`${date}T${timeSlot.slice(0, 5)}:00+01:00`);
}

function hoursUntil(dt: Date): number {
  return (dt.getTime() - Date.now()) / (1000 * 60 * 60);
}

async function pushOwner(
  pushToken: string | null,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
): Promise<void> {
  if (!pushToken?.startsWith("ExponentPushToken")) return;
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([{ to: pushToken, title, body, data, sound: "default" }]),
  }).catch(() => {});
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
    const { token, reservation_id, action, payload = {} } = await req.json();

    if (!action || !["cancel", "modify_time", "modify_party"].includes(action))
      return reply({ status: "refused", reason: "Action non reconnue." });

    let resaId: string;
    let source: "web" | "app";

    // ── Chemin A : token web (page self-service) ─────────────────────────────
    if (token) {
      const { data: tokenRow } = await admin
        .from("reservation_tokens")
        .select("reservation_id, expires_at")
        .eq("token", token)
        .maybeSingle();

      if (!tokenRow)
        return reply({ status: "refused", reason: "Token invalide." }, 403);

      if (new Date(tokenRow.expires_at) <= new Date())
        return reply({ status: "refused", reason: "Ce lien a expiré." }, 403);

      resaId = tokenRow.reservation_id;
      source = "web";

    // ── Chemin B : JWT app (supabase.functions.invoke depuis l'app) ──────────
    } else if (reservation_id) {
      const authHeader = req.headers.get("Authorization") ?? "";
      if (!authHeader.startsWith("Bearer "))
        return reply({ status: "refused", reason: "Authentification requise." }, 401);

      const jwt = authHeader.slice(7);

      // Vérifier le JWT et récupérer l'utilisateur
      const { data: { user }, error: jwtErr } = await admin.auth.getUser(jwt);
      if (jwtErr || !user)
        return reply({ status: "refused", reason: "Token d'authentification invalide." }, 401);

      // Trouver le user_id interne (table users, pas auth.users)
      const { data: userRow } = await admin
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (!userRow)
        return reply({ status: "refused", reason: "Utilisateur introuvable." }, 403);

      // Vérifier que la réservation appartient bien à cet utilisateur
      const { data: ownerCheck } = await admin
        .from("reservations")
        .select("id")
        .eq("id", reservation_id)
        .eq("user_id", userRow.id)
        .maybeSingle();

      if (!ownerCheck)
        return reply({ status: "refused", reason: "Réservation introuvable ou accès non autorisé." }, 403);

      resaId = reservation_id;
      source = "app";

    } else {
      return reply({ status: "refused", reason: "Paramètre token ou reservation_id requis." });
    }

    // ── Charger la réservation ───────────────────────────────────────────────
    const { data: resa } = await admin
      .from("reservations")
      .select("id, restaurant_id, user_id, date, time_slot, nb_adults, nb_children, status")
      .eq("id", resaId)
      .maybeSingle();

    if (!resa)
      return reply({ status: "refused", reason: "Réservation introuvable." });

    if (resa.status === "cancelled")
      return reply({ status: "refused", reason: "Cette réservation est déjà annulée." });

    if (resa.status === "arrived" || resa.status === "no_show")
      return reply({ status: "refused", reason: "Cette réservation est clôturée et ne peut plus être modifiée." });

    // ── Charger les policies (avec valeurs par défaut si absentes) ───────────
    const { data: policy } = await admin
      .from("reservation_policies")
      .select("*")
      .eq("restaurant_id", resa.restaurant_id)
      .maybeSingle();

    const p = {
      min_cancel_hours:   policy?.min_cancel_hours   ?? 2,
      min_modify_hours:   policy?.min_modify_hours   ?? 2,
      max_modifications:  policy?.max_modifications  ?? 2,
      max_party_increase: policy?.max_party_increase ?? 4,
      allow_self_cancel:  policy?.allow_self_cancel  ?? true,
    };

    const hoursToSlot = hoursUntil(slotToUtc(resa.date, resa.time_slot));

    const { data: ownerRow } = await admin
      .from("restaurant_owners")
      .select("push_token")
      .eq("restaurant_id", resa.restaurant_id)
      .maybeSingle();
    const ownerPush = ownerRow?.push_token ?? null;

    const slotLabel = `${resa.date} à ${resa.time_slot.slice(0, 5)}`;

    // ── CANCEL ───────────────────────────────────────────────────────────────
    if (action === "cancel") {
      if (!p.allow_self_cancel)
        return reply({
          status: "refused",
          reason: "L'annulation en ligne n'est pas disponible pour ce restaurant. Contactez-les directement.",
        });

      if (hoursToSlot < p.min_cancel_hours)
        return reply({
          status: "refused",
          reason: `L'annulation n'est plus possible à moins de ${p.min_cancel_hours}h du créneau.`,
        });

      await admin.from("reservations")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", resaId);

      await admin.from("reservation_modifications").insert({
        reservation_id: resaId,
        action: "cancel",
        old_value: { status: resa.status },
        new_value: { status: "cancelled" },
        source,
      });

      await pushOwner(
        ownerPush,
        "Réservation annulée",
        `Annulation reçue pour le ${slotLabel} (${resa.nb_adults + resa.nb_children} pers.).`,
        { reservation_id: resaId },
      );

      return reply({ status: "ok" });
    }

    // ── Compte des modifications déjà appliquées ─────────────────────────────
    const { data: pastMods } = await admin
      .from("reservation_modifications")
      .select("id")
      .eq("reservation_id", resaId)
      .in("action", ["modify_time", "modify_party"]);

    const modCount = pastMods?.length ?? 0;

    // ── MODIFY_TIME ──────────────────────────────────────────────────────────
    if (action === "modify_time") {
      const { date: newDate, time_slot: newSlot } = payload as {
        date?: string;
        time_slot?: string;
      };

      if (!newDate || !newSlot)
        return reply({ status: "refused", reason: "Paramètres date et time_slot requis." });

      if (hoursToSlot < p.min_modify_hours)
        return reply({
          status: "refused",
          reason: `La modification n'est plus possible à moins de ${p.min_modify_hours}h du créneau actuel.`,
        });

      if (modCount >= p.max_modifications)
        return reply({
          status: "refused",
          reason: `Vous avez atteint la limite de ${p.max_modifications} modification(s) autorisée(s) pour cette réservation.`,
        });

      const { data: cap } = await admin.rpc("check_capacity", {
        p_restaurant_id:   resa.restaurant_id,
        p_date:            newDate,
        p_time_slot:       newSlot,
        p_party_size:      resa.nb_adults + resa.nb_children,
        p_exclude_resa_id: resaId,
      });

      if (cap && !cap.unconfigured && !cap.available)
        return reply({
          status: "refused",
          reason: `Ce créneau est complet (${cap.seats_left ?? 0} place(s) disponible(s)). Veuillez choisir un autre horaire.`,
        });

      await admin.from("reservations")
        .update({ date: newDate, time_slot: newSlot })
        .eq("id", resaId);

      await admin.from("reservation_modifications").insert({
        reservation_id: resaId,
        action: "modify_time",
        old_value: { date: resa.date, time_slot: resa.time_slot },
        new_value: { date: newDate, time_slot: newSlot },
        source,
      });

      await pushOwner(
        ownerPush,
        "Réservation modifiée",
        `Un client a déplacé sa réservation du ${slotLabel} au ${newDate} à ${newSlot.slice(0, 5)}.`,
        { reservation_id: resaId },
      );

      return reply({ status: "ok" });
    }

    // ── MODIFY_PARTY ─────────────────────────────────────────────────────────
    if (action === "modify_party") {
      const { nb_adults: rawAdults, nb_children: rawChildren } = payload as {
        nb_adults?: number;
        nb_children?: number;
      };

      if (rawAdults === undefined)
        return reply({ status: "refused", reason: "Paramètre nb_adults requis." });

      const newAdults   = Math.max(1, Math.floor(rawAdults));
      const newChildren = Math.max(0, Math.floor(rawChildren ?? 0));
      const oldParty    = resa.nb_adults + resa.nb_children;
      const newParty    = newAdults + newChildren;
      const increase    = newParty - oldParty;

      if (newAdults === resa.nb_adults && newChildren === resa.nb_children)
        return reply({ status: "refused", reason: "Aucune modification détectée." });

      if (increase > p.max_party_increase) {
        await pushOwner(
          ownerPush,
          "Demande à valider",
          `Un client souhaite passer de ${oldParty} à ${newParty} couverts le ${slotLabel}. Contactez-le pour confirmer.`,
          {
            reservation_id: resaId,
            pending_action: "modify_party",
            nb_adults: newAdults,
            nb_children: newChildren,
          },
        );

        return reply({
          status: "pending_validation",
          reason: `L'ajout de plus de ${p.max_party_increase} couverts supplémentaires doit être validé par le restaurant. Il a été notifié et vous recontactera.`,
        });
      }

      if (modCount >= p.max_modifications)
        return reply({
          status: "refused",
          reason: `Vous avez atteint la limite de ${p.max_modifications} modification(s) autorisée(s).`,
        });

      await admin.from("reservations")
        .update({ nb_adults: newAdults, nb_children: newChildren })
        .eq("id", resaId);

      await admin.from("reservation_modifications").insert({
        reservation_id: resaId,
        action: "modify_party",
        old_value: { nb_adults: resa.nb_adults, nb_children: resa.nb_children },
        new_value: { nb_adults: newAdults, nb_children: newChildren },
        source,
      });

      await pushOwner(
        ownerPush,
        "Réservation modifiée",
        `${oldParty} → ${newParty} couverts le ${slotLabel}.`,
        { reservation_id: resaId },
      );

      return reply({ status: "ok" });
    }

    return reply({ status: "refused", reason: "Action non traitée." });

  } catch (err) {
    console.error("reservation-manage:", err);
    return new Response(
      JSON.stringify({ status: "refused", reason: "Erreur interne." }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
