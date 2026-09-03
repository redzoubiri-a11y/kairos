/**
 * Fennec — synchronisation offline ↔ Supabase.
 *
 * Ne contient AUCUNE logique pédagogique : c'est un pont mécanique entre la
 * file locale (fennec/src/db.mjs, store `pending_sync`) et les tables
 * Supabase (fennec/supabase/migrations/0001_schema.sql). Le moteur SRS
 * (fennec/src/srs.mjs) tourne déjà en local avant que ce module intervienne —
 * si le réseau tombe, l'enfant n'attend jamais après lui.
 *
 * Deux directions :
 *   - pullCatalog()   : télécharge le référentiel de mots une fois (ou à
 *                       chaque mise à jour du curriculum), à appeler en
 *                       Wi-Fi au premier lancement puis périodiquement.
 *   - pushPending()   : vide la file locale vers Supabase, événement par
 *                       événement, en supprimant du local uniquement ce qui
 *                       a été accepté par le serveur.
 *
 * Attend un client Supabase déjà configuré (import { createClient } from
 * '@supabase/supabase-js'), injecté plutôt qu'importé en dur pour rester
 * testable sans réseau (cf. fennec/test/sync.test.js).
 */

/**
 * @typedef {import('./db.mjs').FennecStore} FennecStore
 */

/**
 * Télécharge le référentiel (mondes + mots) et le range dans le cache local.
 * Idempotent : peut être rappelé à tout moment (ex. mise à jour du
 * curriculum en cours d'année) sans perdre l'état SRS de l'élève, qui vit
 * dans un store séparé.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {FennecStore} store
 */
async function pullCatalog(supabase, store) {
  const { data, error } = await supabase
    .from('words')
    .select('external_id, english, french, category, world_id, intro_week, intro_day, audio_url, image_url');
  if (error) throw error;

  const normalized = data.map((row) => ({
    wordId: row.external_id,
    english: row.english,
    french: row.french,
    category: row.category,
    worldId: row.world_id,
    introWeek: row.intro_week,
    introDay: row.intro_day,
    audioUrl: row.audio_url,
    imageUrl: row.image_url,
  }));

  await store.saveCatalog(normalized);
  return normalized.length;
}

/**
 * Vide la file `pending_sync` vers Supabase. Traite les événements dans
 * l'ordre d'ajout (FIFO) ; s'arrête au premier échec réseau pour ne pas
 * envoyer les événements suivants hors ordre (l'état SRS d'un mot dépend de
 * l'historique de ses révisions précédentes).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {FennecStore} store
 * @returns {Promise<{sent: number, remaining: number}>}
 */
async function pushPending(supabase, store) {
  const pending = await store.getPendingSync();
  const sentIds = [];

  for (const item of pending) {
    try {
      await sendOne(supabase, item);
      sentIds.push(item.id);
    } catch (err) {
      // Réseau ou serveur indisponible : on s'arrête là, la file garde le
      // reste pour la prochaine tentative. On ne relance pas en boucle ici
      // — c'est au code appelant (écouteur `online`, minuteur) de rappeler
      // pushPending() plus tard.
      break;
    }
  }

  if (sentIds.length) await store.clearPendingSync(sentIds);
  return { sent: sentIds.length, remaining: pending.length - sentIds.length };
}

/** @param {import('@supabase/supabase-js').SupabaseClient} supabase */
async function sendOne(supabase, item) {
  switch (item.kind) {
    case 'word_state': {
      const { studentId, wordId, payload } = item;
      const { error } = await supabase.from('student_word_state').upsert({
        student_id: studentId,
        word_id: wordId,
        step: payload.step,
        ease: payload.ease ?? 2.3,
        interval_days: payload.intervalDays ?? null,
        due_at: payload.dueAt,
        last_result: payload.lastResult,
        reps_ok: payload.repsOk,
        mastered_at: payload.masteredAt,
        introduced_at: payload.introducedAt,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      return;
    }
    case 'session_event': {
      const { payload } = item;
      const { error } = await supabase.from('session_events').insert({
        session_id: payload.sessionId,
        screen_index: payload.screenIndex,
        word_id: payload.wordId ?? null,
        screen_type: payload.screenType,
        correct: payload.correct,
        response_ms: payload.responseMs ?? null,
        is_retest: !!payload.isRetest,
      });
      if (error) throw error;
      return;
    }
    case 'session_summary': {
      const { studentId, payload } = item;
      const { error } = await supabase.from('sessions').upsert({
        id: payload.sessionId,
        student_id: studentId,
        week: payload.week,
        day: payload.day,
        kind: payload.kind,
        started_at: payload.startedAt,
        finished_at: payload.finishedAt ?? null,
        screens_total: payload.screensTotal,
        screens_correct: payload.screensCorrect,
        boss_passed: payload.bossPassed ?? null,
        boss_variant: payload.bossVariant ?? null,
      });
      if (error) throw error;
      return;
    }
    default:
      throw new Error(`type d'événement de sync inconnu : ${item.kind}`);
  }
}

/**
 * Câble la sync automatique : tente un push au retour de connexion et à
 * intervalle régulier tant que l'app est ouverte. À appeler une fois au
 * démarrage de l'app avec un client Supabase déjà authentifié.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {FennecStore} store
 * @param {{intervalMs?: number}} [opts]
 * @returns {() => void} fonction de nettoyage (à appeler au démontage)
 */
function scheduleAutoSync(supabase, store, opts = {}) {
  const intervalMs = opts.intervalMs ?? 60_000;
  const tryPush = () => { pushPending(supabase, store).catch(() => {}); };

  window.addEventListener('online', tryPush);
  const timer = setInterval(() => {
    if (navigator.onLine) tryPush();
  }, intervalMs);

  return () => {
    window.removeEventListener('online', tryPush);
    clearInterval(timer);
  };
}

/**
 * Assure une session Supabase Auth pour cet appareil, via connexion
 * anonyme — aucun écran de login, aucun compte à créer manuellement,
 * cohérent avec le principe déjà en place partout ailleurs dans l'app
 * ("premier lancement possible sans réseau", "profils multiples sur un
 * téléphone partagé" sans friction). La session anonyme est persistée par
 * supabase-js (localStorage) : un seul sign-in par appareil, jamais répété
 * au lancement suivant tant que le storage n'est pas vidé.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<object>} la session (existante ou nouvellement créée)
 */
async function ensureAnonSession(supabase) {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}

/**
 * Assure une ligne `guardians` (role='parent') pour l'utilisateur courant.
 * Un compte anonyme par appareil correspond à un seul tuteur (le foyer),
 * quel que soit le nombre de profils enfants locaux dessus.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<string>} id du guardian (existant ou nouvellement créé)
 */
async function ensureGuardian(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  const existing = await supabase.from('guardians')
    .select('id').eq('user_id', user.id).eq('role', 'parent').maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data.id;

  const created = await supabase.from('guardians')
    .insert({ user_id: user.id, role: 'parent' }).select('id').single();
  if (created.error) throw created.error;
  return created.data.id;
}

/**
 * Assure une ligne `students` correspondant à un profil local. Réutilise
 * directement `profile.id` (déjà un uuid généré côté app, voir main.mjs
 * `createProfile`) comme id distant plutôt que de maintenir une table de
 * correspondance locale/distante séparée : tout ce qui synchronise déjà
 * via ce même studentId (word_state, sessions, session_events, voir
 * db.mjs) pointe alors vers la bonne ligne sans rien changer ailleurs.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} guardianId
 * @param {{id:string, name:string, avatar:string}} profile
 * @returns {Promise<string>} id du student distant (= profile.id)
 */
async function ensureStudent(supabase, guardianId, profile) {
  const existing = await supabase.from('students').select('id').eq('id', profile.id).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data.id;

  const created = await supabase.from('students').insert({
    id: profile.id, guardian_id: guardianId, display_name: profile.name, avatar: profile.avatar,
  });
  if (created.error) throw created.error;
  return profile.id;
}

export { pullCatalog, pushPending, scheduleAutoSync, ensureAnonSession, ensureGuardian, ensureStudent };
