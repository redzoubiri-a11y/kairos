/**
 * Fennec — service worker : mise en cache de l'app shell pour un
 * fonctionnement hors-ligne complet dès la deuxième visite (la première
 * visite doit se faire en ligne, ne serait-ce que pour récupérer ce
 * fichier et le catalogue de mots).
 *
 * Stratégie volontairement simple (cache-first, sans stale-while-revalidate)
 * car l'app shell change rarement ; CACHE_VERSION se bump manuellement à
 * chaque déploiement pour invalider l'ancien cache.
 */

const CACHE_VERSION = 'fennec-v9';
const SHELL_FILES = [
  './',
  './index.html',
  './styles.css',
  './main.mjs',
  './session.mjs',
  './bossSession.mjs',
  './screens.mjs',
  './classroomQuiz.html',
  './classroomQuiz.mjs',
  './bemSprint.html',
  './bemSprint.mjs',
  './bemSprintBS1.json',
  './bemSprintBS2.json',
  './bemSprintBS3.json',
  './manifest.webmanifest',
  './catalog.json',
  './phonics.json',
  './word-emoji.json',
  './icons/icon.svg',
  '../src/db.mjs',
  '../src/srs.mjs',
  '../src/sync.mjs',
  '../src/queue.mjs',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ne jamais mettre en cache les appels réseau vers Supabase ou tout
  // domaine externe (esm.sh, fonts.googleapis.com) — seul l'app shell local
  // est concerné par ce cache offline.
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
