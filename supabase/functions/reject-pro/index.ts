import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_KEY   = Deno.env.get("RESEND_API_KEY");

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function html(title: string, emoji: string, body: string) {
  return new Response(
    `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
    <title>${title}</title>
    <style>body{font-family:Georgia,serif;max-width:520px;margin:80px auto;padding:32px;color:#1a1a1a;text-align:center;}
    h1{font-size:28px;letter-spacing:4px;color:#0F0D0B;}
    .accent{color:#E8A045;}p{color:#555;line-height:1.7;font-size:16px;}</style>
    </head><body>
    <h1>MIDA</h1>
    <p style="font-size:52px;margin:24px 0;">${emoji}</p>
    <p class="accent" style="letter-spacing:2px;font-size:13px;">${title.toUpperCase()}</p>
    ${body}
    </body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

serve(async (req) => {
  const url = new URL(req.url);
  const requestId = url.searchParams.get("id");

  if (!requestId) {
    return html("Lien invalide", "⚠️", "<p>Aucun identifiant de demande fourni.</p>");
  }

  const { data: req_row, error: reqErr } = await admin
    .from("pro_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (reqErr || !req_row) {
    return html("Demande introuvable", "❌", "<p>Cette demande n'existe pas ou a déjà été traitée.</p>");
  }
  if (req_row.status !== "pending") {
    return html("Déjà traitée", "✅", `<p>Cette demande a déjà été <strong>${req_row.status}</strong>.</p>`);
  }

  await admin.from("pro_requests").update({ status: "rejected" }).eq("id", requestId);

  // Rejection email to applicant
  if (RESEND_KEY) {
    const { data: authUser } = await admin.auth.admin.getUserById(req_row.user_id);
    const userEmail = authUser?.user?.email ?? "";
    if (userEmail) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "MIDA <onboarding@resend.dev>",
          to: [userEmail],
          subject: "MIDA — Votre demande n'a pas été retenue",
          html: `
          <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
            <h1 style="letter-spacing:4px;font-size:20px;">MIDA</h1>
            <h2>Bonjour ${req_row.first_name},</h2>
            <p>Après examen, votre demande d'inscription pour <strong>${req_row.restaurant_name}</strong> n'a pas pu être validée pour le moment.</p>
            <p>Si vous pensez qu'il s'agit d'une erreur ou souhaitez plus d'informations, contactez-nous à <a href="mailto:contact@mida-food.com">contact@mida-food.com</a>.</p>
            <p style="color:#888;font-size:13px;">L'équipe MIDA</p>
          </div>
          `,
        }),
      }).catch(() => {});
    }
  }

  return html(
    "Demande refusée",
    "❌",
    `<p><strong>${req_row.first_name} ${req_row.last_name}</strong> a été notifié(e) par email du refus de sa demande pour <strong>${req_row.restaurant_name}</strong>.</p>`,
  );
});
