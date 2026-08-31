/**
 * Fennec — moteur de session quotidienne réelle (Réveil + Nouveau).
 *
 * À la différence des maquettes wireframes/fennec-maquette-*.html (contenu
 * et parcours écrits à la main pour illustrer S21), ce module exécute le
 * VRAI plan produit par fennec/src/queue.mjs à partir du VRAI catalogue et
 * du VRAI état SRS persisté dans IndexedDB (fennec/src/db.mjs). Chaque
 * réponse de l'enfant appelle réellement srs.introduce()/srs.review(),
 * réellement persistée, réellement mise en file pour Supabase.
 *
 * Le rendu DOM par type d'écran est partagé avec le Boss du jeudi
 * (bossSession.mjs) via screens.mjs ; ce module ne porte que l'orchestration
 * propre à une session quotidienne : persistance SRS, file d'événements,
 * re-test après échec, avance du pointeur de curriculum en fin de session.
 */

import { introduce, review, isMastered } from '../src/srs.mjs';
import { buildDailyQueue, buildScreenPlan, insertRetest } from '../src/queue.mjs';
import { stage, pfill, phaseEl, speak, fennecTag, renderScreen } from './screens.mjs';

/**
 * Démarre et pilote une session quotidienne complète pour un élève donné.
 * N'est jamais appelé pour le jour Boss (jour 5) — voir main.mjs, qui
 * dispatche vers bossSession.runBossSession() ce jour-là.
 *
 * @param {Object} deps
 * @param {import('../src/db.mjs').FennecStore} deps.store
 * @param {string} deps.studentId
 * @param {() => Date} deps.now - horloge (réelle ou virtuelle, voir main.mjs)
 * @param {{week:number, day:number}} deps.pointer - position actuelle dans le curriculum (day: 1-4)
 * @param {(pointer:{week:number,day:number}) => void} deps.onSessionEnd
 */
async function runSession({ store, studentId, now, pointer, onSessionEnd }) {
  const catalog = await store.getCatalog();
  if (catalog.length === 0) {
    stage.innerHTML = `<div class="win"><p class="say">Catalogue vide.<br>Vérifie ensureCatalog() dans main.mjs.</p></div>`;
    return;
  }

  const rawStates = await store.getAllWordStates(studentId);
  const states = new Map(rawStates.map((r) => [r.wordId, deserialize(r)]));

  const { dueEntries, newWordIds } = buildDailyQueue({
    catalog, states, currentWeek: pointer.week, currentDay: pointer.day, now: now(),
  });
  let plan = buildScreenPlan({ dueEntries, newWordIds, catalog });

  const sessionId = crypto.randomUUID();
  const startedAt = now().toISOString();
  let idx = -1;
  let correct = 0;
  let total = 0;

  if (plan.length === 0) {
    return renderNothingDueToday();
  }

  await next();

  async function next() {
    idx++;
    if (idx >= plan.length) return finish();
    pfill.style.width = Math.round((idx / plan.length) * 100) + '%';
    phaseEl.textContent = plan[idx].phase === 'reveil' ? 'Réveil' : 'Nouveau';
    renderScreen(plan[idx], {
      onContinue: () => onDiscovered(plan[idx]),
      onAnswer: (ok) => onAnswer(plan[idx], ok),
    });
  }

  async function onDiscovered(screen) {
    const state = introduce(now());
    await persist(screen.word.wordId, state);
    await next();
  }

  async function onAnswer(screen, ok) {
    total++;
    if (ok) correct++;

    if (screen.phase === 'reveil') {
      const prevRow = states.get(screen.word.wordId) ?? deserialize(await store.getWordState(studentId, screen.word.wordId));
      const newState = review(prevRow, ok, now());
      await persist(screen.word.wordId, newState);
    }
    // Les écrans "nouveau" de pratique ne rappellent pas review() : le mot
    // vient d'être introduit par l'écran discover juste avant (une seule
    // exposition SRS par jour), conformément au script.

    await store.logSessionEvent(studentId, {
      sessionId, screenIndex: idx, wordId: screen.word.wordId,
      screenType: screen.kind, correct: ok, isRetest: !!screen.isRetest,
    });

    if (!ok && !screen.isRetest) {
      const remaining = insertRetest(plan.slice(idx + 1), screen);
      plan = plan.slice(0, idx + 1).concat(remaining);
    }

    setTimeout(next, ok ? 500 : 1200);
  }

  async function persist(wordId, state) {
    states.set(wordId, state);
    await store.saveWordState(studentId, wordId, state, {
      step: state.step,
      repsOk: state.repsOk,
      dueAt: state.dueAt ? state.dueAt.toISOString().slice(0, 10) : null,
      lastResult: state.lastResult,
      introducedAt: state.introducedAt ? state.introducedAt.toISOString() : null,
      masteredAt: state.masteredAt ? state.masteredAt.toISOString() : null,
    });
  }

  async function finish() {
    pfill.style.width = '100%';
    phaseEl.textContent = 'Victoire';
    const allStates = await store.getAllWordStates(studentId);
    const masteredCount = allStates.filter((r) => isMastered(deserialize(r))).length;
    const pct = total ? Math.round((correct / total) * 100) : 100;

    await store.logSessionSummary(studentId, {
      sessionId, week: pointer.week, day: pointer.day, kind: 'daily',
      startedAt, finishedAt: now().toISOString(),
      screensTotal: total, screensCorrect: correct,
    });

    stage.innerHTML = `<div class="win">
      <div class="burst">🎉 ⭐ 🎉</div>${fennecTag('happy')}
      <p class="say">Well done!</p>
      <div class="n">${masteredCount}</div>
      <p class="sub">mots maîtrisés · réussite de la session : ${pct}%</p>
    </div>`;
    speak('Well done!');
    // jour 1→2→3→4, puis jour 5 = Boss (voir main.mjs) avant de repasser à
    // la semaine suivante (géré par bossSession.mjs selon le verdict).
    onSessionEnd({ week: pointer.week, day: pointer.day + 1 });
  }

  function renderNothingDueToday() {
    stage.innerHTML = `<div class="win">${fennecTag()}
      <p class="say">Rien à réviser aujourd'hui !</p>
      <p class="sub">Aucun mot dû, aucun nouveau mot programmé pour S${pointer.week} jour ${pointer.day}.<br>Avance le curriculum ou avance le jour virtuel (barre de dev).</p>
    </div>`;
    onSessionEnd({ week: pointer.week, day: pointer.day + 1 });
  }
}

function deserialize(row) {
  if (!row) return { step: 0, repsOk: 0, dueAt: null, introducedAt: null, masteredAt: null, lastResult: null };
  return {
    step: row.step, repsOk: row.repsOk,
    dueAt: row.dueAt ? new Date(row.dueAt) : null,
    introducedAt: row.introducedAt ? new Date(row.introducedAt) : null,
    masteredAt: row.masteredAt ? new Date(row.masteredAt) : null,
    lastResult: row.lastResult ?? null,
  };
}

export { runSession };
