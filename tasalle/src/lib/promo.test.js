import { normalizePromoCode, promoDiscount, checkPromo, validatePromoPayload } from './promo';
import { PROMO_KINDS } from './constants';

const CODE = {
  code: 'MARIAGE10',
  kind: PROMO_KINDS.PERCENT,
  value: 10,
  starts_on: '2026-08-01',
  ends_on: '2026-12-31',
  max_uses: 20,
  used_count: 0,
  active: true,
};

describe('forme du code', () => {
  it('ignore la casse et les espaces', () => {
    expect(normalizePromoCode('  mariage 10 ')).toBe('MARIAGE10');
  });

  it('tolère une valeur absente', () => {
    expect(normalizePromoCode(null)).toBe('');
  });
});

describe('calcul de la remise', () => {
  it('applique un pourcentage', () => {
    expect(promoDiscount({ kind: PROMO_KINDS.PERCENT, value: 10 }, 35000)).toBe(3500);
  });

  it('applique un montant fixe', () => {
    expect(promoDiscount({ kind: PROMO_KINDS.AMOUNT, value: 5000 }, 35000)).toBe(5000);
  });

  it('arrondit au dinar', () => {
    // 7 % de 35 000 = 2 450 ; 7 % de 33 333 = 2 333,31
    expect(promoDiscount({ kind: PROMO_KINDS.PERCENT, value: 7 }, 33333)).toBe(2333);
  });

  /**
   * Le point qui compte : une remise ne peut pas dépasser le montant. Sans
   * cette borne, un code de 50 000 DA sur une formule à 35 000 laisserait un
   * total négatif — une somme que le propriétaire devrait rembourser.
   */
  it('ne dépasse jamais le montant', () => {
    expect(promoDiscount({ kind: PROMO_KINDS.AMOUNT, value: 50000 }, 35000)).toBe(35000);
    expect(promoDiscount({ kind: PROMO_KINDS.PERCENT, value: 100 }, 35000)).toBe(35000);
  });

  it('reste à zéro sur un montant nul ou négatif', () => {
    expect(promoDiscount({ kind: PROMO_KINDS.PERCENT, value: 10 }, 0)).toBe(0);
    expect(promoDiscount({ kind: PROMO_KINDS.AMOUNT, value: 5000 }, -100)).toBe(0);
  });
});

describe('recevabilité d’un code', () => {
  const params = { amount: 35000, today: '2026-09-15' };

  it('accepte un code valide et rend le total remisé', () => {
    expect(checkPromo(CODE, params)).toEqual({ ok: true, discount: 3500, total: 31500 });
  });

  it('refuse un code inconnu', () => {
    expect(checkPromo(null, params).reason).toBe('unknown');
  });

  it('refuse un code désactivé', () => {
    expect(checkPromo({ ...CODE, active: false }, params).reason).toBe('inactive');
  });

  it('refuse un code pas encore ouvert', () => {
    expect(checkPromo(CODE, { ...params, today: '2026-07-31' }).reason).toBe('not_started');
  });

  it('refuse un code périmé', () => {
    expect(checkPromo(CODE, { ...params, today: '2027-01-01' }).reason).toBe('expired');
  });

  it('accepte aux bornes exactes de la période', () => {
    expect(checkPromo(CODE, { ...params, today: '2026-08-01' }).ok).toBe(true);
    expect(checkPromo(CODE, { ...params, today: '2026-12-31' }).ok).toBe(true);
  });

  it('refuse un code épuisé', () => {
    expect(checkPromo({ ...CODE, used_count: 20 }, params).reason).toBe('exhausted');
  });

  it('accepte à la dernière utilisation disponible', () => {
    expect(checkPromo({ ...CODE, used_count: 19 }, params).ok).toBe(true);
  });

  it('traite un quota absent comme illimité', () => {
    expect(checkPromo({ ...CODE, max_uses: null, used_count: 999 }, params).ok).toBe(true);
  });

  it('ignore les bornes de dates non renseignées', () => {
    const sansDates = { ...CODE, starts_on: null, ends_on: null };
    expect(checkPromo(sansDates, { ...params, today: '2030-01-01' }).ok).toBe(true);
  });

  /**
   * Un code sans effet serait accepté sans que rien ne change à l'écran : le
   * client croirait à une panne plutôt qu'à un code inopérant.
   */
  it('refuse un code qui ne retirerait rien', () => {
    expect(checkPromo({ ...CODE, value: 0 }, params).reason).toBe('no_effect');
    expect(checkPromo(CODE, { ...params, amount: 0 }).reason).toBe('no_effect');
  });
});

describe('saisie du propriétaire', () => {
  const base = { code: 'ETE2026', kind: PROMO_KINDS.PERCENT, value: 15 };

  it('accepte une saisie correcte et rend le code normalisé', () => {
    expect(validatePromoPayload({ ...base, code: ' ete 2026 ' })).toMatchObject({
      ok: true,
      code: 'ETE2026',
      value: 15,
    });
  });

  it('refuse un code trop court', () => {
    expect(validatePromoPayload({ ...base, code: 'AB' }).reason).toBe('code_too_short');
  });

  it('refuse un type inconnu', () => {
    expect(validatePromoPayload({ ...base, kind: 'gratuit' }).reason).toBe('kind_invalid');
  });

  it('refuse une valeur nulle ou négative', () => {
    expect(validatePromoPayload({ ...base, value: 0 }).reason).toBe('value_invalid');
    expect(validatePromoPayload({ ...base, value: -5 }).reason).toBe('value_invalid');
  });

  it('refuse un pourcentage au-dessus de 100', () => {
    expect(validatePromoPayload({ ...base, value: 120 }).reason).toBe('percent_over_100');
  });

  it('autorise un montant fixe supérieur à 100', () => {
    expect(validatePromoPayload({ ...base, kind: PROMO_KINDS.AMOUNT, value: 5000 }).ok).toBe(true);
  });

  it('refuse un quota inférieur à une utilisation', () => {
    expect(validatePromoPayload({ ...base, max_uses: 0 }).reason).toBe('max_uses_invalid');
  });

  it('accepte un quota vide, qui vaut illimité', () => {
    expect(validatePromoPayload({ ...base, max_uses: '' }).ok).toBe(true);
    expect(validatePromoPayload({ ...base, max_uses: null }).ok).toBe(true);
  });

  it('refuse une fin antérieure au début', () => {
    expect(
      validatePromoPayload({ ...base, starts_on: '2026-09-01', ends_on: '2026-08-01' }).reason
    ).toBe('dates_reversed');
  });

  it('arrondit la valeur saisie', () => {
    expect(validatePromoPayload({ ...base, value: 12.6 }).value).toBe(13);
  });
});
