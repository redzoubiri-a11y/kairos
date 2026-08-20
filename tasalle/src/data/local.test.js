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
    const rows = await api.proListReservations(SALLE, 'pending');
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
    const enAttente = await api.proListPendingReviews(SALLE);
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

describe('photos des salles', () => {
  it('expose toujours un tableau, même sans manifeste renseigné', async () => {
    const rows = await api.listSalles({});
    rows.forEach((s) => expect(Array.isArray(s.photos)).toBe(true));
  });

  it('reprend les URL déclarées dans photos.json', async () => {
    // eslint-disable-next-line global-require
    const manifeste = require('./photos.json');
    const declarees = Object.entries(manifeste.salles || {});

    if (declarees.length === 0) {
      // Manifeste vide : toutes les salles retombent sur le dégradé
      const rows = await api.listSalles({});
      expect(rows.every((s) => s.photos.length === 0)).toBe(true);
      return;
    }

    for (const [salleId, entree] of declarees) {
      // eslint-disable-next-line no-await-in-loop
      const salle = await api.getSalle(salleId);
      expect(salle.photos).toEqual(entree.urls);
    }
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
    const data = await api.proGetDashboard(SALLE);

    expect(data.salle.id).toBe(SALLE);
    expect(data.revenueSeries).toHaveLength(6);
    expect(data.kpis.reservations.value).toBeGreaterThanOrEqual(0);
    expect(data.pendingCount).toBe(2); // resa-002 et resa-003
    expect(data.trialDaysLeft).toBe(45);
    expect(data.subscriptionStatus).toBe('trial');
  });

  it('compte les avis en attente de modération', async () => {
    await loginAs(PRO_PHONE);
    const data = await api.proGetDashboard(SALLE);
    expect(data.pendingReviews).toBe(1); // review-002
  });

  it('produit six mois de statistiques', async () => {
    await loginAs(PRO_PHONE);
    const stats = await api.proGetStats(SALLE);
    expect(stats.occupancy).toHaveLength(6);
    expect(stats.revenueSeries).toHaveLength(6);
    expect(stats.eventTypes.reduce((acc, e) => acc + e.count, 0)).toBeGreaterThan(0);
  });
});

describe('planning pro (§5.3)', () => {
  it('bloque et débloque un jour', async () => {
    await loginAs(PRO_PHONE);
    const jour = addDays(T, 60);

    expect(await api.proToggleBlockedDay(SALLE, jour)).toBe(true);
    expect(await stateOf(jour)).toBe('blocked');

    expect(await api.proToggleBlockedDay(SALLE, jour)).toBe(false);
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

  it('ne montre à chacun que ses propres factures', async () => {
    await loginAs(PRO_PHONE);
    const miennes = await api.listInvoices();
    expect(miennes.length).toBeGreaterThan(0);
    expect(miennes.every((f) => f.pro_id === 'user-pro-001')).toBe(true);

    // Un autre propriétaire ne doit pas hériter de la facturation du premier.
    await loginAs('0555 10 00 03');
    expect(await api.listInvoices()).toEqual([]);
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

describe('console d’administration (§2.1)', () => {
  const ADMIN_PHONE = '0555 00 00 00';

  it('refuse les chiffres de la plateforme à un client', async () => {
    await loginAs(CLIENT_PHONE);
    await expect(api.adminGetOverview()).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('refuse à un pro de valider une salle', async () => {
    await loginAs(PRO_PHONE);
    await expect(api.adminReviewSalle('salle-011', true)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('laisse la salle en attente après une tentative refusée', async () => {
    await loginAs(PRO_PHONE);
    await api.adminReviewSalle('salle-011', true).catch(() => {});

    await loginAs(ADMIN_PHONE);
    const attente = await api.adminListPendingSalles();
    expect(attente.some((s) => s.id === 'salle-011')).toBe(true);
  });

  it('expose les chiffres de la plateforme à l’administrateur', async () => {
    await loginAs(ADMIN_PHONE);
    const vue = await api.adminGetOverview();

    expect(vue.salles.pending).toBe(1);
    expect(vue.salles.active).toBe(10);
    expect(vue.reviews.flagged).toBe(1);
    expect(vue.users.total).toBeGreaterThan(0);
  });

  it('joint le propriétaire à chaque salle en attente', async () => {
    await loginAs(ADMIN_PHONE);
    const [salle] = await api.adminListPendingSalles();
    expect(salle.owner.full_name).toBe('Farid Benhamou');
  });

  it('publie la salle validée et prévient son propriétaire', async () => {
    await loginAs(ADMIN_PHONE);
    const salle = await api.adminReviewSalle('salle-011', true);
    expect(salle.status).toBe('active');
    expect(await api.adminListPendingSalles()).toHaveLength(0);

    // Elle devient visible côté client
    const publiques = await api.listSalles({ city: 'Boumerdès' });
    expect(publiques.some((s) => s.id === 'salle-011')).toBe(true);

    await loginAs('0555 10 00 11');
    const notifs = await api.listNotifications();
    expect(notifs.some((n) => n.type === 'salle_approved')).toBe(true);
  });

  it('garde hors ligne une salle refusée', async () => {
    await loginAs(ADMIN_PHONE);
    const salle = await api.adminReviewSalle('salle-011', false);
    expect(salle.status).toBe('inactive');

    const publiques = await api.listSalles({ city: 'Boumerdès' });
    expect(publiques.some((s) => s.id === 'salle-011')).toBe(false);
  });

  it('republie un avis signalé à tort', async () => {
    await loginAs(ADMIN_PHONE);
    const [signale] = await api.adminListFlaggedReviews();
    expect(signale.salle.name).toBe('Palais Ryad');

    const arbitre = await api.adminResolveReview(signale.id, 'restore');
    expect(arbitre.status).toBe('approved');
    expect(await api.adminListFlaggedReviews()).toHaveLength(0);
  });

  it('retire un avis sans le supprimer', async () => {
    await loginAs(ADMIN_PHONE);
    const [signale] = await api.adminListFlaggedReviews();
    const arbitre = await api.adminResolveReview(signale.id, 'remove');

    expect(arbitre.status).toBe('rejected');
    expect(arbitre.moderated_at).toBeTruthy();
    // Retiré du public, mais conservé pour traçabilité
    expect(await api.getSalleReviews('salle-003', {})).toHaveLength(0);
  });
});

describe('multi-salles (§12 Phase 4)', () => {
  const SALLE_2 = 'salle-002';
  const AUTRE_PRO_SALLE = 'salle-003';

  it('liste les salles du propriétaire connecté', async () => {
    await loginAs(PRO_PHONE);
    const miennes = await api.proListSalles();
    expect(miennes.map((s) => s.id)).toEqual([SALLE, SALLE_2]);
  });

  it('ne liste que les siennes', async () => {
    await loginAs('0555 10 00 03');
    const miennes = await api.proListSalles();
    expect(miennes.map((s) => s.id)).toEqual([AUTRE_PRO_SALLE]);
  });

  it('sépare les tableaux de bord de deux salles', async () => {
    await loginAs(PRO_PHONE);
    const a = await api.proGetDashboard(SALLE);
    const b = await api.proGetDashboard(SALLE_2);

    expect(a.salle.id).toBe(SALLE);
    expect(b.salle.id).toBe(SALLE_2);
    // Toutes les réservations du jeu de démo portent sur la première salle
    expect(a.pendingCount).toBe(2);
    expect(b.pendingCount).toBe(0);
  });

  it('sépare les plannings', async () => {
    await loginAs(PRO_PHONE);
    const today = new Date();
    const p1 = await api.proGetPlanning(SALLE, today.getFullYear(), today.getMonth());
    const p2 = await api.proGetPlanning(SALLE_2, today.getFullYear(), today.getMonth());

    expect(p1.salleName).toBe('Salle El Widad');
    expect(p2.salleName).toBe('Espace Andalous');
    expect(Object.keys(p2.byDay)).toHaveLength(0);
  });

  it('refuse l’accès à la salle d’un autre propriétaire', async () => {
    await loginAs(PRO_PHONE);
    await expect(api.proGetDashboard(AUTRE_PRO_SALLE)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    await expect(api.proGetSalle(AUTRE_PRO_SALLE)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(api.proListReservations(AUTRE_PRO_SALLE)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('refuse de bloquer un jour chez un autre', async () => {
    await loginAs(PRO_PHONE);
    await expect(api.proToggleBlockedDay(AUTRE_PRO_SALLE, addDays(T, 60))).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('retombe sur la première salle sans identifiant', async () => {
    await loginAs(PRO_PHONE);
    const data = await api.proGetDashboard();
    expect(data.salle.id).toBe(SALLE);
  });

  it('modifie chaque salle indépendamment', async () => {
    await loginAs(PRO_PHONE);
    await api.proUpdateSalle(SALLE_2, { name: 'Espace Andalous — Rénové' });

    expect((await api.proGetSalle(SALLE_2)).name).toBe('Espace Andalous — Rénové');
    expect((await api.proGetSalle(SALLE)).name).toBe('Salle El Widad');
  });

  it('facture le propriétaire, pas la salle', async () => {
    await loginAs(PRO_PHONE);
    const sub = await api.getSubscription();

    // Un seul abonnement, bien qu'il gère deux salles
    expect(sub.pro_id).toBe('user-pro-001');
    expect(sub.salle_id).toBeNull();
    expect(sub.amount).toBe(5200);
  });

  it('n’ouvre pas un second essai en ajoutant une salle', async () => {
    await loginAs(PRO_PHONE);
    const avant = await api.getSubscription();

    await api.registerSalle({
      name: 'Troisième salle',
      city: 'Alger',
      capacity_max: 150,
      tarifs: [{ name: 'Location', price: 20000 }],
    });

    const apres = await api.getSubscription();
    expect(apres.id).toBe(avant.id);
    expect(apres.trial_ends_at).toBe(avant.trial_ends_at);
    expect((await api.proListSalles())).toHaveLength(3);
  });
});

describe('codes promotionnels (§12 Phase 4)', () => {
  const demande = (day, extra = {}) => ({
    salle_id: SALLE,
    event_date: day,
    event_type: 'mariage',
    guest_count: 200,
    formula_id: 'tarif-salle-001-1',
    client_name: 'Amina Cherif',
    client_phone: CLIENT_PHONE,
    ...extra,
  });

  it('rend la remise sans rien consommer', async () => {
    await loginAs(CLIENT_PHONE);
    const avant = await api.checkPromoCode(SALLE, 'RENTREE10', 35000);
    expect(avant).toMatchObject({ code: 'RENTREE10', discount: 3500, total: 31500 });

    // Deux aperçus de suite ne doivent pas entamer le quota
    await api.checkPromoCode(SALLE, 'RENTREE10', 35000);
    await loginAs(PRO_PHONE);
    const codes = await api.proListPromoCodes(SALLE);
    expect(codes.find((c) => c.code === 'RENTREE10').used_count).toBe(3);
  });

  it('accepte le code quelle que soit la casse saisie', async () => {
    await loginAs(CLIENT_PHONE);
    expect((await api.checkPromoCode(SALLE, ' rentree10 ', 35000)).discount).toBe(3500);
  });

  it('refuse un code d’une autre salle', async () => {
    await loginAs(CLIENT_PHONE);
    // ANDALOUS20 appartient à salle-002
    await expect(api.checkPromoCode(SALLE, 'ANDALOUS20', 35000)).rejects.toMatchObject({
      reason: 'unknown',
    });
  });

  it('refuse un code épuisé', async () => {
    await loginAs(CLIENT_PHONE);
    await expect(api.checkPromoCode(SALLE, 'PRINTEMPS', 35000)).rejects.toMatchObject({
      code: 'PROMO_REFUSED',
    });
  });

  it('applique la remise au montant de la réservation', async () => {
    await loginAs(CLIENT_PHONE);
    const resa = await api.createReservation(demande(addDays(T, 150), { promo_code: 'RENTREE10' }));
    expect(resa.discount_amount).toBe(3500);
    expect(resa.total_amount).toBe(31500);
    expect(resa.promo_code).toBe('RENTREE10');
  });

  it('consomme une utilisation à la demande', async () => {
    await loginAs(PRO_PHONE);
    const avant = (await api.proListPromoCodes(SALLE)).find((c) => c.code === 'RENTREE10').used_count;

    await loginAs(CLIENT_PHONE);
    await api.createReservation(demande(addDays(T, 151), { promo_code: 'RENTREE10' }));

    await loginAs(PRO_PHONE);
    const apres = (await api.proListPromoCodes(SALLE)).find((c) => c.code === 'RENTREE10').used_count;
    expect(apres).toBe(avant + 1);
  });

  /**
   * Sans restitution, quelques demandes créées puis annulées suffiraient à
   * épuiser un code pour tout le monde.
   */
  it('rend l’utilisation quand la demande est annulée', async () => {
    await loginAs(CLIENT_PHONE);
    const resa = await api.createReservation(demande(addDays(T, 152), { promo_code: 'RENTREE10' }));

    await loginAs(PRO_PHONE);
    const pendant = (await api.proListPromoCodes(SALLE)).find((c) => c.code === 'RENTREE10').used_count;

    await loginAs(CLIENT_PHONE);
    await api.cancelReservation(resa.id);

    await loginAs(PRO_PHONE);
    const apres = (await api.proListPromoCodes(SALLE)).find((c) => c.code === 'RENTREE10').used_count;
    expect(apres).toBe(pendant - 1);
  });

  it('refuse la demande si le code est devenu invalide entre-temps', async () => {
    await loginAs(CLIENT_PHONE);
    await expect(
      api.createReservation(demande(addDays(T, 153), { promo_code: 'PRINTEMPS' }))
    ).rejects.toMatchObject({ code: 'PROMO_REFUSED' });
  });

  it('laisse la demande passer sans code', async () => {
    await loginAs(CLIENT_PHONE);
    const resa = await api.createReservation(demande(addDays(T, 154)));
    expect(resa.discount_amount).toBe(0);
    expect(resa.total_amount).toBe(35000);
  });

  it('crée un code et le rend utilisable aussitôt', async () => {
    await loginAs(PRO_PHONE);
    await api.proCreatePromoCode(SALLE, { code: 'nouveau25', kind: 'percent', value: 25 });

    await loginAs(CLIENT_PHONE);
    expect((await api.checkPromoCode(SALLE, 'NOUVEAU25', 40000)).discount).toBe(10000);
  });

  it('refuse deux fois le même code sur une salle', async () => {
    await loginAs(PRO_PHONE);
    await expect(
      api.proCreatePromoCode(SALLE, { code: 'RENTREE10', kind: 'percent', value: 5 })
    ).rejects.toMatchObject({ code: 'PROMO_DUPLICATE' });
  });

  it('accepte le même code sur deux salles différentes', async () => {
    await loginAs(PRO_PHONE);
    const cree = await api.proCreatePromoCode('salle-002', {
      code: 'RENTREE10',
      kind: 'amount',
      value: 2000,
    });
    expect(cree.salle_id).toBe('salle-002');
  });

  it('refuse une saisie invalide en nommant la raison', async () => {
    await loginAs(PRO_PHONE);
    await expect(
      api.proCreatePromoCode(SALLE, { code: 'XX', kind: 'percent', value: 10 })
    ).rejects.toMatchObject({ reason: 'code_too_short' });
    await expect(
      api.proCreatePromoCode(SALLE, { code: 'TROPCHER', kind: 'percent', value: 150 })
    ).rejects.toMatchObject({ reason: 'percent_over_100' });
  });

  it('désactive un code plutôt que de le supprimer s’il a servi', async () => {
    await loginAs(PRO_PHONE);
    const resultat = await api.proDeletePromoCode('promo-001');
    expect(resultat).toEqual({ deleted: false, deactivated: true });
    expect((await api.proListPromoCodes(SALLE)).find((c) => c.id === 'promo-001').active).toBe(false);
  });

  it('supprime un code jamais utilisé', async () => {
    await loginAs(PRO_PHONE);
    const cree = await api.proCreatePromoCode(SALLE, { code: 'JAMAIS', kind: 'percent', value: 5 });
    expect(await api.proDeletePromoCode(cree.id)).toEqual({ deleted: true, deactivated: false });
    expect((await api.proListPromoCodes(SALLE)).some((c) => c.id === cree.id)).toBe(false);
  });

  it('empêche un propriétaire de toucher au code d’un autre', async () => {
    await loginAs('0555 10 00 03'); // propriétaire de salle-003
    await expect(api.proUpdatePromoCode('promo-001', { active: false })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    await expect(api.proListPromoCodes(SALLE)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});

describe('parrainage entre propriétaires (§12 Phase 4)', () => {
  const ADMIN = '0555 00 00 00';
  const NOUVEAU = '0555 77 88 99';

  /** Inscrit un nouveau propriétaire, éventuellement parrainé. */
  const inscrire = async (phone, referral) => {
    await loginAs(phone);
    return api.registerSalle({
      name: 'Salle du filleul',
      city: 'Alger',
      capacity_max: 200,
      pin: '1234',
      tarifs: [{ name: 'Formule', price: 40000 }],
      ...(referral ? { referral_code: referral } : {}),
    });
  };

  it('donne un code à chaque propriétaire', async () => {
    await loginAs(PRO_PHONE);
    const r = await api.getReferralSummary();
    expect(r.code).toMatch(/^[2-9A-HJ-NP-Z]{6}$/);
    expect(r.filleuls).toEqual([]);
  });

  it('accepte un code existant à l’inscription', async () => {
    await loginAs(PRO_PHONE);
    const { code } = await api.getReferralSummary();

    await inscrire(NOUVEAU, code);

    await loginAs(PRO_PHONE);
    const r = await api.getReferralSummary();
    expect(r.filleuls).toHaveLength(1);
    expect(r.pendingCount).toBe(1);
  });

  /**
   * La récompense attend la validation par l'admin : sans ce délai, quelques
   * comptes fictifs suffiraient à s'offrir des mois d'abonnement.
   */
  it('ne récompense pas avant la validation de la salle', async () => {
    await loginAs(PRO_PHONE);
    const { code } = await api.getReferralSummary();
    const avant = (await api.getSubscription()).trial_ends_at;

    await inscrire(NOUVEAU, code);

    await loginAs(PRO_PHONE);
    expect((await api.getSubscription()).trial_ends_at).toBe(avant);
    expect((await api.getReferralSummary()).daysEarned).toBe(0);
  });

  it('récompense les deux comptes quand la salle est validée', async () => {
    await loginAs(PRO_PHONE);
    const { code } = await api.getReferralSummary();
    const echeanceParrain = (await api.getSubscription()).trial_ends_at;

    const { salle } = await inscrire(NOUVEAU, code);
    const echeanceFilleul = (await api.getSubscription()).trial_ends_at;

    await loginAs(ADMIN);
    await api.adminReviewSalle(salle.id, true);

    await loginAs(PRO_PHONE);
    const parrain = await api.getReferralSummary();
    expect(parrain.daysEarned).toBe(30);
    expect(parrain.filleuls[0].status).toBe('rewarded');
    expect((await api.getSubscription()).trial_ends_at).toBe(addDays(echeanceParrain, 30));

    await loginAs(NOUVEAU);
    expect((await api.getSubscription()).trial_ends_at).toBe(addDays(echeanceFilleul, 30));
  });

  it('ne récompense pas une salle refusée', async () => {
    await loginAs(PRO_PHONE);
    const { code } = await api.getReferralSummary();
    const { salle } = await inscrire(NOUVEAU, code);

    await loginAs(ADMIN);
    await api.adminReviewSalle(salle.id, false);

    await loginAs(PRO_PHONE);
    expect((await api.getReferralSummary()).daysEarned).toBe(0);
  });

  it('ne verse la récompense qu’une fois', async () => {
    await loginAs(PRO_PHONE);
    const { code } = await api.getReferralSummary();
    const { salle } = await inscrire(NOUVEAU, code);

    await loginAs(ADMIN);
    await api.adminReviewSalle(salle.id, true);
    // Une salle peut être dépubliée puis republiée : la récompense ne doit
    // pas repartir à chaque passage.
    await api.adminReviewSalle(salle.id, false);
    await api.adminReviewSalle(salle.id, true);

    await loginAs(PRO_PHONE);
    expect((await api.getReferralSummary()).daysEarned).toBe(30);
  });

  it('refuse un code inconnu', async () => {
    await loginAs(NOUVEAU);
    await expect(api.checkReferralCode('ZZZZZZ')).rejects.toMatchObject({ reason: 'unknown' });
  });

  it('refuse l’auto-parrainage', async () => {
    await loginAs(PRO_PHONE);
    const { code } = await api.getReferralSummary();
    await expect(api.checkReferralCode(code)).rejects.toMatchObject({ reason: 'self' });
  });

  it('nomme le parrain quand le code est valide', async () => {
    await loginAs(PRO_PHONE);
    const { code } = await api.getReferralSummary();
    await loginAs(NOUVEAU);
    expect(await api.checkReferralCode(code)).toMatchObject({ referrer_name: 'Karim Belkacem' });
  });

  it('prévient le parrain de sa récompense', async () => {
    await loginAs(PRO_PHONE);
    const { code } = await api.getReferralSummary();
    const { salle } = await inscrire(NOUVEAU, code);

    await loginAs(ADMIN);
    await api.adminReviewSalle(salle.id, true);

    await loginAs(PRO_PHONE);
    const notifs = await api.listNotifications();
    expect(notifs.some((n) => n.type === 'referral_rewarded')).toBe(true);
  });
});

describe('traiteurs et halouadjis (§13)', () => {
  const TRAITEUR_PHONE = '0555 10 00 12';
  const HALOUADJI_PHONE = '0555 10 00 13';
  const ADMIN = '0555 00 00 00';

  it('ne liste que les fiches actives', async () => {
    const traiteurs = await api.listTraiteurs({});
    expect(traiteurs.every((t) => t.id)).toBe(true);
    expect(traiteurs.some((t) => t.id === 'traiteur-001')).toBe(true);

    const halouadjis = await api.listHalouadjis({});
    expect(halouadjis.some((h) => h.id === 'halouadji-001')).toBe(true);
  });

  it('filtre par ville et par recherche texte', async () => {
    expect(await api.listTraiteurs({ city: 'Tizi Ouzou' })).toHaveLength(1);
    expect(await api.listTraiteurs({ query: 'kabylie' })).toHaveLength(1);
  });

  it('inscrit un nouveau traiteur en attente de validation', async () => {
    await loginAs(CLIENT_PHONE);
    const { partner, user } = await api.registerTraiteur({
      name: 'Chez Nadia',
      city: 'Sétif',
      description: 'Traiteur familial',
      specialites: ['cuisine_algerienne'],
      prix_min: 1500,
      prix_max: 3000,
    });

    expect(partner.status).toBe('pending');
    expect(user.role).toBe('pro');
    // Pas encore visible côté client tant qu'il n'est pas validé.
    expect((await api.listTraiteurs({ city: 'Sétif' })).some((t) => t.id === partner.id)).toBe(false);

    // §10.3 — même règle d'abonnement qu'une salle : un essai est ouvert.
    // §13 — mais pas le même tarif : 4200 DA pour un traiteur, ni les
    // 5200 DA d'une salle, ni les 2100 DA d'un halouadji.
    const sub = await api.getSubscription();
    expect(sub.status).toBe('trial');
    expect(sub.amount).toBe(4200);
  });

  it('rejette une demande de devis sans destinataire ou avec les deux', async () => {
    await loginAs(CLIENT_PHONE);
    await expect(api.createDevisRequest({ eventDate: T, guestCount: 100 })).rejects.toThrow(
      'INVALID_PARTNER'
    );
    await expect(
      api.createDevisRequest({ traiteurId: 'traiteur-001', halouadjiId: 'halouadji-001' })
    ).rejects.toThrow('INVALID_PARTNER');
  });

  it('envoie une demande de devis et prévient le professionnel', async () => {
    await loginAs(CLIENT_PHONE);
    const devis = await api.createDevisRequest({
      halouadjiId: 'halouadji-001',
      eventDate: addDays(T, 30),
      guestCount: 150,
      message: 'Pièce montée pour 150 personnes',
    });
    expect(devis.status).toBe('pending');

    await loginAs(HALOUADJI_PHONE);
    const notifs = await api.listNotifications();
    expect(notifs.some((n) => n.type === 'new_devis_request')).toBe(true);

    const recues = await api.proListDevisRequests('halouadji', 'halouadji-001');
    expect(recues.some((d) => d.id === devis.id)).toBe(true);
  });

  it('refuse qu’un autre professionnel réponde à une demande', async () => {
    await loginAs(CLIENT_PHONE);
    const devis = await api.createDevisRequest({ traiteurId: 'traiteur-001', eventDate: T });

    await loginAs(HALOUADJI_PHONE);
    await expect(api.respondDevisRequest(devis.id, 'accepted')).rejects.toThrow('FORBIDDEN');
  });

  it('accepte une demande et prévient le client', async () => {
    await loginAs(CLIENT_PHONE);
    const devis = await api.createDevisRequest({ traiteurId: 'traiteur-001', eventDate: T });

    await loginAs(TRAITEUR_PHONE);
    const reponse = await api.respondDevisRequest(devis.id, 'accepted', '3500 DA tout compris');
    expect(reponse.status).toBe('accepted');
    expect(reponse.pro_reply).toBe('3500 DA tout compris');

    await loginAs(CLIENT_PHONE);
    const notifs = await api.listNotifications();
    expect(notifs.some((n) => n.type === 'devis_accepted')).toBe(true);
  });

  it('empêche de répondre deux fois à la même demande', async () => {
    await loginAs(CLIENT_PHONE);
    const devis = await api.createDevisRequest({ traiteurId: 'traiteur-001', eventDate: T });

    await loginAs(TRAITEUR_PHONE);
    await api.respondDevisRequest(devis.id, 'accepted');
    await expect(api.respondDevisRequest(devis.id, 'declined')).rejects.toThrow(
      'DEVIS_ALREADY_ANSWERED'
    );
  });

  it('liste les fiches en attente pour l’administrateur, tous types confondus', async () => {
    await loginAs(CLIENT_PHONE);
    const { partner } = await api.registerTraiteur({ name: 'Chez Nadia', city: 'Sétif' });

    await loginAs(ADMIN);
    const attente = await api.adminListPendingPartners();
    expect(attente.some((p) => p.id === partner.id && p.type === 'traiteur')).toBe(true);
  });

  it('publie la fiche validée et prévient son propriétaire', async () => {
    await loginAs(CLIENT_PHONE);
    const { partner } = await api.registerHalouadji({ name: 'Chez Nadia', city: 'Sétif' });

    await loginAs(ADMIN);
    const publiee = await api.adminReviewPartner('halouadji', partner.id, true);
    expect(publiee.status).toBe('active');
    expect((await api.listHalouadjis({ city: 'Sétif' })).some((h) => h.id === partner.id)).toBe(true);

    await loginAs(CLIENT_PHONE);
    const notifs = await api.listNotifications();
    expect(notifs.some((n) => n.type === 'partner_approved')).toBe(true);
  });
});
