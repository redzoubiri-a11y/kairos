import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_KEY   = Deno.env.get("RESEND_API_KEY");

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BASE_URL = "https://rghjgyzpdadapmktislv.supabase.co/functions/v1";

function txt(body: string): Response {
  return new Response(body + "\n", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function html(title: string, content: string): Response {
  return new Response(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MIDA</title><style>body{font-family:Georgia,serif;background:#0F0D0B;color:#F5F0EB;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}div{max-width:480px;padding:40px;text-align:center}h1{letter-spacing:6px;font-size:18px;color:#C8975A;margin-bottom:8px}h2{font-weight:300;font-size:22px;margin:0 0 24px}table{width:100%;text-align:left;border-collapse:collapse;margin:0 0 32px}td{padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.07);font-size:14px}td:first-child{color:#888;width:120px}a.btn{display:inline-block;background:#E05A5A;color:white;padding:14px 40px;text-decoration:none;border-radius:8px;font-weight:bold;letter-spacing:2px;font-size:15px}p.note{color:#555;font-size:12px;margin-top:24px}p.done{font-size:18px;margin:16px 0}</style></head><body><div>${content}</div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
  );
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const requestId = url.searchParams.get("id");
  const step = url.searchParams.get("step");

  if (!requestId) return txt("MIDA\n\nErreur : identifiant manquant.");

  const { data: row } = await admin.from("pro_requests").select("*").eq("id", requestId).single();
  if (!row) return txt("MIDA\n\nDemande introuvable ou deja traitee.");
  if (row.status !== "pending") return txt("MIDA\n\nCette demande a deja ete traitee : " + row.status);

  if (step !== "confirm") {
    const confirmUrl = BASE_URL + "/reject-pro?id=" + requestId + "&step=confirm";
    return html("Refuser", `
      <h1>MIDA</h1>
      <h2>Refuser cette demande ?</h2>
      <table>
        <tr><td>Nom</td><td>${row.first_name} ${row.last_name}</td></tr>
        <tr><td>Restaurant</td><td>${row.restaurant_name}</td></tr>
        <tr><td>Ville</td><td>${row.city || "—"}</td></tr>
      </table>
      <a class="btn" href="${confirmUrl}">✗ CONFIRMER LE REFUS</a>
      <p class="note">Fermez cette fenêtre pour annuler.</p>
    `);
  }

  const { data: authUser } = await admin.auth.admin.getUserById(row.user_id);
  const userEmail = authUser?.user?.email ?? "";

  if (RESEND_KEY && userEmail) {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": "Bearer " + RESEND_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "MIDA <noreply@mida-food.com>",
        to: [userEmail],
        subject: "MIDA — Votre demande n'a pas été retenue",
        html: "<div style='font-family:Georgia,serif;max-width:520px;margin:0 auto'><h1>MIDA</h1><h2>Bonjour " + row.first_name + ",</h2><p>Après examen, votre demande pour <strong>" + row.restaurant_name + "</strong> n'a pas pu être validée. Contactez-nous : <a href='mailto:contact@mida-food.com'>contact@mida-food.com</a></p><p style='color:#888;font-size:13px'>L'équipe MIDA</p></div>",
      }),
    });
    if (!resendRes.ok) {
      const resendErr = await resendRes.text();
      console.error("[reject-pro] Resend error:", resendRes.status, resendErr);
    }
  }

  await admin.from("pro_requests").update({ status: "rejected" }).eq("id", requestId);

  return html("Refusé", `
    <h1>MIDA</h1>
    <p class="done">✗ REFUSÉ</p>
    <p>${row.first_name} ${row.last_name} a été notifié(e) du refus de sa demande pour <strong>${row.restaurant_name}</strong>.</p>
    <p class="note">Vous pouvez fermer cette fenêtre.</p>
  `);
});
