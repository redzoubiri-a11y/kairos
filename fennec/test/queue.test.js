'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const queuePromise = import('../src/queue.mjs');
const srsPromise = import('../src/srs.mjs');

const CATALOG = [
  { wordId: 1, english: 'hello', french: 'bonjour', category: 'lexique', introWeek: 1, introDay: 1 },
  { wordId: 2, english: 'bread', french: 'pain', category: 'lexique', introWeek: 21, introDay: 1 },
  { wordId: 3, english: 'milk', french: 'lait', category: 'lexique', introWeek: 21, introDay: 1 },
  { wordId: 4, english: 'I like milk', french: "j'aime le lait", category: 'structure', introWeek: 21, introDay: 3 },
  { wordId: 5, english: 'ship', french: '(mot de lecture)', category: 'décodable', introWeek: 21, introDay: 2 },
  { wordId: 6, english: 'water', french: 'eau', category: 'lexique', introWeek: 21, introDay: 1 },
];

test('buildDailyQueue sélectionne les mots dus (via srs) et les nouveaux mots du jour', async () => {
  const { buildDailyQueue } = await queuePromise;
  const { introduce } = await srsPromise;
  const now = new Date('2026-09-06T08:00:00Z');
  const overdue = { ...introduce(now), dueAt: new Date('2026-09-01T08:00:00Z') };
  const states = new Map([[1, overdue]]);

  const { dueEntries, newWordIds } = buildDailyQueue({
    catalog: CATALOG,
    states,
    currentWeek: 21,
    currentDay: 1,
    now,
  });

  assert.deepEqual(dueEntries.map((e) => e.wordId), [1]);
  assert.deepEqual(newWordIds.sort(), [2, 3, 6]); // les 3 mots programmés S21/jour1, hors 4 (jour3) et 5 (jour2)
});

test('pickDistractors préfère la même catégorie et exclut le mot lui-même', async () => {
  const { pickDistractors } = await queuePromise;
  const word = CATALOG.find((w) => w.wordId === 2); // bread, lexique
  const rng = () => 0.5; // déterministe
  const distractors = pickDistractors(CATALOG, word, 2, rng);
  assert.equal(distractors.length, 2);
  assert.ok(distractors.every((d) => d.wordId !== 2));
  assert.ok(distractors.every((d) => d.category === 'lexique'));
});

test('pickDistractors retombe sur une autre catégorie si pas assez de mots de la même catégorie', async () => {
  const { pickDistractors } = await queuePromise;
  const small = [
    { wordId: 10, category: 'structure', english: 'a' },
    { wordId: 11, category: 'lexique', english: 'b' },
  ];
  const distractors = pickDistractors(small, small[0], 1, () => 0);
  assert.equal(distractors.length, 1);
  assert.equal(distractors[0].wordId, 11);
});

test('screenKindFor : décodable => read_touch, structure => construct, sinon rotation stable par wordId', async () => {
  const { screenKindFor } = await queuePromise;
  assert.equal(screenKindFor({ wordId: 5, category: 'décodable' }), 'read_touch');
  assert.equal(screenKindFor({ wordId: 4, category: 'structure' }), 'construct');
  // la rotation est une fonction pure de wordId : même mot => même résultat à chaque appel
  const w = { wordId: 7, category: 'lexique' };
  assert.equal(screenKindFor(w), screenKindFor(w));
});

test('buildScreenPlan construit Réveil puis Nouveau (découverte + pratique), avec options/tokens selon le type', async () => {
  const { buildScreenPlan } = await queuePromise;
  const { introduce } = await srsPromise;
  const now = new Date('2026-09-06T08:00:00Z');
  const dueState = { ...introduce(now), dueAt: new Date('2026-09-01T08:00:00Z') };

  const plan = buildScreenPlan({
    dueEntries: [{ wordId: 1, state: dueState }],
    newWordIds: [4, 5], // structure + décodable
    catalog: CATALOG,
    rng: () => 0.3,
  });

  // 1 écran de Réveil, puis pour chaque nouveau mot : discover + pratique
  assert.equal(plan[0].phase, 'reveil');
  assert.equal(plan[0].word.wordId, 1);

  const structureScreens = plan.filter((s) => s.word.wordId === 4);
  assert.equal(structureScreens[0].kind, 'discover');
  assert.equal(structureScreens[1].kind, 'construct');
  assert.deepEqual(structureScreens[1].tokens, ['I', 'like', 'milk']);

  const decodableScreens = plan.filter((s) => s.word.wordId === 5);
  assert.equal(decodableScreens[1].kind, 'read_touch');
  assert.ok(Array.isArray(decodableScreens[1].options));
  assert.ok(decodableScreens[1].options.some((o) => o.wordId === 5));
});

test('buildScreenPlan ignore silencieusement un wordId absent du catalogue (mot retiré)', async () => {
  const { buildScreenPlan } = await queuePromise;
  const plan = buildScreenPlan({ dueEntries: [{ wordId: 999, state: {} }], newWordIds: [], catalog: CATALOG });
  assert.deepEqual(plan, []);
});

test('insertRetest insère une variante marquée isRetest deux écrans plus loin, sans muter l\'entrée', async () => {
  const { insertRetest } = await queuePromise;
  const remaining = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const failed = { id: 'x', kind: 'listen_touch' };
  const result = insertRetest(remaining, failed);

  assert.equal(remaining.length, 3, 'le tableau d\'entrée ne doit pas être muté');
  assert.equal(result.length, 4);
  assert.equal(result[2].id, 'x');
  assert.equal(result[2].isRetest, true);
});

test('insertRetest place le clone en fin si moins de 2 écrans restent', async () => {
  const { insertRetest } = await queuePromise;
  const result = insertRetest([{ id: 'a' }], { id: 'x' });
  assert.deepEqual(result.map((s) => s.id), ['a', 'x']);
});

test('buildBossPlan construit exactement `count` défis phase="boss" à partir des mots de la semaine', async () => {
  const { buildBossPlan } = await queuePromise;
  const plan = buildBossPlan({ catalog: CATALOG, week: 21, count: 12, rng: () => 0.4 });
  assert.equal(plan.length, 12);
  assert.ok(plan.every((s) => s.phase === 'boss'));
  assert.ok(plan.every((s) => CATALOG.some((w) => w.wordId === s.word.wordId && w.introWeek === 21)));
});

test('buildBossPlan boucle sur les mots de la semaine si count dépasse leur nombre', async () => {
  const { buildBossPlan } = await queuePromise;
  // S21 dans CATALOG ne compte que 5 mots (2,3,4,5,6) ; on en redemande 12.
  const plan = buildBossPlan({ catalog: CATALOG, week: 21, count: 12 });
  assert.equal(plan.length, 12);
  const distinctWords = new Set(plan.map((s) => s.word.wordId));
  assert.ok(distinctWords.size <= 5);
});

test('buildBossPlan évite de répéter le même mot sur deux défis consécutifs quand c\'est évitable', async () => {
  const { buildBossPlan } = await queuePromise;
  const plan = buildBossPlan({ catalog: CATALOG, week: 21, count: 12, rng: () => 0.9 });
  for (let i = 1; i < plan.length; i++) {
    assert.notEqual(plan[i].word.wordId, plan[i - 1].word.wordId, `défis ${i - 1} et ${i} portent sur le même mot`);
  }
});

test('buildBossPlan retourne un plan vide si aucun mot n\'est programmé pour cette semaine ni les 3 précédentes', async () => {
  const { buildBossPlan } = await queuePromise;
  const plan = buildBossPlan({ catalog: CATALOG, week: 999 });
  assert.deepEqual(plan, []);
});

test('buildBossPlan pioche dans les 3 semaines précédentes quand la semaine du Boss n\'introduit aucun mot elle-même (semaine de pure révision, cf. Foundations S4/S8/S12...)', async () => {
  const { buildBossPlan } = await queuePromise;
  // S24 = semaine de Boss/révision qui n'introduit rien elle-même, mais S21
  // (même monde, 4 semaines) a des mots dans CATALOG — le Boss doit les
  // trouver, pas renvoyer un plan vide comme avant la correction.
  const plan = buildBossPlan({ catalog: CATALOG, week: 24, count: 12, rng: () => 0.4 });
  assert.equal(plan.length, 12);
  assert.ok(plan.every((s) => CATALOG.some((w) => w.wordId === s.word.wordId && w.introWeek === 21)));
});

test('curriculumComplete est faux tant que le pointeur n\'a pas dépassé la fin du dernier monde (multiple de 4 semaines)', async () => {
  const { curriculumComplete } = await queuePromise;
  // CATALOG s'arrête à introWeek 21 => dernier monde = S21-S24, fin S24.
  assert.equal(curriculumComplete({ catalog: CATALOG, week: 24 }), false);
  assert.equal(curriculumComplete({ catalog: CATALOG, week: 25 }), true);
});

test('curriculumComplete est faux sur un catalogue vide (ne bloque jamais avant que le catalogue soit chargé)', async () => {
  const { curriculumComplete } = await queuePromise;
  assert.equal(curriculumComplete({ catalog: [], week: 999 }), false);
});

const PHONICS = [
  { week: 21, grapheme: 'sh', example: 'ship', exampleWordId: 5 },
];

test('getPhonicsForDay : un son n\'est introduit que le jour 1 de sa semaine', async () => {
  const { getPhonicsForDay } = await queuePromise;
  assert.equal(getPhonicsForDay(PHONICS, 21, 1)?.grapheme, 'sh');
  assert.equal(getPhonicsForDay(PHONICS, 21, 2), null, 'pas de phonics hors du jour 1');
  assert.equal(getPhonicsForDay(PHONICS, 1, 1), null, 'pas de son programmé pour cette semaine');
});

test('buildScreenPlan insère l\'écran phonics avant les nouveaux mots quand un son est programmé (jour 1)', async () => {
  const { buildScreenPlan } = await queuePromise;
  const plan = buildScreenPlan({
    dueEntries: [], newWordIds: [2], catalog: CATALOG,
    pointer: { week: 21, day: 1 }, phonicsTable: PHONICS,
  });
  assert.equal(plan[0].kind, 'phonics');
  assert.equal(plan[0].grapheme, 'sh');
  assert.equal(plan[0].example, 'ship');
  assert.equal(plan[0].exampleWord.wordId, 5);
  assert.equal(plan[1].kind, 'discover', 'le phonics précède les mots nouveaux, ne les remplace pas');
});

test('buildScreenPlan n\'insère aucun écran phonics hors jour 1 ou sans son programmé', async () => {
  const { buildScreenPlan } = await queuePromise;
  const planDay2 = buildScreenPlan({
    dueEntries: [], newWordIds: [5], catalog: CATALOG,
    pointer: { week: 21, day: 2 }, phonicsTable: PHONICS,
  });
  assert.ok(planDay2.every((s) => s.kind !== 'phonics'));

  const planNoTable = buildScreenPlan({ dueEntries: [], newWordIds: [2], catalog: CATALOG });
  assert.ok(planNoTable.every((s) => s.kind !== 'phonics'), 'sans phonicsTable, jamais d\'écran phonics');
});
