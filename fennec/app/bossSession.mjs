/**
 * Fennec — moteur du Boss du jeudi (jour 5), réel.
 *
 * Reprend le déroulé de wireframes/fennec-maquette-boss-s21.html (panier de
 * 12 défis, seuil de 80%, message au parent en cas de réussite, "market is
 * closed" + variante en cas d'échec) mais sur du contenu VRAI : les défis
 * viennent de fennec/src/queue.mjs `buildBossPlan()`, construits à partir
 * des mots réellement introduits cette semaine dans le catalogue, et le
 * rendu par type d'écran est partagé avec la session quotidienne via
 * screens.mjs. Aucun texte, aucun mot n'est écrit en dur ici.
 *
 * Contrairement à session.mjs, le Boss ne touche jamais l'état SRS
 * (srs.review/introduce) : c'est un test de maîtrise, pas un événement de
 * révision (cf. le commentaire de buildBossPlan). Il journalise en revanche
 * une session de kind='boss' avec bossPassed/bossVariant, exactement comme
 * prévu par le schéma (fennec/supabase/migrations/0001_schema.sql).
 */

import { buildBossPlan } from '../src/queue.mjs';
import { bossVerdict } from '../src/srs.mjs';
import { stage, pfill, phaseEl, speak, fennecTag, renderScreen } from './screens.mjs';

const PASS_THRESHOLD = 0.8; // documenté ici pour l'affichage ; bossVerdict() applique la même règle

/**
 * @param {Object} deps
 * @param {import('../src/db.mjs').FennecStore} deps.store
 * @param {string} deps.studentId
 * @param {() => Date} deps.now
 * @param {{week:number, day:number}} deps.pointer - day vaut toujours 5 ici
 * @param {number} deps.attempt - 1 = premier essai cette semaine, 2+ = variante après échec
 * @param {(next: {pointer:{week:number,day:number}, attempt:number}) => void} deps.onBossEnd
 */
async function runBossSession({ store, studentId, now, pointer, attempt, onBossEnd }) {
  const catalog = await store.getCatalog();
  const plan = buildBossPlan({ catalog, week: pointer.week, count: 12 });

  if (plan.length === 0) {
    stage.innerHTML = `<div class="win">${fennecTag()}
      <p class="say">Pas de Boss cette semaine.</p>
      <p class="sub">Aucun mot n'a été introduit pour S${pointer.week} — on passe directement à la semaine suivante.</p>
    </div>`;
    return onBossEnd({ pointer: { week: pointer.week + 1, day: 1 }, attempt: 1 });
  }

  const sessionId = crypto.randomUUID();
  const startedAt = now().toISOString();
  const results = [];
  let idx = -1;

  await showIntro();

  async function showIntro() {
    phaseEl.textContent = 'Boss';
    pfill.style.width = '0%';
    stage.innerHTML = `<div class="win">
      <div class="burst">⭐ 🧺 ⭐</div>${fennecTag()}
      <p class="say">BOSS ${attempt > 1 ? '— nouvel essai' : ''}</p>
      <p class="sub">${plan.length} défis · remplis le panier · 80% pour gagner.</p>
      <button class="next">GO ! ➜</button>
    </div>`;
    stage.querySelector('.next').addEventListener('click', () => { speak('Let\'s go!'); next(); }, { once: true });
  }

  async function next() {
    idx++;
    if (idx >= plan.length) return finish();
    pfill.style.width = Math.round((idx / plan.length) * 100) + '%';
    phaseEl.textContent = `Boss · défi ${idx + 1}/${plan.length}`;
    renderScreen(plan[idx], { onAnswer: (ok) => onAnswer(ok) });
  }

  async function onAnswer(ok) {
    results.push(ok);
    const screen = plan[idx];
    await store.logSessionEvent(studentId, {
      sessionId, screenIndex: idx, wordId: screen.word.wordId,
      screenType: screen.kind, correct: ok, isRetest: false,
    });
    setTimeout(next, ok ? 500 : 1000);
  }

  async function finish() {
    pfill.style.width = '100%';
    phaseEl.textContent = 'Boss · résultat';
    const verdict = bossVerdict(results);

    await store.logSessionSummary(studentId, {
      sessionId, week: pointer.week, day: 5, kind: 'boss',
      startedAt, finishedAt: now().toISOString(),
      screensTotal: verdict.total, screensCorrect: verdict.correct,
      bossPassed: verdict.passed,
      bossVariant: attempt > 1 ? `essai_${attempt}` : null,
    });

    if (verdict.passed) {
      stage.innerHTML = `<div class="win">
        <div class="burst">🎉 🏆 🎉</div>${fennecTag('happy')}
        <p class="say">You did it! ${verdict.correct} / ${verdict.total}</p>
        <p class="sub">Le monde suivant est débloqué !</p>
        <div class="parentcard">🔊 Un résumé de la session part vers le parent (à brancher : sync.mjs → tableau de bord).</div>
        <button class="next">Continuer ➜</button>
      </div>`;
      speak('You did it! Well done!');
      stage.querySelector('.next').addEventListener('click', () => onBossEnd({ pointer: { week: pointer.week + 1, day: 1 }, attempt: 1 }), { once: true });
    } else {
      stage.innerHTML = `<div class="win">
        <div class="burst">🌙</div>${fennecTag()}
        <p class="say">Come back tomorrow!</p>
        <p class="sub">${verdict.correct} / ${verdict.total} — pas d'échec affiché à l'enfant : demain, un nouvel essai avec un ordre et des questions différents sur les mêmes mots.</p>
        <button class="next warm">Nouvel essai ↻</button>
      </div>`;
      speak('Come back tomorrow!');
      stage.querySelector('.next').addEventListener('click', () => onBossEnd({ pointer, attempt: attempt + 1 }), { once: true });
    }
  }
}

export { runBossSession, PASS_THRESHOLD };
