// Hook « Send SMS » de Supabase Auth.
//
// Supabase appelle cette fonction à chaque envoi de code OTP, à la place de
// son fournisseur intégré. C'est ce qui permet d'utiliser un opérateur
// algérien tout en gardant le flux d'authentification standard : côté app,
// `signInWithOtp` et `verifyOtp` restent inchangés.
//
// Activation : Authentication → Hooks → Send SMS → HTTP, en pointant sur
// cette fonction et en renseignant le secret.
//
// Contrat (documentation Supabase) :
//   entrée  { user: { phone, ... }, sms: { otp } }
//   sortie  200 avec un corps vide vaut succès
//
// Variables attendues : SEND_SMS_HOOK_SECRET, plus celles du fournisseur
// (voir _shared/sms.ts).

import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { sendSms } from '../_shared/sms.ts';

type HookPayload = {
  user: { phone?: string };
  sms: { otp: string };
};

/** Message d'OTP, bilingue et tenant dans un seul SMS. */
function otpMessage(otp: string): string {
  return `Tasalle : votre code de verification est ${otp}. Valable 10 minutes. Ne le communiquez a personne.`;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 });
  }

  const secret = Deno.env.get('SEND_SMS_HOOK_SECRET');
  if (!secret) {
    console.error('SEND_SMS_HOOK_SECRET manquant');
    return new Response(JSON.stringify({ error: { message: 'Hook non configuré' } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const raw = await request.text();

  // Le secret arrive sous la forme « v1,whsec_<base64> » ; la librairie
  // attend la partie base64 seule.
  let payload: HookPayload;
  try {
    const wh = new Webhook(secret.replace('v1,whsec_', '').replace('v1,', ''));
    payload = wh.verify(raw, Object.fromEntries(request.headers)) as HookPayload;
  } catch (e) {
    // Signature invalide : la requête ne vient pas de Supabase.
    console.error('Signature du hook rejetée', e);
    return new Response(JSON.stringify({ error: { message: 'Signature invalide' } }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const phone = payload.user?.phone;
  const otp = payload.sms?.otp;

  if (!phone || !otp) {
    return new Response(JSON.stringify({ error: { message: 'Téléphone ou code absent' } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await sendSms(phone, otpMessage(otp));

  if (!result.ok) {
    // Un échec renvoyé en erreur remonte à l'utilisateur dans l'app plutôt
    // que de le laisser attendre un SMS qui n'arrivera pas.
    console.error('Échec d’envoi de l’OTP', result.error);
    return new Response(JSON.stringify({ error: { message: result.error } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
});
