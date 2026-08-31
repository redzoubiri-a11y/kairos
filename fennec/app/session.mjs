/**
 * Fennec — moteur de session réel (rendu DOM).
 *
 * À la différence des maquettes wireframes/fennec-maquette-*.html (contenu
 * et parcours écrits à la main pour illustrer S21), ce module exécute le
 * VRAI plan produit par fennec/src/queue.mjs à partir du VRAI catalogue et
 * du VRAI état SRS persisté dans IndexedDB (fennec/src/db.mjs). Chaque
 * réponse de l'enfant appelle réellement srs.introduce()/srs.review(),
 * réellement persistée, réellement mise en file pour Supabase.
 *
 * Ce module ne connaît que le DOM + les modules purs ; aucune donnée n'est
 * codée en dur ici (pas d'emoji fixe par mot : on affiche le texte anglais/
 * français en attendant les vrais assets audio/image — cf. README).
 */

import { introduce, review, isMastered } from '../src/srs.mjs';
import { buildDailyQueue, buildScreenPlan, insertRetest } from '../src/queue.mjs';

const stage = document.getElementById('stage');
const pfill = document.getElementById('pfill');
const phaseEl = document.getElementById('phase');

function speak(text, slow) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = slow ? 0.75 : 0.9;
    u.pitch = 1.1;
    speechSynthesis.speak(u);
  } catch (e) { /* synthèse indisponible : l'app reste utilisable au texte */ }
}

function chime(ok) {
  try {
    const ctx = chime.ctx || (chime.ctx = new (window.AudioContext || window.webkitAudioContext)());
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = ok ? 660 : 220; o.type = 'sine';
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    o.start(); o.stop(ctx.currentTime + 0.35);
  } catch (e) { /* audio indisponible, sans conséquence pédagogique */ }
}

const fennecTag = (cls) => `<div class="fennec ${cls || ''}" aria-hidden="true">🦊</div>`;
const happy = () => { const f = stage.querySelector('.fennec'); if (f) f.classList.add('happy'); };

/**
 * Démarre et pilote une session complète pour un élève donné.
 *
 * @param {Object} deps
 * @param {import('../src/db.mjs').FennecStore} deps.store
 * @param {string} deps.studentId
 * @param {() => Date} deps.now - horloge (réelle ou virtuelle, voir main.mjs)
 * @param {{week:number, day:number}} deps.pointer - position actuelle dans le curriculum
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
    stage.innerHTML = '';
    render(plan[idx]);
  }

  function render(screen) {
    switch (screen.kind) {
      case 'discover': return renderDiscover(screen);
      case 'listen_touch':
      case 'read_touch': return renderChoice(screen);
      case 'true_false': return renderTrueFalse(screen);
      case 'say_it': return renderSayIt(screen);
      case 'construct': return renderConstruct(screen);
      default: return renderChoice(screen);
    }
  }

  function renderDiscover(screen) {
    stage.innerHTML = fennecTag() +
      `<p class="say">New word!</p>` +
      `<div class="card-word">${escapeHtml(screen.word.english)}</div>` +
      `<p class="sub">${escapeHtml(screen.word.french)}</p>` +
      `<button class="speaker" aria-label="Écouter">🔊</button>` +
      `<button class="next">Continue ➜</button>`;
    stage.querySelector('.speaker').onclick = () => speak(screen.word.english);
    stage.querySelector('.next').onclick = async () => {
      const state = introduce(now());
      await persist(screen.word.wordId, state);
      await next();
    };
    setTimeout(() => speak(screen.word.english), 300);
  }

  function renderChoice(screen) {
    const label = screen.kind === 'read_touch' ? 'Read and touch!' : 'Listen and touch!';
    stage.innerHTML = fennecTag() +
      `<p class="say">${label}</p>` +
      (screen.kind === 'read_touch'
        ? `<div class="card-word">${escapeHtml(screen.word.english)}</div>`
        : `<button class="speaker" aria-label="Écouter">🔊</button>`) +
      `<div class="grid ${screen.options.length === 3 ? 'three' : ''}"></div>`;
    if (screen.kind === 'listen_touch') {
      stage.querySelector('.speaker').onclick = () => speak(screen.word.english);
      setTimeout(() => speak(screen.word.english), 300);
    }
    const grid = stage.querySelector('.grid');
    const shuffled = [...screen.options].sort(() => Math.random() - 0.5);
    shuffled.forEach((opt) => {
      const b = document.createElement('button');
      b.className = 'opt';
      b.textContent = opt.french;
      b.onclick = async () => {
        grid.querySelectorAll('.opt').forEach((x) => (x.disabled = true, x.classList.add('dis')));
        const ok = opt.wordId === screen.word.wordId;
        if (ok) { b.classList.add('good'); happy(); chime(true); speak(screen.word.english); }
        else {
          chime(false); speak(screen.word.english, true);
          grid.querySelectorAll('.opt').forEach((x) => { if (x.textContent === screen.word.french) x.classList.add('show'); });
        }
        await answer(screen, ok);
      };
      grid.appendChild(b);
    });
  }

  function renderTrueFalse(screen) {
    const showTruth = Math.random() < 0.5;
    const shownWord = showTruth ? screen.word : screen.options[1];
    stage.innerHTML = fennecTag() +
      `<p class="say">True or false?</p>` +
      `<div class="card-word">${escapeHtml(shownWord.french)}</div>` +
      `<button class="speaker" aria-label="Écouter">🔊</button>` +
      `<div class="tfrow"><button class="tf yes" aria-label="Vrai">👍</button><button class="tf no" aria-label="Faux">👎</button></div>`;
    stage.querySelector('.speaker').onclick = () => speak(screen.word.english);
    const answerTf = async (saidYes) => {
      const ok = saidYes === showTruth;
      if (ok) { chime(true); happy(); } else { chime(false); speak(screen.word.english, true); }
      await answer(screen, ok);
    };
    stage.querySelector('.yes').onclick = () => answerTf(true);
    stage.querySelector('.no').onclick = () => answerTf(false);
    setTimeout(() => speak(screen.word.english), 300);
  }

  function renderSayIt(screen) {
    stage.innerHTML = fennecTag() +
      `<p class="say">Say it: <span class="en">${escapeHtml(screen.word.english)}</span></p>` +
      `<button class="speaker" aria-label="Écouter">🔊</button>` +
      `<button class="mic" aria-label="Maintiens et parle">🎤</button>` +
      `<div class="meter"><div id="m"></div></div>` +
      `<button class="alt">Je l'ai dit ✓</button>`;
    stage.querySelector('.speaker').onclick = () => speak(screen.word.english);
    const m = document.getElementById('m');
    let t = null, v = 0;
    const mic = stage.querySelector('.mic');
    const finishOk = async () => { happy(); chime(true); await answer(screen, true); };
    mic.onpointerdown = (e) => { e.preventDefault();
      t = setInterval(() => { v = Math.min(100, v + 9); m.style.width = v + '%'; if (v >= 100) { clearInterval(t); finishOk(); } }, 90); };
    mic.onpointerup = mic.onpointerleave = () => { if (t) clearInterval(t); };
    stage.querySelector('.alt').onclick = () => { m.style.width = '100%'; finishOk(); };
    setTimeout(() => speak(screen.word.english), 300);
  }

  function renderConstruct(screen) {
    const shuffled = [...screen.tokens].sort(() => Math.random() - 0.5);
    let placed = [];
    stage.innerHTML = fennecTag() +
      `<p class="say">Put it in order!</p>` +
      `<button class="speaker" aria-label="Écouter">🔊</button>` +
      `<div class="slots">${screen.tokens.map(() => '<div class="slot"></div>').join('')}</div>` +
      `<div class="chips"></div>`;
    stage.querySelector('.speaker').onclick = () => speak(screen.word.english);
    const chips = stage.querySelector('.chips');
    const slots = stage.querySelectorAll('.slot');
    shuffled.forEach((w) => {
      const c = document.createElement('button');
      c.className = 'chip'; c.textContent = w;
      c.onclick = async () => {
        c.classList.add('used');
        slots[placed.length].textContent = w;
        placed.push(w);
        if (placed.length === screen.tokens.length) {
          const ok = placed.join(' ') === screen.tokens.join(' ');
          if (ok) { happy(); chime(true); speak(screen.word.english); }
          else { chime(false); slots.forEach((s, i) => (s.textContent = screen.tokens[i])); speak(screen.word.english, true); }
          await answer(screen, ok);
        }
      };
      chips.appendChild(c);
    });
    setTimeout(() => speak(screen.word.english), 300);
  }

  async function answer(screen, ok) {
    total++;
    if (ok) correct++;

    if (screen.phase === 'reveil') {
      const prevRow = states.get(screen.word.wordId) ?? deserialize(await store.getWordState(studentId, screen.word.wordId));
      const newState = review(prevRow, ok, now());
      states.set(screen.word.wordId, newState);
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
    onSessionEnd({ week: pointer.day >= 4 ? pointer.week + 1 : pointer.week, day: pointer.day >= 4 ? 1 : pointer.day + 1 });
  }

  function renderNothingDueToday() {
    stage.innerHTML = `<div class="win">${fennecTag()}
      <p class="say">Rien à réviser aujourd'hui !</p>
      <p class="sub">Aucun mot dû, aucun nouveau mot programmé pour S${pointer.week} jour ${pointer.day}.<br>Avance le curriculum ou avance le jour virtuel (barre de dev).</p>
    </div>`;
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

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

export { runSession };
