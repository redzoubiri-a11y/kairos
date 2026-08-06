import fs from 'fs';
import path from 'path';
import fr from './fr';
import { EVENT_TYPES, RESERVATION_STATUS, AMENITIES } from '../lib/constants';

/**
 * `t()` renvoie la clé brute quand elle est absente du dictionnaire : le texte
 * « pro.switchSalle » s'affiche alors tel quel dans l'interface, sans erreur ni
 * avertissement. Ces tests transforment cette panne silencieuse en échec de
 * build.
 *
 * L'application est francophone depuis le retrait de l'arabe ; ces tests
 * gardent malgré tout leur raison d'être, puisqu'ils protègent l'unicité du
 * lieu où vivent les textes.
 */

/** Aplatit un dictionnaire imbriqué en chemins « a.b.c ». */
function flatten(obj, prefix = '') {
  const out = {};
  Object.entries(obj).forEach(([key, value]) => {
    const chemin = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(out, flatten(value, chemin));
    } else {
      out[chemin] = value;
    }
  });
  return out;
}

const PLAT_FR = flatten(fr);

const SRC = path.join(__dirname, '..');

/** Tous les fichiers .js de src/, hors tests. */
function sourceFiles(dir = SRC, acc = []) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const complet = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(complet, acc);
    else if (entry.name.endsWith('.js') && !entry.name.endsWith('.test.js')) acc.push(complet);
  });
  return acc;
}

/**
 * Clés littérales appelées dans le code : `t('a.b')` et `list('a.b')`.
 * Les clés construites — t(`events.${type}`) — sont ignorées : leur validité
 * dépend des données, et les familles concernées sont couvertes plus bas.
 */
function usedKeys() {
  const trouvees = new Map();
  sourceFiles().forEach((file) => {
    const code = fs.readFileSync(file, 'utf8');
    for (const m of code.matchAll(/\b(?:t|list)\(\s*'([a-zA-Z0-9_.]+)'/g)) {
      if (!trouvees.has(m[1])) trouvees.set(m[1], path.relative(SRC, file));
    }
  });
  return trouvees;
}

describe('clés utilisées dans le code', () => {
  const utilisees = usedKeys();

  test('le scan trouve bien des clés (garde-fou du test lui-même)', () => {
    expect(utilisees.size).toBeGreaterThan(100);
  });

  test('chaque clé littérale existe en français', () => {
    const manquantes = [...utilisees.entries()]
      .filter(([cle]) => !(cle in PLAT_FR))
      .map(([cle, fichier]) => `${cle} (${fichier})`);
    expect(manquantes).toEqual([]);
  });

  test('les listes ne sont jamais vides', () => {
    const vides = Object.entries(PLAT_FR)
      .filter(([, v]) => Array.isArray(v) && v.length === 0)
      .map(([k]) => k);
    expect(vides).toEqual([]);
  });
});

describe('textes en dur', () => {
  /**
   * L'application n'a plus qu'une langue, mais tous les textes visibles
   * restent regroupés dans fr.js : c'est là qu'on relit et corrige la copie.
   * Un libellé écrit en dur dans le JSX y échappe — et les libellés
   * d'accessibilité le plus longtemps, puisque personne ne les voit à
   * l'écran, seuls les lecteurs d'écran les annoncent.
   */
  test('aucun accessibilityLabel littéral', () => {
    const fautifs = [];
    sourceFiles().forEach((file) => {
      const code = fs.readFileSync(file, 'utf8');
      for (const m of code.matchAll(/accessibilityLabel=(["'])((?:(?!\1).)*)\1/g)) {
        fautifs.push(`${path.relative(SRC, file)} → ${m[2]}`);
      }
    });
    expect(fautifs).toEqual([]);
  });
});

describe('familles construites dynamiquement', () => {
  // Ces clés sont formées à l'exécution — t(`events.${type}`) — et échappent au
  // scan littéral. On les confronte aux constantes métier plutôt qu'à une liste
  // recopiée : ajouter un type d'événement fait échouer le test tant que son
  // libellé manque.
  const familles = {
    'events.': EVENT_TYPES,
    'status.': Object.values(RESERVATION_STATUS),
    'amenities.': AMENITIES,
  };

  Object.entries(familles).forEach(([prefixe, valeurs]) => {
    test(`${prefixe}* a bien un libellé`, () => {
      const manquantes = valeurs
        .filter((v) => !(`${prefixe}${v}` in PLAT_FR))
        .map((v) => `${prefixe}${v}`);
      expect(manquantes).toEqual([]);
    });
  });
});
