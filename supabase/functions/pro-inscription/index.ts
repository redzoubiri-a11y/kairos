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

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    // Identify the calling user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non authentifié");

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Utilisateur introuvable");

    const { nom, prenom, restaurant, adresse, ville, telephone, email } = await req.json();

    // 1. Find the pending pro_request for this user
    const { data: reqRow } = await admin
      .from("pro_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!reqRow) throw new Error("Demande introuvable");

    // 2. Create or update restaurant_owners
    const { data: ownerRow, error: ownerErr } = await admin
      .from("restaurant_owners")
      .upsert({
        auth_id:   user.id,
        email:     email,
        phone:     telephone,
        full_name: `${prenom} ${nom}`,
        role:      "owner",
      }, { onConflict: "auth_id" })
      .select("id")
      .single();

    if (ownerErr) throw new Error(`restaurant_owners: ${ownerErr.message}`);

    // 3. Create restaurant if not already exists
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
          name:         restaurant,
          address:      adresse ?? "",
          city:         (ville ?? "alger").toLowerCase(),
          phone:        telephone,
          cuisine_type: "autre",
          status:       "pending",
        })
        .select("id")
        .single();

      if (restoErr) throw new Error(`restaurants: ${restoErr.message}`);
      restoId = restoRow.id;
    }

    // 4. Link restaurant to owner
    await admin.from("restaurant_owners").update({ restaurant_id: restoId }).eq("id", ownerRow.id);

    // 5. Grant manager role
    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { role: "manager" },
    });

    // 6. Mark request approved
    await admin.from("pro_requests").update({ status: "approved" }).eq("id", reqRow.id);

    // 7. Welcome email to restaurateur
    if (RESEND_KEY && email) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "MIDA <onboarding@resend.dev>",
          to: [email],
          subject: "Bienvenue sur MIDA — Votre compte restaurateur est activé",
          html: `
            <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
              <h1 style="letter-spacing:4px;font-size:22px;">MIDA</h1>
              <h2>Félicitations, ${prenom} !</h2>
              <p>Votre compte restaurateur pour <strong>${restaurant}</strong> est maintenant actif.</p>
              <p>Connectez-vous dès maintenant — vous avez accès à votre tableau de bord pour gérer vos réservations.</p>
              <p>Pensez à compléter votre fiche restaurant (photos, menu, horaires) depuis l'application.</p>
              <p style="color:#888;font-size:13px;">L'équipe MIDA</p>
            </div>
          `,
        }),
      }).catch(() => {});
    }

    // 8. Info-only email to admin (no approval button needed)
    if (RESEND_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "MIDA <onboarding@resend.dev>",
          to: ["red.zoubiri@gmail.com"],
          subject: `Nouveau compte PRO activé — ${restaurant}`,
          html: `
            <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
              <h2>Nouveau compte restaurateur activé</h2>
              <p>Un compte a été <strong>automatiquement activé</strong>.</p>
              <table cellpadding="8" style="border-collapse:collapse;width:100%">
                <tr><td><b>Prénom :</b></td><td>${prenom}</td></tr>
                <tr><td><b>Nom :</b></td><td>${nom}</td></tr>
                <tr><td><b>Restaurant :</b></td><td>${restaurant}</td></tr>
                <tr><td><b>Téléphone :</b></td><td>${telephone}</td></tr>
                <tr><td><b>Adresse :</b></td><td>${adresse || "—"}</td></tr>
                <tr><td><b>Ville :</b></td><td>${ville || "—"}</td></tr>
                <tr><td><b>Email :</b></td><td>${email}</td></tr>
                <tr><td><b>Date :</b></td><td>${new Date().toLocaleString("fr-FR")}</td></tr>
              </table>
              <p style="color:#888;font-size:13px;margin-top:16px;">Activation automatique — aucune action requise.</p>
            </div>
          `,
        }),
      }).catch(() => {});
    }

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
