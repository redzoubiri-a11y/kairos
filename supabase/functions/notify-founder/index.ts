import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Alerte fondateur : previent a chaque nouvelle reservation et a chaque
// nouvelle commande, sur WhatsApp et par email.
//
// Pourquoi : MIDA n'a aucune vue de supervision. Sans cette alerte, la
// premiere vraie reservation passe inapercue jusqu'a ce que quelqu'un pense a
// interroger la base a la main.
//
// Appelee par les triggers `alert_new_reservation` / `alert_new_order`
// (migration 20260828000000_founder_alerts.sql) via pg_net.
// Payload : { kind: "reservation" | "order", id: "<uuid>" }.
//
// Pas d'authentification entrante, comme `auto-approve-pro` et `send-reminders`
// qui sont appelees de la meme facon depuis pg_cron. Le seul effet possible
// d'un appel exterieur serait de renvoyer au fondateur une alerte pour une
// reservation existante, en devinant son UUID.
//
// Best-effort et volontairement tolerante : elle repond 200 meme quand un
// canal echoue. Un envoi rate ne doit jamais remonter jusqu'au trigger, sinon
// une alerte cassee ferait echouer la reservation elle-meme.
//
// Cote projet KAIROS, ULTRAMSG_INSTANCE_ID, ULTRAMSG_TOKEN et RESEND_API_KEY
// sont deja configures. ALERT_WHATSAPP_TO (numero du fondateur) ne l'est pas :
// ce repo etant public, le numero n'est pas ecrit en dur ici. Tant qu'il
// manque, seul l'email part — ce qui suffit aujourd'hui, l'instance WhatsApp
// etant sous examen. Pour activer le canal WhatsApp, poser cette variable :
//   npx supabase secrets set ALERT_WHATSAPP_TO=<numero> --project-ref rghjgyzpdadapmktislv

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const ULTRAMSG_INSTANCE = Deno.env.get("ULTRAMSG_INSTANCE_ID") ?? "";
const ULTRAMSG_TOKEN    = Deno.env.get("ULTRAMSG_TOKEN") ?? "";
const WHATSAPP_TO       = Deno.env.get("ALERT_WHATSAPP_TO") ?? "";
const RESEND_KEY        = Deno.env.get("RESEND_API_KEY") ?? "";
// Deja en dur ailleurs dans ce repo (verify-restaurant, send-report).
const EMAIL_TO          = Deno.env.get("ALERT_EMAIL_TO") ?? "red.zoubiri@gmail.com";

// ── Helpers ──────────────────────────────────────────────────────────────────

// Heure d'Alger (UTC+1, pas de changement d'heure).
function heureAlger(iso?: string | null): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleString("fr-FR", {
    timeZone: "Africa/Algiers",
    dateStyle: "short",
    timeStyle: "short",
  });
}

function jourFr(date: string): string {
  const [y, m, j] = date.split("-");
  return `${j}/${m}/${y}`;
}

function lieu(r: { quartier?: string | null; city?: string | null } | null): string {
  return [r?.quartier, r?.city].filter(Boolean).join(", ");
}

function personne(
  u: { first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null } | null,
): string {
  if (!u) return "client inconnu";
  const nom = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return nom || u.email || u.phone || "client inconnu";
}

// ── Composition des messages ─────────────────────────────────────────────────

type Alerte = { titre: string; whatsapp: string; lignes: string[] };

async function alerteReservation(id: string): Promise<Alerte | null> {
  const { data: r, error } = await supabase
    .from("reservations")
    .select(
      "date, time_slot, nb_adults, nb_children, notes, status, created_at, " +
      "restaurants(name, city, quartier, phone), " +
      "users(first_name, last_name, email, phone)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !r) {
    console.error("[alerte] reservation introuvable", id, error?.message);
    return null;
  }

  const resto = (r.restaurants ?? null) as { name?: string; city?: string; quartier?: string; phone?: string } | null;
  const client = (r.users ?? null) as { first_name?: string; last_name?: string; email?: string; phone?: string } | null;
  const couverts = (r.nb_adults ?? 0) + (r.nb_children ?? 0);
  const s = (n: number) => (n > 1 ? "s" : "");
  const detailCouverts = r.nb_children
    ? `${couverts} couverts (${r.nb_adults} adulte${s(r.nb_adults)}, ` +
      `${r.nb_children} enfant${s(r.nb_children)})`
    : `${couverts} couvert${s(couverts)}`;

  const lignes = [
    `Restaurant : ${resto?.name ?? "?"}${lieu(resto) ? ` — ${lieu(resto)}` : ""}`,
    `Quand : ${jourFr(r.date)} à ${String(r.time_slot).slice(0, 5)}`,
    `Couverts : ${detailCouverts}`,
    `Client : ${personne(client)}${client?.phone ? ` — ${client.phone}` : ""}`,
    `Statut : ${r.status}`,
    ...(r.notes ? [`Note du client : ${r.notes}`] : []),
    ...(resto?.phone ? [`Téléphone du restaurant : ${resto.phone}`] : []),
    `Réservée le ${heureAlger(r.created_at)} (Alger)`,
  ];

  const whatsapp =
    `🍽️ *Nouvelle réservation MIDA*\n\n` +
    `*${resto?.name ?? "?"}*${lieu(resto) ? `\n📍 ${lieu(resto)}` : ""}\n` +
    `📅 ${jourFr(r.date)} à ${String(r.time_slot).slice(0, 5)}\n` +
    `👥 ${detailCouverts}\n` +
    `👤 ${personne(client)}${client?.phone ? `\n📞 ${client.phone}` : ""}` +
    `${r.notes ? `\n📝 ${r.notes}` : ""}\n\n` +
    `Reçue le ${heureAlger(r.created_at)} (Alger)`;

  return { titre: `Nouvelle réservation — ${resto?.name ?? "?"}`, whatsapp, lignes };
}

async function alerteCommande(id: string): Promise<Alerte | null> {
  const { data: o, error } = await supabase
    .from("orders")
    .select(
      "status, mode, table_number, pickup_time, total_amount, notes, created_at, " +
      "restaurants(name, city, quartier, phone), " +
      "users(first_name, last_name, email, phone), " +
      "order_items(dish_name, quantity, price)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !o) {
    console.error("[alerte] commande introuvable", id, error?.message);
    return null;
  }

  const resto = (o.restaurants ?? null) as { name?: string; city?: string; quartier?: string; phone?: string } | null;
  const client = (o.users ?? null) as { first_name?: string; last_name?: string; email?: string; phone?: string } | null;
  const items = (o.order_items ?? []) as { dish_name: string; quantity: number; price: number }[];

  // Les order_items sont inseres apres la commande : au moment du trigger la
  // liste peut encore etre vide. On l'annonce plutot que d'afficher un blanc.
  const contenu = items.length
    ? items.map((i) => `${i.quantity}× ${i.dish_name}`).join(", ")
    : "(détail pas encore enregistré)";

  const ou = o.mode === "table"
    ? `sur place${o.table_number ? `, table ${o.table_number}` : ""}`
    : "à emporter";

  const lignes = [
    `Restaurant : ${resto?.name ?? "?"}${lieu(resto) ? ` — ${lieu(resto)}` : ""}`,
    `Contenu : ${contenu}`,
    `Total : ${o.total_amount ?? "?"} DA`,
    `Mode : ${ou}`,
    ...(o.pickup_time ? [`Retrait : ${String(o.pickup_time).slice(0, 5)}`] : []),
    `Client : ${personne(client)}${client?.phone ? ` — ${client.phone}` : ""}`,
    `Statut : ${o.status}`,
    ...(o.notes ? [`Note du client : ${o.notes}`] : []),
    `Commandée le ${heureAlger(o.created_at)} (Alger)`,
  ];

  const whatsapp =
    `🛍️ *Nouvelle commande MIDA*\n\n` +
    `*${resto?.name ?? "?"}*${lieu(resto) ? `\n📍 ${lieu(resto)}` : ""}\n` +
    `🧾 ${contenu}\n` +
    `💰 ${o.total_amount ?? "?"} DA — ${ou}\n` +
    `👤 ${personne(client)}${client?.phone ? `\n📞 ${client.phone}` : ""}` +
    `${o.notes ? `\n📝 ${o.notes}` : ""}\n\n` +
    `Reçue le ${heureAlger(o.created_at)} (Alger)`;

  return { titre: `Nouvelle commande — ${resto?.name ?? "?"}`, whatsapp, lignes };
}

// ── Canaux d'envoi ───────────────────────────────────────────────────────────

// UltraMsg repond 200 avec {"sent":"false"} en cas de refus applicatif, et un
// sent=true signifie "accepte et mis en file", jamais "livre" : si le compte
// WhatsApp est sous examen le message reste en 'queue' indefiniment. D'ou
// l'email, qui lui part toujours.
async function envoyerWhatsApp(texte: string): Promise<string> {
  if (!WHATSAPP_TO) return "ignoré (ALERT_WHATSAPP_TO non défini)";
  if (!ULTRAMSG_INSTANCE || !ULTRAMSG_TOKEN) return "ignoré (identifiants UltraMsg absents)";
  try {
    const res = await fetch(`https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: ULTRAMSG_TOKEN, to: WHATSAPP_TO, body: texte }).toString(),
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json().catch(() => null) as { sent?: unknown; id?: unknown } | null;
    if (!res.ok || String(json?.sent) !== "true") {
      return `refusé (${res.status} ${JSON.stringify(json)})`;
    }
    return `mis en file UltraMsg (id=${String(json?.id ?? "?")})`;
  } catch (err) {
    return `échec (${err instanceof Error ? err.message : String(err)})`;
  }
}

async function envoyerEmail(titre: string, lignes: string[]): Promise<string> {
  if (!RESEND_KEY || !EMAIL_TO) return "ignoré (secrets Resend absents)";

  const html =
    `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:520px;color:#191517">` +
    `<h2 style="font-size:18px;margin:0 0 14px">${titre}</h2>` +
    `<table style="border-collapse:collapse;width:100%;font-size:14px">` +
    lignes.map((l) => {
      const i = l.indexOf(" : ");
      const cle = i > 0 ? l.slice(0, i) : "";
      const val = i > 0 ? l.slice(i + 3) : l;
      return `<tr><td style="padding:6px 10px 6px 0;color:#6E6467;white-space:nowrap;vertical-align:top">${cle}</td>` +
             `<td style="padding:6px 0;font-weight:500">${val}</td></tr>`;
    }).join("") +
    `</table></div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "MIDA <noreply@mida-food.com>",
        to: [EMAIL_TO],
        subject: `MIDA — ${titre}`,
        html,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return `refusé (${res.status} ${await res.text().catch(() => "")})`;
    return "envoyé";
  } catch (err) {
    return `échec (${err instanceof Error ? err.message : String(err)})`;
  }
}

// ── Point d'entrée ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }
  const body = await req.json().catch(() => null) as { kind?: string; id?: string } | null;
  const kind = body?.kind;
  const id = body?.id;
  if (!id || (kind !== "reservation" && kind !== "order")) {
    return new Response("payload invalide", { status: 400 });
  }

  // Les order_items sont inseres juste apres la commande, donc apres le
  // trigger. On laisse la transaction se terminer avant de lire le detail,
  // sinon l'alerte annonce systematiquement une commande vide.
  if (kind === "order") await new Promise((r) => setTimeout(r, 2500));

  const alerte = kind === "reservation" ? await alerteReservation(id) : await alerteCommande(id);
  if (!alerte) {
    // La ligne a disparu (annulation immediate, suppression) : rien a signaler.
    return new Response(JSON.stringify({ ok: false, raison: "introuvable" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const [whatsapp, email] = await Promise.all([
    envoyerWhatsApp(alerte.whatsapp),
    envoyerEmail(alerte.titre, alerte.lignes),
  ]);

  console.log(`[alerte] ${kind} ${id} — WhatsApp: ${whatsapp} — email: ${email}`);

  return new Response(JSON.stringify({ ok: true, whatsapp, email }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
