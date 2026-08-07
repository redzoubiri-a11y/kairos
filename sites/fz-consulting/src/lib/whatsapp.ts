/**
 * Liens WhatsApp.
 *
 * Le message est pré-rempli et diffère selon la page d'origine : le sujet de
 * la conversation est ainsi connu avant même d'avoir répondu (cf. plan,
 * partie 7).
 */

export const WA_MESSAGES = {
  default: 'Bonjour Fatima, je vous contacte au sujet de…',
  home: "Bonjour Fatima, j'ai vu votre site et je souhaite en discuter.",
  offers: 'Bonjour Fatima, je souhaite un devis.',
  case: 'Bonjour Fatima, nous sommes dans une situation comparable.',
  meeting: 'Bonjour Fatima, je souhaite un point de 20 minutes.',
  diagnostic: "Bonjour Fatima, je viens de faire l'auto-diagnostic et je souhaite en discuter.",
} as const

export type WaKey = keyof typeof WA_MESSAGES

/** `phone` : format international sans « + » ni espaces, ex. 213551234567. */
export function waLink(phone: string, key: WaKey = 'default') {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(WA_MESSAGES[key])}`
}

/** Affichage lisible : 213551234567 → +213 551 23 45 67 */
export function waDisplay(phone: string) {
  const d = phone.replace(/\D/g, '')
  if (d.length < 11) return `+${d}`
  return `+${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8, 10)} ${d.slice(10)}`.trim()
}
