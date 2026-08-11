const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

test('administration', async (t) => {
  await h.startServer();
  await h.resetDb();
  t.after(() => h.stopServer());

  await t.test('interdit tout acces admin aux autres roles', async () => {
    const client = await h.createClient();
    const transporter = await h.createTransporter();

    for (const route of ['/admin/stats', '/admin/transporters', '/admin/trips', '/admin/users']) {
      assert.equal((await h.api('GET', route, { token: client.token })).status, 403, route);
      assert.equal((await h.api('GET', route, { token: transporter.token })).status, 403, route);
    }
  });

  await t.test('liste les transporteurs en attente', async () => {
    const admin = await h.createAdmin();
    const pending = await h.createTransporter({ verified: false });

    const { status, body } = await h.api('GET', '/admin/transporters?status=PENDING', {
      token: admin.token,
    });

    assert.equal(status, 200);
    const found = body.items.find((item) => item.id === pending.profileId);
    assert.ok(found);
    assert.equal(found.verificationStatus, 'PENDING');
    assert.ok(found.user.email);
  });

  await t.test('exige un motif pour refuser un dossier', async () => {
    const admin = await h.createAdmin();
    const transporter = await h.createTransporter({ verified: false });

    const withoutReason = await h.api('PATCH', '/admin/verify-transporter', {
      token: admin.token,
      body: { transporterId: transporter.profileId, status: 'REJECTED' },
    });
    assert.equal(withoutReason.status, 400);

    const withReason = await h.api('PATCH', '/admin/verify-transporter', {
      token: admin.token,
      body: { transporterId: transporter.profileId, status: 'REJECTED', reason: 'RC illisible' },
    });
    assert.equal(withReason.status, 200);
    assert.equal(withReason.body.verificationStatus, 'REJECTED');
    assert.equal(withReason.body.rejectionReason, 'RC illisible');
  });

  await t.test('la validation ouvre les droits du transporteur', async () => {
    const admin = await h.createAdmin();
    const transporter = await h.createTransporter({ verified: false });
    const truck = await h.createTruck(transporter.token);

    const before = await h.api('PATCH', `/trucks/${truck.id}/position`, {
      token: transporter.token,
      body: { latitude: 36.75, longitude: 3.05 },
    });
    assert.equal(before.status, 403);

    const verified = await h.api('PATCH', '/admin/verify-transporter', {
      token: admin.token,
      body: { transporterId: transporter.profileId, status: 'VERIFIED' },
    });
    assert.equal(verified.body.verificationStatus, 'VERIFIED');
    assert.ok(verified.body.verifiedAt);

    const after = await h.api('PATCH', `/trucks/${truck.id}/position`, {
      token: transporter.token,
      body: { latitude: 36.75, longitude: 3.05 },
    });
    assert.equal(after.status, 200);
  });

  await t.test('un refus retire les camions de la carte', async () => {
    const admin = await h.createAdmin();
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const client = await h.createClient();

    const visible = await h.api('GET', '/trucks/available', { token: client.token });
    assert.ok(visible.body.items.some((item) => item.id === truck.id));

    await h.api('PATCH', '/admin/verify-transporter', {
      token: admin.token,
      body: { transporterId: transporter.profileId, status: 'REJECTED', reason: 'Documents expires' },
    });

    const hidden = await h.api('GET', '/trucks/available', { token: client.token });
    assert.ok(!hidden.body.items.some((item) => item.id === truck.id));
  });

  await t.test('previent le transporteur de la decision', async () => {
    const admin = await h.createAdmin();
    const transporter = await h.createTransporter({ verified: false });

    await h.api('PATCH', '/admin/verify-transporter', {
      token: admin.token,
      body: { transporterId: transporter.profileId, status: 'VERIFIED' },
    });

    const { body } = await h.api('GET', '/notifications/list', { token: transporter.token });
    assert.ok(body.items.some((n) => n.type === 'ACCOUNT_VERIFIED'));
  });

  await t.test('agrege des statistiques coherentes', async () => {
    const admin = await h.createAdmin();
    const { status, body } = await h.api('GET', '/admin/stats', { token: admin.token });

    assert.equal(status, 200);
    assert.ok(body.users.total > 0);
    assert.equal(typeof body.transporters.pending, 'number');
    assert.equal(typeof body.trucks.available, 'number');
    assert.equal(typeof body.missions.byStatus, 'object');
    assert.equal(typeof body.missions.completionRate, 'number');
  });

  await t.test('voit les trajets des transporteurs non verifies', async () => {
    const admin = await h.createAdmin();
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const trip = await h.createTrip(transporter.token, truck.id);

    await h.prisma.transporterProfile.update({
      where: { id: transporter.profileId },
      data: { verificationStatus: 'PENDING' },
    });

    const client = await h.createClient();
    const clientView = await h.api('GET', '/trips/list', { token: client.token });
    assert.ok(!clientView.body.items.some((item) => item.id === trip.id));

    const adminView = await h.api('GET', '/admin/trips', { token: admin.token });
    assert.ok(adminView.body.items.some((item) => item.id === trip.id));
  });

  await t.test('desactive puis reactive un compte', async () => {
    const admin = await h.createAdmin();
    const client = await h.createClient();

    const disabled = await h.api('PATCH', `/admin/users/${client.user.id}/active`, {
      token: admin.token,
      body: { isActive: false },
    });
    assert.equal(disabled.status, 200);
    assert.equal(disabled.body.isActive, false);

    const blocked = await h.api('GET', '/auth/me', { token: client.token });
    assert.equal(blocked.status, 401);

    const enabled = await h.api('PATCH', `/admin/users/${client.user.id}/active`, {
      token: admin.token,
      body: { isActive: true },
    });
    assert.equal(enabled.body.isActive, true);
  });

  // Le defaut corrige : le back-office grisait le bouton, mais l'API acceptait
  // la demande. Un administrateur qui se desactivait etait ensuite refuse par
  // requireAuth, donc incapable de revenir en arriere sans acces a la base.
  await t.test('un administrateur ne peut pas se desactiver lui-meme', async () => {
    const admin = await h.createAdmin();

    const refus = await h.api('PATCH', `/admin/users/${admin.user.id}/active`, {
      token: admin.token,
      body: { isActive: false },
    });
    assert.equal(refus.status, 400);
    assert.match(refus.body.error.message, /votre propre compte/i);

    // Et il garde bien la main.
    const toujours = await h.api('GET', '/auth/me', { token: admin.token });
    assert.equal(toujours.status, 200);
  });

  await t.test('un administrateur peut se reactiver lui-meme sans blocage', async () => {
    const admin = await h.createAdmin();

    // La regle ne vise que la desactivation : une reactivation reste inoffensive.
    const { status } = await h.api('PATCH', `/admin/users/${admin.user.id}/active`, {
      token: admin.token,
      body: { isActive: true },
    });
    assert.equal(status, 200);
  });

  await t.test('desactiver un autre administrateur reste possible', async () => {
    const premier = await h.createAdmin();
    const second = await h.createAdmin();

    const { status, body } = await h.api('PATCH', `/admin/users/${second.user.id}/active`, {
      token: premier.token,
      body: { isActive: false },
    });
    assert.equal(status, 200);
    assert.equal(body.isActive, false);

    // Celui qui agit reste actif : la plateforme garde un administrateur.
    const encore = await h.api('GET', '/auth/me', { token: premier.token });
    assert.equal(encore.status, 200);
  });

  // Le detail d'un dossier passait par un parcours de toutes les pages de la
  // liste, faute de route dediee : une requete par centaine de transporteurs.
  await t.test('expose le detail d un transporteur par identifiant', async () => {
    const admin = await h.createAdmin();
    const transporter = await h.createTransporter({ verified: false });

    const { status, body } = await h.api(`GET`, `/admin/transporters/${transporter.profileId}`, {
      token: admin.token,
    });

    assert.equal(status, 200);
    assert.equal(body.id, transporter.profileId);
    // Meme forme que dans la liste : la page de detail s'appuie dessus.
    assert.ok(body.user, 'le responsable est joint');
    assert.ok(Array.isArray(body.documents), 'les documents sont joints');
    assert.equal(typeof body._count.trucks, 'number');
  });

  await t.test('renvoie 404 pour un transporteur inconnu', async () => {
    const admin = await h.createAdmin();

    const { status } = await h.api(
      'GET',
      '/admin/transporters/00000000-0000-4000-8000-000000000000',
      { token: admin.token }
    );
    assert.equal(status, 404);
  });

  await t.test('refuse un identifiant qui n est pas un uuid', async () => {
    const admin = await h.createAdmin();

    const { status } = await h.api('GET', '/admin/transporters/pas-un-uuid', {
      token: admin.token,
    });
    assert.equal(status, 400);
  });

  await t.test('le detail d un transporteur reste ferme aux non-admins', async () => {
    const client = await h.createClient();
    const transporter = await h.createTransporter();

    const { status } = await h.api('GET', `/admin/transporters/${transporter.profileId}`, {
      token: client.token,
    });
    assert.equal(status, 403);
  });
});
