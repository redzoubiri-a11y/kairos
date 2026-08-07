import Link from 'next/link'
import { CaseCard, Phases, Stats, WhatsAppButton } from '@/components/ui'
import { getContent, isLocale, defaultLocale, type Locale } from '@/lib/content'
import { waLink } from '@/lib/whatsapp'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : defaultLocale
  const { site, home, method, cases } = getContent(locale)
  const base = `/${locale}`
  const featured = cases.items.slice(0, 2)

  return (
    <>
      {/* 1 — promesse */}
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">{home.eyebrow}</p>
          <h1>{home.title}</h1>
          <p className="sub">{home.subtitle}</p>
          <div className="cta-row">
            <WhatsAppButton href={waLink(site.whatsapp, 'home')}>{home.ctaPrimary}</WhatsAppButton>
            <Link className="btn btn-ghost" href={`${base}/resultats`}>
              {home.ctaSecondary}
            </Link>
          </div>
          <p className="note">{home.note}</p>
        </div>
      </section>

      {/* 2 — preuve */}
      <section className="band wash">
        <div className="wrap">
          <Stats items={home.stats} />
        </div>
      </section>

      {/* 3 — le problème */}
      <section className="band">
        <div className="wrap">
          <h2>Trois situations que nous rencontrons chaque semaine</h2>
          <div className="trio mt">
            {home.problems.map((p) => (
              <div className="sym" key={p.title}>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — la méthode */}
      <section className="band wash">
        <div className="wrap">
          <p className="eyebrow">{home.methodIntro.eyebrow}</p>
          <h2>{home.methodIntro.title}</h2>
          <p style={{ marginBottom: '2.5rem' }}>{home.methodIntro.body}</p>
          <Phases items={method.phases} />
        </div>
      </section>

      {/* 5 — résultats */}
      <section className="band">
        <div className="wrap">
          <p className="eyebrow">{home.resultsIntro.eyebrow}</p>
          <h2>{home.resultsIntro.title}</h2>
          <div className="cases two mt">
            {featured.map((c) => (
              <CaseCard key={c.tag} item={c} compact />
            ))}
          </div>
          <div className="cta-row">
            <Link className="btn btn-ghost" href={`${base}/resultats`}>
              {home.resultsIntro.cta}
            </Link>
          </div>
        </div>
      </section>

      {/* 6 — offres */}
      <section className="band wash">
        <div className="wrap">
          <h2>{home.offersIntro.title}</h2>
          <div className="duo mt">
            {home.offersIntro.columns.map((c) => (
              <div key={c.eyebrow}>
                <p className="eyebrow">{c.eyebrow}</p>
                <h3 className="serif">{c.title}</h3>
                <p>{c.body}</p>
                <Link className="btn btn-ghost" href={`${base}/${c.href}`}>
                  {c.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7 — Fatima */}
      <section className="band">
        <div className="wrap split">
          <div className="portrait">
            {home.about.portrait ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={home.about.portrait} alt={home.about.title} />
            ) : (
              <span>
                PORTRAIT
                <br />À FOURNIR
              </span>
            )}
          </div>
          <div>
            <p className="eyebrow">{home.about.eyebrow}</p>
            <h2>{home.about.title}</h2>
            {home.about.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
            <div className="cta-row">
              <Link className="btn btn-ghost" href={`${base}/contact`}>
                {home.about.cta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8 — conversion */}
      <section className="band wash">
        <div className="wrap center">
          <h2>{home.closing.title}</h2>
          <p>{home.closing.body}</p>
          <div className="cta-row">
            <WhatsAppButton href={waLink(site.whatsapp, 'meeting')}>
              {home.closing.ctaPrimary}
            </WhatsAppButton>
            <Link className="btn btn-ghost" href={`${base}/contact`}>
              {home.closing.ctaSecondary}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
