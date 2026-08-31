/**
 * Fennec — briques de rendu d'écran partagées entre la session quotidienne
 * (session.mjs) et le Boss du jeudi (bossSession.mjs).
 *
 * Un même type d'écran (écoute→touche, vrai/faux, dis-le, construis la
 * phrase) est rencontré aussi bien en Réveil/Nouveau qu'en Boss (cf.
 * docs/script-semaine-type-s21.md) — factoriser ici évite que les deux
 * modes dérivent visuellement l'un de l'autre. Ce module ne connaît que le
 * DOM et le type générique d'écran ; il ignore tout du SRS, du score ou du
 * plan de session — c'est aux appelants (session.mjs, bossSession.mjs) de
 * décider quoi faire d'une réponse via le callback `onAnswer(ok)`.
 */

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

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

/** Écran "découverte" d'un mot nouveau — pas de réponse, juste `onContinue`. */
function renderDiscover(screen, { onContinue }) {
  stage.innerHTML = fennecTag() +
    `<p class="say">New word!</p>` +
    `<div class="card-word">${escapeHtml(screen.word.english)}</div>` +
    `<p class="sub">${escapeHtml(screen.word.french)}</p>` +
    `<button class="speaker" aria-label="Écouter">🔊</button>` +
    `<button class="next">Continue ➜</button>`;
  stage.querySelector('.speaker').onclick = () => speak(screen.word.english);
  // { once: true } : évite qu'un double-tap pendant le délai avant l'écran
  // suivant ne déclenche onContinue() deux fois (ce qui sauterait un écran).
  stage.querySelector('.next').addEventListener('click', () => onContinue(), { once: true });
  setTimeout(() => speak(screen.word.english), 300);
}

/** listen_touch / read_touch : choix parmi `screen.options` (le mot + distracteurs). */
function renderChoice(screen, { onAnswer }) {
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
    b.onclick = () => {
      grid.querySelectorAll('.opt').forEach((x) => (x.disabled = true, x.classList.add('dis')));
      const ok = opt.wordId === screen.word.wordId;
      if (ok) { b.classList.add('good'); happy(); chime(true); speak(screen.word.english); }
      else {
        chime(false); speak(screen.word.english, true);
        grid.querySelectorAll('.opt').forEach((x) => { if (x.textContent === screen.word.french) x.classList.add('show'); });
      }
      onAnswer(ok);
    };
    grid.appendChild(b);
  });
}

/** true_false : montre soit le vrai mot, soit un distracteur, l'enfant tranche. */
function renderTrueFalse(screen, { onAnswer }) {
  const showTruth = Math.random() < 0.5;
  const shownWord = showTruth ? screen.word : screen.options[1];
  stage.innerHTML = fennecTag() +
    `<p class="say">True or false?</p>` +
    `<div class="card-word">${escapeHtml(shownWord.french)}</div>` +
    `<button class="speaker" aria-label="Écouter">🔊</button>` +
    `<div class="tfrow"><button class="tf yes" aria-label="Vrai">👍</button><button class="tf no" aria-label="Faux">👎</button></div>`;
  stage.querySelector('.speaker').onclick = () => speak(screen.word.english);
  let answered = false; // évite un double-tap yes+no pendant le délai avant l'écran suivant
  const answerTf = (saidYes) => {
    if (answered) return;
    answered = true;
    stage.querySelectorAll('.tf').forEach((b) => (b.disabled = true));
    const ok = saidYes === showTruth;
    if (ok) { chime(true); happy(); } else { chime(false); speak(screen.word.english, true); }
    onAnswer(ok);
  };
  stage.querySelector('.yes').onclick = () => answerTf(true);
  stage.querySelector('.no').onclick = () => answerTf(false);
  setTimeout(() => speak(screen.word.english), 300);
}

/** say_it : micro simulé (maintenir) + solution de repli "je l'ai dit" (téléphone partagé, lieu bruyant). */
function renderSayIt(screen, { onAnswer }) {
  stage.innerHTML = fennecTag() +
    `<p class="say">Say it: <span class="en">${escapeHtml(screen.word.english)}</span></p>` +
    `<button class="speaker" aria-label="Écouter">🔊</button>` +
    `<button class="mic" aria-label="Maintiens et parle">🎤</button>` +
    `<div class="meter"><div id="m"></div></div>` +
    `<button class="alt">Je l'ai dit ✓</button>`;
  stage.querySelector('.speaker').onclick = () => speak(screen.word.english);
  const m = document.getElementById('m');
  let t = null, v = 0, answered = false; // le flag empêche mic + "Je l'ai dit" de répondre deux fois
  const mic = stage.querySelector('.mic');
  const alt = stage.querySelector('.alt');
  const finishOk = () => {
    if (answered) return;
    answered = true;
    mic.disabled = true; alt.disabled = true;
    happy(); chime(true); onAnswer(true);
  };
  mic.onpointerdown = (e) => { e.preventDefault();
    t = setInterval(() => { v = Math.min(100, v + 9); m.style.width = v + '%'; if (v >= 100) { clearInterval(t); finishOk(); } }, 90); };
  mic.onpointerup = mic.onpointerleave = () => { if (t) clearInterval(t); };
  alt.onclick = () => { m.style.width = '100%'; finishOk(); };
  setTimeout(() => speak(screen.word.english), 300);
}

/** construct : remettre les tokens de `screen.tokens` (une structure) dans l'ordre. */
function renderConstruct(screen, { onAnswer }) {
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
    c.onclick = () => {
      c.classList.add('used');
      slots[placed.length].textContent = w;
      placed.push(w);
      if (placed.length === screen.tokens.length) {
        const ok = placed.join(' ') === screen.tokens.join(' ');
        if (ok) { happy(); chime(true); speak(screen.word.english); }
        else { chime(false); slots.forEach((s, i) => (s.textContent = screen.tokens[i])); speak(screen.word.english, true); }
        onAnswer(ok);
      }
    };
    chips.appendChild(c);
  });
  setTimeout(() => speak(screen.word.english), 300);
}

/**
 * Dispatche un écran vers le bon renderer selon son `kind`. `handlers`
 * porte `onContinue` (pour 'discover') et/ou `onAnswer(ok)` (pour tous les
 * autres) — chaque appelant ne fournit que ce dont il a besoin.
 */
function renderScreen(screen, handlers) {
  switch (screen.kind) {
    case 'discover': return renderDiscover(screen, handlers);
    case 'listen_touch':
    case 'read_touch': return renderChoice(screen, handlers);
    case 'true_false': return renderTrueFalse(screen, handlers);
    case 'say_it': return renderSayIt(screen, handlers);
    case 'construct': return renderConstruct(screen, handlers);
    default: return renderChoice(screen, handlers);
  }
}

export { stage, pfill, phaseEl, speak, chime, fennecTag, happy, escapeHtml, renderScreen };
