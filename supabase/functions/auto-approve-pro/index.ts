import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_KEY   = Deno.env.get("RESEND_API_KEY");
const CRON_SECRET  = Deno.env.get("AUTO_APPROVE_CRON_SECRET");

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Comparaison a duree constante : on compare les empreintes, jamais les
// chaines, pour qu'une reponse plus lente ne renseigne pas sur le prefixe.
async function egalConstant(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  // Cette fonction accorde le role manager sans intervention humaine, et elle
  // a verify_jwt = false pour que pg_cron l'appelle sans jeton (cf.
  // 20260803_fix_reminders.sql) : elle est donc joignable anonymement depuis
  // n'importe ou. Le secret partage est la seule chose qui distingue le cron
  // d'un appelant quelconque.
  //
  // Absent, on refuse au lieu d'ignorer la verification. C'est l'inverse du
  // choix fait pour Turnstile ailleurs, et pour une raison : la, echouer
  // ouvert perdait une demande de contact ; ici, il accorderait un role.
  if (!CRON_SECRET) {
    console.error("[auto-approve-pro] AUTO_APPROVE_CRON_SECRET absent - refus");
    return json({ approved: 0, error: "non configure" }, 503);
  }
  const presente = req.headers.get("x-cron-secret") ?? "";
  if (!(await egalConstant(presente, CRON_SECRET))) {
    return json({ approved: 0, error: "non autorise" }, 401);
  }

  const threshold = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  // verification_status = 'manual_review' : la demande a ete vue par
  // verify-restaurant et rangee dans le seau qui attend un humain. Sans ce
  // filtre, une demande que verify-restaurant n'a jamais traitee - webhook
  // absent, appel en erreur - etait approuvee au bout de 48 h sans avoir ete
  // verifiee une seule fois.
  const { data: requests } = await admin
    .from("pro_requests")
    .select("*")
    .eq("status", "pending")
    .eq("verification_status", "manual_review")
    .lt("created_at", threshold);

  // Ce qui reste en attente sans etre eligible. Un onboarding qui se bloque
  // parce que le webhook de verify-restaurant est tombe doit se voir dans les
  // logs, pas se deviner devant une file qui ne bouge plus.
  const { count: enAttente } = await admin
    .from("pro_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("created_at", threshold);
  const ignorees = Math.max(0, (enAttente ?? 0) - (requests?.length ?? 0));
  if (ignorees > 0) {
    console.warn(`[auto-approve-pro] ${ignorees} demande(s) en attente hors manual_review - verify-restaurant les a-t-il vues ?`);
  }

  if (!requests || requests.length === 0) {
    return json({ approved: 0, ignorees });
  }

  let approved = 0;
  const errors: { id: string; error: string }[] = [];

  for (const row of requests) {
    try {
      // Une demande sans user_id ne peut pas etre approuvee : il n'y a aucun
      // compte a passer en manager. Sans ce garde, getUserById(null) lance
      // "Expected parameter to be UUID but is not" et la ligne repasse en
      // erreur a chaque execution horaire du cron, indefiniment.
      if (!row.user_id) {
        errors.push({ id: row.id, error: "user_id absent — demande ignoree" });
        continue;
      }

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
          cuisine_type: row.cuisine_type || "autre",
          status: "active",
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

  console.log(`[auto-approve-pro] approved=${approved} errors=${errors.length} ignorees=${ignorees}`);
  return json({ approved, errors, ignorees });
});
