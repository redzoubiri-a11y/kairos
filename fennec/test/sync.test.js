'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

// sync.js est écrit en ESM (il tourne dans la PWA) ; on l'importe dynamiquement
// depuis ce test CommonJS plutôt que de dupliquer le module.
const syncPromise = import('../src/sync.mjs');

/** Store minimal en mémoire, respectant l'interface utilisée par sync.js. */
function makeFakeStore(initialPending) {
  let pending = initialPending;
  const cleared = [];
  return {
    async getPendingSync() { return pending; },
    async clearPendingSync(ids) {
      cleared.push(...ids);
      pending = pending.filter((p) => !ids.includes(p.id));
    },
    async saveCatalog() { /* non exercé ici */ },
    _cleared: cleared,
    _remaining: () => pending,
  };
}

/** Client Supabase minimal : chaque table peut échouer sur demande. */
function makeFakeSupabase({ failOn } = {}) {
  const calls = [];
  const builder = (table) => ({
    insert: async (row) => {
      calls.push({ table, op: 'insert', row });
      if (failOn === table) return { error: new Error(`boom on ${table}`) };
      return { error: null };
    },
    upsert: async (row) => {
      calls.push({ table, op: 'upsert', row });
      if (failOn === table) return { error: new Error(`boom on ${table}`) };
      return { error: null };
    },
    select: async () => ({ data: [], error: null }),
  });
  return { from: builder, _calls: calls };
}

test('pushPending envoie chaque événement à la bonne table et vide la file en cas de succès', async () => {
  const { pushPending } = await syncPromise;
  const store = makeFakeStore([
    { id: 1, kind: 'word_state', studentId: 's1', wordId: 42, payload: { step: 1, repsOk: 1, dueAt: '2026-09-10', lastResult: true, introducedAt: '2026-09-06' } },
    { id: 2, kind: 'session_event', studentId: 's1', payload: { sessionId: 'sess-1', screenIndex: 3, screenType: 'listen_touch', correct: true } },
    { id: 3, kind: 'session_summary', studentId: 's1', payload: { sessionId: 'sess-1', week: 21, day: 1, kind: 'daily', startedAt: '2026-09-06T08:00:00Z', screensTotal: 18, screensCorrect: 17 } },
  ]);
  const supabase = makeFakeSupabase();

  const result = await pushPending(supabase, store);

  assert.deepEqual(result, { sent: 3, remaining: 0 });
  assert.deepEqual(store._cleared, [1, 2, 3]);
  assert.deepEqual(store._remaining(), []);
  assert.deepEqual(supabase._calls.map((c) => c.table), ['student_word_state', 'session_events', 'sessions']);
});

test('pushPending s\'arrête au premier échec et garde le reste en file (ordre préservé)', async () => {
  const { pushPending } = await syncPromise;
  const store = makeFakeStore([
    { id: 1, kind: 'session_event', studentId: 's1', payload: { sessionId: 'sess-1', screenIndex: 1, screenType: 'listen_touch', correct: true } },
    { id: 2, kind: 'session_event', studentId: 's1', payload: { sessionId: 'sess-1', screenIndex: 2, screenType: 'say_it', correct: false } },
    { id: 3, kind: 'session_event', studentId: 's1', payload: { sessionId: 'sess-1', screenIndex: 3, screenType: 'true_false', correct: true } },
  ]);
  // Le 2e événement échoue : on ne doit envoyer/effacer que le 1er.
  const supabase = makeFakeSupabase({ failOn: 'session_events' });
  // On force l'échec seulement à partir du 2e appel en surchargeant après coup.
  let calls = 0;
  const realInsert = supabase.from('session_events').insert;
  supabase.from = (table) => {
    if (table !== 'session_events') return { insert: async () => ({ error: null }) };
    return {
      insert: async (row) => {
        calls++;
        if (calls === 2) return { error: new Error('panne réseau simulée') };
        return { error: null };
      },
    };
  };

  const result = await pushPending(supabase, store);

  assert.equal(result.sent, 1, 'seul le premier événement doit partir avant l\'échec');
  assert.equal(result.remaining, 2);
  assert.deepEqual(store._remaining().map((p) => p.id), [2, 3], 'le 2e et le 3e restent en file, dans l\'ordre');
});

test('pushPending sur une file vide ne fait rien et ne plante pas', async () => {
  const { pushPending } = await syncPromise;
  const store = makeFakeStore([]);
  const supabase = makeFakeSupabase();
  const result = await pushPending(supabase, store);
  assert.deepEqual(result, { sent: 0, remaining: 0 });
});

test('pullCatalog normalise les lignes Supabase (snake_case) vers le format attendu par db.js (camelCase)', async () => {
  const { pullCatalog } = await syncPromise;
  const saved = [];
  const store = { saveCatalog: async (rows) => { saved.push(...rows); } };
  const supabase = {
    from: () => ({
      select: async () => ({
        data: [
          { external_id: 1, english: 'hello', french: 'bonjour', category: 'lexique', world_id: 1, intro_week: 1, intro_day: 1, audio_url: null, image_url: null },
        ],
        error: null,
      }),
    }),
  };

  const count = await pullCatalog(supabase, store);

  assert.equal(count, 1);
  assert.deepEqual(saved, [{
    wordId: 1, english: 'hello', french: 'bonjour', category: 'lexique',
    worldId: 1, introWeek: 1, introDay: 1, audioUrl: null, imageUrl: null,
  }]);
});
