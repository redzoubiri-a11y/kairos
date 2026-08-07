import {
  generateReferralCode,
  normalizeReferralCode,
  checkReferral,
  referralGrant,
  extendedDeadline,
} from './referral';
import { REFERRAL_DAYS, REFERRAL_MAX_DAYS, REFERRAL_CODE_LENGTH } from './constants';

describe('code de parrainage', () => {
  it('a la longueur attendue', () => {
    expect(generateReferralCode()).toHaveLength(REFERRAL_CODE_LENGTH);
  });

  /**
   * Un code se dicte au téléphone ou se recopie d'un SMS : 0/O et 1/I/L s'y
   * confondent, ils sont donc absents de l'alphabet.
   */
  it('n’emploie aucun caractère ambigu', () => {
    const codes = Array.from({ length: 300 }, () => generateReferralCode()).join('');
    expect(codes).not.toMatch(/[01OIL]/);
  });

  it('normalise la saisie', () => {
    expect(normalizeReferralCode(' ab-3 4c ')).toBe('AB34C');
    expect(normalizeReferralCode(null)).toBe('');
  });
});

describe('recevabilité du parrainage', () => {
  const parrain = { id: 'user-a' };
  const filleul = { id: 'user-b' };

  it('accepte un parrain valide', () => {
    expect(checkReferral({ parrain, filleul })).toEqual({ ok: true, referrer_id: 'user-a' });
  });

  it('refuse un code inconnu', () => {
    expect(checkReferral({ parrain: null, filleul }).reason).toBe('unknown');
  });

  // Le contournement le plus évident : doubler son propre essai.
  it('refuse l’auto-parrainage', () => {
    expect(checkReferral({ parrain, filleul: parrain }).reason).toBe('self');
  });

  it('refuse un filleul déjà rattaché', () => {
    expect(checkReferral({ parrain, filleul, dejaParraine: true }).reason).toBe('already_referred');
  });
});

describe('plafond de récompense', () => {
  it('accorde la récompense pleine tant que le plafond est loin', () => {
    expect(referralGrant(0)).toBe(REFERRAL_DAYS);
    expect(referralGrant(REFERRAL_MAX_DAYS - REFERRAL_DAYS)).toBe(REFERRAL_DAYS);
  });

  it('rogne la dernière récompense au plafond', () => {
    expect(referralGrant(REFERRAL_MAX_DAYS - 10)).toBe(10);
  });

  it('n’accorde plus rien au-delà', () => {
    expect(referralGrant(REFERRAL_MAX_DAYS)).toBe(0);
    expect(referralGrant(REFERRAL_MAX_DAYS + 100)).toBe(0);
  });
});

describe('report d’échéance', () => {
  const today = '2026-08-06';

  it('ajoute les jours à la fin d’essai en cours', () => {
    expect(extendedDeadline({ trialEndsAt: '2026-09-20', periodEndsAt: null, days: 30, today }))
      .toBe('2026-10-20');
  });

  it('privilégie la fin de période quand l’essai est terminé', () => {
    expect(
      extendedDeadline({ trialEndsAt: '2026-06-01', periodEndsAt: '2026-09-01', days: 30, today })
    ).toBe('2026-10-01');
  });

  /**
   * Le point qui compte : les jours s'ajoutent à l'échéance, pas à
   * aujourd'hui. Sinon un parrain récompensé au début de son essai perdrait
   * les jours qu'il lui restait.
   */
  it('ne fait pas perdre les jours restants', () => {
    const avec = extendedDeadline({ trialEndsAt: '2026-11-01', periodEndsAt: null, days: 30, today });
    expect(avec).toBe('2026-12-01');
    expect(avec > '2026-11-01').toBe(true);
  });

  it('repart d’aujourd’hui quand l’échéance est déjà passée', () => {
    expect(extendedDeadline({ trialEndsAt: '2026-01-01', periodEndsAt: null, days: 30, today }))
      .toBe('2026-09-05');
  });

  it('gère le passage d’une année', () => {
    expect(extendedDeadline({ trialEndsAt: '2026-12-20', periodEndsAt: null, days: 30, today }))
      .toBe('2027-01-19');
  });
});
