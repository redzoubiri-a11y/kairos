import Link from 'next/link';
import { previewCampaign, langueCampagne } from '../../../src/campaign.ts';
import type { Locale } from '../../../src/types.ts';
import { relancerCampagne } from './relancer.ts';

export const dynamic = 'force-dynamic';

/** Les clés du texte, dans l'ordre où elles se lisent (spec § 3.3). */
const ORDRE = [
  'headline',
  'subline',
  'badge',
  'call_to_action',
  'caption',
  'hashtags',
  'alt_text',
] as const;

function valeur(v: unknown): string {
  return Array.isArray(v) ? v.join(' ') : String(v ?? '');
}

export default async function Campagne({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let campagne;
  let locale: Locale = 'fr';
  try {
    campagne = await previewCampaign(id);
    locale = await langueCampagne(id);
  } catch (erreur) {
    return (
      <main>
        <p><Link href="/">← Campagnes</Link></p>
        <p className="erreur" role="alert">
          {erreur instanceof Error ? erreur.message : String(erreur)}
        </p>
      </main>
    );
  }

  return (
    <main>
      <p><Link href="/">← Campagnes</Link></p>
      <h1 lang={locale}>{campagne.name}</h1>
      <p className="meta">
        <code>{campagne.slug}</code>
        <span className={`etat etat-${campagne.status}`}>{campagne.status}</span>
      </p>

      {/* runCampaign() retraite toutes les pièces, pas seulement celles en
          échec : relancer une campagne de sept entités en rappelle sept,
          jetons Anthropic compris. Averti ici plutôt que caché. */}
      <form action={async () => { 'use server'; await relancerCampagne(id); }}>
        <button type="submit" className="relancer">
          Relancer toute la campagne
        </button>
        <p className="avertissement">
          Régénère le texte et les visuels de TOUTES les pièces, y compris
          celles déjà prêtes — pas seulement celles en échec.
        </p>
      </form>

      {campagne.items.map((piece, i) => (
        <section className="piece" key={i}>
          <h2 lang={locale}>{piece.entityName}</h2>
          <p className="meta">
            <span className={`etat etat-${piece.status}`}>{piece.status}</span>
          </p>

          {piece.error ? <p className="erreur" role="alert">{piece.error}</p> : null}

          <div className="rendus">
            {/* Les seaux sont privés : ces URL sont signées et expirent. D'où
                <img> plutôt que next/image, qui voudrait les optimiser et les
                remettre en cache sous une adresse à lui. */}
            {piece.visualUrl ? (
              <img
                src={piece.visualUrl}
                alt={valeur(piece.copy?.alt_text) || `Visuel — ${piece.entityName}`}
                width={540}
                height={540}
              />
            ) : null}

            {piece.videoUrl ? (
              <video src={piece.videoUrl} controls preload="metadata" width={304} height={540} />
            ) : null}
          </div>

          {piece.copy ? (
            <dl className="copie" lang={locale}>
              {ORDRE.filter((cle) => piece.copy?.[cle] !== undefined).map((cle) => (
                <div key={cle}>
                  <dt>{cle}</dt>
                  <dd>{valeur(piece.copy?.[cle])}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="vide">Aucun texte enregistré pour cette pièce.</p>
          )}
        </section>
      ))}
    </main>
  );
}
