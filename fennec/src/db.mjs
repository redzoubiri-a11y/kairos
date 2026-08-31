/**
 * Fennec — couche offline (IndexedDB).
 *
 * Rôle : rendre la session de l'enfant totalement indépendante du réseau.
 * Trois object stores :
 *   - `words`        : copie locale du référentiel (mots + calendrier nominal),
 *                      téléchargée une fois en Wi-Fi puis réutilisée hors-ligne.
 *   - `word_state`    : état SRS par mot pour l'élève actif sur cet appareil
 *                      (voir fennec/src/srs.mjs pour le format WordState).
 *   - `pending_sync`  : file d'événements en attente d'envoi vers Supabase
 *                      (réponses aux écrans, sessions terminées, boss).
 *
 * Rien ici ne dépend de Supabase : ce module ne connaît que IndexedDB. La
 * synchronisation elle-même est dans fennec/src/sync.mjs, qui lit/vide cette
 * file. Cette séparation permet de tester le moteur SRS + la persistance
 * locale sans jamais toucher au réseau.
 *
 * Le module suppose un environnement navigateur (IndexedDB global). Il est
 * écrit en ES modules pour être importé tel quel dans la PWA.
 */

const DB_NAME = 'fennec';
const DB_VERSION = 1;

const STORE_WORDS = 'words';
const STORE_WORD_STATE = 'word_state';
const STORE_PENDING_SYNC = 'pending_sync';

/** @returns {Promise<IDBDatabase>} */
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains(STORE_WORDS)) {
        const store = db.createObjectStore(STORE_WORDS, { keyPath: 'wordId' });
        store.createIndex('by_world', 'worldId');
        store.createIndex('by_intro', ['introWeek', 'introDay']);
      }

      if (!db.objectStoreNames.contains(STORE_WORD_STATE)) {
        // clé composite étudiant/mot : un appareil peut porter plusieurs
        // profils enfants (fratrie, téléphone partagé — cf. analyse §4.4).
        const store = db.createObjectStore(STORE_WORD_STATE, { keyPath: ['studentId', 'wordId'] });
        store.createIndex('by_student', 'studentId');
        store.createIndex('by_due', ['studentId', 'dueAt']);
      }

      if (!db.objectStoreNames.contains(STORE_PENDING_SYNC)) {
        const store = db.createObjectStore(STORE_PENDING_SYNC, { keyPath: 'id', autoIncrement: true });
        store.createIndex('by_student', 'studentId');
        store.createIndex('by_kind', 'kind');
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, storeNames, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(storeNames, mode);
    const stores = Array.isArray(storeNames)
      ? Object.fromEntries(storeNames.map((n) => [n, t.objectStore(n)]))
      : t.objectStore(storeNames);
    let result;
    Promise.resolve(fn(stores))
      .then((r) => { result = r; })
      .catch(reject);
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error('transaction abandonnée'));
  });
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * API publique de la couche offline. Instanciée une fois au démarrage de
 * l'app (`const store = await FennecStore.open();`).
 */
class FennecStore {
  /** @param {IDBDatabase} db */
  constructor(db) {
    this.db = db;
  }

  static async open() {
    const db = await openDb();
    return new FennecStore(db);
  }

  // ------------------------------------------------------------- référentiel

  /**
   * Remplace le cache local du référentiel de mots. Appelé après un pull
   * réseau réussi (voir sync.mjs `pullCatalog`) ; jamais pendant une session
   * hors-ligne.
   * @param {Array<object>} words - forme normalisée, voir sync.mjs
   */
  async saveCatalog(words) {
    return tx(this.db, STORE_WORDS, 'readwrite', (store) => {
      for (const w of words) store.put(w);
    });
  }

  /** @returns {Promise<Array<object>>} tout le référentiel en cache local */
  async getCatalog() {
    return tx(this.db, STORE_WORDS, 'readonly', (store) => reqToPromise(store.getAll()));
  }

  // -------------------------------------------------------------- état SRS

  /** @returns {Promise<object|undefined>} */
  async getWordState(studentId, wordId) {
    return tx(this.db, STORE_WORD_STATE, 'readonly', (store) =>
      reqToPromise(store.get([studentId, wordId]))
    );
  }

  /** @returns {Promise<Array<object>>} tous les états SRS d'un élève */
  async getAllWordStates(studentId) {
    return tx(this.db, STORE_WORD_STATE, 'readonly', (store) =>
      reqToPromise(store.index('by_student').getAll(IDBKeyRange.only(studentId)))
    );
  }

  /**
   * Persiste un nouvel état SRS (après srs.introduce()/srs.review()) et
   * empile l'événement correspondant dans la file de sync, dans la même
   * transaction locale — jamais l'un sans l'autre.
   *
   * @param {string} studentId
   * @param {number} wordId
   * @param {object} state - WordState (voir srs.mjs), sérialisé (Date -> ISO)
   * @param {object} syncPayload - événement à pousser vers Supabase
   */
  async saveWordState(studentId, wordId, state, syncPayload) {
    return tx(this.db, [STORE_WORD_STATE, STORE_PENDING_SYNC], 'readwrite', (stores) => {
      stores[STORE_WORD_STATE].put({ studentId, wordId, ...serializeState(state) });
      stores[STORE_PENDING_SYNC].add({
        kind: 'word_state',
        studentId,
        wordId,
        payload: syncPayload,
        createdAt: new Date().toISOString(),
      });
    });
  }

  // -------------------------------------------------------------- sessions

  /**
   * Enregistre un événement de session (une réponse à un écran) directement
   * dans la file de sync — ces événements ne sont pas relus localement pour
   * la logique SRS (qui ne lit que word_state), ils servent uniquement au
   * tableau de bord parent/enseignant côté serveur.
   */
  async logSessionEvent(studentId, event) {
    return tx(this.db, STORE_PENDING_SYNC, 'readwrite', (store) => {
      store.add({
        kind: 'session_event',
        studentId,
        payload: event,
        createdAt: new Date().toISOString(),
      });
    });
  }

  async logSessionSummary(studentId, summary) {
    return tx(this.db, STORE_PENDING_SYNC, 'readwrite', (store) => {
      store.add({
        kind: 'session_summary',
        studentId,
        payload: summary,
        createdAt: new Date().toISOString(),
      });
    });
  }

  // ------------------------------------------------------------------ sync

  /** @returns {Promise<Array<object>>} tous les événements en attente d'envoi */
  async getPendingSync() {
    return tx(this.db, STORE_PENDING_SYNC, 'readonly', (store) => reqToPromise(store.getAll()));
  }

  /** Supprime les événements déjà envoyés avec succès. */
  async clearPendingSync(ids) {
    return tx(this.db, STORE_PENDING_SYNC, 'readwrite', (store) => {
      for (const id of ids) store.delete(id);
    });
  }
}

/** Sérialise un WordState (Date -> ISO string) pour le stockage IndexedDB. */
function serializeState(state) {
  return {
    step: state.step,
    repsOk: state.repsOk,
    dueAt: state.dueAt ? state.dueAt.toISOString() : null,
    introducedAt: state.introducedAt ? state.introducedAt.toISOString() : null,
    masteredAt: state.masteredAt ? state.masteredAt.toISOString() : null,
    lastResult: state.lastResult,
  };
}

/** Désérialise l'inverse de serializeState, pour repasser par srs.mjs. */
function deserializeState(row) {
  if (!row) return null;
  return {
    step: row.step,
    repsOk: row.repsOk,
    dueAt: row.dueAt ? new Date(row.dueAt) : null,
    introducedAt: row.introducedAt ? new Date(row.introducedAt) : null,
    masteredAt: row.masteredAt ? new Date(row.masteredAt) : null,
    lastResult: row.lastResult,
  };
}

export { FennecStore, serializeState, deserializeState };
