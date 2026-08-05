import {
  isQuietHour,
  isRamadanPromoBlackout,
  canSendSms,
  clampSms,
  priorityOf,
  smsDelayMinutes,
  buildNotifications,
  SMS_TEMPLATES,
} from './notify';

/** Construit une date locale à l'heure voulue, pour tester les fenêtres horaires. */
const at = (hour, minute = 0, day = 15) => new Date(2026, 7, day, hour, minute, 0);

describe('heures calmes (§6.3)', () => {
  it('interdit la tranche 22 h – 08 h', () => {
    [22, 23, 0, 3, 7].forEach((h) => {
      expect(isQuietHour(at(h))).toBe(true);
    });
  });

  it('autorise la journée', () => {
    [8, 12, 18, 21].forEach((h) => {
      expect(isQuietHour(at(h))).toBe(false);
    });
  });

  it('bascule exactement à 22 h et à 08 h', () => {
    expect(isQuietHour(at(21, 59))).toBe(false);
    expect(isQuietHour(at(22, 0))).toBe(true);
    expect(isQuietHour(at(7, 59))).toBe(true);
    expect(isQuietHour(at(8, 0))).toBe(false);
  });
});

describe('quota et report des SMS (§10.4)', () => {
  it('laisse passer un SMS en journée sous le quota', () => {
    const gate = canSendSms({ now: at(14), sentToday: 2 });
    expect(gate.allowed).toBe(true);
    expect(gate.deferUntil).toBeNull();
  });

  it('bloque au-delà de 3 SMS par jour, sans report', () => {
    const gate = canSendSms({ now: at(14), sentToday: 3 });
    expect(gate.allowed).toBe(false);
    expect(gate.reason).toBe('daily_quota');
    // Un quota dépassé n'est pas reporté : le message est abandonné
    expect(gate.deferUntil).toBeNull();
  });

  it('reporte un envoi de 23 h au lendemain 08 h', () => {
    const gate = canSendSms({ now: at(23, 30) });
    expect(gate.allowed).toBe(false);
    expect(gate.reason).toBe('quiet_hours');
    expect(gate.deferUntil.getDate()).toBe(16);
    expect(gate.deferUntil.getHours()).toBe(8);
  });

  it('reporte un envoi de 03 h au matin même', () => {
    const gate = canSendSms({ now: at(3) });
    expect(gate.deferUntil.getDate()).toBe(15);
    expect(gate.deferUntil.getHours()).toBe(8);
  });

  it("respecte le silence nocturne même pour un message urgent", () => {
    const gate = canSendSms({ now: at(23), urgent: true });
    expect(gate.allowed).toBe(false);
    expect(gate.reason).toBe('quiet_hours');
  });
});

describe('blackout promotionnel du Ramadan (§6.3)', () => {
  it('ne s’applique pas hors Ramadan', () => {
    expect(isRamadanPromoBlackout(at(12), false)).toBe(false);
  });

  it('reporte une promo de 10 h à 19 h pendant le Ramadan', () => {
    const gate = canSendSms({ now: at(10), isPromo: true, isRamadan: true });
    expect(gate.allowed).toBe(false);
    expect(gate.reason).toBe('ramadan_blackout');
    expect(gate.deferUntil.getHours()).toBe(19);
  });

  it('laisse passer une promo après la rupture du jeûne', () => {
    expect(canSendSms({ now: at(20), isPromo: true, isRamadan: true }).allowed).toBe(true);
  });

  it("n'affecte pas un message transactionnel pendant le Ramadan", () => {
    expect(canSendSms({ now: at(10), isPromo: false, isRamadan: true }).allowed).toBe(true);
  });
});

describe('format des SMS (§1.4 — 160 caractères)', () => {
  it('laisse un texte court intact', () => {
    expect(clampSms('Bonjour')).toBe('Bonjour');
  });

  it('normalise les espaces multiples', () => {
    expect(clampSms('  a   b \n c ')).toBe('a b c');
  });

  it('tronque au-delà de 160 caractères', () => {
    const long = 'x'.repeat(300);
    const out = clampSms(long);
    expect(out).toHaveLength(158);
    expect(out.endsWith('…')).toBe(true);
  });

  it('produit des gabarits tenant en un seul SMS', () => {
    const rendus = [
      SMS_TEMPLATES.reservation_confirmed({
        salle: 'Complexe Es-Salam', date: '15 Août 2026', ref: 'TAS-2026-0001',
      }),
      SMS_TEMPLATES.deposit_requested({
        pro: 'Résidence Ibn Khaldoun', amount: '30 000', ccp: '0021458796 clé 33', ref: 'TAS-2026-0001',
      }),
      SMS_TEMPLATES.reminder_24h({ type: 'mariage', salle: 'Palais Ryad', heure: '19h00' }),
      SMS_TEMPLATES.reservation_new({ client: 'Nadia Boumediene', date: '15 Août 2026' }),
      SMS_TEMPLATES.review_request({
        type: 'mariage', salle: 'Salle El Widad', lien: 'https://tasale.dz/a/1234',
      }),
      SMS_TEMPLATES.reservation_cancelled({
        salle: 'Espace Andalous', date: '15 Août 2026', ref: 'TAS-2026-0001',
      }),
    ];

    rendus.forEach((sms) => {
      expect(sms.length).toBeLessThanOrEqual(160);
      expect(sms.length).toBeGreaterThan(0);
    });
  });
});

describe('priorités d’envoi (§6.3)', () => {
  it('classe correctement les types', () => {
    expect(priorityOf('reservation_confirmed')).toBe('urgent');
    expect(priorityOf('reservation_new')).toBe('important');
    expect(priorityOf('subscription_reminder')).toBe('info');
    expect(priorityOf('type_inconnu')).toBe('info');
  });

  it('applique immédiat / 15 min / 2 h selon la priorité', () => {
    expect(smsDelayMinutes('deposit_requested')).toBe(0);
    expect(smsDelayMinutes('reservation_new')).toBe(15);
    expect(smsDelayMinutes('review_approved')).toBe(120);
  });
});

describe('construction des notifications', () => {
  const base = {
    type: 'reservation_confirmed',
    userId: 'user-1',
    title: 'Réservation confirmée',
    body: 'Votre réservation est confirmée.',
    data: { reservation_id: 'resa-1' },
  };

  it('crée toujours une notification push', () => {
    const records = buildNotifications({ ...base, now: at(14) });
    expect(records).toHaveLength(1);
    expect(records[0].channel).toBe('push');
    expect(records[0].is_read).toBe(false);
    expect(records[0].data).toEqual({ reservation_id: 'resa-1' });
  });

  it('ajoute un SMS lorsque le texte est fourni', () => {
    const records = buildNotifications({ ...base, smsText: 'Confirmée !', now: at(14) });
    expect(records.map((r) => r.channel)).toEqual(['push', 'sms']);
  });

  it('programme un SMS urgent immédiatement en journée', () => {
    const now = at(14);
    const [, sms] = buildNotifications({ ...base, smsText: 'Confirmée !', now });
    expect(new Date(sms.sent_at).getHours()).toBe(14);
  });

  it('décale de 15 min un SMS de priorité importante', () => {
    const now = at(14, 0);
    const [, sms] = buildNotifications({
      ...base, type: 'reservation_new', smsText: 'Nouvelle demande', now,
    });
    expect(new Date(sms.sent_at).getHours()).toBe(14);
    expect(new Date(sms.sent_at).getMinutes()).toBe(15);
  });

  it('repousse au matin un SMS produit la nuit', () => {
    const [, sms] = buildNotifications({ ...base, smsText: 'Confirmée !', now: at(23, 30) });
    const sendAt = new Date(sms.sent_at);
    expect(sendAt.getHours()).toBe(8);
    expect(sendAt.getDate()).toBe(16);
  });

  it('tronque le corps du SMS à 160 caractères', () => {
    const [, sms] = buildNotifications({ ...base, smsText: 'y'.repeat(400), now: at(14) });
    expect(sms.body.length).toBeLessThanOrEqual(160);
  });
});
