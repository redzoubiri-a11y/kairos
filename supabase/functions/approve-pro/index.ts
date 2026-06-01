import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_KEY   = Deno.env.get("RESEND_API_KEY");

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const enc = new TextEncoder();

function html(title: string, emoji: string, body: string): Response {
  const content = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <style>
    body{font-family:Georgia,serif;max-width:520px;margin:80px auto;padding:32px;color:#1a1a1a;text-align:center;}
    h1{font-size:28px;letter-spacing:4px;color:#0F0D0B;}
    .accent{color:#E8A045;}
    p{color:#555;line-height:1.7;font-size:16px;}
  </style>
</head>
<body>
  <h1>MIDA</h1>
  <p style="font-size:52px;margin:24px 0">${emoji}</p>
  <p class="accent" style="letter-spacing:2px;font-size:13px">${title.toUpperCase()}</p>
  ${body}
</body>
</html>`;
  return new Response(enc.encode(content), {
    status: 200,
    headers: new Headers({
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    }),
  });
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
    return html("Demande introuvable", "❌", "<p>Cette demande n’existe pas ou a déjà été traitée.</p>");
  }
  if (req_row.status !== "pending") {
    return html("Déjà traitée", "✅", `<p>Cette demande a déjà été <strong>${req_row.status}</strong>.</p>`);
  }

  const { data: authUser } = await admin.auth.admin.getUserById(req_row.user_id);
  const userEmail = authUser?.user?.email ?? "";

  try {
    const { data: ownerRow, error: ownerErr } = await admin
      .from("restaurant_owners")
      .upsert({
        auth_id:   req_row.user_id,
        email:     userEmail,
        phone:     req_row.phone,
        full_name: `${req_row.first_name} ${req_row.last_name}`,
        role:      "owner",
      }, { onConflict: "auth_id" })
      .select("id")
      .single();

    if (ownerErr) throw new Error(`restaurant_owners: ${ownerErr.message}`);

    const { data: existingResto } = await admin
      .from("restaurants")
      .select("id")
      .eq("owner_id", ownerRow.id)
      .maybeSingle();

    let restoId: string;
    if (existingResto) {
      restoId = existingResto.id;
    } else {
      const { data: restoRow, error: restoErr } = await admin
        .from("restaurants")
        .insert({
          owner_id:     ownerRow.id,
          name:         req_row.restaurant_name,
          address:      req_row.address ?? "",
          city:         (req_row.city ?? "alger").toLowerCase(),
          phone:        req_row.phone,
          cuisine_type: "autre",
          status:       "pending",
        })
        .select("id")
        .single();

      if (restoErr) throw new Error(`restaurants: ${restoErr.message}`);
      restoId = restoRow.id;
    }

    await admin.from("restaurant_owners").update({ restaurant_id: restoId }).eq("id", ownerRow.id);

    await admin.auth.admin.updateUserById(req_row.user_id, {
      app_metadata: { role: "manager" },
    });

    await admin.from("pro_requests").update({ status: "approved" }).eq("id", requestId);

    if (RESEND_KEY && userEmail) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "MIDA <onboarding@resend.dev>",
          to: [userEmail],
          subject: "Bienvenue sur MIDA — Votre compte restaurateur est activé",
          html: `
            <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
              <h1 style="letter-spacing:4px;font-size:20px;">MIDA</h1>
              <h2>Félicitations, ${req_row.first_name} !</h2>
              <p>Votre compte restaurateur pour <strong>${req_row.restaurant_name}</strong> est maintenant actif.</p>
              <p>Connectez-vous avec vos identifiants habituels — vous avez accès à votre tableau de bord.</p>
              <p>Pensez à compléter votre fiche restaurant (photos, menu, horaires) depuis l’application.</p>
              <p style="color:#888;font-size:13px;">L’équipe MIDA</p>
            </div>
          `,
        }),
      }).catch(() => {});
    }

    return html(
      "Compte activé",
      "✅",
      `<p><strong>${req_row.first_name} ${req_row.last_name}</strong> peut désormais se connecter
       en tant que restaurateur pour <strong>${req_row.restaurant_name}</strong>.<br><br>
       Un email de confirmation lui a été envoyé.</p>`,
    );
  } catch (err) {
    return html("Erreur", "⚠️", `<p>${String(err)}</p>`);
  }
});
