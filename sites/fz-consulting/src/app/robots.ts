import type { MetadataRoute } from 'next'
import { getContent } from '@/lib/content'
import { DRAFT } from '@/lib/draft'

export default function robots(): MetadataRoute.Robots {
  const { site } = getContent('fr')

  // Tant que le site est en maquette, on interdit l'indexation.
  if (DRAFT) return { rules: { userAgent: '*', disallow: '/' } }

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${site.baseUrl}/sitemap.xml`,
  }
}
