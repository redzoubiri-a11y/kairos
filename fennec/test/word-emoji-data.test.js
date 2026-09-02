'use strict';

// Vérifie fennec/app/word-emoji.json (généré par build_word_emoji.py) contre
// fennec/app/catalog.json : chaque clé doit être un vrai wordId "lexique",
// et aucun emoji ne doit être partagé par deux mots différents — sinon un
// écran "écoute → touche" montrerait deux fois la même image sans que
// l'enfant puisse distinguer la bonne réponse du distracteur.

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

test('aucun emoji n\'est partagé par deux mots différents', () => {
  const byEmoji = new Map();
  for (const [wordId, emoji] of Object.entries(wordEmoji)) {
    if (!byEmoji.has(emoji)) byEmoji.set(emoji, []);
    byEmoji.get(emoji).push(wordId);
  }
  const dups = [...byEmoji.entries()].filter(([, ids]) => ids.length > 1);
  assert.deepEqual(dups, [], `emoji dupliqués : ${JSON.stringify(dups)}`);
});
