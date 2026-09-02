/**
 * Deux règles que la relecture humaine laisse passer.
 *
 * 1. Parité fr/ar. Une clé présente d'un seul côté retombe silencieusement
 *    sur le français : l'écran ne plante pas, personne ne le voit, et la
 *    version arabe reste en français indéfiniment.
 *
 * 2. Glyphes directionnels écrits en dur. RTL inverse une liste fermée de
 *    propriétés de style ; il n'inverse **ni les caractères, ni transform**.
 *    Une flèche « ← » dans le code pointe donc à contresens en arabe. Les
 *    constantes de `src/i18n` (FLECHE_RETOUR, FLECHE_AVANT, CHEVRON) sont
 *    lues depuis `I18nManager.isRTL` et règlent le problème — encore
 *    faut-il les utiliser.
 *
 * Lancement : npm run check:i18n
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const erreurs = [];

// ── 1. Parité des dictionnaires ──────────────────────────────────────────
function clesDe(fichier) {
  const cles = new Set();
  let section = null;
  for (const ligne of readFileSync(join(RACINE, fichier), 'utf8').split('\n')) {
    const debutSection = ligne.match(/^ {2}(\w+): \{/);
    if (debutSection) { section = debutSection[1]; continue; }
    const cle = ligne.match(/^ {4}(\w+):/);
    if (cle && section) cles.add(`${section}.${cle[1]}`);
  }
  return cles;
}

const fr = clesDe('src/i18n/fr.js');
const ar = clesDe('src/i18n/ar.js');
for (const c of [...fr].filter((c) => !ar.has(c)).sort())
  erreurs.push(`clé absente de ar.js : ${c}`);
for (const c of [...ar].filter((c) => !fr.has(c)).sort())
  erreurs.push(`clé absente de fr.js : ${c}`);

// ── 2. Glyphes directionnels hors du module i18n ─────────────────────────
const DIRECTIONNELS = /[←→‹›◀▶⬅➡⬆⬇↑↓⟨⟩]/;

function* fichiers(dossier) {
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) {
      if (nom === 'node_modules' || nom === '.git') continue;
      yield* fichiers(chemin);
    } else if (nom.endsWith('.js')) {
      yield chemin;
    }
  }
}

for (const chemin of fichiers(RACINE)) {
  const rel = relative(RACINE, chemin);
  if (rel.startsWith('src/i18n') || rel.startsWith('scripts')) continue;
  readFileSync(chemin, 'utf8').split('\n').forEach((ligne, i) => {
    const trouve = ligne.match(DIRECTIONNELS);
    if (trouve)
      erreurs.push(
        `${rel}:${i + 1} — glyphe « ${trouve[0]} » en dur ; utiliser ` +
        `FLECHE_RETOUR / FLECHE_AVANT / CHEVRON de src/i18n`
      );
  });
}

// ── Rapport ──────────────────────────────────────────────────────────────
console.log(`${fr.size} clés fr · ${ar.size} clés ar`);
if (erreurs.length) {
  console.error(`\n${erreurs.length} problème(s) :`);
  erreurs.forEach((e) => console.error(`  ✕ ${e}`));
  process.exit(1);
}
console.log('\n✓ parité fr/ar et glyphes directionnels : OK');
