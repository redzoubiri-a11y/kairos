/**
 * Fennec — BEM Sprint, premier segment réel dans l'app (BS1 · Reading
 * Comprehension, cf. docs/curriculum-bem-sprint.md).
 *
 * Choix d'architecture assumé ici (le document listait deux options sans
 * trancher) : pas de réutilisation du SRS mot-par-mot pour l'instant —
 * ce premier segment est un mode "practice" autonome, sans état persisté,
 * comme classroomQuiz.mjs. La question plus profonde ("comment le SRS
 * pourrait suivre des motifs d'erreur d'examen dans la durée") reste
 * ouverte ; ce fichier ne la referme pas, il livre un premier exercice
 * réel et jouable pendant qu'elle se pose.
 *
 * BS1 (Reading Comprehension), BS2 (Lexis), BS3 (Mechanics & Morphology),
 * BS4 (Syntax) et BS5 (Pronunciation) seulement, sélectionnables via
 * ?week=1..5 ou les onglets en haut — BS6-BS8 ne sont pas encore
 * intégrés, cf. fennec/README.md.
 */

const WEEK_TITLES = {
  1: 'BS1 · Reading Comprehension',
  2: 'BS2 · Lexis',
  3: 'BS3 · Mechanics & Morphology',
  4: 'BS4 · Syntax',
  5: 'BS5 · Pronunciation',
};

const brandLabel = document.getElementById('brandLabel');
const weekNav = document.getElementById('weekNav');
const textTitle = document.getElementById('textTitle');
const textBody = document.getElementById('textBody');
const progress = document.getElementById('progress');
const promptAr = document.getElementById('promptAr');
const promptEn = document.getElementById('promptEn');
const tfBlock = document.getElementById('tfBlock');
const tfYes = document.getElementById('tfYes');
const tfNo = document.getElementById('tfNo');
const optList = document.getElementById('optList');
const nextBtn = document.getElementById('nextBtn');
const qwrap = document.getElementById('qwrap');
const endScreen = document.getElementById('endScreen');
const scoreLine = document.getElementById('scoreLine');
const scoreDetail = document.getElementById('scoreDetail');
const restartBtn = document.getElementById('restartBtn');

let data = null;
let index = 0;
let correctCount = 0;
let answered = false;
let week = 1;

function currentWeek() {
  const requested = Number(new URLSearchParams(location.search).get('week'));
  return WEEK_TITLES[requested] ? requested : 1;
}

async function boot() {
  week = currentWeek();
  brandLabel.textContent = `🎓 Fennec — BEM Sprint · ${WEEK_TITLES[week]}`;
  [...weekNav.children].forEach((a) => {
    a.classList.toggle('active', Number(a.dataset.week) === week);
  });
  data = await fetch(`bemSprintBS${week}.json`).then((r) => r.json());
  textTitle.textContent = data.text.title;
  textBody.textContent = data.text.body.join(' ');
  index = 0;
  correctCount = 0;
  renderItem();
}

function renderItem() {
  answered = false;
  const item = data.items[index];
  progress.textContent = `${index + 1} / ${data.items.length}`;
  nextBtn.hidden = true;
  optList.innerHTML = '';
  tfBlock.hidden = true;
  tfYes.disabled = false;
  tfNo.disabled = false;

  if (item.kind === 'mcq') {
    promptAr.textContent = item.prompt;
    promptEn.textContent = item.promptEn;
    item.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'opt2';
      btn.textContent = opt;
      btn.addEventListener('click', () => revealMcq(i));
      optList.appendChild(btn);
    });
  } else if (item.kind === 'true_false_justify') {
    promptAr.textContent = 'صح أم خطأ؟';
    promptEn.textContent = item.statement;
    tfBlock.hidden = false;
    tfYes.addEventListener('click', () => revealTrueFalse(true), { once: true });
    tfNo.addEventListener('click', () => revealTrueFalse(false), { once: true });
  }
}

function revealMcq(chosenIndex) {
  if (answered) return;
  answered = true;
  const item = data.items[index];
  const isCorrect = chosenIndex === item.correctIndex;
  if (isCorrect) correctCount++;
  [...optList.children].forEach((btn, i) => {
    btn.disabled = true;
    if (i === item.correctIndex) btn.classList.add('correct');
    else btn.classList.add('faded');
  });
  nextBtn.hidden = false;
}

function revealTrueFalse(chosen) {
  if (answered) return;
  answered = true;
  const item = data.items[index];
  tfYes.disabled = true;
  tfNo.disabled = true;
  const statementCorrect = chosen === item.answer;

  // Deuxième étape : justifier avec la bonne phrase du texte — c'est
  // cette étape qui est notée au BEM, pas juste vrai/faux (cf. BS1·jour2).
  promptAr.textContent = 'أي جملة من النص تثبت ذلك؟';
  promptEn.textContent = 'Which sentence from the text proves it?';
  optList.innerHTML = '';
  item.proofOptions.forEach((proof, i) => {
    const btn = document.createElement('button');
    btn.className = 'opt2';
    btn.textContent = proof;
    btn.addEventListener('click', () => {
      const proofCorrect = i === item.correctProofIndex;
      if (statementCorrect && proofCorrect) correctCount++;
      [...optList.children].forEach((b, j) => {
        b.disabled = true;
        if (j === item.correctProofIndex) b.classList.add('correct');
        else b.classList.add('faded');
      });
      nextBtn.hidden = false;
    }, { once: true });
    optList.appendChild(btn);
  });
}

nextBtn.addEventListener('click', () => {
  index += 1;
  if (index >= data.items.length) {
    showEnd();
  } else {
    renderItem();
  }
});

function showEnd() {
  qwrap.hidden = true;
  endScreen.hidden = false;
  const total = data.items.length;
  scoreLine.textContent = `${correctCount} / ${total}`;
  const pct = Math.round((correctCount / total) * 100);
  scoreDetail.textContent = `النتيجة : ${pct}% — ${WEEK_TITLES[week]}`;
}

restartBtn.addEventListener('click', () => {
  endScreen.hidden = true;
  qwrap.hidden = false;
  boot();
});

boot();
