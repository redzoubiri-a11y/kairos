import type { Metadata } from 'next'
import Link from 'next/link'
import { WhatsAppButton } from '@/components/ui'
import { getContent, isLocale, defaultLocale, type Locale } from '@/lib/content'
import { waLink } from '@/lib/whatsapp'

export const metadata: Metadata = {
  title: 'Offres — conseil et formation en achats et supply chain',
  description:
    'Quatre missions de conseil à périmètre défini et trois parcours de formation en achats, négociation et commerce extérieur.',
}

export default async function OffersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : defaultLocale
  const { site, offers } = getContent(locale)
  const base = `/${locale}`

  /* Le bloc tarifs ne s'affiche que si au moins un montant est renseigné.
     Cf. plan, partie 4 : les prix ne bloquent jamais la mise en ligne. */
  const pricedRows = offers.pricing.rows.filter((r) => r.price)

  return (
    <>
      <section className="band">
        <div className="wrap">
          <p className="eyebrow">Offres</p>
          <h1 className="sm">{offers.title}</h1>
          <p className="sub">{offers.subtitle}</p>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <h2>{offers.consulting.title}</h2>
          <div className="offers" style={{ marginTop: '2rem' }}>
            {offers.consulting.items.map((o) => (
              <div className={o.lead ? 'offer lead' : 'offer'} key={o.title}>
                <p className="kicker">{o.kicker}</p>
                <h3>{o.title}</h3>
                <p>{o.body}</p>
                <ul className="deliv">
                  {o.deliverables.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <div className="foot">
                  <span>{o.duration}</span>
                  {o.price && <span>{o.price}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band wash">
        <div className="wrap">
          <h2>{offers.training.title}</h2>
          <p>{offers.training.intro}</p>
          <div className="courses mt">
            {offers.training.items.map((c) => (
              <div className="course" key={c.title}>
                <h3>{c.title}</h3>
                <ul>
                  {c.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
                <p className="fmt">{c.format}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '2rem', fontSize: '.95rem' }}>
            {offers.training.othersNote}{' '}
            <Link href={`${base}/contact`} style={{ color: 'var(--marine)' }}>
              Nous écrire
            </Link>
            .
          </p>
        </div>
      </section>

      {pricedRows.length > 0 && (
        <section className="band">
          <div className="wrap">
            <h2>{offers.pricing.title}</h2>
            <p>{offers.pricing.intro}</p>
            <div className="pricing" style={{ marginTop: '1.5rem' }}>
              <table>
                <tbody>
                  {pricedRows.map((r) => (
                    <tr key={r.label}>
                      <td>{r.label}</td>
                      <td className="p">{r.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <section className="band wash">
        <div className="wrap center">
          <h2>Un devis, ou juste une question ?</h2>
          <p>Décrivez votre situation en deux lignes. {site.responseTime}</p>
          <div className="cta-row">
            <WhatsAppButton href={waLink(site.whatsapp, 'offers')}>
              Demander un devis sur WhatsApp
            </WhatsAppButton>
            <Link className="btn btn-ghost" href={`${base}/contact`}>
              Passer par le formulaire
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
