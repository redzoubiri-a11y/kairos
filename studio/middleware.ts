/**
 * Rien n'est servi sans cookie valide, sauf la page de connexion elle-même.
 *
 * Le contrôle est ici plutôt que dans chaque page : une page ajoutée un jour
 * sans y penser est protégée par défaut. L'inverse — protéger page par page —
 * laisse toujours passer celle qu'on oublie.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { configWeb, jetonValide, NOM_COOKIE } from './src/web/session.ts';

export async function middleware(request: NextRequest) {
  const config = configWeb();

  // Configuration absente : on refuse, on n'ouvre pas. Un studio qui servirait
  // ses campagnes en clair parce qu'une variable manque serait pire qu'un
  // studio injoignable.
  if (!config) {
    return new NextResponse(
      'Studio non configuré : STUDIO_WEB_PASSWORD et STUDIO_WEB_SECRET sont requis.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }

  if (request.nextUrl.pathname === '/connexion') return NextResponse.next();

  if (await jetonValide(request.cookies.get(NOM_COOKIE)?.value, config.secret)) {
    return NextResponse.next();
  }

  const cible = new URL('/connexion', request.url);
  return NextResponse.redirect(cible);
}

export const config = {
  // Tout, sauf les fichiers internes de Next et le favicon : les pages, les
  // routes, et les images servies.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
