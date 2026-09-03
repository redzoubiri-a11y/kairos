/**
 * Fennec — bootstrap de l'app réelle.
 *
 * Câble ensemble : FennecStore (db.mjs, IndexedDB), le catalogue embarqué
 * (catalog.json, généré par build_catalog.py), les profils élèves locaux
 * (plusieurs enfants sur un même téléphone partagé — pilier explicite de
 * l'analyse stratégique : "la fratrie... profils multiples sur un
 * appareil"), et le moteur de session (session.mjs → queue.mjs → srs.mjs).
 *
 * Multi-profils : chaque enfant a son propre studentId (déjà la clé
 * primaire du moteur SRS dans IndexedDB, voir db.mjs) et son propre
 * pointeur de curriculum/essai Boss, namespacés en localStorage par
 * profileId. Rien à changer côté moteur — seule l'orchestration ici en
 * manquait.
 *
 * Horloge virtuelle : le calendrier SRS réel s'étale sur des jours/semaines
 * (J+1, J+3, J+7…) — impossible à observer en session de test sans attendre
 * plusieurs jours. La barre de développement en haut de l'app permet
 * d'avancer une horloge virtuelle stockée en localStorage (partagée entre
 * profils : c'est l'horloge du foyer, pas une préférence par enfant) ;
 * `now()` partout dans l'app (session.mjs compris) passe par cette horloge,
 * jamais par `new Date()` en dur.
 */

import { FennecStore } from '../src/db.mjs';
import { pullCatalog, pushPending } from '../src/sync.mjs';
import { curriculumComplete } from '../src/queue.mjs';
import { runSession } from './session.mjs';
import { runBossSession } from './bossSession.mjs';
import { stage, avatarTag } from './screens.mjs';

const CLOCK_KEY = 'fennec_clock_offset_ms';
const PROFILES_KEY = 'fennec_profiles';
const ACTIVE_PROFILE_KEY = 'fennec_active_profile';
const AVATARS = ['🦊', '🐱', '🐶', '🐰', '🐨', '🦁', '🐼', '🐸'];

function now() {
  const offset = Number(localStorage.getItem(CLOCK_KEY) || '0');
  return new Date(Date.now() + offset);
}

function advanceClockByDays(days) {
  const offset = Number(localStorage.getItem(CLOCK_KEY) || '0');
  localStorage.setItem(CLOCK_KEY, String(offset + days * 24 * 60 * 60 * 1000));
}

/* ------------------------------------------------------- profils élèves */

function getProfiles() {
  try { return JSON.parse(localStorage.getItem(PROFILES_KEY) || '[]'); }
  catch { return []; }
}

function saveProfiles(list) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
}

function createProfile(name) {
  const list = getProfiles();
  const profile = { id: crypto.randomUUID(), name, avatar: AVATARS[list.length % AVATARS.length] };
  saveProfiles([...list, profile]);
  return profile;
}

function getActiveProfileId() {
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
}

function setActiveProfile(id) {
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

function clearActiveProfile() {
  localStorage.removeItem(ACTIVE_PROFILE_KEY);
}

function getPointer(profileId) {
  const raw = localStorage.getItem(`fennec_pointer_${profileId}`);
  return raw ? JSON.parse(raw) : { week: 1, day: 1 };
}

function savePointer(profileId, pointer) {
  localStorage.setItem(`fennec_pointer_${profileId}`, JSON.stringify(pointer));
}

function getBossAttempt(profileId) {
  return Number(localStorage.getItem(`fennec_boss_attempt_${profileId}`) || '1');
}

function saveBossAttempt(profileId, n) {
  localStorage.setItem(`fennec_boss_attempt_${profileId}`, String(n));
}

/**
 * Écran "qui joue aujourd'hui ?" — affiché tant qu'aucun profil n'est
 * actif (premier lancement, ou après un tap sur "تبديل الطفل"). Chaque
 * tuile choisit le profil actif puis relance boot() ; l'ajout se fait sur
 * place, sans quitter l'écran. Chaque tuile porte aussi un petit lien
 * "🎙 التسجيلات" (sans activer le profil) vers renderRecordings() —
 * jusqu'ici les enregistrements de Boss (bossSession.mjs) étaient
 * sauvegardés en IndexedDB mais jamais réécoutables nulle part dans l'app
 * elle-même (seul le tableau de bord parent, maquette non branchée, était
 * censé les lire un jour) : fonctionnalité écrite mais inutilisable en
 * pratique tant que Supabase et ce tableau de bord restent hors scope.
 */
function renderProfilePicker() {
  const profiles = getProfiles();
  stage.innerHTML =
    `<div class="win">` +
      `<p class="say ar center">من يلعب اليوم؟</p>` +
      `<div class="profile-grid" id="profileGrid"></div>` +
      `<div id="addProfileForm" hidden>
        <input type="text" id="newProfileName" class="profile-input" placeholder="اسم الطفل" maxlength="20">
        <button class="cta primary" id="confirmAddProfile">إضافة</button>
      </div>` +
    `</div>`;

  const grid = document.getElementById('profileGrid');
  profiles.forEach((p) => {
    const wrap = document.createElement('div');
    const tile = document.createElement('button');
    tile.className = 'profile-tile';
    tile.innerHTML = `<span class="pt-avatar">${p.avatar}</span><span class="pt-name">${escapeHtml(p.name)}</span>`;
    tile.onclick = () => { setActiveProfile(p.id); boot(); };
    wrap.appendChild(tile);
    const recBtn = document.createElement('button');
    recBtn.className = 'pt-recordings ar';
    recBtn.textContent = '🎙 التسجيلات';
    recBtn.onclick = () => renderRecordings(p);
    wrap.appendChild(recBtn);
    grid.appendChild(wrap);
  });
  const addTile = document.createElement('button');
  addTile.className = 'profile-tile add';
  addTile.innerHTML = `<span class="pt-avatar">➕</span><span class="pt-name ar">إضافة طفل</span>`;
  addTile.onclick = () => { document.getElementById('addProfileForm').hidden = false; document.getElementById('newProfileName').focus(); };
  grid.appendChild(addTile);

  document.getElementById('confirmAddProfile').addEventListener('click', () => {
    const input = document.getElementById('newProfileName');
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    const profile = createProfile(name);
    setActiveProfile(profile.id);
    boot();
  }, { once: true });
}

/**
 * Liste les enregistrements de Boss d'un profil, triés par semaine, avec
 * lecture directe (<audio controls>) depuis les Blobs IndexedDB — voir
 * db.mjs `getRecordings()` et bossSession.mjs `showRecording()`. N'active
 * pas le profil : bouton "← رجوع" ramène simplement au sélecteur.
 *
 * @param {{id:string, name:string, avatar:string}} profile
 */
async function renderRecordings(profile) {
  const store = await FennecStore.open();
  const recordings = (await store.getRecordings(profile.id)).sort((a, b) => a.week - b.week);

  stage.innerHTML = `<div class="win">
    <p class="say ar center">${profile.avatar} تسجيلات ${escapeHtml(profile.name)}</p>
    ${recordings.length === 0
      ? `<p class="sub ar center">لا توجد تسجيلات بعد — تُضاف تلقائيًا عند الفوز بتحديات الزعيم الكبرى.</p>`
      : `<div class="recordings-list" id="recList"></div>`}
    <button class="cta primary">← رجوع</button>
  </div>`;

  if (recordings.length > 0) {
    const list = document.getElementById('recList');
    recordings.forEach((r) => {
      const url = URL.createObjectURL(r.blob);
      const row = document.createElement('div');
      row.className = 'recording-row';
      row.innerHTML = `<span class="rr-week">S${r.week}</span><audio controls src="${url}"></audio>`;
      list.appendChild(row);
    });
  }

  stage.querySelector('.cta').addEventListener('click', () => renderProfilePicker(), { once: true });
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
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

function renderDevBar(profile, pointer, attempt) {
  const bar = document.getElementById('devbar');
  const dayLabel = pointer.day === 5 ? `jour 5 · Boss${attempt > 1 ? ` (essai ${attempt})` : ''}` : `jour ${pointer.day}`;
  bar.innerHTML = `
    <span>${profile.avatar} ${escapeHtml(profile.name)}</span>
    <span>Position : S${pointer.week} · ${dayLabel}</span>
    <span>Horloge : ${now().toLocaleDateString('fr-FR')}</span>
    <button id="switch-profile">🔁 changer d'enfant</button>
    <button id="advance-day">⏭ +1 jour</button>
    <button id="advance-week">⏭⏭ +7 jours</button>
    <button id="reset">↻ tout réinitialiser</button>
  `;
  document.getElementById('switch-profile').onclick = () => { clearActiveProfile(); boot(); };
  document.getElementById('advance-day').onclick = () => { advanceClockByDays(1); boot(); };
  document.getElementById('advance-week').onclick = () => { advanceClockByDays(7); boot(); };
  document.getElementById('reset').onclick = async () => {
    // Réinitialisation totale (tous les profils, toute la base locale) —
    // volontairement plus radicale que "changer d'enfant" : outil de test.
    localStorage.removeItem(CLOCK_KEY);
    localStorage.removeItem(PROFILES_KEY);
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
    getProfiles().forEach((p) => {
      localStorage.removeItem(`fennec_pointer_${p.id}`);
      localStorage.removeItem(`fennec_boss_attempt_${p.id}`);
    });
    indexedDB.deleteDatabase('fennec');
    location.reload();
  };
}

/**
 * Écran de fin de programme : affiché quand le pointeur a dépassé la
 * dernière semaine de contenu (Foundations + Builder, S1 à S64 — voir
 * curriculumComplete() dans queue.mjs). Avant ce garde-fou, l'app
 * continuait à avancer le pointeur pour toujours au-delà de S64, sans plan
 * de session ni Boss à proposer, sans jamais le dire à l'enfant. Renvoie
 * vers BEM Sprint (la suite documentée dans docs/curriculum-bem-sprint.md)
 * plutôt que de laisser l'enfant dans une session vide.
 */
function renderCurriculumComplete(profile) {
  stage.innerHTML = `<div class="win">
    <div class="win emoji-lg">🏁</div>
    ${avatarTag()}
    <p class="say ar center">أنهى ${escapeHtml(profile.name)} البرنامج كاملاً!</p>
    <p class="sub ar center">من Foundations إلى Builder — كل الأسابيع الـ64 تمت. الخطوة التالية : BEM Sprint، 8 أسابيع للتحضير لامتحان BEM.</p>
    <a class="cta accent" href="./bemSprint.html">ابدأ BEM Sprint ←</a>
    <a class="portal-link" href="../../wireframes/madrassatidz-portal.html">← Madrassatidz</a>
  </div>`;
}

async function boot() {
  const activeId = getActiveProfileId();
  const profiles = getProfiles();
  const profile = profiles.find((p) => p.id === activeId);
  if (!profile) return renderProfilePicker();

  const store = await FennecStore.open();
  await ensureCatalog(store);
  await maybeConfigureSync(store);

  const pointer = getPointer(profile.id);
  const attempt = getBossAttempt(profile.id);
  renderDevBar(profile, pointer, attempt);

  if (curriculumComplete({ catalog: await store.getCatalog(), week: pointer.week })) {
    return renderCurriculumComplete(profile);
  }

  if (pointer.day === 5) {
    await runBossSession({
      store, studentId: profile.id, now, pointer, attempt,
      onBossEnd: ({ pointer: nextPointer, attempt: nextAttempt }) => {
        savePointer(profile.id, nextPointer);
        saveBossAttempt(profile.id, nextAttempt);
        boot(); // le bouton "Continuer"/"Nouvel essai" enchaîne réellement, sans reload manuel
      },
    });
    return;
  }

  await runSession({
    store,
    studentId: profile.id,
    now,
    pointer,
    streakDays: pointer.day, // rythme hebdomadaire : jour 1-4 = sessions de la semaine en cours
    onSessionEnd: (nextPointer) => {
      savePointer(profile.id, nextPointer);
      // La session quotidienne se termine sur un écran de fin (pas de bouton
      // "continuer" : une seule session par jour). Le pointeur est prêt pour
      // la prochaine visite ou le prochain clic "+1 jour" de la barre de dev.
    },
  });
}

registerServiceWorker();
boot();
