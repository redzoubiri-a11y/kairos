import { NextResponse } from 'next/server'

/**
 * Réception du formulaire de contact.
 *
 * Trois protections, dans l'ordre où elles s'appliquent :
 *   1. champ piège (honeypot) — arrête les robots les plus simples ;
 *   2. jeton Cloudflare Turnstile — invisible, si la clé est configurée ;
 *   3. limitation par IP en mémoire — dépannage, pas une vraie protection
 *      (réinitialisée à chaque démarrage d'instance).
 *
 * L'envoi passe par Resend si RESEND_API_KEY est présent ; sinon la demande
 * est journalisée, ce qui permet de développer sans clé.
 */

export const runtime = 'nodejs'

type Payload = {
  nom?: string
  entreprise?: string
  contact?: string
  sujet?: string
  message?: string
  consent?: string | boolean
  website?: string
  turnstileToken?: string
}

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()

function rateLimited(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > MAX_PER_WINDOW
}

async function verifyTurnstile(token: string | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // non configuré : on n'exige pas de jeton
  if (!token) return false

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token, remoteip: ip }),
  })
  const data = (await res.json()) as { success?: boolean }
  return data.success === true
}

async function deliver(body: Payload) {
  const to = process.env.CONTACT_TO_EMAIL
  const key = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_FROM_EMAIL

  const text = [
    `Nom        : ${body.nom ?? ''}`,
    `Entreprise : ${body.entreprise ?? '—'}`,
    `Contact    : ${body.contact ?? ''}`,
    `Sujet      : ${body.sujet ?? '—'}`,
    '',
    body.message ?? '',
  ].join('\n')

  if (!key || !to || !from) {
    console.info('[contact] envoi e-mail non configuré — demande reçue :\n' + text)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to,
      reply_to: body.contact?.includes('@') ? body.contact : undefined,
      subject: `Site — ${body.sujet ?? 'demande'} — ${body.nom ?? ''}`,
      text,
    }),
  })

  if (!res.ok) throw new Error(`Resend a répondu ${res.status}`)
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'inconnue'

  let body: Payload
  try {
    body = (await request.json()) as Payload
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  // 1 — champ piège : rempli ⇒ robot. On répond 200 pour ne rien révéler.
  if (body.website) return NextResponse.json({ ok: true })

  if (!body.nom?.trim() || !body.contact?.trim()) {
    return NextResponse.json({ error: 'Nom et moyen de contact sont requis.' }, { status: 400 })
  }
  if (!body.consent) {
    return NextResponse.json(
      { error: 'Le consentement au traitement des données est requis.' },
      { status: 400 },
    )
  }
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Trop de demandes envoyées. Réessayez dans quelques minutes.' },
      { status: 429 },
    )
  }
  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json({ error: 'Vérification anti-robot échouée.' }, { status: 403 })
  }

  try {
    await deliver(body)
  } catch (err) {
    console.error('[contact] échec de la remise', err)
    return NextResponse.json(
      { error: "L'envoi n'a pas abouti. Écrivez-nous sur WhatsApp." },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true })
}
