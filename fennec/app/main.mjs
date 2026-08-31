/**
 * Fennec — bootstrap de l'app réelle.
 *
 * Câble ensemble : FennecStore (db.mjs, IndexedDB), le catalogue embarqué
 * (catalog.json, généré par build_catalog.py), l'identité locale de l'élève
 * (un profil de démo tant qu'il n'y a pas d'authentification Supabase), et
 * le moteur de session (session.mjs → queue.mjs → srs.mjs).
 *
 * Horloge virtuelle : le calendrier SRS réel s'étale sur des jours/semaines
 * (J+1, J+3, J+7…) — impossible à observer en session de test sans attendre
 * plusieurs jours. La barre de développement en haut de l'app permet
 * d'avancer une horloge virtuelle stockée en localStorage ; `now()` partout
 * dans l'app (session.mjs compris) passe par cette horloge, jamais par
 * `new Date()` en dur — c'est ce qui permet de vérifier que le moteur SRS
 * réel programme bien les révisions aux bons intervalles.
 */

import { FennecStore } from '../src/db.mjs';
import { pullCatalog, pushPending } from '../src/sync.mjs';
import { runSession } from './session.mjs';
import { runBossSession } from './bossSession.mjs';

const CLOCK_KEY = 'fennec_clock_offset_ms';
const STUDENT_KEY = 'fennec_student_id';
const POINTER_KEY = 'fennec_pointer';
const BOSS_ATTEMPT_KEY = 'fennec_boss_attempt';

function now() {
  const offset = Number(localStorage.getItem(CLOCK_KEY) || '0');
  return new Date(Date.now() + offset);
}

function advanceClockByDays(days) {
  const offset = Number(localStorage.getItem(CLOCK_KEY) || '0');
  localStorage.setItem(CLOCK_KEY, String(offset + days * 24 * 60 * 60 * 1000));
}

function getOrCreateStudentId() {
  let id = localStorage.getItem(STUDENT_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STUDENT_KEY, id);
  }
  return id;
}

function getPointer() {
  const raw = localStorage.getItem(POINTER_KEY);
  return raw ? JSON.parse(raw) : { week: 1, day: 1 };
}

function savePointer(pointer) {
  localStorage.setItem(POINTER_KEY, JSON.stringify(pointer));
}

function getBossAttempt() {
  return Number(localStorage.getItem(BOSS_ATTEMPT_KEY) || '1');
}

function saveBossAttempt(n) {
  localStorage.setItem(BOSS_ATTEMPT_KEY, String(n));
}

/**
 * Remplit le cache local du référentiel si vide. Au premier lancement,
 * hors-ligne ou en ligne, on part du catalogue embarqué (catalog.json,
 * copie figée à la date de build) — c'est ce qui rend le tout premier
 * lancement possible sans réseau. `pullCatalog` (Supabase) n'est appelée
 * que si un client est configuré (voir configureSupabaseSync ci-dessous) ;
 * en son absence l'app fonctionne intégralement sur le catalogue embarqué.
 *
 * @param {FennecStore} store
 */
async function ensureCatalog(store) {
  const existing = await store.getCatalog();
  if (existing.length > 0) return existing.length;
  const res = await fetch('./catalog.json');
  const words = await res.json();
  await store.saveCatalog(words);
  return words.length;
}

/**
 * Branche la synchronisation Supabase si des identifiants sont fournis
 * (via window.FENNEC_SUPABASE_URL / FENNEC_SUPABASE_KEY, injectés par le
 * déploiement — jamais commités). Sans configuration, l'app tourne
 * intégralement en local : c'est un choix délibéré pour que ce chantier
 * soit démontrable sans dépendre d'un projet Supabase réel.
 *
 * @param {FennecStore} store
 */
async function maybeConfigureSync(store) {
  if (!window.FENNEC_SUPABASE_URL || !window.FENNEC_SUPABASE_KEY) {
    console.info('[fennec] Sync Supabase désactivée (aucune configuration) — mode 100% local.');
    return;
  }
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(window.FENNEC_SUPABASE_URL, window.FENNEC_SUPABASE_KEY);
  window.addEventListener('online', () => pushPending(supabase, store).catch(() => {}));
  if (navigator.onLine) {
    await pullCatalog(supabase, store).catch(() => {});
    await pushPending(supabase, store).catch(() => {});
  }
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('./sw.js');
  } catch (e) {
    console.warn('[fennec] Service worker non enregistré :', e);
  }
}

function renderDevBar(pointer, attempt) {
  const bar = document.getElementById('devbar');
  const dayLabel = pointer.day === 5 ? `jour 5 · Boss${attempt > 1 ? ` (essai ${attempt})` : ''}` : `jour ${pointer.day}`;
  bar.innerHTML = `
    <span>Élève : ${getOrCreateStudentId().slice(0, 8)}</span>
    <span>Position : S${pointer.week} · ${dayLabel}</span>
    <span>Horloge : ${now().toLocaleDateString('fr-FR')}</span>
    <button id="advance-day">⏭ +1 jour</button>
    <button id="advance-week">⏭⏭ +7 jours</button>
    <button id="reset">↻ réinitialiser</button>
  `;
  document.getElementById('advance-day').onclick = () => { advanceClockByDays(1); boot(); };
  document.getElementById('advance-week').onclick = () => { advanceClockByDays(7); boot(); };
  document.getElementById('reset').onclick = async () => {
    localStorage.removeItem(CLOCK_KEY);
    localStorage.removeItem(STUDENT_KEY);
    localStorage.removeItem(POINTER_KEY);
    localStorage.removeItem(BOSS_ATTEMPT_KEY);
    indexedDB.deleteDatabase('fennec');
    location.reload();
  };
}

async function boot() {
  const store = await FennecStore.open();
  await ensureCatalog(store);
  await maybeConfigureSync(store);

  const studentId = getOrCreateStudentId();
  const pointer = getPointer();
  const attempt = getBossAttempt();
  renderDevBar(pointer, attempt);

  if (pointer.day === 5) {
    await runBossSession({
      store, studentId, now, pointer, attempt,
      onBossEnd: ({ pointer: nextPointer, attempt: nextAttempt }) => {
        savePointer(nextPointer);
        saveBossAttempt(nextAttempt);
        boot(); // le bouton "Continuer"/"Nouvel essai" enchaîne réellement, sans reload manuel
      },
    });
    return;
  }

  await runSession({
    store,
    studentId,
    now,
    pointer,
    onSessionEnd: (nextPointer) => {
      savePointer(nextPointer);
      // La session quotidienne se termine sur un écran de fin (pas de bouton
      // "continuer" : une seule session par jour). Le pointeur est prêt pour
      // la prochaine visite ou le prochain clic "+1 jour" de la barre de dev.
    },
  });
}

registerServiceWorker();
boot();
