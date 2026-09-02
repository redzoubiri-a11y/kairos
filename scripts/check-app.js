#!/usr/bin/env node
/**
 * Vérification statique de Mida : syntaxe, identifiants non résolus, jetons
 * de thème inexistants. N'exécute rien — remplace le seul filet qui
 * existait jusqu'ici pour ce genre d'erreur : la relecture humaine.
 *
 * Ce que ça attrape en pratique : une destructuration oubliée après avoir
 * ajouté `erreur`/`reessayer` au retour d'un hook (l'écran plante à
 * l'exécution, jamais à l'import), et une couleur inventée qui compile mais
 * s'affiche `undefined`. Deux erreurs de ce type ont été injectées puis
 * retirées pour éprouver ce script avant de l'ajouter à la CI — voir
 * l'historique du commit qui l'introduit.
 *
 * Ne couvre PAS : le comportement à l'exécution. `npx expo export` (le job
 * CI qui suit celui-ci) compile réellement le graphe de modules et attrape
 * les imports cassés ; aucun des deux ne remplace un test sur appareil.
 *
 * Lancement : npm run check
 */
const fs = require('fs');
const path = require('path');
const parser   = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const RACINE = path.join(__dirname, '..');

// Le dépôt héberge trois projets ; celui-ci ne vérifie que Mida (racine +
// src/screens/scripts), jamais allotruck/ ni tasalle/, qui ont leurs
// propres CI. `data/` est exclu aussi : fixtures JSON consommées par des
// scripts d'import manuels, jamais par l'app.
const EXCLUS = /^(allotruck|tasalle|sites|docs|data|node_modules|\.git|test-results)\//;

function* fichiers(dossier) {
  for (const nom of fs.readdirSync(dossier)) {
    const chemin = path.join(dossier, nom);
    const rel = path.relative(RACINE, chemin);
    if (EXCLUS.test(rel + '/')) continue;
    const st = fs.statSync(chemin);
    if (st.isDirectory()) yield* fichiers(chemin);
    else if (nom.endsWith('.js')) yield rel;
  }
}

// Jetons réellement exportés par src/theme.js, lus dans le fichier lui-même
// plutôt que recopiés ici : une nouvelle entrée de thème n'a jamais besoin
// de mise à jour de ce script.
const themeSrc = fs.readFileSync(path.join(RACINE, 'src/theme.js'), 'utf8');
function jetonsDe(nomExport) {
  const debut = themeSrc.indexOf(`export const ${nomExport}`);
  if (debut < 0) return null;
  let profondeur = 0, fin = debut;
  for (let j = themeSrc.indexOf('{', debut); j < themeSrc.length; j++) {
    if (themeSrc[j] === '{') profondeur++;
    if (themeSrc[j] === '}') { profondeur--; if (profondeur === 0) { fin = j; break; } }
  }
  return new Set([...themeSrc.slice(debut, fin).matchAll(/^\s{2}(\w+)\s*:/gm)].map((m) => m[1]));
}
const JETONS = { colors: jetonsDe('colors'), spacing: jetonsDe('spacing'),
                 radius: jetonsDe('radius'), typography: jetonsDe('typography') };

const GLOBAUX = new Set([
  'console', 'JSON', 'Math', 'Date', 'Object', 'Array', 'Number', 'String',
  'Boolean', 'Set', 'Map', 'Promise', 'globalThis', 'window', 'require', 'module',
  'process', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'fetch',
  'FormData', 'Blob', 'URL', 'TextEncoder', 'atob', 'btoa', '__DEV__', '__dirname',
  '__filename', 'encodeURIComponent', 'decodeURIComponent', 'URLSearchParams',
  'undefined', 'NaN', 'Infinity', 'isNaN', 'parseInt', 'parseFloat', 'Error',
  'Symbol', 'WeakMap', 'WeakSet', 'RegExp',
]);

let echecsSyntaxe = 0, echecsIdent = 0, echecsJeton = 0, total = 0;
const rapport = [];

for (const f of fichiers(RACINE)) {
  total++;
  const chemin = path.join(RACINE, f);
  const src = fs.readFileSync(chemin, 'utf8');
  let ast;
  try {
    ast = parser.parse(src, { sourceType: 'module', plugins: ['jsx'] });
  } catch (e) {
    echecsSyntaxe++;
    rapport.push(`✕ ${f} — syntaxe : ${e.message.split('\n')[0]}`);
    continue;
  }

  traverse(ast, {
    ReferencedIdentifier(chem) {
      const nom = chem.node.name;
      if (GLOBAUX.has(nom)) return;
      if (chem.scope.hasBinding(nom, true)) return;
      echecsIdent++;
      rapport.push(`✕ ${f}:${chem.node.loc.start.line} — identifiant non résolu : ${nom}`);
    },
  });

  // Ne suit que les liaisons d'IMPORT de src/theme(.js) pour colors/spacing/
  // radius/typography — une variable locale du même nom (qui masque
  // l'import, ex. BottomTabBar.js : `const colors = C` dans une fonction)
  // n'a plus rien à voir avec le thème et ne doit pas être vérifiée.
  const liaisonsTheme = new Set();
  traverse(ast, {
    ImportDeclaration(chem) {
      if (!/\/theme(\.js)?$/.test(chem.node.source.value)) return;
      for (const spec of chem.node.specifiers) {
        if (spec.type !== 'ImportSpecifier') continue;
        if (!JETONS[spec.imported.name]) continue;
        const binding = chem.scope.getBinding(spec.local.name);
        if (binding) liaisonsTheme.add(binding.identifier);
      }
    },
  });

  traverse(ast, {
    MemberExpression(chem) {
      const { object, property, computed } = chem.node;
      if (computed || object.type !== 'Identifier' || property.type !== 'Identifier') return;
      const binding = chem.scope.getBinding(object.name);
      if (!binding || !liaisonsTheme.has(binding.identifier)) return;
      if (binding.path.node.type !== 'ImportSpecifier') return;
      const nomJeton = binding.path.node.imported.name;
      const table = JETONS[nomJeton];
      if (table && !table.has(property.name)) {
        echecsJeton++;
        rapport.push(`✕ ${f}:${chem.node.loc.start.line} — jeton inexistant : ${nomJeton}.${property.name}`);
      }
    },
  });
}

console.log(`${total} fichiers passés en revue (Mida uniquement — allotruck/, tasalle/, sites/, docs/, data/ exclus)`);

if (rapport.length) {
  console.error(`\n${rapport.length} problème(s) :`);
  rapport.forEach((l) => console.error('  ' + l));
  console.error(`\n  syntaxe : ${echecsSyntaxe} · identifiants : ${echecsIdent} · jetons de thème : ${echecsJeton}`);
  process.exit(1);
}

console.log('\n✓ syntaxe, identifiants et jetons de thème : OK');
