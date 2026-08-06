// ============================================================================
// Edge Function : create-satim-payment
// Crée une commande de paiement SATIM (CIB/Edahabia) pour l'acompte d'une
// réservation, et retourne l'URL du formulaire de paiement hébergé par SATIM.
//
// SATIM expose une passerelle de paiement de type "register.do" (protocole
// dérivé de la plateforme Sberbank, standard utilisé par les banques
// algériennes). Ceci nécessite un compte marchand SATIM (convention signée
// avec la banque), un SATIM_MERCHANT_ID et un SATIM_MERCHANT_PASSWORD
// obtenus lors de l'enregistrement du commerce.
//
// Déployer : supabase functions deploy create-satim-payment
// Variables d'env à configurer (supabase secrets set) :
//   SATIM_API_URL            (ex: https://cib.satim.dz/payment/rest)
//   SATIM_MERCHANT_ID
//   SATIM_MERCHANT_PASSWORD
//   SATIM_RETURN_URL         (deep link app, ex: salony://paiement/retour)
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (auto-injectées par Supabase)
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SATIM_API_URL = Deno.env.get('SATIM_API_URL')!;
const SATIM_MERCHANT_ID = Deno.env.get('SATIM_MERCHANT_ID')!;
const SATIM_MERCHANT_PASSWORD = Deno.env.get('SATIM_MERCHANT_PASSWORD')!;
const SATIM_RETURN_URL = Deno.env.get('SATIM_RETURN_URL')!;

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401 });
    }

    const { booking_id } = await req.json();
    if (!booking_id) {
      return new Response(JSON.stringify({ error: 'booking_id requis' }), { status: 400 });
    }

    // le client ne doit payer que l'acompte de SA réservation
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, client_id, acompte_montant, acompte_paye')
      .eq('id', booking_id)
      .eq('client_id', user.id)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: 'Réservation introuvable' }), { status: 404 });
    }
    if (booking.acompte_paye) {
      return new Response(JSON.stringify({ error: 'Acompte déjà payé' }), { status: 409 });
    }

    const montantCentimes = Math.round(Number(booking.acompte_montant) * 100);
    const orderId = `salony-${booking.id}-${Date.now()}`;

    // Enregistrement de la commande côté SATIM (register.do)
    const params = new URLSearchParams({
      userName: SATIM_MERCHANT_ID,
      password: SATIM_MERCHANT_PASSWORD,
      orderNumber: orderId,
      amount: String(montantCentimes),
      currency: '012', // DZD
      returnUrl: SATIM_RETURN_URL,
      failUrl: SATIM_RETURN_URL,
      language: 'FR',
    });

    const satimResponse = await fetch(`${SATIM_API_URL}/register.do?${params.toString()}`, {
      method: 'POST',
    });
    const satimData = await satimResponse.json();

    if (satimData.errorCode && satimData.errorCode !== '0') {
      await supabaseAdmin.from('payments').insert({
        booking_id: booking.id,
        provider: 'satim',
        montant: booking.acompte_montant,
        statut: 'echoue',
        raw_response: satimData,
      });
      return new Response(JSON.stringify({ error: satimData.errorMessage ?? 'Erreur SATIM' }), { status: 502 });
    }

    await supabaseAdmin.from('payments').insert({
      booking_id: booking.id,
      provider: 'satim',
      montant: booking.acompte_montant,
      statut: 'en_attente',
      order_id: orderId,
      raw_response: satimData,
    });

    return new Response(JSON.stringify({ formUrl: satimData.formUrl, orderId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
