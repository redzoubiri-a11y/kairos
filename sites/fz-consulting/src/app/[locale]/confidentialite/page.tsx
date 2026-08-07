import type { Metadata } from 'next'
import { getContent, isLocale, defaultLocale, type Locale } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  robots: { index: false, follow: true },
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : defaultLocale
  const { site } = getContent(locale)

  return (
    <section className="band">
      <div className="wrap prose">
        <h1 className="sm">Politique de confidentialité</h1>
        <p className="form-note">
          Trame à compléter et à faire valider par un conseil local. Deux régimes peuvent se
          cumuler : la loi algérienne 18-07 et le RGPD si l&apos;hébergement est situé dans
          l&apos;Union européenne.
        </p>

        <h2>Données collectées</h2>
        <p>
          Via le formulaire de contact : nom et prénom, entreprise, adresse e-mail ou numéro de
          téléphone, sujet de la demande et message. Aucune autre donnée n&apos;est collectée à
          votre insu.
        </p>

        <h2>Finalité</h2>
        <p>
          Ces données servent uniquement à répondre à votre demande et, le cas échéant, à établir
          une proposition commerciale. Elles ne sont ni vendues ni transmises à des tiers à des fins
          commerciales.
        </p>

        <h2>Durée de conservation</h2>
        <p>[À compléter] — par exemple 24 mois à compter du dernier échange.</p>

        <h2>Destinataires</h2>
        <p>
          {site.name} uniquement, ainsi que le prestataire technique assurant l&apos;acheminement
          des e-mails.
        </p>

        <h2>Vos droits</h2>
        <p>
          Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données en
          écrivant à {site.email}.
        </p>

        <h2>Mesure d&apos;audience</h2>
        <p>
          Le site utilise un outil de mesure d&apos;audience sans cookie, qui ne permet pas de vous
          identifier individuellement. [À confirmer selon l&apos;outil retenu.]
        </p>
      </div>
    </section>
  )
}
