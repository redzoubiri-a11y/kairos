import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Infra ────────────────────────────────────────────────────────────────────
// Reçoit le webhook UltraMsg "message_received" (config manuelle côté dashboard
// UltraMsg -> Instance Settings -> Webhook, à faire par l'utilisateur) et passe
// prospection.statut à 'répondu' quand un restaurateur répond au message de
// revendication envoyé par scripts/send-prospection-whatsapp.js.

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Protection basique -- UltraMsg n'a pas de signature HMAC, seul un secret en
// query string sur l'URL du webhook (?key=...) permet de vérifier la source.
const WEBHOOK_SECRET = Deno.env.get("WHATSAPP_INBOUND_SECRET")!;

// Même normalisation que send-reminders/index.ts et scripts/send-prospection-whatsapp.js
// -- doit rester identique pour que le matching fonctionne dans les deux sens.
function algerianToInternational(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("213")) return digits;
  if (digits.startsWith("0")) return "213" + digits.slice(1);
  return "213" + digits;
}

type UltraMsgWebhook = {
  event_type?: string;
  data?: {
    from?: string;
    body?: string;
    fromMe?: boolean;
  };
};

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.searchParams.get("key") !== WEBHOOK_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  let payload: UltraMsgWebhook;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  // Ignore tout ce qui n'est pas un message entrant réel (statuts ack, messages
  // envoyés par l'instance elle-même, autres event_type comme "message_create").
  if (payload.event_type !== "message_received" || payload.data?.fromMe) {
    return new Response(JSON.stringify({ ok: true, ignored: true }), { status: 200 });
  }

  const fromRaw = payload.data?.from ?? ""; // format UltraMsg: "213XXXXXXXXX@c.us"
  const fromDigits = fromRaw.split("@")[0].replace(/\D/g, "");
  if (!fromDigits) {
    return new Response(JSON.stringify({ ok: true, matched: false, reason: "no_from" }), { status: 200 });
  }

  // Petite volumétrie (< 200 lignes avec téléphone) -- comparaison en mémoire
  // plutôt qu'un matching SQL sur des formats de téléphone hétérogènes en base.
  const { data: restaurants, error: restError } = await supabase
    .from("restaurants")
    .select("id, phone")
    .not("phone", "is", null)
    .neq("phone", "");
  if (restError) {
    return new Response(JSON.stringify({ ok: false, error: restError.message }), { status: 500 });
  }

  const match = (restaurants ?? []).find(
    (r) => algerianToInternational(r.phone) === fromDigits,
  );
  if (!match) {
    return new Response(JSON.stringify({ ok: true, matched: false, from: fromDigits }), { status: 200 });
  }

  // Ne rétrograde jamais un statut déjà avancé (accord/refus/sans_suite) --
  // seulement envoyé/cliqué -> répondu.
  const { data: prospectionRow } = await supabase
    .from("prospection")
    .select("id, statut, notes")
    .eq("restaurant_id", match.id)
    .in("statut", ["envoyé", "cliqué"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!prospectionRow) {
    return new Response(
      JSON.stringify({ ok: true, matched: true, restaurant_id: match.id, prospection_updated: false }),
      { status: 200 },
    );
  }

  // Ajoute au notes existant (garde le marqueur WHATSAPP_OK posé par
  // scripts/send-prospection-whatsapp.js -- ne jamais l'écraser, il évite un
  // double envoi si le script de campagne est relancé).
  const reply = payload.data?.body ? `Réponse WhatsApp: "${payload.data.body}"` : "Réponse WhatsApp reçue";
  const notes = `${prospectionRow.notes ? prospectionRow.notes + " | " : ""}${reply}`;
  await supabase
    .from("prospection")
    .update({ statut: "répondu", notes })
    .eq("id", prospectionRow.id);

  return new Response(
    JSON.stringify({ ok: true, matched: true, restaurant_id: match.id, prospection_updated: true }),
    { status: 200 },
  );
});
