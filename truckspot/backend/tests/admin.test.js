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
});
