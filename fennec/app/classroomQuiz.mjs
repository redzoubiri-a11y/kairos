/**
 * Fennec — quiz projetable ("mode classe" de l'analyse stratégique).
 *
 * Un seul appareil (celui du professeur, branché au vidéoprojecteur) pilote
 * l'écran ; la classe répond à voix haute ou à main levée, l'enseignant
 * clique sur l'option choisie par le consensus de la classe. Aucune
 * synchronisation réseau : ce n'est pas un Kahoot multi-appareils (ça
 * demanderait un backend), c'est l'outil "devoirs projetés" décrit dans
 * l'analyse — utilisable dès aujourd'hui, sans Supabase.
 *
 * Réutilise le vrai référentiel (catalog.json) et pickDistractors du moteur
 * réel (src/queue.mjs) — les questions sont de vrais mots du curriculum,
 * pas des données inventées pour la démo.
 */

import { pickDistractors, shuffle } from '../src/queue.mjs';

const TIMER_SECONDS = 12;

const setupScreen = document.getElementById('setupScreen');
const quizScreen = document.getElementById('quizScreen');
const endScreen = document.getElementById('endScreen');
const weekSelect = document.getElementById('weekSelect');
const countSelect = document.getElementById('countSelect');
const startBtn = document.getElementById('startBtn');
const qzProgress = document.getElementById('qzProgress');
const timerFill = document.getElementById('timerFill');
const promptEmoji = document.getElementById('promptEmoji');
const promptWord = document.getElementById('promptWord');
const optGrid = document.getElementById('optGrid');
const revealBtn = document.getElementById('revealBtn');
const nextBtn = document.getElementById('nextBtn');
const endSummary = document.getElementById('endSummary');
const wordRecap = document.getElementById('wordRecap');
const restartBtn = document.getElementById('restartBtn');

let catalog = [];
let wordEmoji = {};
let questions = [];
let qIndex = 0;
let timerHandle = null;
let revealed = false;

async function boot() {
  try {
    catalog = await fetch('catalog.json').then((r) => r.json());
  } catch {
    weekSelect.innerHTML = '<option>—</option>';
    startBtn.disabled = true;
    startBtn.textContent = 'تعذّر تحميل الكلمات — تحقق من الاتصال';
    return;
  }
  wordEmoji = await fetch('word-emoji.json').then((r) => r.json()).catch(() => ({}));

  const weeks = [...new Set(catalog.map((w) => w.introWeek))].sort((a, b) => a - b);
  weekSelect.innerHTML = weeks.map((w) => `<option value="${w}">S${w}</option>`).join('');
  weekSelect.value = String(weeks[weeks.length - 1]);
  startBtn.disabled = false;
}

function buildQuestions(untilWeek, count) {
  const pool = catalog.filter((w) => w.introWeek <= untilWeek);
  const shuffled = shuffle(pool);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((word) => {
    const distractors = pickDistractors(pool, word, 3);
    const options = shuffle([word, ...distractors]);
    return { word, options };
  });
}

startBtn.addEventListener('click', () => {
  const untilWeek = Number(weekSelect.value);
  const count = Number(countSelect.value);
  questions = buildQuestions(untilWeek, count);
  qIndex = 0;
  setupScreen.hidden = true;
  endScreen.hidden = true;
  quizScreen.hidden = false;
  renderQuestion();
});

function renderQuestion() {
  revealed = false;
  clearInterval(timerHandle);
  const q = questions[qIndex];
  qzProgress.textContent = `${qIndex + 1} / ${questions.length}`;
  promptWord.textContent = q.word.english;
  const emoji = wordEmoji[String(q.word.wordId)];
  if (emoji) {
    promptEmoji.hidden = false;
    promptEmoji.textContent = emoji;
  } else {
    promptEmoji.hidden = true;
  }

  optGrid.innerHTML = '';
  q.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'qopt ar';
    btn.textContent = opt.french;
    btn.dataset.wordId = String(opt.wordId);
    btn.addEventListener('click', () => reveal(opt.wordId));
    optGrid.appendChild(btn);
  });

  nextBtn.hidden = true;
  revealBtn.hidden = false;

  runTimer();
}

function runTimer() {
  const start = Date.now();
  timerFill.style.transition = 'none';
  timerFill.style.transform = 'scaleX(1)';
  requestAnimationFrame(() => {
    timerFill.style.transition = `transform ${TIMER_SECONDS}s linear`;
    timerFill.style.transform = 'scaleX(0)';
  });
  timerHandle = setInterval(() => {
    if (Date.now() - start >= TIMER_SECONDS * 1000) {
      clearInterval(timerHandle);
      if (!revealed) reveal(null);
    }
  }, 200);
}

function reveal(chosenWordId) {
  if (revealed) return;
  revealed = true;
  clearInterval(timerHandle);
  const q = questions[qIndex];
  [...optGrid.children].forEach((btn) => {
    const isCorrect = Number(btn.dataset.wordId) === q.word.wordId;
    btn.disabled = true;
    if (isCorrect) btn.classList.add('correct');
    else if (chosenWordId !== null) btn.classList.add('faded');
  });
  revealBtn.hidden = true;
  nextBtn.hidden = false;
}

revealBtn.addEventListener('click', () => reveal(null));

nextBtn.addEventListener('click', () => {
  qIndex += 1;
  if (qIndex >= questions.length) {
    showEnd();
  } else {
    renderQuestion();
  }
});

function showEnd() {
  quizScreen.hidden = true;
  endScreen.hidden = false;
  endSummary.textContent = `${questions.length} كلمة — من الأسبوع 1 إلى الأسبوع ${weekSelect.value}`;
  wordRecap.innerHTML = questions
    .map((q) => `<span>${q.word.english}</span>`)
    .join('');
}

restartBtn.addEventListener('click', () => {
  endScreen.hidden = true;
  setupScreen.hidden = false;
});

boot();
