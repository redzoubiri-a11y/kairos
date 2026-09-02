'use strict';

// Vérifie que fennec/app/phonics.json (données de conception, écrites à la
// main depuis docs/curriculum-foundations-semaine-par-semaine.md) reste
// cohérent avec fennec/app/catalog.json (généré depuis la banque de mots) —
// c'est exactement le genre d'incohérence silencieuse qui a fait disparaître
// S24 du catalogue (bug corrigé dans scripts/generate-foundations-word-bank.py).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const phonics = require(path.join(__dirname, '../app/phonics.json'));
const catalog = require(path.join(__dirname, '../app/catalog.json'));

test('chaque entrée phonics référence un mot réellement présent dans le catalogue, sous ce wordId', () => {
  const byId = new Map(catalog.map((w) => [w.wordId, w]));
  for (const p of phonics) {
    const word = byId.get(p.exampleWordId);
    assert.ok(word, `exampleWordId ${p.exampleWordId} (${p.example}, S${p.week}) absent du catalogue`);
    assert.equal(word.english, p.example, `exampleWordId ${p.exampleWordId} pointe vers "${word.english}", pas "${p.example}"`);
  }
});

test('chaque exemple phonics contient bien le grapheme qu\'il est censé illustrer', () => {
  for (const p of phonics) {
    const graphemes = p.grapheme.replace(/\s*\([^)]*\)/g, '').split(/\s+/);
    const containsOne = graphemes.some((g) => p.example.toLowerCase().includes(g.toLowerCase()));
    assert.ok(containsOne, `"${p.example}" ne contient aucun des graphèmes "${p.grapheme}" (S${p.week})`);
  }
});

test('les semaines phonics sont uniques (un seul son introduit par semaine)', () => {
  const weeks = phonics.map((p) => p.week);
  assert.equal(new Set(weeks).size, weeks.length);
});
