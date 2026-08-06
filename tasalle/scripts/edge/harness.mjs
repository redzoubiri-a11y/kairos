// Banc d'essai des fonctions Edge de Tasalle.
//
// Deno n'est pas installable ici : le proxy refuse deno.land. Les fonctions
// sont donc compilées puis exécutées sous Node, avec des adaptateurs pour les
// deux seules API Deno qu'elles utilisent — `Deno.env` et `Deno.serve` — et
// une réécriture des imports par URL vers leurs équivalents npm.
//
// Ce que cela prouve : la logique s'exécute (vérification de signature,
// analyse du payload, choix du fournisseur, boucle d'expédition, comptage des
// tentatives). Ce que cela ne prouve pas : la compatibilité avec le runtime
// Deno lui-même. Les deux API utilisées sont standard et l'import distant est
// le seul point qui diffère.

import { build } from 'esbuild';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import fs from 'node:fs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '../..');
const FONCTIONS = path.join(RACINE, 'supabase/functions');

// Le bundle doit rester dans le projet : depuis /tmp, Node ne saurait pas
// résoudre les paquets npm vers lesquels les imports par URL sont réécrits.
const SORTIE = path.join(RACINE, 'node_modules/.cache/tasalle-edge');

/** Les imports par URL des fonctions Deno, vers leurs paquets npm. */
const EQUIVALENTS = {
  'https://esm.sh/standardwebhooks@1.0.0': 'standardwebhooks',
  'https://esm.sh/@supabase/supabase-js@2': '@supabase/supabase-js',
};

const reecritureURL = {
  name: 'reecriture-imports-url',
  setup(build) {
    build.onResolve({ filter: /^https:\/\// }, (args) => {
      const npm = EQUIVALENTS[args.path];
      if (!npm) throw new Error(`Import distant non prévu : ${args.path}`);
      return { path: npm, external: true };
    });
  },
};

/** Compile une fonction et renvoie le chemin du module Node produit. */
export async function compiler(nom) {
  fs.mkdirSync(SORTIE, { recursive: true });
  const dest = path.join(SORTIE, `${nom}.mjs`);
  await build({
    entryPoints: [path.join(FONCTIONS, nom, 'index.ts')],
    outfile: dest,
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    plugins: [reecritureURL],
    logLevel: 'silent',
  });
  return dest;
}

/**
 * Charge une fonction avec un environnement donné et rend son gestionnaire.
 * `Deno.serve` est détourné pour capturer le gestionnaire au lieu d'ouvrir
 * un port.
 */
export async function charger(nom, env) {
  const dest = await compiler(nom);
  let gestionnaire = null;

  globalThis.Deno = {
    env: { get: (cle) => env[cle] },
    serve: (h) => {
      gestionnaire = h;
      return { finished: Promise.resolve() };
    },
  };

  // Import frais à chaque appel : l'environnement est lu au chargement.
  await import(`${pathToFileURL(dest).href}?v=${Math.random()}`);
  if (!gestionnaire) throw new Error(`${nom} n'a pas appelé Deno.serve`);
  return gestionnaire;
}
