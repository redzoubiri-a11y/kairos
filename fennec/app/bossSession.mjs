/**
 * Fennec — moteur du Boss du jeudi (jour 5), réel.
 *
 * Reprend le gabarit Boss du design système définitif (bandeau plein
 * marine + étoile + compteur "x/12", panier rouge à 12 cases, CTA rouge —
 * "même famille visuelle [que la session normale], mode clairement
 * différencié") mais sur du contenu VRAI : les défis viennent de
 * fennec/src/queue.mjs `buildBossPlan()`, construits à partir des mots
 * réellement introduits cette semaine dans le catalogue, et le rendu par
 * type d'écran est partagé avec la session quotidienne via screens.mjs.
 * Aucun texte, aucun mot n'est écrit en dur ici.
 *
 * Contrairement à session.mjs, le Boss ne touche jamais l'état SRS
 * (srs.review/introduce) : c'est un test de maîtrise, pas un événement de
 * révision (cf. le commentaire de buildBossPlan). Il journalise en revanche
 * une session de kind='boss' avec bossPassed/bossVariant, exactement comme
 * prévu par le schéma (fennec/supabase/migrations/0001_schema.sql).
 */

import { buildBossPlan } from '../src/queue.mjs';
import { bossVerdict } from '../src/srs.mjs';
import { stage, setBossProgress, setHelp, speak, avatarTag, renderScreen } from './screens.mjs';

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
    setBossProgress(0, 12);
    stage.innerHTML = `<div class="win">${avatarTag()}
      <p class="say ar center">لا يوجد تحدي زعيم هذا الأسبوع</p>
      <p class="sub ar center">لم تتم برمجة أي كلمة لـ S${pointer.week} — ننتقل مباشرة إلى الأسبوع التالي.</p>
    </div>`;
    return onBossEnd({ pointer: { week: pointer.week + 1, day: 1 }, attempt: 1 });
  }

  const sessionId = crypto.randomUUID();
  const startedAt = now().toISOString();
  const results = [];
  let idx = -1;

  await showIntro();

  async function showIntro() {
    setBossProgress(0, plan.length);
    setHelp('كل جولة صحيحة تملأ خانة في السلة — 80% كافية للفوز 🧺');
    stage.innerHTML = `<div class="win">
      <div class="win emoji-lg">⭐</div>
      ${avatarTag()}
      <p class="say ar center">تحدي الزعيم${attempt > 1 ? ` — محاولة ${attempt}` : ''}</p>
      <p class="sub ar center">${plan.length} تحديات · املأ السلة · 80% للفوز</p>
      <button class="cta accent">ابدأ</button>
    </div>`;
    stage.querySelector('.cta').addEventListener('click', () => { speak('Let\'s go!'); next(); }, { once: true });
  }

  async function next() {
    idx++;
    if (idx >= plan.length) return finish();
    setBossProgress(idx, plan.length);
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
    const verdict = bossVerdict(results);
    setBossProgress(verdict.correct, plan.length);

    await store.logSessionSummary(studentId, {
      sessionId, week: pointer.week, day: 5, kind: 'boss',
      startedAt, finishedAt: now().toISOString(),
      screensTotal: verdict.total, screensCorrect: verdict.correct,
      bossPassed: verdict.passed,
      bossVariant: attempt > 1 ? `essai_${attempt}` : null,
    });

    if (verdict.passed) {
      stage.innerHTML = `<div class="win">
        <div class="win emoji-lg">🏆</div>
        <p class="say ar center">فاز الزعيم! السوق مفتوح</p>
        <div class="parentcard">
          <span class="tag ar">رسالة لولي الأمر</span>
          <p class="ar">أتم طفلك تحدي الزعيم بنجاح هذا الأسبوع! ${verdict.correct} من ${verdict.total} — استمر في تشجيعه 👏</p>
        </div>
        <button class="cta accent">مشاركة مع الوالدين</button>
      </div>`;
      speak('You did it! Well done!');
      // "مشاركة مع الوالدين" fait avancer vers la semaine suivante ; le
      // partage réel (export/envoi du message ci-dessus) reste à brancher
      // sur un canal concret (SMS/WhatsApp/notification) — hors scope ici.
      stage.querySelector('.cta').addEventListener('click', () => onBossEnd({ pointer: { week: pointer.week + 1, day: 1 }, attempt: 1 }), { once: true });
    } else {
      stage.innerHTML = `<div class="win">
        <div class="win emoji-lg" style="opacity:.7">🏪</div>
        <p class="say ar center">السوق مغلق اليوم</p>
        <p class="sub ar center">تدرب أكثر ثم عد لتحدي الزعيم غدًا</p>
        <button class="cta primary">تدرّب الآن</button>
      </div>`;
      speak('Come back tomorrow!');
      stage.querySelector('.cta').addEventListener('click', () => onBossEnd({ pointer, attempt: attempt + 1 }), { once: true });
    }
  }
}

export { runBossSession };
