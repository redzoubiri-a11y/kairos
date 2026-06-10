import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_KEY   = Deno.env.get("RESEND_API_KEY");

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

Deno.serve(async (_req) => {
  const threshold = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: requests } = await admin
    .from("pro_requests")
    .select("*")
    .eq("status", "pending")
    .lt("created_at", threshold);

  if (!requests || requests.length === 0) {
    return new Response(JSON.stringify({ approved: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  let approved = 0;
  const errors: { id: string; error: string }[] = [];

  for (const row of requests) {
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(row.user_id);
      const userEmail = authUser?.user?.email ?? "";

      const { data: ownerRow, error: ownerErr } = await admin
        .from("restaurant_owners")
        .upsert(
          { auth_id: row.user_id, email: userEmail, phone: row.phone, full_name: row.first_name + " " + row.last_name, role: "owner" },
          { onConflict: "auth_id" }
        )
        .select("id").single();
      if (ownerErr) throw new Error(ownerErr.message);

      const { data: existingResto } = await admin.from("restaurants").select("id").eq("owner_id", ownerRow.id).maybeSingle();
      let restoId: string;
      if (existingResto) {
        restoId = existingResto.id;
      } else {
        const { data: restoRow, error: restoErr } = await admin.from("restaurants").insert({
          owner_id: ownerRow.id,
          name: row.restaurant_name,
          address: row.address ?? "",
          quartier: "",
          city: (row.city ?? "alger").toLowerCase(),
          phone: row.phone,
          cuisine_type: "autre",
          status: "pending",
        }).select("id").single();
        if (restoErr) throw new Error(restoErr.message);
        restoId = restoRow.id;
      }

      await admin.from("restaurant_owners").update({ restaurant_id: restoId }).eq("id", ownerRow.id);
      await admin.auth.admin.updateUserById(row.user_id, { app_metadata: { role: "manager" } });
      await admin.from("pro_requests").update({ status: "approved" }).eq("id", row.id);

      if (RESEND_KEY && userEmail) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": "Bearer " + RESEND_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "MIDA <onboarding@resend.dev>",
            to: [userEmail],
            subject: "Bienvenue sur MIDA — Votre compte restaurateur est activé",
            html: "<div style='font-family:Georgia,serif;max-width:520px;margin:0 auto'><h1>MIDA</h1><h2>Félicitations, " + row.first_name + " !</h2><p>Votre compte pour <strong>" + row.restaurant_name + "</strong> est actif. Connectez-vous avec vos identifiants habituels.</p><p style='color:#888;font-size:13px'>L'équipe MIDA</p></div>",
          }),
        }).catch(() => {});
      }

      approved++;
    } catch (err) {
      errors.push({ id: row.id, error: String(err) });
    }
  }

  console.log(`[auto-approve-pro] approved=${approved} errors=${errors.length}`);
  return new Response(JSON.stringify({ approved, errors }), {
    headers: { "Content-Type": "application/json" },
  });
});
