import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY     = Deno.env.get("SUPABASE_ANON_KEY")!;
const RESEND_KEY   = Deno.env.get("RESEND_API_KEY");

const FUNCTIONS_URL = `${SUPABASE_URL.replace("https://", "https://")}/functions/v1`;
const ADMIN_EMAIL   = "red.zoubiri@gmail.com";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "MIDA <onboarding@resend.dev>", to: [to], subject, html }),
  }).catch(() => {});
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non authentifié");

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Utilisateur introuvable");

    const { nom, prenom, restaurant, adresse, ville, telephone, email } = await req.json();

    // Find the pending pro_request just inserted by the app
    const { data: reqRow } = await admin
      .from("pro_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!reqRow) throw new Error("Demande introuvable");

    const approveUrl = `${FUNCTIONS_URL}/approve-pro?id=${reqRow.id}`;
    const rejectUrl  = `${FUNCTIONS_URL}/reject-pro?id=${reqRow.id}`;

    // Email to admin with approve/reject buttons
    await sendEmail(
      ADMIN_EMAIL,
      `Nouvelle demande PRO — ${restaurant} (${ville})`,
      `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
        <h1 style="letter-spacing:4px;font-size:20px;color:#0F0D0B;">MIDA</h1>
        <h2 style="font-size:18px;">Nouvelle demande restaurateur</h2>
        <table cellpadding="8" style="border-collapse:collapse;width:100%;margin:16px 0;">
          <tr><td style="color:#888;width:130px;">Prénom</td><td><b>${prenom}</b></td></tr>
          <tr><td style="color:#888;">Nom</td><td><b>${nom}</b></td></tr>
          <tr><td style="color:#888;">Restaurant</td><td><b>${restaurant}</b></td></tr>
          <tr><td style="color:#888;">Ville</td><td>${ville || "—"}</td></tr>
          <tr><td style="color:#888;">Téléphone</td><td>${telephone}</td></tr>
          <tr><td style="color:#888;">Adresse</td><td>${adresse || "—"}</td></tr>
          <tr><td style="color:#888;">Email</td><td>${email}</td></tr>
          <tr><td style="color:#888;">Date</td><td>${new Date().toLocaleString("fr-FR")}</td></tr>
        </table>
        <div style="display:flex;gap:16px;margin-top:24px;">
          <a href="${approveUrl}" style="display:inline-block;background:#4CAF82;color:white;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;letter-spacing:1px;">✓ APPROUVER</a>
          &nbsp;&nbsp;
          <a href="${rejectUrl}" style="display:inline-block;background:#E05A5A;color:white;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;letter-spacing:1px;">✗ REFUSER</a>
        </div>
        <p style="color:#aaa;font-size:12px;margin-top:24px;">Ces liens sont à usage unique.</p>
      </div>
      `,
    );

    // Acknowledgment email to applicant
    await sendEmail(
      email,
      "MIDA — Votre demande est en cours d'examen",
      `
      <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
        <h1 style="letter-spacing:4px;font-size:20px;">MIDA</h1>
        <h2>Demande reçue, ${prenom} !</h2>
        <p>Votre demande d'inscription pour <strong>${restaurant}</strong> a bien été reçue.</p>
        <p>Notre équipe l'examine et vous recevrez une réponse par email dans les 24h.</p>
        <p style="color:#888;font-size:13px;">L'équipe MIDA</p>
      </div>
      `,
    );

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
