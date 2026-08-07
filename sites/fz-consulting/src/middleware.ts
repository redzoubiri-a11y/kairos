import { NextResponse, type NextRequest } from 'next/server'

/**
 * Préfixe de langue.
 *
 * Toutes les URL portent leur langue (/fr/offres). L'arabe s'ajoutera en
 * déclarant 'ar' dans locales : aucune URL existante ne changera, ce qui est
 * exactement ce que le plan exige (partie 3.3).
 */

const LOCALES = ['fr'] as const
const DEFAULT_LOCALE = 'fr'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))
  if (hasLocale) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  // On laisse passer les fichiers techniques et les routes d'API.
  matcher: ['/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
}
