/**
 * Fennec — briques de rendu d'écran partagées entre la session quotidienne
 * (session.mjs) et le Boss du jeudi (bossSession.mjs).
 *
 * Applique le design système définitif (handoff "Fennec Design System —
 * Complete.dc.html", variante couleurs "1d" marine/rouge/blanc) : tokens
 * dans styles.css, gabarits et copie ici. Interface enfant en **arabe**
 * (classe .ar => direction/alignement RTL) ; le mot anglais enseigné reste
 * affiché en anglais (LTR), c'est le contenu pédagogique.
 *
 * Écart connu par rapport au handoff : les cartes-options montrent le mot
 * anglais en texte (pas encore d'illustration/emoji par mot — aucune
 * banque d'images n'existe pour les 335 mots). C'est un placeholder
 * temporaire à remplacer par les vraies illustrations, pas une French text
 * comme avant (le handoff ne prévoit aucun français dans l'UI).
 */

const stage = document.getElementById('stage');
const pipsEl = document.getElementById('pips');
const helpBtn = document.getElementById('helpbtn');
const helpCard = document.getElementById('helpcard');
const normalTop = document.getElementById('normalTop');
const bossTop = document.getElementById('bossTop');
const bossCountEl = document.getElementById('bossCount');
const basketEl = document.getElementById('basket');

helpBtn.addEventListener('click', () => helpCard.classList.toggle('on'));

/** Affiche la barre de progression en pastilles (gabarit "session normale"). */
function setProgress(index, total) {
  normalTop.hidden = false;
  bossTop.hidden = true;
  pipsEl.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const p = document.createElement('div');
    p.className = 'pip' + (i < index ? ' on' : '');
    pipsEl.appendChild(p);
  }
}

/** Affiche le bandeau Boss (plein marine, étoile + compteur) et le panier rouge à 12 cases. */
function setBossProgress(done, total) {
  normalTop.hidden = true;
  bossTop.hidden = false;
  bossCountEl.textContent = `${done}/${total}`;
  basketEl.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const c = document.createElement('div');
    c.className = 'cell' + (i < done ? ' on' : '');
    basketEl.appendChild(c);
  }
}

/** Renseigne l'encart d'aide en arabe (darja), masqué jusqu'au tap sur "؟". */
function setHelp(arabicText) {
  helpCard.innerHTML = `<span class="ar">${arabicText}</span>`;
  helpCard.classList.remove('on');
}

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

/** Un seul son, pour la réussite — le design système exclut tout son d'échec. */
function chimeSuccess() {
  try {
    const ctx = chimeSuccess.ctx || (chimeSuccess.ctx = new (window.AudioContext || window.webkitAudioContext)());
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 660; o.type = 'sine';
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    o.start(); o.stop(ctx.currentTime + 0.35);
  } catch (e) { /* audio indisponible, sans conséquence pédagogique */ }
}

const avatarTag = (size) => `<div class="avatar${size === 'sm' ? ' sm' : ''}" aria-hidden="true">🦊</div>`;

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

/** Écran "découverte" d'un mot nouveau — pas de réponse, juste `onContinue`. */
function renderDiscover(screen, { onContinue }) {
  stage.innerHTML = avatarTag() +
    `<p class="say ar center">كلمة جديدة</p>` +
    `<div class="card-word">${escapeHtml(screen.word.english)}</div>` +
    `<button class="speaker" aria-label="Écouter">🔊</button>` +
    `<button class="cta primary">متابعة</button>`;
  stage.querySelector('.speaker').onclick = () => speak(screen.word.english);
  stage.querySelector('.cta').addEventListener('click', () => onContinue(), { once: true });
  setTimeout(() => speak(screen.word.english), 300);
}

/** listen_touch / read_touch : choix parmi `screen.options` (le mot + distracteurs). */
function renderChoice(screen, { onAnswer }) {
  const label = screen.kind === 'read_touch'
    ? 'المس الصورة المطابقة للكلمة المكتوبة'
    : 'المس صورة الكلمة التي تسمعها';
  stage.innerHTML =
    (screen.kind === 'read_touch'
      ? `<div class="card-word">${escapeHtml(screen.word.english)}</div>`
      : `<button class="speaker" aria-label="Écouter">🔊</button>`) +
    `<div class="grid"></div>` +
    `<p class="sub ar center">${label}</p>`;
  if (screen.kind === 'listen_touch') {
    stage.querySelector('.speaker').onclick = () => speak(screen.word.english);
    setTimeout(() => speak(screen.word.english), 300);
  }
  const grid = stage.querySelector('.grid');
  const shuffled = [...screen.options].sort(() => Math.random() - 0.5);
  const buttonByWordId = new Map();
  shuffled.forEach((opt) => {
    const b = document.createElement('button');
    b.className = 'opt';
    // Placeholder en attendant les illustrations réelles (cf. commentaire d'en-tête) :
    b.innerHTML = `<span class="lbl">${escapeHtml(opt.english)}</span>`;
    b.onclick = () => {
      grid.querySelectorAll('.opt').forEach((x) => (x.disabled = true));
      const ok = opt.wordId === screen.word.wordId;
      if (ok) { b.classList.add('good'); chimeSuccess(); speak(screen.word.english); }
      else {
        speak(screen.word.english, true);
        // Révèle la bonne réponse (erreur-douce, jamais rouge, jamais de croix) :
        buttonByWordId.get(screen.word.wordId)?.classList.add('err');
      }
      onAnswer(ok);
    };
    buttonByWordId.set(opt.wordId, b);
    grid.appendChild(b);
  });
}

/** true_false : la carte montre soit le vrai mot, soit un distracteur ; boutons صح/خطأ fixes. */
function renderTrueFalse(screen, { onAnswer }) {
  const showTruth = Math.random() < 0.5;
  const shownWord = showTruth ? screen.word : screen.options[1];
  stage.innerHTML = avatarTag('sm') +
    `<div class="card-word">${escapeHtml(shownWord.english)}</div>` +
    `<button class="speaker" aria-label="Écouter">🔊</button>` +
    `<p class="sub ar center">صح أو خطأ؟</p>` +
    `<div class="tfrow">
      <button class="tf yes">صح</button>
      <button class="tf no">خطأ</button>
    </div>`;
  stage.querySelector('.speaker').onclick = () => speak(screen.word.english);
  let answered = false; // évite un double-tap صح+خطأ pendant le délai avant l'écran suivant
  const answerTf = (saidYes) => {
    if (answered) return;
    answered = true;
    stage.querySelectorAll('.tf').forEach((b) => (b.disabled = true));
    const ok = saidYes === showTruth;
    if (ok) chimeSuccess(); else speak(screen.word.english, true);
    onAnswer(ok);
  };
  stage.querySelector('.yes').onclick = () => answerTf(true);
  stage.querySelector('.no').onclick = () => answerTf(false);
  setTimeout(() => speak(screen.word.english), 300);
}

/** say_it : micro avec halo actif + jauge vocale (barres), solution de repli "قلتها". */
function renderSayIt(screen, { onAnswer }) {
  stage.innerHTML = `
    <p class="say en center" style="text-align:center">${escapeHtml(screen.word.english)}</p>
    <p class="sub ar center">قل الكلمة بصوت عال</p>
    <div class="mic-wrap">
      <button class="mic" aria-label="Maintiens et parle">🎙️</button>
      <div class="voice-bars" aria-hidden="true">${Array.from({ length: 6 }, () => '<span style="height:6px"></span>').join('')}</div>
      <p class="mic-caption" id="micCaption"></p>
      <button class="alt">قلتها ✓</button>
    </div>`;
  const mic = stage.querySelector('.mic');
  const bars = [...stage.querySelectorAll('.voice-bars span')];
  const caption = document.getElementById('micCaption');
  const alt = stage.querySelector('.alt');
  let t = null, answered = false;

  const finishOk = () => {
    if (answered) return;
    answered = true;
    mic.disabled = true; alt.disabled = true;
    mic.classList.remove('active');
    caption.textContent = '';
    chimeSuccess();
    onAnswer(true);
  };
  const startListening = (e) => {
    e.preventDefault();
    if (answered) return;
    mic.classList.add('active');
    caption.innerHTML = '<span class="ar">جاري الاستماع…</span>';
    let elapsed = 0;
    t = setInterval(() => {
      bars.forEach((b) => (b.style.height = Math.round(6 + Math.random() * 22) + 'px'));
      elapsed += 90;
      if (elapsed >= 900) { clearInterval(t); finishOk(); }
    }, 90);
  };
  const stopListening = () => {
    if (t) clearInterval(t);
    if (!answered) { mic.classList.remove('active'); caption.textContent = ''; bars.forEach((b) => (b.style.height = '6px')); }
  };
  mic.onpointerdown = startListening;
  mic.onpointerup = stopListening;
  mic.onpointerleave = stopListening;
  alt.onclick = () => finishOk();
  setTimeout(() => speak(screen.word.english), 300);
}

/** construct : place les jetons dans les emplacements, "تحقق" ne s'active qu'une fois tout rempli. */
function renderConstruct(screen, { onAnswer }) {
  const shuffled = [...screen.tokens].sort(() => Math.random() - 0.5);
  let placed = [];
  stage.innerHTML =
    `<p class="sub ar center">رتب الكلمات لتكوين الجملة</p>` +
    `<div class="slots">${screen.tokens.map(() => '<div class="slot"></div>').join('')}</div>` +
    `<div class="chips"></div>` +
    `<button class="cta primary" disabled>تحقق</button>`;
  const chips = stage.querySelector('.chips');
  const slots = stage.querySelectorAll('.slot');
  const checkBtn = stage.querySelector('.cta');
  shuffled.forEach((w) => {
    const c = document.createElement('button');
    c.className = 'chip'; c.textContent = w;
    c.onclick = () => {
      if (placed.length >= screen.tokens.length) return;
      c.classList.add('used');
      slots[placed.length].textContent = w;
      slots[placed.length].classList.add('filled');
      placed.push(w);
      if (placed.length === screen.tokens.length) checkBtn.disabled = false;
    };
    chips.appendChild(c);
  });
  checkBtn.addEventListener('click', () => {
    const ok = placed.join(' ') === screen.tokens.join(' ');
    checkBtn.disabled = true;
    if (ok) { chimeSuccess(); speak(screen.word.english); }
    else {
      // Révèle l'ordre correct (erreur-douce, jamais rouge) :
      slots.forEach((s, i) => { s.textContent = screen.tokens[i]; s.classList.remove('filled'); });
      speak(screen.word.english, true);
    }
    onAnswer(ok);
  }, { once: true });
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

export { stage, setProgress, setBossProgress, setHelp, speak, chimeSuccess, avatarTag, escapeHtml, renderScreen };
