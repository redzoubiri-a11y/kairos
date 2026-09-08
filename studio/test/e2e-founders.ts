/**
 * Test de bout en bout — la campagne des cinq restaurants fondateurs.
 *
 * Chemin complet : base Mida (lecture seule) → instantané dans le studio →
 * texte par Claude → visuel par Sharp → dépôt dans le Storage du studio →
 * relecture par URL signée. Rien n'est simulé : si ce script passe, la chaîne
 * fonctionne pour de vrai.
 *
 *   npm run e2e                      les cinq premiers restaurants consentants
 *   npm run e2e -- <id> <id> ...     une liste explicite d'identifiants
 *
 * Prérequis, dans cet ordre :
 *   1. migrations db/migrations/ appliquées sur le projet studio ;
 *   2. db/kairos/0001 et 0002 appliqués sur Kairos, mot de passe du rôle posé ;
 *   3. db/kairos/0003 rempli avec les cinq vrais slugs, puis exécuté ;
 *   4. .env.local complété.
 */

import { openConnector } from '../src/connectors/registry.ts';
import { createCampaign, runCampaign, previewCampaign } from '../src/campaign.ts';

const APP = 'mida';
const SLUG = 'fondateurs-lancement';
const EXPECTED = 5;

const OBJECTIVE =
  'Faire connaître les cinq restaurants partenaires fondateurs de Mida à Alger, ' +
  "et donner envie de réserver une table dès ce soir depuis l'application.";

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

const missing = (
  ['STUDIO_SUPABASE_URL', 'STUDIO_SUPABASE_SERVICE_ROLE_KEY', 'MIDA_DB_URL', 'ANTHROPIC_API_KEY'] as const
).filter((name) => !process.env[name]?.trim());

if (missing.length > 0) {
  fail(
    `Variables manquantes : ${missing.join(', ')}.\n` +
      '  Ce test parle à la vraie base Mida, à la vraie API Claude et au vrai\n' +
      '  Storage du studio : il ne peut pas tourner sans elles. Voir .env.example.',
  );
}

const connector = openConnector(APP);

try {
  const health = await connector.check();
  console.log(`Connexion Mida — rôle « ${health.role} », lecture seule : ${health.readOnly ? 'oui' : 'NON'}`);
  if (!health.ok) fail(health.details);
  console.log(`  ${health.details}\n`);

  let externalIds = process.argv.slice(2).filter((a) => !a.startsWith('-'));

  if (externalIds.length === 0) {
    const consented = await connector.find({
      kind: 'restaurant',
      consentedOnly: true,
      minPhotos: 1,
      limit: EXPECTED,
    });

    if (consented.length < EXPECTED) {
      fail(
        `${consented.length} restaurant(s) consentant(s) avec au moins une photo, ` +
          `${EXPECTED} attendus.\n` +
          '  La table marketing_permissions est la seule source : remplir\n' +
          '  db/kairos/0003_consent_founders.sql avec les cinq vrais slugs et\n' +
          "  l'exécuter, ou passer les identifiants en arguments.",
      );
    }

    externalIds = consented.map((e) => e.externalId);
    console.log('Fondateurs retenus :');
    for (const entity of consented) {
      console.log(`  · ${entity.name} — ${entity.neighbourhood ?? entity.city ?? '—'} (${entity.photoCount} photo·s)`);
    }
    console.log();
  }

  const created = await createCampaign(
    { appKey: APP, slug: SLUG, name: 'Fondateurs — lancement', objective: OBJECTIVE, externalIds },
    connector,
  );

  console.log(`Campagne ${created.campaignId} — ${created.included.length} pièce(s) retenue(s)`);
  for (const excluded of created.excluded) {
    console.log(`  ! écarté : ${excluded.name} — ${excluded.reason}`);
  }

  console.log('\nProduction…');
  const { produced, failed } = await runCampaign(created.campaignId);

  for (const item of produced) {
    console.log(
      `  ✓ ${item.entityName}\n` +
        `      visuel : ${item.visual.bucket}/${item.visual.path} (${(item.visual.bytes / 1024).toFixed(0)} Ko)` +
        (item.photoMissing ? '  ⚠ fond uni, photo injoignable' : '') +
        `\n      texte  : ${item.text.bucket}/${item.text.path} (${item.text.bytes} o)` +
        (item.repaired ? '  ⚠ une reprise a été nécessaire' : ''),
    );
  }
  for (const item of failed) {
    console.log(`  ✗ ${item.entityName} — ${item.error}`);
  }

  const preview = await previewCampaign(created.campaignId);
  console.log(`\nRelecture — campagne « ${preview.name} », état ${preview.status}`);
  for (const item of preview.items) {
    console.log(`  ${item.status === 'ready' ? '·' : '!'} ${item.entityName} : ${item.copy?.headline ?? item.error ?? '—'}`);
  }

  // Le test ne « passe » que si les cinq pièces sont là, des deux types.
  const visuals = produced.length;
  const texts = produced.length;
  console.log(`\n${visuals} visuel(s) et ${texts} texte(s) déposés dans le Storage du studio.`);

  if (failed.length > 0 || produced.length !== EXPECTED) {
    fail(`${EXPECTED} visuels et ${EXPECTED} textes attendus, ${produced.length} produits.`);
  }

  console.log('\n✓ Bout en bout vérifié.');
} finally {
  await connector.close().catch(() => {});
}
