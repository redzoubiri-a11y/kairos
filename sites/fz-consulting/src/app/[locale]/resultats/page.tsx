import type { Metadata } from 'next'
import { CaseCard, Stats } from '@/components/ui'
import { getContent, isLocale, defaultLocale, type Locale } from '@/lib/content'
import { waLink } from '@/lib/whatsapp'

export const metadata: Metadata = {
  title: 'Résultats — ce qui a changé, et de combien',
  description:
    'Cas clients chiffrés : situation de départ, intervention menée et résultat mesuré après la mission.',
}

export default async function ResultsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : defaultLocale
  const { site, cases } = getContent(locale)
  const caseCta = waLink(site.whatsapp, 'case')

  return (
    <>
      <section className="band">
        <div className="wrap">
          <p className="eyebrow">Résultats</p>
          <h1 className="sm">{cases.title}</h1>
          <p className="sub">{cases.subtitle}</p>
        </div>
      </section>

      <section className="band">
        <div className="wrap cases">
          {cases.items.map((c) => (
            <CaseCard key={c.tag} item={c} ctaHref={caseCta} ctaLabel={cases.cta} />
          ))}
        </div>
      </section>

      <section className="band wash">
        <div className="wrap">
          <h2>{cases.training.title}</h2>
          <div className="mt">
            <Stats items={cases.training.stats} />
          </div>
          {cases.training.quote && (
            <>
              <p className="quote">« {cases.training.quote} »</p>
              {cases.training.quoteAuthor && (
                <p className="quote-author">— {cases.training.quoteAuthor}</p>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
