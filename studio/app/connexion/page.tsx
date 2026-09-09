import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  configWeb,
  creerJeton,
  DUREE_SECONDES,
  egalConstant,
  NOM_COOKIE,
} from '../../src/web/session.ts';

export const dynamic = 'force-dynamic';

async function entrer(formData: FormData) {
  'use server';

  const config = configWeb();
  if (!config) redirect('/connexion?erreur=1');

  const propose = String(formData.get('mot_de_passe') ?? '');
  if (!(await egalConstant(propose, config.motDePasse))) {
    redirect('/connexion?erreur=1');
  }

  (await cookies()).set(NOM_COOKIE, await creerJeton(config.secret), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DUREE_SECONDES,
  });
  redirect('/');
}

export default async function Connexion({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <main className="porte">
      <form action={entrer}>
        <h1>Kairos Studio</h1>
        <label htmlFor="mot_de_passe">Mot de passe</label>
        <input
          id="mot_de_passe"
          name="mot_de_passe"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
        />
        {/* Message unique : distinguer « mauvais mot de passe » de « pas
            configuré » renseignerait sur l'état du serveur. */}
        {erreur ? <p role="alert">Accès refusé.</p> : null}
        <button type="submit">Entrer</button>
      </form>
    </main>
  );
}
