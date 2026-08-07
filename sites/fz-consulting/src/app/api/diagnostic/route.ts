import { NextResponse } from 'next/server'
import { clientIp, rateLimited, sendMail, verifyTurnstile } from '@/lib/mail'
import { getContent } from '@/lib/content'
import { flatten, WEAK_BELOW } from '@/lib/diagnostic'

/**
 * Résultats de l'auto-diagnostic.
 *
 * Deux usages, et c'est voulu : la personne reçoit son détail, et le cabinet
 * reçoit un contact qualifié accompagné du diagnostic de son problème.
 * Les réponses agrégées alimenteront le Baromètre annuel.
 */

export const runtime = 'nodejs'

type Payload = {
  email?: string
  entreprise?: string
  consent?: string | boolean
  website?: string
  turnstileToken?: string
  score?: number
  phases?: { key: string; pct: number }[]
  answers?: (number | null)[]
}

export async function POST(request: Request) {
  const ip = clientIp(request)

  let body: Payload
  try {
    body = (await request.json()) as Payload
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  if (body.website) return NextResponse.json({ ok: true })

  const email = body.email?.trim()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Une adresse e-mail valide est requise.' }, { status: 400 })
  }
  if (!body.consent) {
    return NextResponse.json({ error: 'Le consentement est requis.' }, { status: 400 })
  }
  if (rateLimited('diagnostic', ip)) {
    return NextResponse.json(
      { error: 'Trop de demandes envoyées. Réessayez dans quelques minutes.' },
      { status: 429 },
    )
  }
  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json({ error: 'Vérification anti-robot échouée.' }, { status: 403 })
  }

  const { diagnostic } = getContent('fr')
  const questions = flatten(diagnostic.phases)
  const labelOf = (v: number | null) =>
    diagnostic.scale.find((s) => s.value === v)?.label ?? 'sans réponse'

  const weak = (body.phases ?? []).filter((p) => p.pct < WEAK_BELOW).map((p) => p.key)

  const text = [
    `Score global : ${body.score ?? '—'} / 100`,
    `Entreprise   : ${body.entreprise || '—'}`,
    `Contact      : ${email}`,
    '',
    'Par phase :',
    ...(body.phases ?? []).map((p) => `  ${p.key.padEnd(16)} ${p.pct} %`),
    '',
    `Chantiers prioritaires : ${weak.length ? weak.join(', ') : 'aucun'}`,
    '',
    'Détail des réponses :',
    ...questions.map((q, i) => `  ${String(i + 1).padStart(2, '0')}. ${q.question}\n      → ${labelOf(body.answers?.[i] ?? null)}`),
  ].join('\n')

  try {
    await sendMail({
      subject: `Diagnostic — ${body.score ?? '?'}/100 — ${body.entreprise || email}`,
      text,
      replyTo: email,
    })
  } catch (err) {
    console.error('[diagnostic] échec de la remise', err)
    return NextResponse.json(
      { error: "L'envoi n'a pas abouti. Écrivez-nous sur WhatsApp." },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true })
}
