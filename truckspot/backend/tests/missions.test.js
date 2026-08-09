const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

test('missions', async (t) => {
  await h.startServer();
  await h.resetDb();
  t.after(() => h.stopServer());

  // Each case works on its own transporter/client/trip triplet so the capacity
  // assertions stay independent of execution order.
  async function scenario() {
    const transporter = await h.createTransporter();
    const client = await h.createClient();
    const truck = await h.createTruck(transporter.token);
    const trip = await h.createTrip(transporter.token, truck.id, {
      freeVolumeM3: 18,
      freeWeightKg: 3000,
    });
    return { transporter, client, truck, trip };
  }

  await t.test('un client cree une mission en attente', async () => {
    const { transporter, client, truck, trip } = await scenario();
    const mission = await h.createMission(client.token, {
      transporterId: transporter.profileId,
      truckId: truck.id,
      tripId: trip.id,
    });

    assert.equal(mission.status, 'PENDING');
    assert.equal(mission.clientId, client.user.id);
  });

  await t.test('refuse une mission depassant la capacite libre du trajet', async () => {
    const { transporter, client, truck, trip } = await scenario();
    const { status } = await h.api('POST', '/missions/create', {
      token: client.token,
      body: {
        transporterId: transporter.profileId,
        truckId: truck.id,
        tripId: trip.id,
        goodsType: 'Palettes',
        volumeM3: 100,
        weightKg: 500,
        pickupCity: 'Alger',
        pickupLat: 36.7538,
        pickupLng: 3.0588,
        pickupAt: h.tomorrowAt(),
        dropoffCity: 'Oran',
        dropoffLat: 35.6971,
        dropoffLng: -0.6308,
      },
    });

    assert.equal(status, 400);
  });

  await t.test('refuse une mission vers un transporteur non verifie', async () => {
    const unverified = await h.createTransporter({ verified: false });
    const client = await h.createClient();

    const { status } = await h.api('POST', '/missions/create', {
      token: client.token,
      body: {
        transporterId: unverified.user.transporter.id,
        goodsType: 'Palettes',
        volumeM3: 5,
        weightKg: 800,
        pickupCity: 'Alger',
        pickupLat: 36.7538,
        pickupLng: 3.0588,
        pickupAt: h.tomorrowAt(),
        dropoffCity: 'Oran',
        dropoffLat: 35.6971,
        dropoffLng: -0.6308,
      },
    });

    assert.equal(status, 400);
  });

  await t.test('un transporteur ne peut pas emettre de mission', async () => {
    const { transporter } = await scenario();
    const { status } = await h.api('POST', '/missions/create', {
      token: transporter.token,
      body: {
        transporterId: transporter.profileId,
        goodsType: 'Palettes',
        volumeM3: 5,
        weightKg: 800,
        pickupCity: 'Alger',
        pickupLat: 36.7538,
        pickupLng: 3.0588,
        pickupAt: h.tomorrowAt(),
        dropoffCity: 'Oran',
        dropoffLat: 35.6971,
        dropoffLng: -0.6308,
      },
    });

    assert.equal(status, 403);
  });

  await t.test('chaque partie voit la mission dans sa liste', async () => {
    const { transporter, client, truck, trip } = await scenario();
    const mission = await h.createMission(client.token, {
      transporterId: transporter.profileId,
      truckId: truck.id,
      tripId: trip.id,
    });

    const clientList = await h.api('GET', '/missions/list', { token: client.token });
    const transporterList = await h.api('GET', '/missions/list', { token: transporter.token });

    assert.ok(clientList.body.items.some((m) => m.id === mission.id));
    assert.ok(transporterList.body.items.some((m) => m.id === mission.id));
  });

  await t.test('un tiers ne peut ni lire la mission ni sa conversation', async () => {
    const { transporter, client, truck, trip } = await scenario();
    const mission = await h.createMission(client.token, {
      transporterId: transporter.profileId,
      truckId: truck.id,
      tripId: trip.id,
    });
    const outsider = await h.createClient();

    assert.equal((await h.api('GET', `/missions/${mission.id}`, { token: outsider.token })).status, 403);
    assert.equal(
      (await h.api('GET', `/chat/history?missionId=${mission.id}`, { token: outsider.token })).status,
      403
    );
    assert.equal(
      (
        await h.api('POST', '/chat/send', {
          token: outsider.token,
          body: { missionId: mission.id, content: 'intrusion' },
        })
      ).status,
      403
    );

    const outsiderList = await h.api('GET', '/missions/list', { token: outsider.token });
    assert.ok(!outsiderList.body.items.some((m) => m.id === mission.id));
  });

  await t.test('seul le transporteur accepte, seul le client annule', async () => {
    const { transporter, client, truck, trip } = await scenario();
    const mission = await h.createMission(client.token, {
      transporterId: transporter.profileId,
      truckId: truck.id,
      tripId: trip.id,
    });

    const clientAccepts = await h.api('PATCH', '/missions/update-status', {
      token: client.token,
      body: { missionId: mission.id, status: 'ACCEPTED' },
    });
    assert.equal(clientAccepts.status, 403);

    const transporterCancels = await h.api('PATCH', '/missions/update-status', {
      token: transporter.token,
      body: { missionId: mission.id, status: 'CANCELLED' },
    });
    assert.equal(transporterCancels.status, 403);
  });

  await t.test('refuse une transition de statut illegale', async () => {
    const { transporter, client, truck, trip } = await scenario();
    const mission = await h.createMission(client.token, {
      transporterId: transporter.profileId,
      truckId: truck.id,
      tripId: trip.id,
    });

    const skipAhead = await h.api('PATCH', '/missions/update-status', {
      token: transporter.token,
      body: { missionId: mission.id, status: 'COMPLETED' },
    });
    assert.equal(skipAhead.status, 400);
  });

  await t.test('accepter decremente la capacite libre du trajet', async () => {
    const { transporter, client, truck, trip } = await scenario();
    const mission = await h.createMission(client.token, {
      transporterId: transporter.profileId,
      truckId: truck.id,
      tripId: trip.id,
      volumeM3: 5,
      weightKg: 800,
    });

    const accepted = await h.api('PATCH', '/missions/update-status', {
      token: transporter.token,
      body: { missionId: mission.id, status: 'ACCEPTED' },
    });
    assert.equal(accepted.status, 200);
    assert.equal(accepted.body.status, 'ACCEPTED');
    assert.ok(accepted.body.acceptedAt);

    const after = await h.api('GET', `/trips/${trip.id}`, { token: client.token });
    assert.equal(after.body.freeVolumeM3, 13);
    assert.equal(after.body.freeWeightKg, 2200);
  });

  await t.test('annuler apres acceptation restitue la capacite', async () => {
    const { transporter, client, truck, trip } = await scenario();
    const mission = await h.createMission(client.token, {
      transporterId: transporter.profileId,
      truckId: truck.id,
      tripId: trip.id,
      volumeM3: 5,
      weightKg: 800,
    });

    await h.api('PATCH', '/missions/update-status', {
      token: transporter.token,
      body: { missionId: mission.id, status: 'ACCEPTED' },
    });
    await h.api('PATCH', '/missions/update-status', {
      token: client.token,
      body: { missionId: mission.id, status: 'CANCELLED', reason: 'Report' },
    });

    const after = await h.api('GET', `/trips/${trip.id}`, { token: client.token });
    assert.equal(after.body.freeVolumeM3, 18);
    assert.equal(after.body.freeWeightKg, 3000);
  });

  await t.test('annuler avant acceptation ne modifie pas la capacite', async () => {
    const { transporter, client, truck, trip } = await scenario();
    const mission = await h.createMission(client.token, {
      transporterId: transporter.profileId,
      truckId: truck.id,
      tripId: trip.id,
    });

    await h.api('PATCH', '/missions/update-status', {
      token: client.token,
      body: { missionId: mission.id, status: 'CANCELLED' },
    });

    const after = await h.api('GET', `/trips/${trip.id}`, { token: client.token });
    assert.equal(after.body.freeVolumeM3, 18);
    assert.equal(after.body.freeWeightKg, 3000);
  });

  await t.test('deroule le cycle complet jusqu a la livraison', async () => {
    const { transporter, client, truck, trip } = await scenario();
    const mission = await h.createMission(client.token, {
      transporterId: transporter.profileId,
      truckId: truck.id,
      tripId: trip.id,
    });

    for (const status of ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED']) {
      const response = await h.api('PATCH', '/missions/update-status', {
        token: transporter.token,
        body: { missionId: mission.id, status },
      });
      assert.equal(response.status, 200, `transition vers ${status}`);
      assert.equal(response.body.status, status);
    }

    const final = await h.api('GET', `/missions/${mission.id}`, { token: client.token });
    assert.ok(final.body.completedAt);
  });

  await t.test('notifie chaque partie aux moments cles', async () => {
    const { transporter, client, truck, trip } = await scenario();
    const mission = await h.createMission(client.token, {
      transporterId: transporter.profileId,
      truckId: truck.id,
      tripId: trip.id,
    });

    const transporterNotifs = await h.api('GET', '/notifications/list', { token: transporter.token });
    assert.ok(transporterNotifs.body.items.some((n) => n.type === 'MISSION_CREATED'));

    await h.api('PATCH', '/missions/update-status', {
      token: transporter.token,
      body: { missionId: mission.id, status: 'ACCEPTED' },
    });

    const clientNotifs = await h.api('GET', '/notifications/list', { token: client.token });
    assert.ok(clientNotifs.body.items.some((n) => n.type === 'MISSION_ACCEPTED'));

    const read = await h.api('PATCH', '/notifications/read-all', { token: client.token });
    assert.equal(read.status, 200);
    const afterRead = await h.api('GET', '/notifications/list?unreadOnly=true', { token: client.token });
    assert.equal(afterRead.body.items.length, 0);
  });
});
