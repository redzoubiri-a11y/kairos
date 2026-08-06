// ============================================================================
// Edge Function : send-booking-reminders
// Envoie les rappels WhatsApp 24h et 2h avant chaque réservation confirmée,
// via l'API WhatsApp Cloud de Meta (accessible depuis l'Algérie, contrairement
// à certains providers SMS locaux qui nécessitent un accord opérateur).
//
// À appeler toutes les 15 min via pg_cron (voir migration 0002, section 3).
//
// Prérequis :
//   - Un compte WhatsApp Business + numéro vérifié sur Meta for Developers
//   - Un message template pré-approuvé par Meta (les rappels automatiques
//     hors fenêtre de 24h de conversation DOIVENT utiliser un template)
//
// Déployer : supabase functions deploy send-booking-reminders --no-verify-jwt
// Variables d'env :
//   WHATSAPP_TOKEN            (token permanent de l'app Meta)
//   WHATSAPP_PHONE_NUMBER_ID  (id du numéro expéditeur WhatsApp Business)
//   WHATSAPP_TEMPLATE_NAME    (ex: "rappel_rdv_salony", approuvé par Meta)
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN')!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!;
const WHATSAPP_TEMPLATE_NAME = Deno.env.get('WHATSAPP_TEMPLATE_NAME') ?? 'rappel_rdv_salony';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Meta exige un template approuvé PAR LANGUE : faire valider le même template
// en 'fr' et en 'ar' sous le même nom, sinon l'envoi échoue pour la langue
// manquante. La langue vient de profiles.langue (réglée dans l'app).
async function envoyerWhatsapp(
  telephone: string,
  salonNom: string,
  heure: string,
  langue: string
) {
  const res = await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: telephone.replace(/^0/, '213'), // format international DZ
      type: 'template',
      template: {
        name: WHATSAPP_TEMPLATE_NAME,
        language: { code: langue === 'ar' ? 'ar' : 'fr' },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: salonNom }, { type: 'text', text: heure }],
          },
        ],
      },
    }),
  });
  return res.ok;
}

async function traiterFenetre(champBooleen: '24h' | '2h', minMinutes: number, maxMinutes: number) {
  const maintenant = new Date();
  const debut = new Date(maintenant.getTime() + minMinutes * 60000);
  const fin = new Date(maintenant.getTime() + maxMinutes * 60000);
  const colonne = champBooleen === '24h' ? 'rappel_24h_envoye' : 'rappel_2h_envoye';

  const { data: reservations } = await supabaseAdmin
    .from('bookings')
    .select('id, date_heure_debut, client_id, salons(nom), profiles!bookings_client_id_fkey(telephone, langue)')
    .eq('statut', 'confirme')
    .eq(colonne, false)
    .gte('date_heure_debut', debut.toISOString())
    .lte('date_heure_debut', fin.toISOString());

  let envoyes = 0;
  for (const r of reservations ?? []) {
    const telephone = r.profiles?.telephone;
    if (!telephone) continue;

    const langue = r.profiles?.langue === 'ar' ? 'ar' : 'fr';
    const heure = new Date(r.date_heure_debut).toLocaleTimeString(
      langue === 'ar' ? 'ar-DZ' : 'fr-FR',
      { hour: '2-digit', minute: '2-digit' }
    );
    const ok = await envoyerWhatsapp(
      telephone,
      r.salons?.nom ?? (langue === 'ar' ? 'صالونك' : 'votre salon'),
      heure,
      langue
    );

    if (ok) {
      await supabaseAdmin.from('bookings').update({ [colonne]: true }).eq('id', r.id);
      await supabaseAdmin.from('notifications').insert({
        user_id: r.client_id,
        type: 'rappel_rdv',
        titre: langue === 'ar' ? 'تذكير بالموعد' : 'Rappel de rendez-vous',
        message:
          langue === 'ar'
            ? `موعدك في ${r.salons?.nom} على الساعة ${heure}.`
            : `Votre RDV chez ${r.salons?.nom} est à ${heure}.`,
      });
      envoyes++;
    }
  }
  return envoyes;
}

Deno.serve(async () => {
  const envoyes24h = await traiterFenetre('24h', 23 * 60, 25 * 60); // fenêtre 23h-25h avant
  const envoyes2h = await traiterFenetre('2h', 105, 135);           // fenêtre 1h45-2h15 avant

  return new Response(JSON.stringify({ envoyes24h, envoyes2h }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
