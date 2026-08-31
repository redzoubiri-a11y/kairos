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
