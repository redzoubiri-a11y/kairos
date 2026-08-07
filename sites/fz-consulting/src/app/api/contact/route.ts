import { NextResponse } from 'next/server'
import { clientIp, rateLimited, sendMail, verifyTurnstile } from '@/lib/mail'

/**
 * Réception du formulaire de contact.
 *
 * Trois protections, dans l'ordre : champ piège, limitation par IP, puis
 * jeton Turnstile si une clé est configurée.
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

export async function POST(request: Request) {
  const ip = clientIp(request)

  let body: Payload
  try {
    body = (await request.json()) as Payload
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  // Champ piège rempli ⇒ robot. On répond 200 pour ne rien lui apprendre.
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
  if (rateLimited('contact', ip)) {
    return NextResponse.json(
      { error: 'Trop de demandes envoyées. Réessayez dans quelques minutes.' },
      { status: 429 },
    )
  }
  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json({ error: 'Vérification anti-robot échouée.' }, { status: 403 })
  }

  const text = [
    `Nom        : ${body.nom}`,
    `Entreprise : ${body.entreprise || '—'}`,
    `Contact    : ${body.contact}`,
    `Sujet      : ${body.sujet || '—'}`,
    '',
    body.message || '(aucun message)',
  ].join('\n')

  try {
    await sendMail({
      subject: `Site — ${body.sujet || 'demande'} — ${body.nom}`,
      text,
      replyTo: body.contact.includes('@') ? body.contact : undefined,
    })
  } catch (err) {
    console.error('[contact] échec de la remise', err)
    return NextResponse.json(
      { error: "L'envoi n'a pas abouti. Écrivez-nous sur WhatsApp." },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true })
}
