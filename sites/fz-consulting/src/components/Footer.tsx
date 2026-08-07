import Link from 'next/link'
import type { Site, Locale } from '@/lib/content'

export default function Footer({ site, locale }: { site: Site; locale: Locale }) {
  const base = `/${locale}`
  const year = 2026

  return (
    <footer className="site">
      <div className="wrap">
        <div className="cols">
          <div>
            <Link className="logo" href={base}>
              FZ<span style={{ color: '#A9713B' }}>&nbsp;/</span>&nbsp;Consulting
            </Link>
            <p style={{ marginTop: '.8rem' }}>
              {site.tagline} {site.city}.
            </p>
          </div>
          <div>
            <h4>Navigation</h4>
            <ul>
              {site.nav.map((n) => (
                <li key={n.label}>
                  <Link href={n.href ? `${base}/${n.href}` : base}>{n.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Informations</h4>
            <ul>
              <li>
                <Link href={`${base}/mentions-legales`}>Mentions légales</Link>
              </li>
              <li>
                <Link href={`${base}/confidentialite`}>Politique de confidentialité</Link>
              </li>
              <li>
                <a href={site.linkedin} rel="noopener" target="_blank">
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className="legal">
          © {year} {site.name} — anciennement Cabinet Oceanic
        </p>
      </div>
    </footer>
  )
}
