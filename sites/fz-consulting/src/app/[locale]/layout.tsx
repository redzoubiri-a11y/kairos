import type { Metadata } from 'next'
import '@/styles/globals.css'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { WhatsAppButton } from '@/components/ui'
import { getContent, isLocale, locales, dirOf, defaultLocale, type Locale } from '@/lib/content'
import { waLink } from '@/lib/whatsapp'

/** Bandeau « maquette » tant que les contenus ne sont pas validés. */
const DRAFT = process.env.NEXT_PUBLIC_DRAFT === '1'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const { site } = getContent(isLocale(locale) ? locale : defaultLocale)

  return {
    metadataBase: new URL(site.baseUrl),
    title: {
      default: `${site.name} — Conseil et formation en achats et supply chain`,
      template: `%s — ${site.name}`,
    },
    description: site.tagline,
    openGraph: {
      type: 'website',
      locale: 'fr_DZ',
      siteName: site.name,
      title: `${site.name} — Conseil et formation en achats et supply chain`,
      description: site.tagline,
    },
    robots: DRAFT ? { index: false, follow: false } : { index: true, follow: true },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : defaultLocale
  const { site } = getContent(locale)
  const wa = waLink(site.whatsapp)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: site.name,
    description: site.tagline,
    url: site.baseUrl,
    email: site.email,
    telephone: `+${site.whatsapp}`,
    areaServed: 'DZ',
    address: { '@type': 'PostalAddress', addressLocality: 'Alger', addressCountry: 'DZ' },
    knowsAbout: ['Achats', 'Supply chain', 'Commerce extérieur', 'Négociation'],
    sameAs: [site.linkedin],
  }

  return (
    <html lang={locale} dir={dirOf(locale)}>
      <body>
        {DRAFT && (
          <p className="proto">
            Maquette — <b>contenus d&apos;exemple à remplacer</b> — non publiable en l&apos;état
          </p>
        )}
        <Header site={site} locale={locale} waHref={wa} />
        <main>{children}</main>
        <Footer site={site} locale={locale} />
        <div className="wa-bar">
          <WhatsAppButton href={wa}>Parler à Fatima sur WhatsApp</WhatsAppButton>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  )
}
