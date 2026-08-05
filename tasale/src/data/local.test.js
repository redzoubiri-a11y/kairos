// Tests du backend local — mêmes règles métier que la migration SQL (§10).
// Le jeu de démonstration est reconstruit avant chaque test.

import * as api from './local';
import { todayISO, addDays } from '../lib/format';
import { SMS_MAX_PER_DAY } from '../lib/constants';

const PRO_PHONE = '0555 10 00 01';
const CLIENT_PHONE = '0661 23 45 67';
const SALLE = 'salle-001';

const T = todayISO();

async function loginAs(phone) {
  await api.sendOtp(phone);
  return api.verifyOtp(phone, api.DEMO_OTP);
}

/** L'état d'un jour donné, tel que le calendrier l'affiche. */
async function stateOf(day) {
  const d = new Date(day);
  const map = await api.getAvailability(SALLE, d.getFullYear(), d.getMonth());
  return map[day];
}

beforeEach(async () => {
  await api.resetDemoData();
});

describe('authentification', () => {
  it('refuse un code erroné', async () => {
    await api.sendOtp(CLIENT_PHONE);
    await expect(api.verifyOtp(CLIENT_PHONE, '000000')).rejects.toThrow('INVALID_OTP');
  });

  it('reconnaît un compte existant du jeu de démonstration', async () => {
    const { user, isNew } = await loginAs(PRO_PHONE);
    expect(isNew).toBe(false);
    expect(user.role).toBe('pro');
    expect(user.full_name).toBe('Karim Belkacem');
  });

  it('crée un compte pour un numéro inconnu', async () => {
    const { user, isNew } = await loginAs('0770 11 22 33');
    expect(isNew).toBe(true);
    expect(user.role).toBeNull();
    expect(user.phone).toBe('+213770112233');
  });

  it('normalise le numéro au format international', async () => {
    const { user } = await loginAs(CLIENT_PHONE);
    expect(user.phone).toBe('+213661234567');
  });
});

describe('disponibilités (§4.4, §10.1)', () => {
  it('grise les jours passés', async () => {
    expect(await stateOf(addDays(T, -1))).toBe('past');
  });

  it('marque comme réservé un jour déjà confirmé', async () => {
    // resa-001 est confirmée à J+21
    expect(await stateOf(addDays(T, 21))).toBe('booked');
  });

  it('réserve le jour d’une demande en attente pendant 48 h', async () => {
    // resa-002 est en attente à J+9, créée il y a un jour
    expect(await stateOf(addDays(T, 9))).toBe('held');
  });

  it('respecte les jours bloqués par le propriétaire', async () => {
    expect(await stateOf(addDays(T, 14))).toBe('blocked');
  });

  it('laisse disponibles les autres jours', async () => {
    expect(await stateOf(addDays(T, 100))).toBe('available');
  });
});

describe('création d’une demande (§9.3)', () => {
  const payload = (day) => ({
    salle_id: SALLE,
    event_date: day,
    event_type: 'mariage',
    guest_count: 200,
    formula_id: 'tarif-salle-001-1',
    client_name: 'Amina Cherif',
    client_phone: CLIENT_PHONE,
    client_message: 'Merci',
  });

  it('génère une référence au format TAS-AAAA-XXXX', async () => {
    await loginAs(CLIENT_PHONE);
    const resa = await api.createReservation(payload(addDays(T, 100)));
    expect(resa.reference).toMatch(/^TAS-\d{4}-\d{4}$/);
    expect(resa.status).toBe('pending');
  });

  it('reprend le prix de la formule choisie', async () => {
    await loginAs(CLIENT_PHONE);
    const resa = await api.createReservation(payload(addDays(T, 100)));
    expect(resa.total_amount).toBe(35000);
  });

  it('refuse un jour déjà confirmé', async () => {
    await loginAs(CLIENT_PHONE);
    await expect(api.createReservation(payload(addDays(T, 21)))).rejects.toMatchObject({
      code: 'DAY_TAKEN',
    });
  });

  it('notifie le client et le propriétaire', async () => {
    await loginAs(CLIENT_PHONE);
    await api.createReservation(payload(addDays(T, 100)));

    const mine = await api.listNotifications();
    expect(mine.some((n) => n.type === 'reservation_sent')).toBe(true);

    await loginAs(PRO_PHONE);
    const pro = await api.listNotifications();
    expect(pro.some((n) => n.type === 'reservation_new')).toBe(true);
  });

  it('exige une session', async () => {
    await expect(api.createReservation(payload(addDays(T, 100)))).rejects.toThrow('NOT_AUTHENTICATED');
  });
});

describe('annulation client (§10.1)', () => {
  it('autorise l’annulation d’une demande en attente', async () => {
    await loginAs(CLIENT_PHONE);
    const resa = await api.createReservation({
      salle_id: SALLE,
      event_date: addDays(T, 100),
      event_type: 'mariage',
      guest_count: 200,
      formula_id: 'tarif-salle-001-1',
      client_name: 'Amina Cherif',
      client_phone: CLIENT_PHONE,
    });

    const cancelled = await api.cancelReservation(resa.id);
    expect(cancelled.status).toBe('cancelled');
  });

  it('refuse l’annulation d’une réservation confirmée', async () => {
    await loginAs(CLIENT_PHONE);
    // resa-001 appartient au client de démonstration et est confirmée
    await expect(api.cancelReservation('resa-001')).rejects.toMatchObject({
      code: 'NOT_CANCELLABLE',
    });
  });

  it('libère le jour après annulation', async () => {
    await loginAs(CLIENT_PHONE);
    const resa = await api.createReservation({
      salle_id: SALLE,
      event_date: addDays(T, 100),
      event_type: 'mariage',
      guest_count: 200,
      formula_id: 'tarif-salle-001-1',
      client_name: 'Amina Cherif',
      client_phone: CLIENT_PHONE,
    });
    expect(await stateOf(addDays(T, 100))).toBe('held');

    await api.cancelReservation(resa.id);
    expect(await stateOf(addDays(T, 100))).toBe('available');
  });
});

describe('confirmation par le pro (§10.1, §11.1)', () => {
  beforeEach(async () => {
    await loginAs(PRO_PHONE);
  });

  it('rejette un PIN erroné', async () => {
    await expect(
      api.proConfirmReservation('resa-002', { depositAmount: 16000, ccp: '002145', pin: '9999' })
    ).rejects.toMatchObject({ code: 'WRONG_PIN' });
  });

  it('laisse la réservation intacte après un PIN erroné', async () => {
    await api
      .proConfirmReservation('resa-002', { depositAmount: 16000, pin: '9999' })
      .catch(() => {});
    const rows = await api.proListReservations('pending');
    expect(rows.some((r) => r.id === 'resa-002')).toBe(true);
  });

  it('confirme et horodate la signature avec le bon PIN', async () => {
    const resa = await api.proConfirmReservation('resa-002', {
      depositAmount: 16000,
      ccp: '0021458796',
      pin: '1234',
    });
    expect(resa.status).toBe('confirmed');
    expect(resa.signed_at).toBeTruthy();
    expect(resa.deposit_amount).toBe(16000);
  });

  it('notifie le client de la confirmation et de l’acompte', async () => {
    await api.proConfirmReservation('resa-002', { depositAmount: 16000, pin: '1234' });

    await loginAs('0770 99 88 77'); // Yacine Haddad, client de resa-002
    const notifs = await api.listNotifications();
    expect(notifs.some((n) => n.type === 'reservation_confirmed')).toBe(true);
    expect(notifs.some((n) => n.type === 'deposit_requested')).toBe(true);
  });

  it('bascule le jour en réservé', async () => {
    await api.proConfirmReservation('resa-002', { depositAmount: 16000, pin: '1234' });
    expect(await stateOf(addDays(T, 9))).toBe('booked');
  });

  it('refuse une seconde confirmation le même jour', async () => {
    await loginAs(CLIENT_PHONE);
    const concurrente = await api.createReservation({
      salle_id: SALLE,
      event_date: addDays(T, 9),
      event_type: 'fiancailles',
      guest_count: 100,
      formula_id: 'tarif-salle-001-1',
      client_name: 'Amina Cherif',
      client_phone: CLIENT_PHONE,
    });

    await loginAs(PRO_PHONE);
    await api.proConfirmReservation('resa-002', { depositAmount: 16000, pin: '1234' });

    await expect(
      api.proConfirmReservation(concurrente.id, { depositAmount: 10000, pin: '1234' })
    ).rejects.toMatchObject({ code: 'DAY_TAKEN' });
  });

  it('enregistre la réception de l’acompte', async () => {
    await api.proConfirmReservation('resa-002', { depositAmount: 16000, pin: '1234' });
    const resa = await api.proVerifyDeposit('resa-002');
    expect(resa.deposit_paid).toBe(true);
    expect(resa.deposit_paid_at).toBeTruthy();
  });
});

describe('refus par le pro', () => {
  it('annule la demande et notifie le client', async () => {
    await loginAs(PRO_PHONE);
    const resa = await api.proCancelReservation('resa-002', 'Salle en travaux');
    expect(resa.status).toBe('cancelled');
    expect(resa.pro_notes).toBe('Salle en travaux');

    await loginAs('0770 99 88 77');
    const notifs = await api.listNotifications();
    expect(notifs.some((n) => n.type === 'reservation_cancelled')).toBe(true);
  });
});

describe('avis (§7, §10.2)', () => {
  it('refuse un avis avant 48 h après l’événement', async () => {
    await loginAs(CLIENT_PHONE);
    // resa-001 a lieu dans 21 jours
    await expect(
      api.createReview({ reservation_id: 'resa-001', rating_overall: 5 })
    ).rejects.toMatchObject({ code: 'TOO_EARLY' });
  });

  it('accepte un avis après l’événement et pose le badge « client confirmé »', async () => {
    await loginAs(CLIENT_PHONE);
    // resa-005 est terminée, il y a 12 jours
    const review = await api.createReview({
      reservation_id: 'resa-005',
      rating_overall: 5,
      rating_salle: 5,
      comment: 'Parfait',
    });
    expect(review.is_verified).toBe(true);
    expect(review.status).toBe('pending');
  });

  it('garde l’avis invisible pendant les 24 h de modération', async () => {
    await loginAs(CLIENT_PHONE);
    await api.createReview({ reservation_id: 'resa-005', rating_overall: 5 });

    const publics = await api.getSalleReviews('salle-005', {});
    expect(publics).toHaveLength(0);
  });

  it('publie automatiquement passé 24 h sans modération', async () => {
    await loginAs(CLIENT_PHONE);
    await api.createReview({ reservation_id: 'resa-005', rating_overall: 5 });

    const spy = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 25 * 3_600_000);
    try {
      const publics = await api.getSalleReviews('salle-005', {});
      expect(publics).toHaveLength(1);
    } finally {
      spy.mockRestore();
    }
  });

  it('publie immédiatement un avis approuvé par le pro', async () => {
    await loginAs(CLIENT_PHONE);
    const review = await api.createReview({ reservation_id: 'resa-005', rating_overall: 4 });
    expect(review.status).toBe('pending');
    expect(await api.getSalleReviews('salle-005', {})).toHaveLength(0);

    // salle-005 appartient à user-pro-005
    await loginAs('0555 10 00 05');
    const approuve = await api.proModerateReview(review.id, 'approve');
    expect(approuve.status).toBe('approved');

    // Publication sans attendre les 24 h de modération
    expect(await api.getSalleReviews('salle-005', {})).toHaveLength(1);
  });

  it('signale un avis sans le supprimer', async () => {
    await loginAs(CLIENT_PHONE);
    const review = await api.createReview({ reservation_id: 'resa-005', rating_overall: 2 });

    await loginAs('0555 10 00 05');
    const signale = await api.proModerateReview(review.id, 'flag');
    expect(signale.status).toBe('flagged');

    // Un avis signalé n'est plus public, mais reste en base pour arbitrage
    expect(await api.getSalleReviews('salle-005', {})).toHaveLength(0);

    const spy = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 25 * 3_600_000);
    try {
      // Il ne repasse pas en publication automatique passé 24 h
      expect(await api.getSalleReviews('salle-005', {})).toHaveLength(0);
    } finally {
      spy.mockRestore();
    }
  });

  it('notifie le pro d’un avis à modérer', async () => {
    await loginAs(CLIENT_PHONE);
    await api.createReview({ reservation_id: 'resa-005', rating_overall: 5 });

    await loginAs('0555 10 00 05'); // propriétaire de salle-005
    const notifs = await api.listNotifications();
    expect(notifs.some((n) => n.type === 'review_pending')).toBe(true);
  });

  it('recalcule la note publique de la salle', async () => {
    const avant = await api.getSalle('salle-005');

    await loginAs(CLIENT_PHONE);
    await api.createReview({ reservation_id: 'resa-005', rating_overall: 1 });

    const spy = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 25 * 3_600_000);
    try {
      const apres = await api.getSalle('salle-005');
      expect(apres.rating).toBe(1);
      expect(apres.rating).not.toBe(avant.rating);
    } finally {
      spy.mockRestore();
    }
  });

  it('permet au pro d’approuver et de répondre, jamais de supprimer', async () => {
    await loginAs(PRO_PHONE);
    const enAttente = await api.proListPendingReviews();
    expect(enAttente).toHaveLength(1); // review-002

    const repondu = await api.proModerateReview(enAttente[0].id, 'reply', 'Merci !');
    expect(repondu.pro_reply).toBe('Merci !');
    expect(repondu.status).toBe('approved');

    // Aucune fonction de suppression n'est exposée (§10.2)
    expect(api.proDeleteReview).toBeUndefined();
  });
});

describe('quota de SMS (§10.4)', () => {
  it('ne programme jamais plus de 3 SMS par jour et par destinataire', async () => {
    await loginAs(CLIENT_PHONE);

    // Chaque demande déclenche un SMS vers le client
    for (let i = 0; i < 8; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await api.createReservation({
        salle_id: SALLE,
        event_date: addDays(T, 100 + i),
        event_type: 'mariage',
        guest_count: 100,
        formula_id: 'tarif-salle-001-1',
        client_name: 'Amina Cherif',
        client_phone: CLIENT_PHONE,
      });
    }

    const log = await api.listSmsLog();
    expect(log).toHaveLength(8); // tous tracés

    const parJour = {};
    log.forEach((n) => {
      if (!n.sent_at) return;
      const jour = n.sent_at.slice(0, 10);
      parJour[jour] = (parJour[jour] || 0) + 1;
    });

    Object.values(parJour).forEach((count) => {
      expect(count).toBeLessThanOrEqual(SMS_MAX_PER_DAY);
    });

    // 8 SMS ne peuvent viser que 2 jours au plus : le plafond force des abandons
    expect(log.filter((n) => !n.sent_at).length).toBeGreaterThan(0);
  });
});

describe('favoris', () => {
  it('ajoute et retire une salle', async () => {
    await loginAs(CLIENT_PHONE);
    expect(await api.listFavoriteIds()).toEqual(['salle-003', 'salle-005']);

    expect(await api.toggleFavorite(SALLE)).toBe(true);
    expect(await api.listFavoriteIds()).toContain(SALLE);

    expect(await api.toggleFavorite(SALLE)).toBe(false);
    expect(await api.listFavoriteIds()).not.toContain(SALLE);
  });
});

describe('recherche (§4.2)', () => {
  it('filtre par ville', async () => {
    const rows = await api.listSalles({ city: 'Oran' });
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Palais Ryad');
  });

  it('filtre par capacité minimale', async () => {
    const rows = await api.listSalles({ minCapacity: 500 });
    expect(rows.every((s) => s.capacity_max >= 500)).toBe(true);
  });

  it('filtre par équipement', async () => {
    const rows = await api.listSalles({ amenities: ['pmr'] });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((s) => s.amenities.includes('pmr'))).toBe(true);
  });

  it('cherche par nom et par ville', async () => {
    expect((await api.listSalles({ query: 'widad' }))[0].name).toBe('Salle El Widad');
    expect((await api.listSalles({ query: 'annaba' }))[0].city).toBe('Annaba');
  });

  it('calcule le prix d’appel à partir de la formule la moins chère', async () => {
    const salle = await api.getSalle(SALLE);
    expect(salle.price_from).toBe(35000);
    expect(salle.tarifs).toHaveLength(3);
  });

  it('fait remonter les salles premium', async () => {
    const rows = await api.listSalles({});
    expect(rows[0].is_premium).toBe(true);
  });
});

describe('tableau de bord pro (§5.2)', () => {
  it('renvoie KPI, série de revenus et alertes', async () => {
    await loginAs(PRO_PHONE);
    const data = await api.proGetDashboard();

    expect(data.salle.id).toBe(SALLE);
    expect(data.revenueSeries).toHaveLength(6);
    expect(data.kpis.reservations.value).toBeGreaterThanOrEqual(0);
    expect(data.pendingCount).toBe(2); // resa-002 et resa-003
    expect(data.trialDaysLeft).toBe(45);
    expect(data.subscriptionStatus).toBe('trial');
  });

  it('compte les avis en attente de modération', async () => {
    await loginAs(PRO_PHONE);
    const data = await api.proGetDashboard();
    expect(data.pendingReviews).toBe(1); // review-002
  });

  it('produit six mois de statistiques', async () => {
    await loginAs(PRO_PHONE);
    const stats = await api.proGetStats();
    expect(stats.occupancy).toHaveLength(6);
    expect(stats.revenueSeries).toHaveLength(6);
    expect(stats.eventTypes.reduce((acc, e) => acc + e.count, 0)).toBeGreaterThan(0);
  });
});

describe('planning pro (§5.3)', () => {
  it('bloque et débloque un jour', async () => {
    await loginAs(PRO_PHONE);
    const jour = addDays(T, 60);

    expect(await api.proToggleBlockedDay(jour)).toBe(true);
    expect(await stateOf(jour)).toBe('blocked');

    expect(await api.proToggleBlockedDay(jour)).toBe(false);
    expect(await stateOf(jour)).toBe('available');
  });
});

describe('abonnement (§10.3)', () => {
  it('expose l’avancement de l’essai gratuit', async () => {
    await loginAs(PRO_PHONE);
    const sub = await api.getSubscription();
    expect(sub.status).toBe('trial');
    expect(sub.trialTotal).toBe(90);
    expect(sub.daysLeft).toBe(45);
    expect(sub.daysUsed).toBe(45);
  });

  it('enregistre la méthode de paiement', async () => {
    await loginAs(PRO_PHONE);
    const sub = await api.setPaymentMethod('ccp', { reference: '0021458796' });
    expect(sub.payment_method).toBe('ccp');
    expect(sub.payment_details.reference).toBe('0021458796');
  });
});

describe('messagerie (§9.5)', () => {
  it('envoie un message et notifie le destinataire', async () => {
    await loginAs(CLIENT_PHONE);
    await api.sendMessage('resa-001', 'Bonjour, une question.');

    const messages = await api.listMessages('resa-001');
    expect(messages[messages.length - 1].content).toBe('Bonjour, une question.');

    await loginAs(PRO_PHONE);
    const notifs = await api.listNotifications();
    expect(notifs.some((n) => n.type === 'message_new')).toBe(true);
  });

  it('marque les messages reçus comme lus à l’ouverture', async () => {
    await loginAs(PRO_PHONE);
    await api.listMessages('resa-001');

    const conversations = await api.listConversations();
    const conv = conversations.find((c) => c.reservation_id === 'resa-001');
    expect(conv.unread).toBe(0);
  });
});
