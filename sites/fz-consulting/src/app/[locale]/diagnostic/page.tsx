import type { Metadata } from 'next'
import Diagnostic from '@/components/Diagnostic'
import { getContent, isLocale, defaultLocale, type Locale } from '@/lib/content'
import { waLink } from '@/lib/whatsapp'

export const metadata: Metadata = {
  title: 'Auto-diagnostic — maturité de votre fonction achats',
  description:
    "20 questions, 5 minutes, résultat immédiat : un score de maturité par phase et les chantiers à ouvrir en priorité.",
}

export default async function DiagnosticPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  const locale: Locale = isLocale(raw) ? raw : defaultLocale
  const { site, diagnostic } = getContent(locale)

  return (
    <section className="band">
      <div className="wrap">
        <Diagnostic content={diagnostic} waHref={waLink(site.whatsapp, 'diagnostic')} />
      </div>
    </section>
  )
}
