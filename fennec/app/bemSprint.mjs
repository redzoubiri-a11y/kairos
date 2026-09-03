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
 * BS4 (Syntax), BS5 (Pronunciation), BS6 (Written Expression) et BS7
 * (premier examen blanc) seulement, sélectionnables via ?week=1..7 ou les
 * onglets en haut — BS8 n'est pas encore intégré, cf. fennec/README.md.
 *
 * BS6 est structurellement différent des semaines précédentes : ce n'est
 * pas objectivement notable par QCM (c'est de la rédaction libre). Plutôt
 * que de simuler une "correction" automatique de grammaire/cohérence que
 * cette app n'a pas les moyens de faire honnêtement, BS6 fait deux choses
 * réellement vérifiables : (1) une vérification par mots-clés que chaque
 * note de la situation d'intégration a bien été utilisée (substring
 * insensible à la casse — un signal grossier mais honnête, pas une
 * prétention de corriger la langue), et (2) l'auto-évaluation à la grille
 * analytique du BEM, qui est exactement l'activité prévue par le
 * curriculum (BS6·jour4) plutôt qu'un artifice inventé pour l'occasion.
 *
 * BS7 (examen blanc) combine les 6 semaines précédentes sur un texte
 * inédit, avec le vrai barème du BEM (points par item, pas un score
 * uniforme) et un vrai chrono d'examen (data.durationMinutes, ou
 * ?duration=<minutes> pour la démo/le test — sans quoi il faudrait
 * attendre 2h réelles pour valider l'expiration du temps). L'item
 * d'expression écrite reçoit des points proportionnels aux notes
 * retrouvées (mêmes mots-clés que BS6) — un barème de contenu réel, pas
 * une prétention de noter la qualité de la langue.
 *
 * BS8 (deuxième examen blanc) réutilise exactement le même moteur que
 * BS7. Ce qui change : le score de chaque semaine "examen" (isMock) est
 * persisté en localStorage (`bemSprint_mock_score_<week>`) — le seul état
 * persisté de tout BEM Sprint, ajouté précisément pour permettre le delta
 * objectif que le curriculum demande (BS8·jour2, même logique que les
 * bilans S1→S16→S32 de Foundations). L'écran de fin de BS8 ajoute aussi la
 * fiche de révision personnelle (BS8·jour5, texte libre sauvegardé en
 * localStorage) et un rappel statique de stratégie jour J (BS8·jour3-4) —
 * du contenu affiché, pas une simulation interactive inventée pour
 * l'occasion.
 */

const WEEK_TITLES = {
  1: 'BS1 · Reading Comprehension',
  2: 'BS2 · Lexis',
  3: 'BS3 · Mechanics & Morphology',
  4: 'BS4 · Syntax',
  5: 'BS5 · Pronunciation',
  6: 'BS6 · Written Expression',
  7: 'BS7 · Examen blanc n°1',
  8: 'BS8 · Examen blanc n°2',
};

const PART_LABELS = {
  comprehension: 'Reading Comprehension',
  language: 'Mastery of Language',
  writing: 'Written Expression',
};

const brandLabel = document.getElementById('brandLabel');
const weekNav = document.getElementById('weekNav');
const passageBlock = document.querySelector('.passage');
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
const notesBlock = document.getElementById('notesBlock');
const notesTitleAr = document.getElementById('notesTitleAr');
const notesList = document.getElementById('notesList');
const writingArea = document.getElementById('writingArea');
const checkBtn = document.getElementById('checkBtn');
const rubricBlock = document.getElementById('rubricBlock');
const mockTimer = document.getElementById('mockTimer');
const partScore = document.getElementById('partScore');
const deltaLine = document.getElementById('deltaLine');
const strategyBlock = document.getElementById('strategyBlock');
const revSheet = document.getElementById('revSheet');
const revNotes = document.getElementById('revNotes');
const revSaved = document.getElementById('revSaved');

const REV_NOTES_KEY = 'bemSprint_revision_notes';
function mockScoreKey(w) {
  return `bemSprint_mock_score_${w}`;
}

let data = null;
let index = 0;
let correctCount = 0;
let answered = false;
let week = 1;
let writingCompleted = false;
let earnedByPart = {};
let timerHandle = null;

function currentWeek() {
  const requested = Number(new URLSearchParams(location.search).get('week'));
  return WEEK_TITLES[requested] ? requested : 1;
}

function itemPoints(item) {
  return typeof item.points === 'number' ? item.points : 1;
}

function awardPoints(item, points) {
  const part = item.part || 'default';
  earnedByPart[part] = (earnedByPart[part] || 0) + points;
}

async function boot() {
  week = currentWeek();
  brandLabel.textContent = `🎓 Fennec — BEM Sprint · ${WEEK_TITLES[week]}`;
  [...weekNav.children].forEach((a) => {
    a.classList.toggle('active', Number(a.dataset.week) === week);
  });
  data = await fetch(`bemSprintBS${week}.json`).then((r) => r.json());
  passageBlock.hidden = !data.text;
  if (data.text) {
    textTitle.textContent = data.text.title;
    textBody.textContent = data.text.body.join(' ');
  }
  index = 0;
  correctCount = 0;
  writingCompleted = false;
  earnedByPart = {};
  clearInterval(timerHandle);
  mockTimer.hidden = !data.isMock;
  if (data.isMock) startMockTimer();
  renderItem();
}

function startMockTimer() {
  const override = Number(new URLSearchParams(location.search).get('duration'));
  const totalMinutes = override > 0 ? override : data.durationMinutes || 120;
  const deadline = Date.now() + totalMinutes * 60 * 1000;
  const tick = () => {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      clearInterval(timerHandle);
      mockTimer.textContent = '00:00';
      showEnd();
      return;
    }
    const totalSec = Math.ceil(remainingMs / 1000);
    const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const ss = String(totalSec % 60).padStart(2, '0');
    mockTimer.textContent = `⏱ ${mm}:${ss}`;
    mockTimer.classList.toggle('low', totalSec <= 300);
  };
  tick();
  timerHandle = setInterval(tick, 1000);
}

function hideAllInputs() {
  nextBtn.hidden = true;
  optList.innerHTML = '';
  tfBlock.hidden = true;
  tfYes.disabled = false;
  tfNo.disabled = false;
  notesBlock.hidden = true;
  writingArea.hidden = true;
  writingArea.value = '';
  checkBtn.hidden = true;
  rubricBlock.hidden = true;
  rubricBlock.innerHTML = '';
}

function renderItem() {
  answered = false;
  const item = data.items[index];
  progress.textContent = `${index + 1} / ${data.items.length}`;
  hideAllInputs();

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
  } else if (item.kind === 'writing') {
    renderWriting(item);
  }
}

function renderWriting(item) {
  promptAr.textContent = item.instructionAr;
  promptEn.textContent = item.titleEn;
  notesBlock.hidden = false;
  notesTitleAr.textContent = item.titleAr;
  notesList.innerHTML = item.notes.map((n) => `<li>${n.en}</li>`).join('');
  writingArea.hidden = false;
  checkBtn.hidden = false;

  checkBtn.addEventListener('click', () => {
    const text = writingArea.value.toLowerCase();
    let foundCount = 0;
    [...notesList.children].forEach((li, i) => {
      const note = item.notes[i];
      const found = note.keywords.some((kw) => text.includes(kw.toLowerCase()));
      li.classList.toggle('found', found);
      li.classList.toggle('missing', !found);
      if (found) foundCount++;
    });
    checkBtn.hidden = true;
    writingArea.disabled = true;
    if (data.isMock) {
      // Barème de contenu réel (points proportionnels aux notes retrouvées) —
      // pas une prétention de noter la qualité de la langue, cf. l'en-tête.
      const proportion = foundCount / item.notes.length;
      awardPoints(item, Math.round(itemPoints(item) * proportion * 2) / 2);
    }
    renderRubric(item, foundCount);
  }, { once: true });
}

function renderRubric(item, foundCount) {
  rubricBlock.hidden = false;
  const ratings = {};
  const levels = [
    { id: 'good', label: 'جيد جدًا' },
    { id: 'ok', label: 'مقبول' },
    { id: 'work', label: 'يحتاج عمل' },
  ];
  item.rubric.forEach((criterion) => {
    const row = document.createElement('div');
    row.className = 'rubric-row';
    row.innerHTML = `<span class="lbl ar">${criterion.labelAr}</span><span class="choices"></span>`;
    const choices = row.querySelector('.choices');
    levels.forEach((lvl) => {
      const btn = document.createElement('button');
      btn.className = 'ar';
      btn.textContent = lvl.label;
      btn.addEventListener('click', () => {
        ratings[criterion.id] = lvl.id;
        [...choices.children].forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        if (Object.keys(ratings).length === item.rubric.length) {
          writingCompleted = true;
          nextBtn.hidden = false;
          nextBtn.textContent = 'إنهاء ←';
        }
      });
      choices.appendChild(btn);
    });
    rubricBlock.appendChild(row);
  });
}

function revealMcq(chosenIndex) {
  if (answered) return;
  answered = true;
  const item = data.items[index];
  const isCorrect = chosenIndex === item.correctIndex;
  if (isCorrect) {
    correctCount++;
    awardPoints(item, itemPoints(item));
  }
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
      if (statementCorrect && proofCorrect) {
        correctCount++;
        awardPoints(item, itemPoints(item));
      }
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
  clearInterval(timerHandle);
  qwrap.hidden = true;
  endScreen.hidden = false;
  partScore.innerHTML = '';
  deltaLine.hidden = true;
  strategyBlock.hidden = true;
  revSheet.hidden = true;
  const isWritingWeek = data.items.every((it) => it.kind === 'writing');

  if (data.isMock) {
    const maxPoints = data.items.reduce((sum, it) => sum + itemPoints(it), 0);
    const earned = Object.values(earnedByPart).reduce((sum, v) => sum + v, 0);
    scoreLine.textContent = `${earned} / ${maxPoints}`;
    scoreDetail.textContent = `النتيجة الإجمالية — ${WEEK_TITLES[week]}`;
    const maxByPart = {};
    data.items.forEach((it) => {
      const part = it.part || 'default';
      maxByPart[part] = (maxByPart[part] || 0) + itemPoints(it);
    });
    partScore.innerHTML = Object.keys(maxByPart)
      .map((part) => `${PART_LABELS[part] || part} : ${earnedByPart[part] || 0} / ${maxByPart[part]}`)
      .join('<br>');

    try { localStorage.setItem(mockScoreKey(week), String(earned)); } catch { /* stockage indisponible, pas bloquant */ }

    if (week === 8) {
      let previous = null;
      try { previous = localStorage.getItem(mockScoreKey(7)); } catch { /* ignore */ }
      deltaLine.hidden = false;
      if (previous === null) {
        deltaLine.className = 'delta ar flat';
        deltaLine.textContent = 'لم يُسجَّل بعد محاولة BS7 على هذا الجهاز للمقارنة.';
      } else {
        const diff = earned - Number(previous);
        deltaLine.className = `delta ar ${diff >= 0 ? 'up' : 'flat'}`;
        const sign = diff > 0 ? '▲ +' : diff < 0 ? '▼ ' : '● ';
        deltaLine.textContent = `${sign}${diff} نقطة منذ BS7 (${previous} → ${earned})`;
      }
      strategyBlock.hidden = false;
      revSheet.hidden = false;
      try { revNotes.value = localStorage.getItem(REV_NOTES_KEY) || ''; } catch { revNotes.value = ''; }
      revNotes.oninput = () => {
        try {
          localStorage.setItem(REV_NOTES_KEY, revNotes.value);
          revSaved.textContent = '✓ محفوظ';
          clearTimeout(revNotes._t);
          revNotes._t = setTimeout(() => { revSaved.textContent = ''; }, 1500);
        } catch { /* stockage indisponible, pas bloquant */ }
      };
    }
  } else if (isWritingWeek) {
    // Pas de score chiffré ici : une rédaction libre n'est pas notable par
    // QCM, cf. la note en tête de fichier. On montre l'accomplissement de
    // la tâche, pas une fausse précision.
    scoreLine.textContent = '✅';
    scoreDetail.textContent = `تم إنجاز المهمة — ${WEEK_TITLES[week]}`;
  } else {
    const total = data.items.length;
    scoreLine.textContent = `${correctCount} / ${total}`;
    const pct = Math.round((correctCount / total) * 100);
    scoreDetail.textContent = `النتيجة : ${pct}% — ${WEEK_TITLES[week]}`;
  }
}

restartBtn.addEventListener('click', () => {
  endScreen.hidden = true;
  qwrap.hidden = false;
  boot();
});

boot();
