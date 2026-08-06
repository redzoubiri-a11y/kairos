// Adaptateur d'envoi de SMS — le fournisseur est choisi par variable
// d'environnement, jamais codé en dur.
//
// Le §1.3 vise un opérateur algérien (~1,5 DA/SMS) ; Twilio dépanne au
// démarrage mais coûte bien plus vers les numéros algériens. Le mode `http`
// couvre un routeur GSM ou une passerelle d'opérateur : il suffit d'une URL
// acceptant du JSON.
//
// SMS_PROVIDER = log | twilio | http
//
//   log     — n'envoie rien, journalise. Défaut : évite d'envoyer de vrais
//             SMS tant que rien n'est configuré.
//   twilio  — TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
//   http    — SMS_HTTP_URL, SMS_HTTP_TOKEN (facultatif),
//             SMS_HTTP_TO_FIELD / SMS_HTTP_TEXT_FIELD pour adapter les noms
//             de champs attendus par la passerelle.

export type SmsResult = { ok: true; provider: string } | { ok: false; error: string };

/** Format international attendu par la plupart des passerelles : +213XXXXXXXXX */
export function normalizePhone(raw: string): string {
  const digits = String(raw ?? '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('213')) return `+${digits}`;
  if (digits.startsWith('0')) return `+213${digits.slice(1)}`;
  return `+${digits}`;
}

/** Un SMS = 160 caractères (§1.4). Au-delà, l'opérateur facture double. */
export function clampSms(text: string): string {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  return s.length <= 160 ? s : `${s.slice(0, 157)}…`;
}

async function sendViaTwilio(to: string, body: string): Promise<SmsResult> {
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const token = Deno.env.get('TWILIO_AUTH_TOKEN');
  const from = Deno.env.get('TWILIO_FROM');

  if (!sid || !token || !from) {
    return { ok: false, error: 'Twilio incomplet : SID, token ou expéditeur manquant' };
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });

  if (!response.ok) {
    return { ok: false, error: `Twilio ${response.status}: ${(await response.text()).slice(0, 200)}` };
  }
  return { ok: true, provider: 'twilio' };
}

async function sendViaHttp(to: string, body: string): Promise<SmsResult> {
  const url = Deno.env.get('SMS_HTTP_URL');
  if (!url) return { ok: false, error: 'SMS_HTTP_URL manquante' };

  const toField = Deno.env.get('SMS_HTTP_TO_FIELD') ?? 'to';
  const textField = Deno.env.get('SMS_HTTP_TEXT_FIELD') ?? 'text';
  const token = Deno.env.get('SMS_HTTP_TOKEN');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ [toField]: to, [textField]: body }),
  });

  if (!response.ok) {
    return { ok: false, error: `Passerelle ${response.status}: ${(await response.text()).slice(0, 200)}` };
  }
  return { ok: true, provider: 'http' };
}

export async function sendSms(to: string, text: string): Promise<SmsResult> {
  const provider = Deno.env.get('SMS_PROVIDER') ?? 'log';
  const destination = normalizePhone(to);
  const body = clampSms(text);

  try {
    switch (provider) {
      case 'twilio':
        return await sendViaTwilio(destination, body);
      case 'http':
        return await sendViaHttp(destination, body);
      case 'log':
      default:
        // Aucun fournisseur configuré : on trace sans rien envoyer, pour que
        // le reste de la chaîne soit vérifiable sans coût ni risque.
        console.log(`[sms:log] → ${destination} (${body.length} car.) : ${body}`);
        return { ok: true, provider: 'log' };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
