import fs from 'fs';
import path from 'path';
import fr from './fr';
import ar from './ar';
import { EVENT_TYPES, RESERVATION_STATUS, AMENITIES } from '../lib/constants';

/**
 * `t()` renvoie la clé brute quand elle est absente du dictionnaire : le texte
 * « pro.switchSalle » s'affiche alors tel quel dans l'interface, sans erreur ni
 * avertissement. Ces tests transforment cette panne silencieuse en échec de
 * build.
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
const PLAT_AR = flatten(ar);

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

describe('dictionnaires', () => {
  test('le français et l’arabe couvrent exactement les mêmes clés', () => {
    const seulementFr = Object.keys(PLAT_FR).filter((k) => !(k in PLAT_AR));
    const seulementAr = Object.keys(PLAT_AR).filter((k) => !(k in PLAT_FR));
    expect({ seulementFr, seulementAr }).toEqual({ seulementFr: [], seulementAr: [] });
  });

  test('aucune valeur vide', () => {
    const vides = Object.entries(PLAT_FR)
      .concat(Object.entries(PLAT_AR))
      .filter(([, v]) => typeof v === 'string' && v.trim() === '')
      .map(([k]) => k);
    expect(vides).toEqual([]);
  });

  /**
   * Un jeton présent en arabe mais absent du français s'affiche tel quel :
   * les appels sont écrits en regard du dictionnaire français, la valeur n'est
   * donc jamais fournie. L'inverse est sans risque — et légitime pour {{s}},
   * la marque du pluriel français, que l'arabe n'utilise pas.
   */
  test('l’arabe ne référence aucun jeton absent du français', () => {
    const jetons = (s) => (typeof s === 'string' ? s.match(/\{\{\w+\}\}/g) || [] : []);
    const orphelins = Object.keys(PLAT_AR)
      .filter((k) => k in PLAT_FR)
      .flatMap((k) => {
        const cote_fr = jetons(PLAT_FR[k]);
        return jetons(PLAT_AR[k])
          .filter((j) => !cote_fr.includes(j))
          .map((j) => `${k} → ${j}`);
      });
    expect(orphelins).toEqual([]);
  });

  test('le français n’ajoute que {{s}} — la marque du pluriel', () => {
    const jetons = (s) => (typeof s === 'string' ? s.match(/\{\{\w+\}\}/g) || [] : []);
    const surplus = Object.keys(PLAT_FR)
      .filter((k) => k in PLAT_AR)
      .flatMap((k) => {
        const cote_ar = jetons(PLAT_AR[k]);
        return jetons(PLAT_FR[k])
          .filter((j) => j !== '{{s}}' && !cote_ar.includes(j))
          .map((j) => `${k} → ${j}`);
      });
    expect(surplus).toEqual([]);
  });
});

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

  test('chaque clé littérale existe en arabe', () => {
    const manquantes = [...utilisees.entries()]
      .filter(([cle]) => !(cle in PLAT_AR))
      .map(([cle, fichier]) => `${cle} (${fichier})`);
    expect(manquantes).toEqual([]);
  });
});

describe('textes en dur', () => {
  /**
   * Un libellé écrit en toutes lettres dans le JSX ne se traduit jamais :
   * l'écran reste français en mode arabe. Les libellés d'accessibilité y
   * échappaient le plus longtemps — personne ne les voit à l'écran, seuls les
   * lecteurs d'écran les annoncent.
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

describe('clés à valeur de liste', () => {
  // Mois, jours, réponses rapides : `list()` les rend telles quelles. Une
  // liste plus courte d'un côté tronque silencieusement l'affichage.
  const listes = Object.keys(PLAT_FR).filter((k) => Array.isArray(PLAT_FR[k]));

  test('le scan trouve bien des listes (garde-fou du test lui-même)', () => {
    expect(listes.length).toBeGreaterThan(0);
  });

  test('même longueur dans les deux langues', () => {
    const divergentes = listes
      .filter((k) => Array.isArray(PLAT_AR[k]))
      .filter((k) => PLAT_FR[k].length !== PLAT_AR[k].length)
      .map((k) => `${k} (fr ${PLAT_FR[k].length} ≠ ar ${PLAT_AR[k].length})`);
    expect(divergentes).toEqual([]);
  });

  test('aucune entrée vide', () => {
    const vides = listes.flatMap((k) =>
      [
        ...(PLAT_FR[k] || []).map((v, i) => [`fr:${k}[${i}]`, v]),
        ...(PLAT_AR[k] || []).map((v, i) => [`ar:${k}[${i}]`, v]),
      ]
        .filter(([, v]) => typeof v !== 'string' || v.trim() === '')
        .map(([nom]) => nom)
    );
    expect(vides).toEqual([]);
  });

  // Ces deux listes sont choisies par une ternaire — `list(estPro ? a : b)` —
  // que le scan littéral ne voit pas.
  test('les réponses rapides existent pour les deux rôles', () => {
    ['messages.quickClient', 'messages.quickPro'].forEach((cle) => {
      expect(Array.isArray(PLAT_FR[cle])).toBe(true);
      expect(Array.isArray(PLAT_AR[cle])).toBe(true);
      expect(PLAT_FR[cle].length).toBeGreaterThan(0);
    });
  });
});

describe('familles construites dynamiquement', () => {
  // Ces clés sont formées à l'exécution — t(`events.${type}`) — et échappent au
  // scan littéral. On les confronte aux constantes métier plutôt qu'à une liste
  // recopiée : ajouter un type d'événement fera échouer le test tant que les
  // deux traductions manquent.
  const familles = {
    'events.': EVENT_TYPES,
    'status.': Object.values(RESERVATION_STATUS),
    'amenities.': AMENITIES,
  };

  Object.entries(familles).forEach(([prefixe, valeurs]) => {
    test(`${prefixe}* est traduit dans les deux langues`, () => {
      const manquantes = [];
      valeurs.forEach((v) => {
        if (!(`${prefixe}${v}` in PLAT_FR)) manquantes.push(`fr:${prefixe}${v}`);
        if (!(`${prefixe}${v}` in PLAT_AR)) manquantes.push(`ar:${prefixe}${v}`);
      });
      expect(manquantes).toEqual([]);
    });
  });
});
