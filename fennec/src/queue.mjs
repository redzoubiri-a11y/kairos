/**
 * Fennec — construction du plan d'écrans d'une session (logique pure).
 *
 * Contrairement aux maquettes `wireframes/fennec-maquette-*.html` (contenu
 * figé, écrit à la main pour la semaine S21), ce module construit le plan
 * d'une session à partir du **vrai référentiel** (catalog, tel que stocké
 * par fennec/src/db.mjs) et du **vrai état SRS** de l'élève (fennec/src/srs.mjs).
 * C'est la pièce qui relie les deux : sans dépendance DOM, donc testable
 * (fennec/test/queue.test.js) et réutilisée telle quelle par fennec/app/session.mjs
 * pour le rendu réel dans le navigateur.
 *
 * Deux temps :
 *   1. buildDailyQueue()   — via srs.selectDueWords/selectNewWords, décide
 *                            QUELS mots travailler aujourd'hui (Réveil + Nouveau).
 *   2. buildScreenPlan()   — décide QUEL TYPE d'écran pour chaque mot choisi,
 *                            et pré-calcule les distracteurs nécessaires.
 */

import { selectDueWords, selectNewWords, freshState } from './srs.mjs';

const REVIEW_LIMIT = 8;

/**
 * @param {Object} args
 * @param {Array<{wordId:number, english:string, french:string, category:string, introWeek:number, introDay:number}>} args.catalog
 * @param {Map<number, import('./srs.mjs').WordState>} args.states - état actuel par wordId (mots jamais vus absents de la map)
 * @param {number} args.currentWeek
 * @param {number} args.currentDay
 * @param {Date} args.now
 * @returns {{dueEntries: Array<{wordId:number, state:object}>, newWordIds: Array<number>}}
 */
function buildDailyQueue({ catalog, states, currentWeek, currentDay, now }) {
  const dueEntries = selectDueWords(
    [...states.entries()].map(([wordId, state]) => ({ wordId, state })),
    now,
    REVIEW_LIMIT
  );
  const newWordIds = selectNewWords(catalog, states, currentWeek, currentDay);
  return { dueEntries, newWordIds };
}

/**
 * Choisit `count` mots-leurres (distracteurs) de la même catégorie que
 * `word` quand c'est possible (pour rester plausible : pas de leurre
 * "structure" pour un mot "lexique"), sinon retombe sur n'importe quel
 * autre mot du catalogue. Déterministe si `rng` est fourni (tests), sinon
 * Math.random.
 *
 * @param {Array<object>} catalog
 * @param {object} word
 * @param {number} count
 * @param {() => number} [rng]
 */
function pickDistractors(catalog, word, count, rng = Math.random) {
  const sameCategory = catalog.filter((w) => w.wordId !== word.wordId && w.category === word.category);
  const pool = sameCategory.length >= count ? sameCategory : catalog.filter((w) => w.wordId !== word.wordId);
  return shuffle(pool, rng).slice(0, count);
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Détermine le type d'écran générique pour un mot, à partir de sa
 * catégorie — reproduit la logique du script (docs/script-semaine-type-s21.md) :
 * les décodables se lisent, les structures se construisent, le reste
 * alterne entre écoute, production orale et vrai/faux pour varier les
 * formats de rencontre (cf. principe "≥7 fois sous 4 formats" de l'analyse).
 *
 * @param {object} word
 * @returns {'read_touch'|'construct'|'listen_touch'|'say_it'|'true_false'}
 */
function screenKindFor(word) {
  if (word.category === 'décodable') return 'read_touch';
  if (word.category === 'structure') return 'construct';
  const rotation = ['listen_touch', 'say_it', 'true_false'];
  return rotation[word.wordId % rotation.length];
}

/**
 * Cherche si un nouveau son (grapheme) est introduit cette semaine — donnée
 * conçue à la conception (fennec/app/phonics.json, généré depuis la
 * progression documentée dans docs/curriculum-foundations-semaine-par-semaine.md),
 * pas déduite du catalogue. Convention : le son est introduit le jour 1 de
 * sa semaine (cohérent avec le script S21, où /sh/ apparaît dès le jour 1) —
 * une simplification documentée en l'absence d'un jour d'introduction propre
 * au phonics dans les données sources.
 *
 * @param {Array<{week:number, grapheme:string, example:string, exampleWordId:number}>} phonicsTable
 * @param {number} week
 * @param {number} day
 * @returns {object|null}
 */
function getPhonicsForDay(phonicsTable, week, day) {
  if (day !== 1) return null;
  return phonicsTable.find((p) => p.week === week) ?? null;
}

/**
 * Construit le plan d'écrans complet : Réveil (révisions dues) puis
 * Nouveau (un écran phonics si un son est introduit cette semaine, puis une
 * découverte + une pratique par mot nouveau). Chaque écran porte tout ce
 * qu'il faut pour se rendre sans re-consulter le catalogue : le mot, son
 * type, et ses distracteurs le cas échéant.
 *
 * @param {Object} args
 * @param {Array<{wordId:number, state:object}>} args.dueEntries
 * @param {Array<number>} args.newWordIds
 * @param {Array<object>} args.catalog
 * @param {{week:number, day:number}} [args.pointer] - pour le phonics ; omis = pas d'écran phonics
 * @param {Array<object>} [args.phonicsTable] - fennec/app/phonics.json
 * @param {() => number} [args.rng]
 * @returns {Array<object>} liste ordonnée d'écrans {phase, kind, word|grapheme, options?, isRetest}
 */
function buildScreenPlan({ dueEntries, newWordIds, catalog, pointer, phonicsTable, rng = Math.random }) {
  const byId = new Map(catalog.map((w) => [w.wordId, w]));
  const screens = [];

  for (const { wordId } of dueEntries) {
    const word = byId.get(wordId);
    if (!word) continue; // mot retiré du catalogue depuis son introduction
    screens.push(makeScreen('reveil', word, catalog, rng));
  }

  if (pointer && phonicsTable) {
    const phonics = getPhonicsForDay(phonicsTable, pointer.week, pointer.day);
    if (phonics) {
      const exampleWord = byId.get(phonics.exampleWordId) ?? null;
      screens.push({
        phase: 'nouveau', kind: 'phonics', isRetest: false,
        grapheme: phonics.grapheme, example: phonics.example, exampleWord,
      });
    }
  }

  for (const wordId of newWordIds) {
    const word = byId.get(wordId);
    if (!word) continue;
    screens.push({ phase: 'nouveau', kind: 'discover', word, isRetest: false });
    screens.push(makeScreen('nouveau', word, catalog, rng));
  }

  return screens;
}

/**
 * Construit le plan du Boss du jeudi (jour 5) : `count` défis piochant dans
 * les mots introduits pendant `week` (cf. "Pas de nouveau contenu" du
 * script), en boucle si la semaine compte moins de mots que `count`.
 * Chaque appel (premier essai ou variante après un échec) redonne un ordre
 * et des distracteurs différents — c'est ce qui tient lieu de "Market 2"
 * du script sans dupliquer de contenu écrit à la main par semaine.
 *
 * Ne modifie aucun état SRS : le Boss teste la maîtrise du contenu de la
 * semaine, il n'est pas un événement de révision au sens de srs.review().
 *
 * @param {Object} args
 * @param {Array<object>} args.catalog
 * @param {number} args.week
 * @param {number} [args.count=12] - nombre de défis (seuil de réussite : 80%, cf. srs.bossVerdict)
 * @param {() => number} [args.rng]
 * @returns {Array<object>} liste de défis {phase:'boss', kind, word, options?, tokens?}
 */
function buildBossPlan({ catalog, week, count = 12, rng = Math.random }) {
  const weekWords = catalog.filter((w) => w.introWeek === week);
  if (weekWords.length === 0) return [];

  const screens = [];
  let pool = [];
  let lastWordId = null;
  for (let i = 0; i < count; i++) {
    if (pool.length === 0) pool = shuffle(weekWords, rng);
    let word = pool.pop();
    // Évite de répéter le même mot deux défis de suite quand le pool se
    // renouvelle pile à cette frontière (visible seulement si peu de mots).
    if (word.wordId === lastWordId && pool.length > 0) {
      const swap = pool.pop();
      pool.push(word);
      word = swap;
    }
    lastWordId = word.wordId;
    screens.push(makeScreen('boss', word, catalog, rng));
  }
  return screens;
}

function makeScreen(phase, word, catalog, rng) {
  const kind = screenKindFor(word);
  const screen = { phase, kind, word, isRetest: false };
  if (kind === 'listen_touch' || kind === 'read_touch' || kind === 'true_false') {
    screen.options = [word, ...pickDistractors(catalog, word, kind === 'true_false' ? 1 : 2, rng)];
  }
  if (kind === 'construct') {
    screen.tokens = word.english.split(' ');
  }
  return screen;
}

/**
 * Insère une variante d'un écran raté 2 écrans plus loin dans le plan déjà
 * en cours d'exécution — reproduit la règle "erreur → re-test à +2 écrans"
 * du script. Prend le plan restant (déjà tronqué de l'écran courant) et y
 * insère le clone en position 2 (ou en fin si le plan restant est plus
 * court), marqué `isRetest`.
 *
 * @param {Array<object>} remainingScreens
 * @param {object} failedScreen
 * @returns {Array<object>} nouveau tableau (ne mute pas l'entrée)
 */
function insertRetest(remainingScreens, failedScreen) {
  const clone = { ...failedScreen, isRetest: true };
  const pos = Math.min(2, remainingScreens.length);
  const next = [...remainingScreens];
  next.splice(pos, 0, clone);
  return next;
}

export { buildDailyQueue, buildScreenPlan, buildBossPlan, pickDistractors, screenKindFor, getPhonicsForDay, insertRetest, freshState };
