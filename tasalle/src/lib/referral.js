// Règles du parrainage entre propriétaires (§12 Phase 4).
//
// Le modèle est le seul cohérent avec la tarification : les familles ne paient
// rien, il n'y a donc rien à leur offrir. Un propriétaire parraine un autre
// propriétaire, et tous deux gagnent des jours d'abonnement.
//
// Module pur, partagé par les deux adaptateurs, et repris en PL/pgSQL dans
// 0011_referrals.sql — la récompense ne doit pas dépendre du client.

import { REFERRAL_DAYS, REFERRAL_MAX_DAYS, REFERRAL_CODE_LENGTH } from './constants';

// L'alphabet exclut 0/O, 1/I/L et les lettres qui se confondent à l'oral :
// un code de parrainage se dicte au téléphone ou se recopie d'un SMS.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/** Code lisible et prononçable, sans caractères ambigus. */
export function generateReferralCode(random = Math.random) {
  let code = '';
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i += 1) {
    code += ALPHABET[Math.floor(random() * ALPHABET.length)];
  }
  return code;
}

/** Forme canonique : capitales, sans espaces ni tirets. */
export function normalizeReferralCode(raw) {
  return String(raw ?? '')
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '');
}

/**
 * Le code saisi par un nouveau propriétaire est-il recevable ?
 *
 * `parrain` est le compte qui porte ce code, `filleul` celui qui le saisit.
 * Rend `{ ok: false, reason }` plutôt que de lever : chaque refus devient un
 * message à l'inscription.
 */
export function checkReferral({ parrain, filleul, dejaParraine = false }) {
  if (!parrain) return { ok: false, reason: 'unknown' };

  // Se parrainer soi-même serait la façon la plus simple de doubler son essai.
  if (filleul && parrain.id === filleul.id) return { ok: false, reason: 'self' };

  // Le lien se noue une fois, à l'inscription : un filleul déjà rattaché ne
  // peut pas changer de parrain pour rejouer la récompense.
  if (dejaParraine) return { ok: false, reason: 'already_referred' };

  return { ok: true, referrer_id: parrain.id };
}

/**
 * Jours réellement accordés à un parrain, plafond compris.
 *
 * Le plafond borne l'engagement : sans lui, un parrain très actif pourrait
 * accumuler des années d'abonnement gratuit, que Tasalle devrait honorer.
 */
export function referralGrant(dejaGagnes) {
  const acquis = Math.max(0, Number(dejaGagnes) || 0);
  const restant = Math.max(0, REFERRAL_MAX_DAYS - acquis);
  return Math.min(REFERRAL_DAYS, restant);
}

/**
 * Nouvelle échéance après ajout de jours.
 *
 * Les jours s'ajoutent à l'échéance en cours — fin d'essai tant qu'il dure,
 * fin de période ensuite. S'ils étaient toujours comptés depuis aujourd'hui,
 * un parrain récompensé en début d'essai y perdrait ses jours restants.
 */
export function extendedDeadline({ trialEndsAt, periodEndsAt, days, today }) {
  const base = periodEndsAt || trialEndsAt || today;
  // Une échéance déjà passée ne sert pas de base : on repart d'aujourd'hui.
  const depart = base < today ? today : base;

  const d = new Date(`${depart}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
