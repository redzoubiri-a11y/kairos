import type { MetadataRoute } from 'next'
import { getContent, locales } from '@/lib/content'

const PATHS = ['', 'offres', 'resultats', 'diagnostic', 'contact']

export default function sitemap(): MetadataRoute.Sitemap {
  const { site } = getContent('fr')

  return locales.flatMap((locale) =>
    PATHS.map((p) => ({
      url: `${site.baseUrl}/${locale}${p ? `/${p}` : ''}`,
      lastModified: new Date('2026-08-07'),
      changeFrequency: 'monthly' as const,
      priority: p === '' ? 1 : 0.8,
    })),
  )
}
