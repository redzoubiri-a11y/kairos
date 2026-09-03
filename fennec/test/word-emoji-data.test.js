'use strict';

// Vérifie fennec/app/word-emoji.json (généré par build_word_emoji.py) contre
// fennec/app/catalog.json : chaque clé doit être un vrai wordId "lexique",
// et aucun emoji ne doit être partagé par deux mots ANGLAIS différents —
// sinon un écran "écoute → touche" pourrait montrer deux fois la même
// image sans que l'enfant puisse distinguer la bonne réponse du
// distracteur. Le même mot anglais peut en revanche légitimement
// apparaître à deux wordId (introduit en Foundations, repris en Builder,
// cf. pickDistractors dans src/queue.mjs qui exclut désormais ces
// doublons du tirage des leurres) : ce n'est pas une ambiguïté, l'enfant
// revoit alors le même mot illustré par la même image.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const wordEmoji = require(path.join(__dirname, '../app/word-emoji.json'));
const catalog = require(path.join(__dirname, '../app/catalog.json'));

test('chaque clé de word-emoji.json est un wordId réel, de catégorie "lexique"', () => {
  const byId = new Map(catalog.map((w) => [String(w.wordId), w]));
  for (const wordId of Object.keys(wordEmoji)) {
    const word = byId.get(wordId);
    assert.ok(word, `wordId ${wordId} absent du catalogue`);
    assert.equal(word.category, 'lexique', `wordId ${wordId} (${word.english}) n'est pas "lexique"`);
  }
});

test('aucun emoji n\'est partagé par deux mots anglais différents', () => {
  const byId = new Map(catalog.map((w) => [String(w.wordId), w]));
  const byEmoji = new Map();
  for (const [wordId, emoji] of Object.entries(wordEmoji)) {
    const english = byId.get(wordId).english;
    if (!byEmoji.has(emoji)) byEmoji.set(emoji, new Set());
    byEmoji.get(emoji).add(english);
  }
  const dups = [...byEmoji.entries()].filter(([, words]) => words.size > 1)
    .map(([emoji, words]) => [emoji, [...words]]);
  assert.deepEqual(dups, [], `emoji dupliqués sur des mots différents : ${JSON.stringify(dups)}`);
});
