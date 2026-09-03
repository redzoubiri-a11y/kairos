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
import { stage, setProgress, setHelp, speak, avatarTag, renderScreen } from './screens.mjs';

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
 * @param {number} deps.streakDays - jours consécutifs joués cette semaine (badge flamme)
 * @param {(pointer:{week:number,day:number}) => void} deps.onSessionEnd
 */
async function runSession({ store, studentId, now, pointer, streakDays, onSessionEnd }) {
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
  const phonicsTable = await fetch('./phonics.json').then((r) => r.json()).catch(() => []);
  let plan = buildScreenPlan({ dueEntries, newWordIds, catalog, pointer, phonicsTable });

  const sessionId = crypto.randomUUID();
  const startedAt = now().toISOString();
  let idx = -1;
  let correct = 0;
  let total = 0;

  if (plan.length === 0) {
    return renderNothingDueToday();
  }

  // Crée la ligne `sessions` distante dès le début (upsert, pas insert) —
  // pas seulement à la fin dans finish(). Sans ça, les session_event mis en
  // file pendant la session (onAnswer, ci-dessous) référencent un
  // `session_id` qui n'existe encore nulle part côté serveur si la sync
  // tourne avant la fin de la session (retour réseau en cours de session,
  // ou simplement le tout premier jour réel d'un enfant) : la policy RLS
  // "events: écriture par tuteur" (fennec/supabase/migrations/0002_rls.sql)
  // exige que `session_id` corresponde à une ligne `sessions` déjà visible,
  // donc le tout premier session_event de la toute première session est
  // systématiquement rejeté et bloque la file de sync pour de bon — trouvé
  // en vérifiant réellement le chemin contre le projet Supabase (voir
  // fennec/README.md, section "Supabase — projet réel branché").
  await store.logSessionSummary(studentId, {
    sessionId, week: pointer.week, day: pointer.day, kind: 'daily',
    startedAt, finishedAt: null, screensTotal: 0, screensCorrect: 0,
  });

  await showSessionIntro();

  async function showSessionIntro() {
    setProgress(0, plan.length);
    setHelp('اضغط على الصورة المطابقة للكلمة التي تسمعها 🎧');
    const world = catalog.find((w) => w.introWeek === pointer.week)?.worldId;
    stage.innerHTML = `<div class="win">${avatarTag()}
      <p class="say ar center">مستعد لـ 15 دقيقة إنجليزي؟</p>
      <p class="sub ar center">الحصة ${pointer.day} · S${pointer.week}${world ? ` · M${world}` : ''}</p>
      <button class="cta accent">ابدأ</button>
    </div>`;
    stage.querySelector('.cta').addEventListener('click', () => next(), { once: true });
  }

  async function next() {
    idx++;
    if (idx >= plan.length) return finish();
    setProgress(idx, plan.length);
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
    // exposition SRS par jour), conformément au script. L'écran phonics n'a
    // pas de mot propre (il illustre un son avec un exemple du catalogue) :
    // wordId reste null, cohérent avec session_events.word_id nullable.

    await store.logSessionEvent(studentId, {
      sessionId, screenIndex: idx, wordId: screen.word?.wordId ?? null,
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
    setProgress(plan.length, plan.length);
    const allStates = await store.getAllWordStates(studentId);
    const masteredCount = allStates.filter((r) => isMastered(deserialize(r))).length;
    const pct = total ? Math.round((correct / total) * 100) : 100;

    await store.logSessionSummary(studentId, {
      sessionId, week: pointer.week, day: pointer.day, kind: 'daily',
      startedAt, finishedAt: now().toISOString(),
      screensTotal: total, screensCorrect: correct,
    });

    stage.innerHTML = `<div class="win">
      ${avatarTag()}
      <p class="say ar center">أحسنت، انتهت الحصة!</p>
      <div class="stats-row">
        <div class="stat"><b>${masteredCount}</b><span class="ar">كلمات</span></div>
        <div class="stat"><b class="accent">${pct}%</b><span class="ar">الدقة</span></div>
      </div>
      ${streakDays > 0 ? `<div class="streak-badge ar">🔥 سلسلة ${streakDays} أيام</div>` : ''}
      <button class="cta primary">متابعة</button>
    </div>`;
    speak('Well done!');
    // jour 1→2→3→4, puis jour 5 = Boss (voir main.mjs) avant de repasser à
    // la semaine suivante (géré par bossSession.mjs selon le verdict). Le
    // bouton "متابعة" ne fait qu'acquitter l'écran (une seule session par
    // jour) : il ne relance rien, contrairement au Boss.
    onSessionEnd({ week: pointer.week, day: pointer.day + 1 });
  }

  function renderNothingDueToday() {
    setProgress(1, 1);
    stage.innerHTML = `<div class="win">${avatarTag()}
      <p class="say ar center">لا يوجد شيء للمراجعة اليوم!</p>
      <p class="sub ar center">لا كلمات مستحقة، ولا كلمات جديدة مبرمجة لـ S${pointer.week} اليوم ${pointer.day}.</p>
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
