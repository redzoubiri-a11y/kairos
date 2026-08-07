'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WhatsAppButton } from './ui'
import type { Site, Locale } from '@/lib/content'

export default function Header({
  site,
  locale,
  waHref,
}: {
  site: Site
  locale: Locale
  waHref: string
}) {
  const pathname = usePathname()
  const base = `/${locale}`
  const links = site.nav.map((n) => ({
    label: n.label,
    href: n.href ? `${base}/${n.href}` : base,
  }))
  const isCurrent = (href: string) =>
    href === base ? pathname === base || pathname === `${base}/` : pathname.startsWith(href)

  return (
    <header className="site">
      <div className="wrap bar">
        <Link className="logo" href={base}>
          FZ<span>&nbsp;/</span>&nbsp;Consulting
        </Link>
        <nav className="main" aria-label="Principal">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={isCurrent(l.href) ? 'page' : undefined}>
              {l.label}
            </Link>
          ))}
        </nav>
        <WhatsAppButton href={waHref}>WhatsApp</WhatsAppButton>
      </div>
      <nav className="mobile" aria-label="Principal">
        <ul>
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} aria-current={isCurrent(l.href) ? 'page' : undefined}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
