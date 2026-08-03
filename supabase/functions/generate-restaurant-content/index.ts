import Anthropic from "npm:@anthropic-ai/sdk";
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

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

const OCCASION_TAGS = ["famille", "couple", "business", "rapide"] as const;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    description: {
      type: "string",
      description: "Description accrocheuse du restaurant en français, 150 à 250 caractères.",
    },
    occasion_tags: {
      type: "array",
      items: { type: "string", enum: OCCASION_TAGS as unknown as string[] },
      description: "1 à 3 tags parmi la liste fournie, les plus pertinents pour ce restaurant.",
    },
  },
  required: ["description", "occasion_tags"],
  additionalProperties: false,
};

function reply(body: object, status = 200) {
  return new Response(
    JSON.stringify(body),
    { status, headers: { ...CORS, "Content-Type": "application/json" } },
  );
}

// ── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // ── 1. Auth : le caller doit être le pro du restaurant ───────────────────
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    if (!jwt) return reply({ ok: false, error: "Non autorisé." }, 401);

    const { data: { user }, error: authErr } = await admin.auth.getUser(jwt);
    if (authErr || !user) return reply({ ok: false, error: "Non autorisé." }, 401);

    const { restaurant_id } = await req.json();
    if (!restaurant_id) return reply({ ok: false, error: "restaurant_id requis." }, 400);

    const { data: ownerCheck } = await admin
      .from("restaurant_owners")
      .select("id")
      .eq("auth_id", user.id)
      .eq("restaurant_id", restaurant_id)
      .maybeSingle();

    if (!ownerCheck) return reply({ ok: false, error: "Accès refusé." }, 403);

    // ── 2. Charger les données du restaurant ─────────────────────────────────
    const { data: resto } = await admin
      .from("restaurants")
      .select("name, cuisine_type, city, quartier, neighborhood, avg_ticket, has_kids_menu, has_kids_chairs")
      .eq("id", restaurant_id)
      .maybeSingle();

    if (!resto) return reply({ ok: false, error: "Restaurant introuvable." }, 404);

    const { data: dishes } = await admin
      .from("dishes")
      .select("name")
      .eq("restaurant_id", restaurant_id)
      .eq("is_available", true)
      .limit(8);

    const dishNames = (dishes ?? []).map((d) => d.name).filter(Boolean);

    // ── 3. Construire le prompt ───────────────────────────────────────────────
    const facts = [
      `Nom : ${resto.name}`,
      resto.cuisine_type && `Type de cuisine : ${resto.cuisine_type}`,
      (resto.quartier || resto.neighborhood) && `Quartier : ${resto.quartier || resto.neighborhood}`,
      resto.city && `Ville : ${resto.city}`,
      resto.avg_ticket && `Ticket moyen : ${resto.avg_ticket} DA`,
      resto.has_kids_menu && `A un menu enfant`,
      resto.has_kids_chairs && `A des chaises hautes`,
      dishNames.length > 0 && `Quelques plats : ${dishNames.join(", ")}`,
    ].filter(Boolean).join("\n");

    const prompt =
      `Voici les informations disponibles sur un restaurant en Algérie :\n\n${facts}\n\n` +
      `Rédige une description accrocheuse en français (150 à 250 caractères) pour sa fiche ` +
      `dans une application de réservation, et choisis 1 à 3 tags d'occasion parmi : ` +
      `${OCCASION_TAGS.join(", ")}. N'invente aucune information qui ne figure pas ci-dessus.`;

    // ── 4. Appel Claude ────────────────────────────────────────────────────────
    const response = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: OUTPUT_SCHEMA },
      },
      messages: [{ role: "user", content: prompt }],
    });

    if (response.stop_reason !== "end_turn") {
      console.error("generate-restaurant-content: stop_reason=", response.stop_reason);
      return reply({ ok: false, error: "Génération IA indisponible pour cette fiche." }, 502);
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return reply({ ok: false, error: "Réponse IA invalide." }, 502);
    }

    const parsed = JSON.parse(textBlock.text) as {
      description: string;
      occasion_tags: string[];
    };

    // ── 5. Retourner la suggestion (jamais auto-sauvegardée) ─────────────────
    return reply({
      ok: true,
      description: parsed.description,
      occasion_tags: parsed.occasion_tags,
    });

  } catch (err) {
    console.error("generate-restaurant-content:", err);
    return reply({ ok: false, error: "Erreur interne." }, 500);
  }
});
