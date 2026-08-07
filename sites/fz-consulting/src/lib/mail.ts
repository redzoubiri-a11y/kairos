/**
 * Protections et remise des e-mails, partagées par les routes qui reçoivent
 * du public (formulaire de contact, auto-diagnostic).
 */

const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5

/** Compteurs en mémoire : garde-fou, pas une vraie défense. Remis à zéro à
 *  chaque redéploiement, et non partagé entre instances. */
const hits = new Map<string, number[]>()

export function clientIp(request: Request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'inconnue'
  )
}

export function rateLimited(scope: string, ip: string) {
  const key = `${scope}:${ip}`
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(key, recent)
  return recent.length > MAX_PER_WINDOW
}

/** Vrai si aucune clé Turnstile n'est configurée : on n'exige alors aucun jeton. */
export async function verifyTurnstile(token: string | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, response: token, remoteip: ip }),
  })
  const data = (await res.json()) as { success?: boolean }
  return data.success === true
}

/**
 * Envoie via Resend si les trois variables sont présentes, journalise sinon.
 * Permet de développer et de recetter sans clé.
 */
export async function sendMail(opts: { subject: string; text: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO_EMAIL
  const from = process.env.CONTACT_FROM_EMAIL

  if (!key || !to || !from) {
    console.info(`[mail] envoi non configuré — ${opts.subject}\n${opts.text}`)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to,
      reply_to: opts.replyTo,
      subject: opts.subject,
      text: opts.text,
    }),
  })

  if (!res.ok) throw new Error(`Resend a répondu ${res.status}`)
}
