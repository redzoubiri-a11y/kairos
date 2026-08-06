// ============================================================================
// Edge Function : refund-satim
// Rembourse l'acompte d'une réservation annulée, via l'opération refund.do
// de la passerelle SATIM.
//
// Appelée par l'app après `cancel_booking` lorsque la RPC indique que
// l'acompte est remboursable. Revérifie systématiquement les conditions
// côté serveur — on ne rembourse jamais sur la seule parole du client.
//
// Déployer : supabase functions deploy refund-satim
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SATIM_API_URL = Deno.env.get('SATIM_API_URL')!;
const SATIM_MERCHANT_ID = Deno.env.get('SATIM_MERCHANT_ID')!;
const SATIM_MERCHANT_PASSWORD = Deno.env.get('SATIM_MERCHANT_PASSWORD')!;

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401 });
    }

    const { booking_id } = await req.json();

    // La réservation doit appartenir au demandeur (client) ou à son salon (pro)
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id, client_id, statut, acompte_paye, date_heure_debut, salons(owner_id, delai_annulation_h)')
      .eq('id', booking_id)
      .single();

    if (!booking) {
      return new Response(JSON.stringify({ error: 'Réservation introuvable' }), { status: 404 });
    }

    const estClient = booking.client_id === user.id;
    const estProprietaire = booking.salons?.owner_id === user.id;
    if (!estClient && !estProprietaire) {
      return new Response(JSON.stringify({ error: 'Accès refusé' }), { status: 403 });
    }

    if (booking.statut !== 'annule' || !booking.acompte_paye) {
      return new Response(
        JSON.stringify({ error: 'Aucun acompte remboursable pour cette réservation' }),
        { status: 409 }
      );
    }

    // Revérification du délai d'annulation — sauf si c'est le salon qui
    // rembourse volontairement (geste commercial), auquel cas on l'autorise.
    const heuresRestantes =
      (new Date(booking.date_heure_debut).getTime() - Date.now()) / 3_600_000;
    if (estClient && heuresRestantes < (booking.salons?.delai_annulation_h ?? 24)) {
      return new Response(
        JSON.stringify({ error: 'Délai d\'annulation dépassé, acompte non remboursable' }),
        { status: 409 }
      );
    }

    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('booking_id', booking_id)
      .eq('statut', 'reussi')
      .maybeSingle();

    if (!payment) {
      return new Response(JSON.stringify({ error: 'Aucun paiement à rembourser' }), { status: 404 });
    }

    // Paiement en espèces : rien à rembourser en ligne, le salon rend la main
    if (payment.provider === 'especes') {
      await supabaseAdmin
        .from('payments')
        .update({
          statut: 'rembourse',
          rembourse_le: new Date().toISOString(),
          remboursement_motif: 'Annulation — remboursement en espèces à effectuer au salon',
        })
        .eq('id', payment.id);
      return new Response(JSON.stringify({ rembourse: true, mode: 'especes' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Remboursement SATIM (refund.do) — montant en centimes
    const params = new URLSearchParams({
      userName: SATIM_MERCHANT_ID,
      password: SATIM_MERCHANT_PASSWORD,
      orderId: payment.order_id,
      amount: String(Math.round(Number(payment.montant) * 100)),
    });

    const refundResponse = await fetch(`${SATIM_API_URL}/refund.do?${params.toString()}`, {
      method: 'POST',
    });
    const refundData = await refundResponse.json();

    if (refundData.errorCode && refundData.errorCode !== '0') {
      return new Response(
        JSON.stringify({ error: refundData.errorMessage ?? 'Échec du remboursement SATIM' }),
        { status: 502 }
      );
    }

    await supabaseAdmin
      .from('payments')
      .update({
        statut: 'rembourse',
        rembourse_le: new Date().toISOString(),
        remboursement_motif: 'Annulation dans les délais',
        raw_response: refundData,
      })
      .eq('id', payment.id);

    await supabaseAdmin
      .from('bookings')
      .update({ acompte_paye: false })
      .eq('id', booking_id);

    await supabaseAdmin.from('notifications').insert({
      user_id: booking.client_id,
      type: 'annulation_rdv',
      titre: 'Acompte remboursé',
      message: `Votre acompte de ${payment.montant} DA a été remboursé.`,
    });

    return new Response(JSON.stringify({ rembourse: true, mode: 'satim' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
