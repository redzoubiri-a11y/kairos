/**
 * Couche de contenu.
 *
 * Tout le texte du site vit dans /content/<locale>/*.json — jamais dans les
 * composants. C'est ce qui rend le branchement d'un CMS possible plus tard
 * sans toucher au rendu : il suffira de remplacer les imports ci-dessous par
 * un appel réseau, les types restant identiques.
 *
 * Règle (cf. plan, partie 11) : tout ce qui bouge est ici, tout ce qui ne
 * bouge pas est dans le code.
 */

import siteFr from '@content/fr/site.json'
import homeFr from '@content/fr/home.json'
import offersFr from '@content/fr/offers.json'
import casesFr from '@content/fr/cases.json'
import methodFr from '@content/fr/method.json'

export const locales = ['fr'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'fr'

/** Langues dont l'écriture va de droite à gauche (l'arabe, le jour venu). */
const RTL: string[] = ['ar']
export const dirOf = (locale: string) => (RTL.includes(locale) ? 'rtl' : 'ltr')

/* ------------------------------------------------------------------ types */

export type Site = {
  name: string
  tagline: string
  city: string
  /** Numéro au format international sans espaces ni +, ex. 213551234567. */
  whatsapp: string
  email: string
  linkedin: string
  baseUrl: string
  nav: { href: string; label: string }[]
  responseTime: string
}

export type Stat = { value: string; label: string }

export type Home = {
  eyebrow: string
  title: string
  subtitle: string
  ctaPrimary: string
  ctaSecondary: string
  note: string
  stats: Stat[]
  problems: { title: string; body: string }[]
  methodIntro: { eyebrow: string; title: string; body: string }
  resultsIntro: { eyebrow: string; title: string; cta: string }
  offersIntro: {
    title: string
    columns: { eyebrow: string; title: string; body: string; cta: string; href: string }[]
  }
  about: { eyebrow: string; title: string; paragraphs: string[]; cta: string; portrait: string | null }
  closing: { title: string; body: string; ctaPrimary: string; ctaSecondary: string }
}

export type Phase = { n: string; title: string; body: string; deliverable: string }
export type Method = { title: string; intro: string; phases: Phase[] }

export type Offer = {
  kicker: string
  title: string
  body: string
  deliverables: string[]
  duration: string
  /** null ⇒ la ligne de prix ne s'affiche pas. Ne bloque jamais la mise en ligne. */
  price: string | null
  lead?: boolean
}

export type Course = { title: string; items: string[]; format: string }

export type Offers = {
  title: string
  subtitle: string
  consulting: { title: string; items: Offer[] }
  training: { title: string; intro: string; items: Course[]; othersNote: string }
  pricing: { title: string; intro: string; note: string; rows: { label: string; price: string | null }[] }
}

export type Case = {
  /** true tant que le cas n'est pas un vrai cas client validé. */
  draft: boolean
  tag: string
  figure: string | null
  figureLabel: string
  context: string
  intervention: string
  result: string
}

export type Cases = {
  title: string
  subtitle: string
  items: Case[]
  training: { title: string; stats: Stat[]; quote: string | null; quoteAuthor: string | null }
  cta: string
}

/* ----------------------------------------------------------------- accès */

const byLocale = {
  fr: {
    site: siteFr as unknown as Site,
    home: homeFr as unknown as Home,
    offers: offersFr as unknown as Offers,
    cases: casesFr as unknown as Cases,
    method: methodFr as unknown as Method,
  },
} satisfies Record<Locale, unknown>

export function getContent(locale: Locale) {
  return byLocale[locale] ?? byLocale[defaultLocale]
}

export const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v)
