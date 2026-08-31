/**
 * Fennec — moteur de répétition espacée (SRS).
 *
 * Module pur, sans dépendance : mêmes entrées → mêmes sorties, aucun accès
 * réseau ni stockage. C'est ce qui le rend utilisable hors-ligne (fennec/src/db.mjs
 * l'appelle depuis IndexedDB) et testable sans backend (fennec/test/srs.test.js).
 *
 * Algorithme : SM-2 simplifié avec palier fixe d'intervalles, conforme au
 * calendrier nominal décrit dans data/foundations-banque-mots.json et
 * docs/curriculum-foundations-semaine-par-semaine.md :
 *   J+1, J+3, J+7, J+16, J+35 après l'introduction, en jours calendaires réels
 *   (le calendrier du curriculum raisonne en semaines scolaires pour la
 *   conception ; le moteur runtime raisonne en jours réels à partir de la
 *   date effective d'introduction de CET élève, qui peut différer du plan
 *   nominal si l'élève est en avance/retard).
 *
 * Un item est "maîtrisé" après la 5e réussite consécutive suivant ce palier
 * (reps_ok >= STEPS.length). Un échec ne réinitialise pas tout : il fait
 * reculer d'un cran (jamais sous 0) et redémarre le compte de réussites
 * consécutives — cohérent avec la règle du script : "une révision ratée fait
 * reculer l'item d'un cran, non modélisé comme un retour à zéro".
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Paliers d'intervalles en jours, du premier au dernier avant maîtrise. */
const STEPS = Object.freeze([1, 3, 7, 16, 35]);

/** Nombre de réussites espacées nécessaires pour qu'un mot soit "maîtrisé". */
const MASTERY_REPS = STEPS.length;

/**
 * État SRS d'un item pour un élève donné. Reflète une ligne de la table
 * `student_word_state` (voir fennec/supabase/migrations/0001_schema.sql),
 * en camelCase et avec des Date au lieu de timestamps texte.
 *
 * @typedef {Object} WordState
 * @property {number} step          - index dans STEPS (0 = première échéance à venir)
 * @property {number} repsOk        - réussites consécutives depuis le dernier échec
 * @property {Date|null} dueAt      - prochaine échéance (null = pas encore introduit)
 * @property {Date|null} introducedAt
 * @property {Date|null} masteredAt - non-null une fois maîtrisé
 * @property {boolean|null} lastResult
 */

/** État initial pour un mot qui n'a jamais été vu. */
function freshState() {
  return {
    step: 0,
    repsOk: 0,
    dueAt: null,
    introducedAt: null,
    masteredAt: null,
    lastResult: null,
  };
}

/**
 * Introduit un mot : programme sa première révision à J+STEPS[0].
 * Appelé une seule fois, à l'écran "Nouveau" de la session (cf. script S21).
 *
 * @param {Date} now
 * @returns {WordState}
 */
function introduce(now) {
  return {
    step: 0,
    repsOk: 0,
    dueAt: addDays(now, STEPS[0]),
    introducedAt: now,
    masteredAt: null,
    lastResult: null,
  };
}

/**
 * Enregistre le résultat d'une révision et calcule le nouvel état.
 *
 * - Réussite : avance d'un cran dans STEPS (ou reste au dernier cran en
 *   boucle courte si déjà au maximum, ce qui ne devrait pas arriver car la
 *   5e réussite marque la maîtrise) ; incrémente repsOk ; si repsOk atteint
 *   MASTERY_REPS, marque masteredAt et arrête de programmer des échéances
 *   (un mot maîtrisé peut néanmoins être choisi ponctuellement par le
 *   Réveil pour un rappel long terme — hors scope de ce module, décision
 *   du sélecteur de session, cf. selectDueWords/selectMasteryRefresh).
 * - Échec : recule d'un cran (jamais sous 0), repsOk revient à 0, nouvelle
 *   échéance au cran réduit (l'item revient plus vite, pas dans 35 jours).
 *
 * @param {WordState} state
 * @param {boolean} correct
 * @param {Date} now
 * @returns {WordState} nouvel état (ne mute pas l'entrée)
 */
function review(state, correct, now) {
  if (!state.introducedAt) {
    throw new Error('review() appelé sur un mot jamais introduit — appeler introduce() avant');
  }
  if (state.masteredAt) {
    // Rappel de maintenance sur un mot déjà maîtrisé : on ne reprogramme pas
    // d'échéance SRS classique, mais on garde la trace du résultat.
    return { ...state, lastResult: correct };
  }

  if (correct) {
    const repsOk = state.repsOk + 1;
    if (repsOk >= MASTERY_REPS) {
      return {
        ...state,
        repsOk,
        step: STEPS.length - 1,
        dueAt: null,
        masteredAt: now,
        lastResult: true,
      };
    }
    const nextStep = Math.min(state.step + 1, STEPS.length - 1);
    return {
      ...state,
      step: nextStep,
      repsOk,
      dueAt: addDays(now, STEPS[nextStep]),
      lastResult: true,
    };
  }

  // Échec : recule d'un cran, ne repart jamais à zéro pur (cran 0 minimum).
  const prevStep = Math.max(state.step - 1, 0);
  return {
    ...state,
    step: prevStep,
    repsOk: 0,
    dueAt: addDays(now, STEPS[prevStep]),
    lastResult: false,
  };
}

/**
 * Un mot est "dû" s'il a une échéance passée ou égale à `now` et n'est pas
 * encore maîtrisé. Utilisé par le sélecteur de la phase Réveil (8 cartes).
 *
 * @param {WordState} state
 * @param {Date} now
 * @returns {boolean}
 */
function isDue(state, now) {
  if (!state.introducedAt || state.masteredAt) return false;
  return !!state.dueAt && state.dueAt.getTime() <= now.getTime();
}

/**
 * Construit la liste des mots à réviser aujourd'hui parmi un ensemble
 * d'états, triée par ancienneté d'échéance (les plus en retard d'abord),
 * puis tronquée à `limit` — reproduit "le Réveil est composé par
 * l'algorithme" du script de session.
 *
 * @param {Array<{wordId: number, state: WordState}>} entries
 * @param {Date} now
 * @param {number} [limit=8]
 * @returns {Array<{wordId: number, state: WordState}>}
 */
function selectDueWords(entries, now, limit = 8) {
  return entries
    .filter((e) => isDue(e.state, now))
    .sort((a, b) => a.state.dueAt.getTime() - b.state.dueAt.getTime())
    .slice(0, limit);
}

/**
 * Choisit de nouveaux mots à introduire aujourd'hui : ceux du programme dont
 * `introWeek`/`introDay` correspondent à la position actuelle de l'élève
 * dans le curriculum, et qui n'ont pas encore d'état (jamais introduits).
 *
 * @param {Array<{wordId: number, introWeek: number, introDay: number}>} catalog
 * @param {Map<number, WordState>} states - état actuel par wordId
 * @param {number} currentWeek
 * @param {number} currentDay
 * @returns {Array<number>} wordIds à introduire
 */
function selectNewWords(catalog, states, currentWeek, currentDay) {
  return catalog
    .filter((w) => w.introWeek === currentWeek && w.introDay === currentDay)
    .filter((w) => !states.has(w.wordId) || !states.get(w.wordId).introducedAt)
    .map((w) => w.wordId);
}

/** Un mot est maîtrisé si masteredAt est renseigné. */
function isMastered(state) {
  return !!state.masteredAt;
}

/**
 * Score de réussite d'un boss (nombre de défis réussis / total), et
 * verdict selon le seuil de 80 % défini dans le script (cf.
 * docs/script-semaine-type-s21.md, section "BOSS").
 *
 * @param {Array<boolean>} results
 * @returns {{correct: number, total: number, ratio: number, passed: boolean}}
 */
function bossVerdict(results) {
  const total = results.length;
  const correct = results.filter(Boolean).length;
  const ratio = total === 0 ? 0 : correct / total;
  return { correct, total, ratio, passed: ratio >= 0.8 };
}

function addDays(date, days) {
  return new Date(date.getTime() + days * DAY_MS);
}

export {
  STEPS,
  MASTERY_REPS,
  freshState,
  introduce,
  review,
  isDue,
  isMastered,
  selectDueWords,
  selectNewWords,
  bossVerdict,
};
