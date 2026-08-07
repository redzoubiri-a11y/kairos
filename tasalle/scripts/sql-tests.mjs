/**
 * Applique le schéma sur une base vierge, puis exécute les suites SQL en
 * rendant leur résultat exploitable par une machine.
 *
 *   createdb tasalle_test
 *   DATABASE_URL=postgres:///tasalle_test node scripts/sql-tests.mjs
 *
 * Pourquoi ce script : `psql` sort en 0 même quand une assertion vaut faux.
 * Les suites affichent bien `t` / `f` et des NOTICE « OK » / « ÉCHEC », mais
 * rien ne les lisait — elles ne protégeaient donc que si quelqu'un relisait la
 * sortie. Ici, un seul `f` ou un seul « ÉCHEC » fait échouer la commande.
 *
 * La base est supposée vide : le script y applique le préambule local, les
 * migrations dans l'ordre, puis les suites. En intégration continue, le
 * conteneur PostgreSQL en fournit une neuve à chaque exécution.
 */
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const SUPABASE = path.join(RACINE, 'supabase');

const URL_BASE = process.env.DATABASE_URL;
if (!URL_BASE) {
  console.error('DATABASE_URL est requis.');
  process.exit(2);
}

/**
 * Exécute un fichier SQL et rend sa sortie complète.
 *
 * stdout ET stderr : les assertions qui doivent intercepter une exception
 * s'expriment en `raise notice`, donc sur stderr. Ne lire que stdout les
 * passait sous silence — onze contrôles sur cinquante-sept.
 */
function psql(fichier, { strict = false } = {}) {
  const args = ['-d', URL_BASE, '-A', '-F', '|', '-f', fichier];
  if (strict) args.unshift('-v', 'ON_ERROR_STOP=1');

  const r = spawnSync('psql', args, { encoding: 'utf8' });
  const sortie = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;

  if (strict && r.status !== 0) {
    console.error(`\nÉchec sur ${path.relative(RACINE, fichier)} :`);
    console.error(sortie.trim());
    process.exit(1);
  }
  return sortie;
}

// ── Schéma ────────────────────────────────────────────────────────────────

console.log('Préambule et migrations');
psql(path.join(SUPABASE, 'tests/_bootstrap_local.sql'), { strict: true });

const migrations = readdirSync(path.join(SUPABASE, 'migrations'))
  .filter((f) => f.endsWith('.sql'))
  .sort();

for (const m of migrations) {
  psql(path.join(SUPABASE, 'migrations', m), { strict: true });
  console.log(`  ✓ ${m}`);
}

// ── Suites ────────────────────────────────────────────────────────────────

// L'ordre compte : multi_salles.sql réutilise le jeu d'essai de
// business_rules.sql plutôt que de le recréer.
const SUITES = ['business_rules', 'lifecycle', 'admin', 'multi_salles', 'promo_codes', 'referrals'];

let totalOk = 0;
let totalKo = 0;

for (const suite of SUITES) {
  const sortie = psql(path.join(SUPABASE, 'tests', `${suite}.sql`));
  const lignes = sortie.split('\n');

  // Deux formes d'assertion coexistent : une colonne booléenne pour les
  // vérifications simples, un NOTICE pour celles qui doivent intercepter une
  // exception (un PIN refusé, une salle d'autrui).
  const vrais = lignes.filter((l) => /\|t$/.test(l)).length;
  const faux = lignes.filter((l) => /\|f$/.test(l));
  const noticesOk = lignes.filter((l) => / OK\s*$/.test(l)).length;
  const noticesKo = lignes.filter((l) => /ÉCHEC/.test(l));

  // Une erreur PostgreSQL au milieu d'une suite fausserait le décompte.
  const erreurs = lignes.filter((l) => /^psql:.*(ERROR|FATAL)/.test(l));

  const ok = vrais + noticesOk;
  const ko = faux.length + noticesKo.length + erreurs.length;
  totalOk += ok;
  totalKo += ko;

  console.log(`\n${suite} : ${ok} passées, ${ko} en échec`);
  [...faux, ...noticesKo, ...erreurs].forEach((l) => console.log(`  ✗ ${l.trim()}`));

  if (ok === 0) {
    console.log('  ✗ aucune assertion exécutée — la suite n’a probablement pas tourné');
    totalKo += 1;
  }
}

console.log(`\n${totalOk} assertions passées, ${totalKo} en échec`);
process.exit(totalKo === 0 ? 0 : 1);
