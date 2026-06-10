import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_KEY   = Deno.env.get("RESEND_API_KEY");
const PLACES_KEY   = Deno.env.get("GOOGLE_PLACES_API_KEY") ?? "AIzaSyDItXI-VUjF5ONSzHuM8GVNJRPbDQUlzto";

const ADMIN_EMAIL = "red.zoubiri@gmail.com";
const BASE_URL    = "https://rghjgyzpdadapmktislv.supabase.co/functions/v1";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_KEY || !to) return;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "MIDA <noreply@mida-food.com>", to: [to], subject, html }),
  });
  if (!res.ok) console.error("[verify-restaurant] Resend:", await res.text());
}

function isValidAlgerianPhone(phone: string): boolean {
  const c = phone.replace(/[\s\-\(\)\.]/g, "");
  return /^(\+213|00213|0)(5|6|7|2|3|4)\d{7,8}$/.test(c);
}

function isLegitName(name: string): boolean {
  if (!name || name.trim().length < 3) return false;
  if (/^(test|aaa|bbb|xxx|123|abc|foo|bar|demo|fake|qwerty)/i.test(name)) return false;
  if (/(.)\1{4,}/.test(name)) return false;
  return true;
}

const ALGERIAN_CITIES = [
  "alger","oran","constantine","annaba","blida","batna","djelfa","setif","sétif",
  "sidi bel abbes","biskra","tebessa","el oued","skikda","tiaret","bejaia","béjaïa",
  "tlemcen","ouargla","bechar","mostaganem","chlef","tizi ouzou","medea","boumerdes",
  "tipaza","msila","ghardaia","relizane","saida","ain defla","souk ahras","khenchela",
  "bordj bou arreridj",
];

function isAlgerianCity(city: string): boolean {
  if (!city) return false;
  const norm = city.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return ALGERIAN_CITIES.some(c => {
    const nc = c.normalize("NFD").replace(/[̀-ͯ]/g, "");
    return norm.includes(nc) || nc.includes(norm);
  });
}

interface PlacesResult {
  found: boolean;
  name?: string;
  address?: string;
  rating?: number;
  reviews?: number;
  mapsUrl?: string;
}

async function searchGooglePlaces(restaurantName: string, city: string): Promise<PlacesResult> {
  if (!PLACES_KEY) return { found: false };
  try {
    const query = encodeURIComponent(`${restaurantName} restaurant ${city} Algérie`);
    const textRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&language=fr&region=dz&key=${PLACES_KEY}`
    );
    const textData = await textRes.json();
    if (textData.status !== "OK" || !textData.results?.length) {
      console.log("[verify-restaurant] Places status:", textData.status);
      return { found: false };
    }
    const place = textData.results[0];
    const result: PlacesResult = {
      found: true,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      reviews: place.user_ratings_total ?? 0,
    };
    if (place.place_id) {
      const detailRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=url&language=fr&key=${PLACES_KEY}`
      );
      const detailData = await detailRes.json();
      if (detailData.status === "OK") result.mapsUrl = detailData.result?.url;
    }
    return result;
  } catch (err) {
    console.error("[verify-restaurant] Places error:", err);
    return { found: false };
  }
}

function computeScore(place: PlacesResult, phone: string, name: string, city: string) {
  let score = 0;
  const breakdown: Record<string, number> = {};
  if (isLegitName(name))             { score += 10; breakdown.nom_legitime     = 10; }
  if (isAlgerianCity(city))          { score += 10; breakdown.ville_valide     = 10; }
  if (isValidAlgerianPhone(phone))   { score += 20; breakdown.telephone_valide = 20; }
  if (place.found) {
    score += 40; breakdown.trouve_sur_maps = 40;
    if ((place.reviews ?? 0) > 0) { score += 20; breakdown.a_des_avis = 20; }
  }
  return { score, breakdown };
}

async function autoApprove(row: Record<string, string>, requestId: string, userEmail: string) {
  const { data: ownerRow, error: ownerErr } = await admin
    .from("restaurant_owners")
    .upsert(
      { auth_id: row.user_id, email: userEmail, phone: row.phone,
        full_name: `${row.first_name} ${row.last_name}`, role: "owner" },
      { onConflict: "auth_id" }
    )
    .select("id").single();
  if (ownerErr) throw new Error("owner: " + ownerErr.message);

  const { data: existingResto } = await admin.from("restaurants").select("id").eq("owner_id", ownerRow.id).maybeSingle();
  let restoId: string;
  if (existingResto) {
    restoId = existingResto.id;
  } else {
    const { data: restoRow, error: restoErr } = await admin.from("restaurants").insert({
      owner_id: ownerRow.id, name: row.restaurant_name, cuisine_type: "autre",
      status: "active", address: row.address || "", quartier: "",
      phone: row.phone || "", city: (row.city?.trim() || "alger").toLowerCase(),
    }).select("id").single();
    if (restoErr) throw new Error("restaurant: " + restoErr.message);
    restoId = restoRow.id;
  }

  await admin.from("restaurant_owners").update({ restaurant_id: restoId }).eq("id", ownerRow.id);
  await admin.auth.admin.updateUserById(row.user_id, { app_metadata: { role: "manager" } });
  await admin.from("pro_requests").update({ status: "approved", verification_status: "auto_approved" }).eq("id", requestId);

  await sendEmail(
    userEmail,
    "Bienvenue sur MIDA — Votre compte est activé !",
    `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
      <h1 style="letter-spacing:4px;font-size:20px;color:#C8975A;">MIDA</h1>
      <h2 style="font-weight:300;">Félicitations, ${row.first_name} ! 🎉</h2>
      <p>Votre restaurant <strong>${row.restaurant_name}</strong> a été vérifié et votre compte activé automatiquement.</p>
      <p>Connectez-vous avec vos identifiants habituels pour accéder à votre tableau de bord professionnel.</p>
      <p style="color:#888;font-size:13px;">L'équipe MIDA</p>
    </div>`
  );
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const record  = payload.record ?? payload;
    const requestId = record?.id;
    if (!requestId) return new Response("missing id", { status: 400 });

    const { data: row } = await admin.from("pro_requests").select("*").eq("id", requestId).maybeSingle();
    if (!row || row.status !== "pending") return new Response("not pending", { status: 200 });

    const { data: authData } = await admin.auth.admin.getUserById(row.user_id);
    const userEmail = row.email || authData?.user?.email || "";

    // Acknowledgment email — envoyé immédiatement avant la vérification
    await sendEmail(
      userEmail,
      "MIDA — Votre demande est en cours de vérification",
      `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
        <h1 style="letter-spacing:4px;font-size:20px;">MIDA</h1>
        <h2 style="font-weight:300;">Demande reçue, ${row.first_name} !</h2>
        <p>Votre demande pour <strong>${row.restaurant_name}</strong> a bien été reçue.</p>
        <p>Nous vérifions votre établissement en ce moment. Vous recevrez une réponse dans les prochaines minutes.</p>
        <p style="color:#888;font-size:13px;">L'équipe MIDA</p>
      </div>`
    );

    // Vérification Google Places
    const place = await searchGooglePlaces(row.restaurant_name, row.city || "Alger");
    const { score, breakdown } = computeScore(place, row.phone || "", row.restaurant_name, row.city || "Alger");

    let verification_status: string;
    if (score >= 70)      verification_status = "auto_approved";
    else if (score >= 40) verification_status = "manual_review";
    else                  verification_status = "auto_rejected";

    await admin.from("pro_requests").update({
      verification_score: score,
      verification_status,
      verification_notes: { ...place, breakdown },
      verified_at: new Date().toISOString(),
    }).eq("id", requestId);

    if (verification_status === "auto_approved") {
      await autoApprove(row, requestId, userEmail);

    } else if (verification_status === "auto_rejected") {
      await admin.from("pro_requests").update({ status: "rejected" }).eq("id", requestId);
      await sendEmail(
        userEmail,
        "MIDA — Demande d'inscription",
        `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
          <h1 style="letter-spacing:4px;font-size:20px;">MIDA</h1>
          <h2 style="font-weight:300;">Demande non retenue</h2>
          <p>Bonjour ${row.first_name},</p>
          <p>Nous n'avons pas pu vérifier l'existence de <strong>${row.restaurant_name}</strong> à ${row.city || "Alger"} dans nos sources.</p>
          <p>Si vous pensez qu'il s'agit d'une erreur, contactez-nous à <a href="mailto:contact@mida-food.com">contact@mida-food.com</a> avec des justificatifs de votre établissement.</p>
          <p style="color:#888;font-size:13px;">L'équipe MIDA</p>
        </div>`
      );

    } else {
      // manual_review — email enrichi à l'admin
      const approveUrl = `${BASE_URL}/approve-pro?id=${requestId}&step=confirm`;
      const rejectUrl  = `${BASE_URL}/reject-pro?id=${requestId}&step=confirm`;

      const scoreRow = (label: string, pts: number) =>
        `<tr><td style="color:#888;padding:4px 8px;">${label}</td><td style="padding:4px 8px;color:#4CAF82;font-weight:bold;">+${pts}</td></tr>`;

      const mapsBlock = place.found
        ? `<div style="background:#f5f9f5;border-left:3px solid #4CAF82;padding:10px 14px;margin:14px 0;font-size:13px;">
            <b>📍 ${place.name}</b><br>
            <span style="color:#555;">${place.address}</span><br>
            ${place.rating ? `⭐ ${place.rating}/5 — ${place.reviews} avis` : "Aucun avis"}<br>
            ${place.mapsUrl ? `<a href="${place.mapsUrl}" style="color:#4CAF82;">Voir sur Google Maps →</a>` : ""}
          </div>`
        : `<div style="background:#fff5f5;border-left:3px solid #E05A5A;padding:10px 14px;margin:14px 0;font-size:13px;color:#c00;">
            ❌ Non trouvé sur Google Maps pour « ${row.restaurant_name} » à ${row.city || "Alger"}
          </div>`;

      await sendEmail(
        ADMIN_EMAIL,
        `[MIDA] Vérification requise — ${row.restaurant_name} (${score}/100)`,
        `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
          <h1 style="letter-spacing:4px;font-size:20px;color:#0F0D0B;">MIDA</h1>
          <h2 style="font-weight:400;">Inscription Pro — Décision manuelle requise</h2>

          <div style="background:#fffbe6;border-left:4px solid #C8975A;padding:10px 16px;margin:16px 0;">
            Score de vérification : <b>${score}/100</b> — seuil auto-approbation : 70
          </div>

          <table cellpadding="5" style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="color:#888;width:130px;">Candidat</td><td><b>${row.first_name} ${row.last_name}</b></td></tr>
            <tr><td style="color:#888;">Restaurant</td><td>${row.restaurant_name}</td></tr>
            <tr><td style="color:#888;">Ville</td><td>${row.city || "—"}</td></tr>
            <tr><td style="color:#888;">Téléphone</td><td>${row.phone || "—"}</td></tr>
            <tr><td style="color:#888;">Email</td><td>${userEmail || "—"}</td></tr>
            <tr><td style="color:#888;">Date</td><td>${new Date().toLocaleString("fr-FR")}</td></tr>
          </table>

          ${mapsBlock}

          <table style="font-size:13px;border-collapse:collapse;margin:12px 0;border:1px solid #eee;width:280px;">
            <tr style="background:#f9f9f9;"><td colspan="2" style="padding:6px 8px;font-weight:bold;">Détail du score</td></tr>
            ${Object.entries(breakdown).map(([k, v]) => scoreRow(k.replace(/_/g," "), v)).join("")}
            <tr style="border-top:1px solid #eee;"><td style="padding:6px 8px;font-weight:bold;">Total</td><td style="padding:6px 8px;font-weight:bold;">${score}/100</td></tr>
          </table>

          <div style="margin-top:24px;">
            <a href="${approveUrl}" style="display:inline-block;background:#4CAF82;color:white;padding:13px 30px;text-decoration:none;border-radius:6px;font-weight:bold;letter-spacing:1px;margin-right:10px;">✓ APPROUVER</a>
            <a href="${rejectUrl}"  style="display:inline-block;background:#E05A5A;color:white;padding:13px 30px;text-decoration:none;border-radius:6px;font-weight:bold;letter-spacing:1px;">✗ REFUSER</a>
          </div>
          <p style="color:#aaa;font-size:11px;margin-top:16px;">Liens à usage unique.</p>
        </div>`
      );
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("[verify-restaurant]", err);
    return new Response(String(err), { status: 500 });
  }
});
