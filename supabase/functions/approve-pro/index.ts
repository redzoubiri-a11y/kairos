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
  return new Response(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MIDA</title><style>body{font-family:Georgia,serif;background:#0F0D0B;color:#F5F0EB;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}div{max-width:480px;padding:40px;text-align:center}h1{letter-spacing:6px;font-size:18px;color:#C8975A;margin-bottom:8px}h2{font-weight:300;font-size:22px;margin:0 0 24px}table{width:100%;text-align:left;border-collapse:collapse;margin:0 0 32px}td{padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.07);font-size:14px}td:first-child{color:#888;width:120px}a.btn{display:inline-block;background:#4CAF82;color:white;padding:14px 40px;text-decoration:none;border-radius:8px;font-weight:bold;letter-spacing:2px;font-size:15px}p.note{color:#555;font-size:12px;margin-top:24px}p.done{font-size:18px;margin:16px 0}</style></head><body><div>${content}</div></body></html>`,
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
    const confirmUrl = BASE_URL + "/approve-pro?id=" + requestId + "&step=confirm";
    return html("Approuver", `
      <h1>MIDA</h1>
      <h2>Approuver cette demande ?</h2>
      <table>
        <tr><td>Nom</td><td>${row.first_name} ${row.last_name}</td></tr>
        <tr><td>Restaurant</td><td>${row.restaurant_name}</td></tr>
        <tr><td>Ville</td><td>${row.city || "—"}</td></tr>
      </table>
      <a class="btn" href="${confirmUrl}">✓ CONFIRMER</a>
      <p class="note">Fermez cette fenêtre pour annuler.</p>
    `);
  }

  const { data: authUser } = await admin.auth.admin.getUserById(row.user_id);
  const userEmail = authUser?.user?.email ?? "";

  try {
    const { data: ownerRow, error: ownerErr } = await admin
      .from("restaurant_owners")
      .upsert({ auth_id: row.user_id, email: userEmail, phone: row.phone, full_name: row.first_name + " " + row.last_name, role: "owner" }, { onConflict: "auth_id" })
      .select("id").single();
    if (ownerErr) throw new Error(ownerErr.message);

    const { data: existingResto } = await admin.from("restaurants").select("id").eq("owner_id", ownerRow.id).maybeSingle();
    let restoId: string;
    if (existingResto) {
      restoId = existingResto.id;
    } else {
      const { data: restoRow, error: restoErr } = await admin.from("restaurants").insert({
        owner_id: ownerRow.id, name: row.restaurant_name,
        cuisine_type: "autre", status: "pending",
        address: "", quartier: "", phone: row.phone || "",
        city: row.city?.trim() || "alger",
      }).select("id").single();
      if (restoErr) throw new Error(restoErr.message);
      restoId = restoRow.id;
    }

    await admin.from("restaurant_owners").update({ restaurant_id: restoId }).eq("id", ownerRow.id);
    await admin.auth.admin.updateUserById(row.user_id, { app_metadata: { role: "manager" } });
    await admin.from("pro_requests").update({ status: "approved" }).eq("id", requestId);

    if (RESEND_KEY && userEmail) {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": "Bearer " + RESEND_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "MIDA <noreply@mida-food.com>",
          to: [userEmail],
          subject: "Bienvenue sur MIDA — Votre compte restaurateur est activé",
          html: "<div style='font-family:Georgia,serif;max-width:520px;margin:0 auto'><h1>MIDA</h1><h2>Félicitations, " + row.first_name + " !</h2><p>Votre compte pour <strong>" + row.restaurant_name + "</strong> est actif. Connectez-vous avec vos identifiants habituels.</p><p style='color:#888;font-size:13px'>L'équipe MIDA</p></div>",
        }),
      });
      if (!resendRes.ok) {
        const resendErr = await resendRes.text();
        console.error("[approve-pro] Resend error:", resendRes.status, resendErr);
      }
    }

    return html("Approuvé", `
      <h1>MIDA</h1>
      <p class="done">✓ APPROUVÉ</p>
      <p>${row.first_name} ${row.last_name} peut se connecter en tant que restaurateur pour <strong>${row.restaurant_name}</strong>.</p>
      <p>Email de bienvenue envoyé.</p>
      <p class="note">Vous pouvez fermer cette fenêtre.</p>
    `);
  } catch (err) {
    return txt("MIDA\n\nErreur : " + String(err));
  }
});
