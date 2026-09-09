import Link from 'next/link';
import { listCampaigns } from '../src/campaign.ts';

// La page lit la base à chaque affichage : rien à pré-rendre, et le build ne
// doit pas exiger les variables d'environnement.
export const dynamic = 'force-dynamic';

const DATE = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export default async function Campagnes() {
  let campagnes;
  try {
    campagnes = await listCampaigns();
  } catch (erreur) {
    // Une base injoignable est un état à afficher, pas une page blanche : c'est
    // le cas le plus probable tant que le projet Supabase n'existe pas.
    return (
      <main>
        <h1>Campagnes</h1>
        <p className="erreur" role="alert">
          {erreur instanceof Error ? erreur.message : String(erreur)}
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Campagnes</h1>

      {campagnes.length === 0 ? (
        <p className="vide">
          Aucune campagne. Elles se créent par le serveur MCP, avec
          <code> create_campaign</code>.
        </p>
      ) : (
        <ul className="liste">
          {campagnes.map((c) => (
            <li key={c.id}>
              <Link href={`/campagnes/${c.id}`}>
                <span className="nom">{c.name}</span>
                <span className="meta">
                  <code>{c.slug}</code>
                  <span className={`etat etat-${c.status}`}>{c.status}</span>
                  <span lang={c.locale}>{c.locale === 'ar' ? 'arabe' : 'français'}</span>
                  <span>{c.items} pièce{c.items > 1 ? 's' : ''}</span>
                  <time dateTime={c.createdAt}>{DATE.format(new Date(c.createdAt))}</time>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
