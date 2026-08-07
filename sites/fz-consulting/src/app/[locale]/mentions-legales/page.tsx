import type { Metadata } from 'next'
import { getContent, isLocale, defaultLocale, type Locale } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Mentions légales',
  robots: { index: false, follow: true },
}

export default async function LegalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : defaultLocale
  const { site } = getContent(locale)

  return (
    <section className="band">
      <div className="wrap prose">
        <h1 className="sm">Mentions légales</h1>
        <p className="form-note">
          Trame à compléter et à faire valider par un conseil local avant mise en ligne.
        </p>

        <h2>Éditeur du site</h2>
        <ul>
          <li>Dénomination : {site.name}</li>
          <li>Forme juridique : [à compléter]</li>
          <li>Registre du commerce : [numéro]</li>
          <li>NIF : [numéro]</li>
          <li>Siège : [adresse], {site.city}</li>
          <li>Directeur de la publication : [nom]</li>
          <li>Contact : {site.email}</li>
        </ul>

        <h2>Hébergement</h2>
        <ul>
          <li>Hébergeur : [nom]</li>
          <li>Pays d&apos;hébergement : [pays]</li>
          <li>Adresse : [adresse]</li>
        </ul>

        <h2>Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des contenus de ce site — textes, méthode, schémas, documents — est la
          propriété de {site.name}, sauf mention contraire.
        </p>

        <h2>Données personnelles</h2>
        <p>
          Le traitement des données transmises via le formulaire de contact est décrit dans la
          politique de confidentialité.
        </p>
      </div>
    </section>
  )
}
