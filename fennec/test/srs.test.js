'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const srsPromise = import('../src/srs.mjs');

const DAY = 24 * 60 * 60 * 1000;
const d = (base, days) => new Date(base.getTime() + days * DAY);

test('introduce() programme la première échéance à J+1', async () => {
  const srs = await srsPromise;
  const t0 = new Date('2026-09-06T08:00:00Z');
  const s = srs.introduce(t0);
  assert.equal(s.step, 0);
  assert.equal(s.repsOk, 0);
  assert.equal(s.masteredAt, null);
  assert.equal(s.dueAt.getTime(), d(t0, 1).getTime());
});

test('5 réussites consécutives aux bons intervalles => maîtrisé', async () => {
  const srs = await srsPromise;
  const t0 = new Date('2026-09-06T08:00:00Z');
  let s = srs.introduce(t0);
  const expectedSteps = srs.STEPS;
  let now = t0;
  for (let i = 0; i < expectedSteps.length; i++) {
    now = s.dueAt; // on révise pile à l'échéance
    const before = s;
    s = srs.review(s, true, now);
    if (i < expectedSteps.length - 1) {
      assert.equal(s.masteredAt, null, `ne doit pas être maîtrisé après ${i + 1} réussite(s)`);
      assert.equal(s.repsOk, i + 1);
    }
  }
  assert.ok(s.masteredAt, 'doit être maîtrisé après 5 réussites espacées');
  assert.equal(s.repsOk, srs.MASTERY_REPS);
  assert.ok(srs.isMastered(s));
});

test('un échec fait reculer le palier sans repartir à zéro', async () => {
  const srs = await srsPromise;
  const t0 = new Date('2026-09-06T08:00:00Z');
  let s = srs.introduce(t0);
  s = srs.review(s, true, s.dueAt);   // step 0 -> 1 (repsOk=1)
  s = srs.review(s, true, s.dueAt);   // step 1 -> 2 (repsOk=2)
  const stepBeforeFail = s.step;
  s = srs.review(s, false, s.dueAt);  // échec : recule d'un cran
  assert.equal(s.step, stepBeforeFail - 1);
  assert.equal(s.repsOk, 0, 'repsOk doit repartir de 0 après un échec');
  assert.equal(s.lastResult, false);
});

test("un échec au palier 0 ne descend pas sous 0", async () => {
  const srs = await srsPromise;
  const t0 = new Date('2026-09-06T08:00:00Z');
  let s = srs.introduce(t0);
  const reviewedAt = s.dueAt;
  s = srs.review(s, false, reviewedAt);
  assert.equal(s.step, 0);
  // la nouvelle échéance repart de l'instant de la révision (reviewedAt),
  // pas de la date d'introduction — l'enfant a échoué "maintenant".
  assert.equal(s.dueAt.getTime(), d(reviewedAt, srs.STEPS[0]).getTime());
});

test('review() sur un mot jamais introduit lève une erreur explicite', async () => {
  const srs = await srsPromise;
  assert.throws(() => srs.review(srs.freshState(), true, new Date()), /jamais introduit/);
});

test('un mot maîtrisé ne reprogramme plus d\'échéance SRS', async () => {
  const srs = await srsPromise;
  const t0 = new Date('2026-09-06T08:00:00Z');
  let s = srs.introduce(t0);
  for (let i = 0; i < srs.STEPS.length; i++) s = srs.review(s, true, s.dueAt);
  assert.ok(s.masteredAt);
  const again = srs.review(s, true, d(s.masteredAt, 100));
  assert.equal(again.dueAt, null);
  assert.equal(again.masteredAt, s.masteredAt);
});

test('isDue() : un mot est dû seulement à/après son échéance, jamais s\'il est maîtrisé', async () => {
  const srs = await srsPromise;
  const t0 = new Date('2026-09-06T08:00:00Z');
  const s = srs.introduce(t0);
  assert.equal(srs.isDue(s, t0), false, 'pas encore dû le jour de l\'introduction');
  assert.equal(srs.isDue(s, s.dueAt), true, 'dû pile à l\'échéance');
  assert.equal(srs.isDue(s, d(s.dueAt, 5)), true, 'toujours dû si en retard');
  assert.equal(srs.isDue(srs.freshState(), t0), false, 'un mot jamais introduit n\'est jamais dû');
});

test('selectDueWords() trie par ancienneté et respecte la limite', async () => {
  const srs = await srsPromise;
  const t0 = new Date('2026-09-06T08:00:00Z');
  const mkDue = (daysLate) => ({
    ...srs.introduce(t0),
    dueAt: d(t0, -daysLate), // échéance déjà passée de `daysLate` jours
  });
  const entries = [
    { wordId: 1, state: mkDue(1) },
    { wordId: 2, state: mkDue(10) }, // le plus en retard
    { wordId: 3, state: mkDue(5) },
    { wordId: 4, state: srs.freshState() }, // jamais introduit : jamais sélectionné
  ];
  const due = srs.selectDueWords(entries, t0, 2);
  assert.deepEqual(due.map((e) => e.wordId), [2, 3]);
});

test('selectNewWords() ne propose que les mots programmés pour semaine/jour courants, non déjà introduits', async () => {
  const srs = await srsPromise;
  const catalog = [
    { wordId: 10, introWeek: 21, introDay: 1 },
    { wordId: 11, introWeek: 21, introDay: 1 },
    { wordId: 12, introWeek: 21, introDay: 2 },
  ];
  const states = new Map([[10, { introducedAt: new Date() }]]); // déjà introduit
  const result = srs.selectNewWords(catalog, states, 21, 1);
  assert.deepEqual(result, [11]);
});

test('bossVerdict() applique le seuil de 80 % du script (10/12)', async () => {
  const srs = await srsPromise;
  const ok10of12 = [...Array(10).fill(true), ...Array(2).fill(false)];
  const ok9of12 = [...Array(9).fill(true), ...Array(3).fill(false)];
  assert.equal(srs.bossVerdict(ok10of12).passed, true);
  assert.equal(srs.bossVerdict(ok9of12).passed, false);
  assert.equal(srs.bossVerdict([]).passed, false);
  assert.equal(srs.bossVerdict([]).ratio, 0);
});
