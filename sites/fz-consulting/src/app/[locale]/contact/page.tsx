import type { Metadata } from 'next'
import ContactForm from '@/components/ContactForm'
import { WhatsAppButton } from '@/components/ui'
import { getContent, isLocale, defaultLocale, type Locale } from '@/lib/content'
import { waLink, waDisplay } from '@/lib/whatsapp'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Un premier échange de 20 minutes, sans engagement. Par WhatsApp de préférence, ou par formulaire.',
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : defaultLocale
  const { site } = getContent(locale)

  return (
    <>
      <section className="band">
        <div className="wrap">
          <p className="eyebrow">Contact</p>
          <h1 className="sm">Parlons de votre situation</h1>
          <p className="sub">
            Le plus simple est WhatsApp. Décrivez votre situation en deux lignes,{' '}
            {site.responseTime.toLowerCase()}
          </p>
          <div className="cta-row">
            <WhatsAppButton href={waLink(site.whatsapp)}>Écrire sur WhatsApp</WhatsAppButton>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap split">
          <div>
            <h3>Ce qui se passe ensuite</h3>
            <div className="next">
              <ol>
                <li>{site.responseTime}</li>
                <li>Un échange de 20 minutes pour comprendre la situation.</li>
                <li>Si le sujet n&apos;est pas le nôtre, nous vous le disons tout de suite.</li>
                <li>Sinon, une proposition écrite sous une semaine.</li>
              </ol>
            </div>

            <h3 style={{ margin: '2rem 0 .5rem' }}>Coordonnées</h3>
            <ul className="coord">
              <li>
                <span className="k">WhatsApp</span>
                <a href={waLink(site.whatsapp)} rel="noopener" target="_blank">
                  {waDisplay(site.whatsapp)}
                </a>
              </li>
              <li>
                <span className="k">E-mail</span>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </li>
              <li>
                <span className="k">LinkedIn</span>
                <a href={site.linkedin} rel="noopener" target="_blank">
                  Profil
                </a>
              </li>
              <li>
                <span className="k">Ville</span>
                <span>{site.city}</span>
              </li>
            </ul>
          </div>

          <div>
            <h3>Ou par formulaire</h3>
            <ContactForm responseTime={site.responseTime} />
          </div>
        </div>
      </section>
    </>
  )
}
