const prisma = require('../config/prisma');
const env = require('../config/env');

// Expo accepte 100 messages par requete.
const CHUNK_SIZE = 100;
const SEND_TIMEOUT_MS = 10000;

// Un jeton devenu invalide ne le redeviendra jamais : on le supprime au lieu de
// le reessayer a chaque notification.
const DEAD_TOKEN_ERRORS = new Set(['DeviceNotRegistered', 'InvalidCredentials']);

// Les envois sont volontairement detaches du cycle requete/reponse. Ce jeu de
// promesses en vol permet aux tests d'attendre la fin sans exposer d'attente
// dans le chemin applicatif.
const inFlight = new Set();

function track(promise) {
  inFlight.add(promise);
  promise.finally(() => inFlight.delete(promise));
  return promise;
}

async function flush() {
  while (inFlight.size > 0) {
    await Promise.allSettled([...inFlight]);
  }
}

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function isExpoPushToken(token) {
  return /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token);
}

async function postToExpo(messages) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  try {
    const response = await fetch(env.expoPushUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(env.expoAccessToken ? { Authorization: `Bearer ${env.expoAccessToken}` } : {}),
      },
      body: JSON.stringify(messages),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Expo a repondu ${response.status}`);
    }

    const payload = await response.json();
    return Array.isArray(payload?.data) ? payload.data : [];
  } finally {
    clearTimeout(timer);
  }
}

async function deliver(tokens, { title, body, data }) {
  const messages = tokens.map((token) => ({
    to: token,
    title,
    body,
    sound: 'default',
    priority: 'high',
    channelId: 'default',
    ...(data ? { data } : {}),
  }));

  const deadTokens = [];

  for (const batch of chunk(messages, CHUNK_SIZE)) {
    const tickets = await postToExpo(batch);

    tickets.forEach((ticket, index) => {
      if (ticket?.status !== 'error') return;
      const reason = ticket.details?.error;
      if (DEAD_TOKEN_ERRORS.has(reason)) {
        deadTokens.push(batch[index].to);
      } else {
        console.warn('[push] envoi refuse', reason ?? ticket.message);
      }
    });
  }

  if (deadTokens.length) {
    await prisma.deviceToken.deleteMany({ where: { token: { in: deadTokens } } });
    console.info(`[push] ${deadTokens.length} jeton(s) obsolete(s) supprime(s)`);
  }

  return { sent: tokens.length - deadTokens.length, removed: deadTokens.length };
}

async function sendToUser(userId, { title, body, data }) {
  if (!env.pushEnabled) return { sent: 0, removed: 0, skipped: true };

  const devices = await prisma.deviceToken.findMany({
    where: { userId },
    select: { token: true },
  });
  if (!devices.length) return { sent: 0, removed: 0 };

  return deliver(
    devices.map((d) => d.token),
    { title, body, data }
  );
}

// Un echec de notification ne doit jamais faire echouer l'action metier qui l'a
// declenchee : l'envoi est detache et les erreurs sont seulement tracees.
function sendToUserDetached(userId, payload) {
  const promise = sendToUser(userId, payload).catch((error) => {
    console.warn('[push] envoi impossible:', error.message);
  });
  return track(promise);
}

module.exports = { sendToUser, sendToUserDetached, isExpoPushToken, flush };
