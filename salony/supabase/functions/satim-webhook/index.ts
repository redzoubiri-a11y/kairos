// ============================================================================
// Edge Function : satim-webhook
// Appelée par l'écran AcompteScreen (WebView) au retour du paiement SATIM,
// avec le orderId en paramètre. Interroge SATIM (confirmOrder.do /
// getOrderStatus.do) pour vérifier le statut réel — ne JAMAIS faire confiance
// à un simple retour d'URL, toujours revérifier côté serveur.
//
// Déployer : supabase functions deploy satim-webhook --no-verify-jwt
// (appelée directement par le navigateur WebView, sans JWT utilisateur)
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
    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'orderId requis' }), { status: 400 });
    }

    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (!payment) {
      return new Response(JSON.stringify({ error: 'Paiement introuvable' }), { status: 404 });
    }

    // vérification du statut réel auprès de SATIM (getOrderStatus.do)
    const params = new URLSearchParams({
      userName: SATIM_MERCHANT_ID,
      password: SATIM_MERCHANT_PASSWORD,
      orderId,
    });
    const statusResponse = await fetch(`${SATIM_API_URL}/getOrderStatus.do?${params.toString()}`);
    const statusData = await statusResponse.json();

    // orderStatus === 2 signifie "paiement déposé avec succès" côté SATIM
    const succes = statusData.orderStatus === 2;

    await supabaseAdmin
      .from('payments')
      .update({
        statut: succes ? 'reussi' : 'echoue',
        reference_externe: statusData.approvalCode ?? null,
        raw_response: statusData,
      })
      .eq('order_id', orderId);

    if (succes) {
      await supabaseAdmin
        .from('bookings')
        .update({ acompte_paye: true, statut: 'confirme' })
        .eq('id', payment.booking_id);
    }

    return new Response(JSON.stringify({ succes }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
