import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { nom, prenom, restaurant, adresse, ville, telephone, email } = await req.json();

    const { data: reqRow } = await (await import("https://esm.sh/@supabase/supabase-js@2"))
      .createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)
      .from("pro_requests")
      .select("id")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const approveUrl = reqRow?.id
      ? `${Deno.env.get("SUPABASE_URL")!.replace(".supabase.co", "")}.supabase.co/functions/v1/approve-pro?id=${reqRow.id}`
      : null;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "KAIROS <onboarding@resend.dev>",
        to: ["red.zoubiri@gmail.com"],
        subject: `Nouvelle demande PRO — ${restaurant}`,
        html: `
          <h2>Nouvelle demande d'accès PRO</h2>
          <table cellpadding="8" style="border-collapse:collapse">
            <tr><td><b>Prénom :</b></td><td>${prenom}</td></tr>
            <tr><td><b>Nom :</b></td><td>${nom}</td></tr>
            <tr><td><b>Restaurant :</b></td><td>${restaurant}</td></tr>
            <tr><td><b>Téléphone :</b></td><td>${telephone}</td></tr>
            <tr><td><b>Adresse :</b></td><td>${adresse || "—"}</td></tr>
            <tr><td><b>Ville :</b></td><td>${ville || "—"}</td></tr>
            <tr><td><b>Email :</b></td><td>${email}</td></tr>
            <tr><td><b>Date :</b></td><td>${new Date().toLocaleString("fr-FR")}</td></tr>
          </table>
          ${approveUrl ? `
          <br>
          <a href="${approveUrl}" style="display:inline-block;background:#4CAF82;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;margin-top:16px;">
            ✅ Approuver d'un clic
          </a>
          <p style="color:#888;font-size:12px;margin-top:8px;">Ce lien active automatiquement le compte restaurateur.</p>
          ` : ""}
        `,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Resend error");

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
