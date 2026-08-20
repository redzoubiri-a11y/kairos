// Règles des codes promotionnels (§12 Phase 4).
//
// Module pur : les deux adaptateurs de données s'en servent, et il se teste
// sans base ni moteur de rendu. La contrepartie côté PostgreSQL vit dans
// 0010_promo_codes.sql, où les mêmes règles sont réappliquées — un client
// modifié ne doit pas pouvoir s'accorder une remise.

import { PROMO_KINDS } from './constants';

/** Forme canonique d'un code : sans espaces, en capitales. */
export function normalizePromoCode(raw) {
  return String(raw ?? '').trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Remise accordée par un code sur un montant.
 *
 * Bornée au montant lui-même : une remise fixe de 50 000 DA sur une formule à
 * 35 000 DA ramène à zéro, jamais à un total négatif que le propriétaire
 * devrait rembourser.
 */
export function promoDiscount(promo, amount) {
  const base = Math.max(0, Number(amount) || 0);
  const valeur = Number(promo?.value) || 0;

  const brut =
    promo?.kind === PROMO_KINDS.PERCENT ? Math.round((base * valeur) / 100) : Math.round(valeur);

  return Math.min(Math.max(0, brut), base);
}

/**
 * Vérifie qu'un code est utilisable, et rend la remise correspondante.
 *
 * Rend `{ ok: false, reason }` plutôt que de lever : l'appelant est un écran
 * de saisie, où chaque refus doit devenir un message précis. Les raisons sont
 * des identifiants stables, traduits à l'affichage.
 *
 * `today` est injecté pour que les tests ne dépendent pas de la date du jour.
 */
export function checkPromo(promo, { amount, today = new Date().toISOString().slice(0, 10) } = {}) {
  if (!promo) return { ok: false, reason: 'unknown' };
  if (promo.active === false) return { ok: false, reason: 'inactive' };

  if (promo.starts_on && today < promo.starts_on) return { ok: false, reason: 'not_started' };
  if (promo.ends_on && today > promo.ends_on) return { ok: false, reason: 'expired' };

  // `max_uses` nul vaut illimité.
  if (promo.max_uses != null && (promo.used_count ?? 0) >= promo.max_uses) {
    return { ok: false, reason: 'exhausted' };
  }

  const discount = promoDiscount(promo, amount);

  // Un code qui ne retire rien — 0 % ou une remise sur un montant nul — serait
  // accepté sans effet visible, ce qui ressemble à une panne.
  if (discount <= 0) return { ok: false, reason: 'no_effect' };

  return { ok: true, discount, total: Math.max(0, (Number(amount) || 0) - discount) };
}

/** Contrôle des champs saisis par le propriétaire. */
export function validatePromoPayload(payload) {
  const code = normalizePromoCode(payload?.code);
  if (code.length < 3) return { ok: false, reason: 'code_too_short' };

  const kind = payload?.kind;
  if (kind !== PROMO_KINDS.PERCENT && kind !== PROMO_KINDS.AMOUNT) {
    return { ok: false, reason: 'kind_invalid' };
  }

  const value = Number(payload?.value);
  if (!Number.isFinite(value) || value <= 0) return { ok: false, reason: 'value_invalid' };
  if (kind === PROMO_KINDS.PERCENT && value > 100) return { ok: false, reason: 'percent_over_100' };

  const max = payload?.max_uses;
  if (max != null && max !== '' && (!Number.isFinite(Number(max)) || Number(max) < 1)) {
    return { ok: false, reason: 'max_uses_invalid' };
  }

  if (payload?.starts_on && payload?.ends_on && payload.ends_on < payload.starts_on) {
    return { ok: false, reason: 'dates_reversed' };
  }

  return { ok: true, code, kind, value: Math.round(value) };
}
