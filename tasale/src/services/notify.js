// Moteur de notifications — §6 (canaux, templates, règles) et §10.4.
// Logique pure : les adaptateurs de données l'appellent pour produire les
// enregistrements à persister/envoyer. Aucun effet de bord ici.

import {
  SMS_QUIET_START,
  SMS_QUIET_END,
  SMS_MAX_PER_DAY,
} from '../lib/constants';

/** §6.3 — Aucun SMS entre 22 h et 08 h. */
export function isQuietHour(date = new Date()) {
  const h = date.getHours();
  return h >= SMS_QUIET_START || h < SMS_QUIET_END;
}

/** §6.3 — Pas de SMS promotionnel pendant le Ramadan entre 06 h et 19 h. */
export function isRamadanPromoBlackout(date = new Date(), isRamadan = false) {
  if (!isRamadan) return false;
  const h = date.getHours();
  return h >= 6 && h < 19;
}

/**
 * §10.4 — Décide si un SMS peut partir maintenant.
 * Retourne { allowed, reason, deferUntil } — deferUntil est une Date si
 * l'envoi doit simplement être repoussé (heure calme) plutôt qu'abandonné.
 */
export function canSendSms({
  now = new Date(),
  sentToday = 0,
  isPromo = false,
  isRamadan = false,
  urgent = false,
} = {}) {
  if (sentToday >= SMS_MAX_PER_DAY) {
    return { allowed: false, reason: 'daily_quota', deferUntil: null };
  }
  if (isPromo && isRamadanPromoBlackout(now, isRamadan)) {
    const defer = new Date(now);
    defer.setHours(19, 0, 0, 0);
    return { allowed: false, reason: 'ramadan_blackout', deferUntil: defer };
  }
  if (isQuietHour(now)) {
    // Même urgent, on respecte le silence nocturne : l'envoi est repoussé à 08 h.
    const defer = new Date(now);
    if (now.getHours() >= SMS_QUIET_START) defer.setDate(defer.getDate() + 1);
    defer.setHours(SMS_QUIET_END, 0, 0, 0);
    return { allowed: false, reason: 'quiet_hours', deferUntil: defer };
  }
  return { allowed: true, reason: urgent ? 'urgent' : 'ok', deferUntil: null };
}

/** Tronque à 160 caractères — contrainte 1 SMS (§1.4). */
export function clampSms(text) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  return s.length <= 160 ? s : `${s.slice(0, 157)}…`;
}

// §6.2 — Templates SMS (160 caractères max)
export const SMS_TEMPLATES = {
  reservation_confirmed: ({ salle, date, ref }) =>
    clampSms(`🎉 Tasale : Votre réservation à ${salle} le ${date} est confirmée ! N° ${ref}. À très bientôt !`),
  deposit_requested: ({ pro, amount, ccp, ref }) =>
    clampSms(`💰 Tasale : ${pro} demande un acompte de ${amount} DA. CCP : ${ccp}. Réf : ${ref}. Merci !`),
  reminder_24h: ({ type, salle, heure }) =>
    clampSms(`📅 Tasale : Rappel — Votre ${type} à ${salle} est demain à ${heure}. Bonne fête !`),
  reservation_new: ({ client, date }) =>
    clampSms(`📨 Tasale : Nouvelle demande de ${client} pour le ${date}. Ouvrez l'app pour répondre.`),
  review_request: ({ type, salle, lien }) =>
    clampSms(`🎉 Tasale : Votre ${type} s'est bien passé ? Partagez votre avis sur ${salle} : ${lien}`),
  reservation_cancelled: ({ salle, date, ref }) =>
    clampSms(`❌ Tasale : Votre demande pour ${salle} le ${date} n'a pas pu être retenue. Réf : ${ref}.`),
};

// §6.3 — Priorité par type d'événement
const PRIORITY = {
  reservation_confirmed: 'urgent',
  deposit_requested: 'urgent',
  reservation_cancelled: 'urgent',
  reservation_new: 'important',
  review_pending: 'important',
  review_request: 'important',
  review_approved: 'info',
  reminder_24h: 'important',
  subscription_reminder: 'info',
  message_new: 'important',
};

export function priorityOf(type) {
  return PRIORITY[type] || 'info';
}

/**
 * Délai avant envoi SMS selon la priorité (§6.3) :
 * urgent → immédiat, important → 15 min, info → groupé (2 h).
 */
export function smsDelayMinutes(type) {
  switch (priorityOf(type)) {
    case 'urgent':
      return 0;
    case 'important':
      return 15;
    default:
      return 120;
  }
}

/**
 * Construit les enregistrements de notification pour un événement métier.
 * Retourne un tableau d'objets prêts à insérer dans `notifications`.
 */
export function buildNotifications({ type, userId, title, body, data = {}, smsText = null, now = new Date() }) {
  const records = [
    {
      user_id: userId,
      type,
      title,
      body,
      data,
      channel: 'push',
      is_read: false,
      sent_at: now.toISOString(),
      created_at: now.toISOString(),
    },
  ];

  if (smsText) {
    const delay = smsDelayMinutes(type);
    const target = new Date(now.getTime() + delay * 60_000);
    const gate = canSendSms({ now: target, urgent: priorityOf(type) === 'urgent' });
    const sendAt = gate.allowed ? target : gate.deferUntil;

    records.push({
      user_id: userId,
      type,
      title,
      body: clampSms(smsText),
      data,
      channel: 'sms',
      is_read: false,
      // null si l'envoi est abandonné (quota journalier atteint)
      sent_at: sendAt ? sendAt.toISOString() : null,
      created_at: now.toISOString(),
    });
  }

  return records;
}
