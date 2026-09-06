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

  // Le defaut corrige : le volume n'etait verifie qu'a la creation, et plusieurs
  // demandes en attente coexistent sur un meme trajet sans rien consommer. Le
  // transporteur pouvait donc accepter plus de fret que son camion ne porte.
  await t.test('refuse une acceptation qui depasserait la capacite restante', async () => {
    const { transporter, client, truck, trip } = await scenario();
    const commun = { transporterId: transporter.profileId, truckId: truck.id, tripId: trip.id };

    const premiere = await h.createMission(client.token, {
      ...commun,
      volumeM3: 15,
      weightKg: 2000,
    });
    const seconde = await h.createMission(client.token, {
      ...commun,
      volumeM3: 15,
      weightKg: 2000,
    });

    const acceptee = await h.api('PATCH', '/missions/update-status', {
      token: transporter.token,
      body: { missionId: premiere.id, status: 'ACCEPTED' },
    });
    assert.equal(acceptee.status, 200);

    const refusee = await h.api('PATCH', '/missions/update-status', {
      token: transporter.token,
      body: { missionId: seconde.id, status: 'ACCEPTED' },
    });
    assert.equal(refusee.status, 400);
    assert.match(refusee.body.error.message, /capacite insuffisante/i);

    // La capacite ne doit pas etre passee dans le negatif.
    const after = await h.api('GET', `/trips/${trip.id}`, { token: client.token });
    assert.equal(after.body.freeVolumeM3, 3);
    assert.equal(after.body.freeWeightKg, 1000);
  });

  await t.test('une acceptation refusee laisse la mission en attente', async () => {
    const { transporter, client, truck, trip } = await scenario();
    const commun = { transporterId: transporter.profileId, truckId: truck.id, tripId: trip.id };

    const premiere = await h.createMission(client.token, { ...commun, volumeM3: 15, weightKg: 2000 });
    const seconde = await h.createMission(client.token, { ...commun, volumeM3: 15, weightKg: 2000 });

    await h.api('PATCH', '/missions/update-status', {
      token: transporter.token,
      body: { missionId: premiere.id, status: 'ACCEPTED' },
    });
    await h.api('PATCH', '/missions/update-status', {
      token: transporter.token,
      body: { missionId: seconde.id, status: 'ACCEPTED' },
    });

    // Le changement de statut et le decompte partagent la meme transaction :
    // si la capacite manque, la mission ne doit pas rester marquee acceptee.
    const { body } = await h.api('GET', `/missions/${seconde.id}`, { token: client.token });
    assert.equal(body.status, 'PENDING');
    assert.equal(body.acceptedAt, null);
  });

  await t.test('le poids est controle au meme titre que le volume', async () => {
    const { transporter, client, truck, trip } = await scenario();
    const commun = { transporterId: transporter.profileId, truckId: truck.id, tripId: trip.id };

    const premiere = await h.createMission(client.token, { ...commun, volumeM3: 2, weightKg: 2500 });
    const seconde = await h.createMission(client.token, { ...commun, volumeM3: 2, weightKg: 1000 });

    await h.api('PATCH', '/missions/update-status', {
      token: transporter.token,
      body: { missionId: premiere.id, status: 'ACCEPTED' },
    });

    // Le volume passe largement, seule la charge manque.
    const refusee = await h.api('PATCH', '/missions/update-status', {
      token: transporter.token,
      body: { missionId: seconde.id, status: 'ACCEPTED' },
    });
    assert.equal(refusee.status, 400);

    const after = await h.api('GET', `/trips/${trip.id}`, { token: client.token });
    assert.equal(after.body.freeWeightKg, 500);
  });

  await t.test('liberer une place rend la seconde acceptation possible', async () => {
    const { transporter, client, truck, trip } = await scenario();
    const commun = { transporterId: transporter.profileId, truckId: truck.id, tripId: trip.id };

    const premiere = await h.createMission(client.token, { ...commun, volumeM3: 15, weightKg: 2000 });
    const seconde = await h.createMission(client.token, { ...commun, volumeM3: 15, weightKg: 2000 });

    await h.api('PATCH', '/missions/update-status', {
      token: transporter.token,
      body: { missionId: premiere.id, status: 'ACCEPTED' },
    });
    await h.api('PATCH', '/missions/update-status', {
      token: client.token,
      body: { missionId: premiere.id, status: 'CANCELLED', reason: 'Report' },
    });

    const rattrapee = await h.api('PATCH', '/missions/update-status', {
      token: transporter.token,
      body: { missionId: seconde.id, status: 'ACCEPTED' },
    });
    assert.equal(rattrapee.status, 200);

    const after = await h.api('GET', `/trips/${trip.id}`, { token: client.token });
    assert.equal(after.body.freeVolumeM3, 3);
  });

  // La condition est portee par le `where` de l'update, donc evaluee sous le
  // verrou de ligne : deux acceptations simultanees ne peuvent pas la franchir
  // ensemble. Sans cela, les deux lisaient la meme capacite avant d'ecrire.
  await t.test('deux acceptations simultanees ne peuvent pas passer ensemble', async () => {
    const { transporter, client, truck, trip } = await scenario();
    const commun = { transporterId: transporter.profileId, truckId: truck.id, tripId: trip.id };

    const premiere = await h.createMission(client.token, { ...commun, volumeM3: 15, weightKg: 2000 });
    const seconde = await h.createMission(client.token, { ...commun, volumeM3: 15, weightKg: 2000 });

    const [a, b] = await Promise.all([
      h.api('PATCH', '/missions/update-status', {
        token: transporter.token,
        body: { missionId: premiere.id, status: 'ACCEPTED' },
      }),
      h.api('PATCH', '/missions/update-status', {
        token: transporter.token,
        body: { missionId: seconde.id, status: 'ACCEPTED' },
      }),
    ]);

    const reussites = [a, b].filter((r) => r.status === 200);
    assert.equal(reussites.length, 1, 'une seule acceptation aboutit');

    const after = await h.api('GET', `/trips/${trip.id}`, { token: client.token });
    assert.equal(after.body.freeVolumeM3, 3);
    assert.ok(after.body.freeWeightKg >= 0);
  });

  await t.test('une mission sans trajet ne touche pas le trajet, mais decompte le camion', async () => {
    const { transporter, client, truck, trip } = await scenario();

    const mission = await h.createMission(client.token, {
      transporterId: transporter.profileId,
      truckId: truck.id,
      volumeM3: 15,
      weightKg: 2500,
    });

    const accepted = await h.api('PATCH', '/missions/update-status', {
      token: transporter.token,
      body: { missionId: mission.id, status: 'ACCEPTED' },
    });
    assert.equal(accepted.status, 200);

    const afterTrip = await h.api('GET', `/trips/${trip.id}`, { token: client.token });
    assert.equal(afterTrip.body.freeVolumeM3, 18);

    const afterTruck = await h.api('GET', `/trucks/${truck.id}`, { token: client.token });
    assert.equal(afterTruck.body.freeVolumeM3, 5);
    assert.equal(afterTruck.body.freeWeightKg, 1000);
  });

  // Le defaut symetrique de celui deja corrige pour les trajets : le volume
  // d'une mission sans trajet n'etait verifie qu'a la creation, contre la
  // capacite totale du camion, jamais decompte a l'acceptation. Deux demandes
  // de 15 m3 sur un camion de 20 m3 passaient toutes les deux la creation,
  // puis les deux acceptations — le camion se retrouvait engage sur 30 m3
  // pour 20 m3 reels.
  await t.test('refuse une acceptation qui depasserait la capacite libre du camion', async () => {
    const { transporter, client, truck } = await scenario();
    const commun = { transporterId: transporter.profileId, truckId: truck.id };

    const premiere = await h.createMission(client.token, { ...commun, volumeM3: 15, weightKg: 2000 });
    const seconde = await h.createMission(client.token, { ...commun, volumeM3: 15, weightKg: 2000 });

    const acceptee = await h.api('PATCH', '/missions/update-status', {
      token: transporter.token,
      body: { missionId: premiere.id, status: 'ACCEPTED' },
    });
    assert.equal(acceptee.status, 200);

    const refusee = await h.api('PATCH', '/missions/update-status', {
      token: transporter.token,
      body: { missionId: seconde.id, status: 'ACCEPTED' },
    });
    assert.equal(refusee.status, 400);
    assert.match(refusee.body.error.message, /capacite insuffisante sur ce camion/i);

    const after = await h.api('GET', `/trucks/${truck.id}`, { token: client.token });
    assert.equal(after.body.freeVolumeM3, 5);
    assert.equal(after.body.freeWeightKg, 1500);
  });

  await t.test('deux acceptations simultanees sur le meme camion ne peuvent pas passer ensemble', async () => {
    const { transporter, client, truck } = await scenario();
    const commun = { transporterId: transporter.profileId, truckId: truck.id };

    const premiere = await h.createMission(client.token, { ...commun, volumeM3: 15, weightKg: 2000 });
    const seconde = await h.createMission(client.token, { ...commun, volumeM3: 15, weightKg: 2000 });

    const [a, b] = await Promise.all([
      h.api('PATCH', '/missions/update-status', {
        token: transporter.token,
        body: { missionId: premiere.id, status: 'ACCEPTED' },
      }),
      h.api('PATCH', '/missions/update-status', {
        token: transporter.token,
        body: { missionId: seconde.id, status: 'ACCEPTED' },
      }),
    ]);

    const reussites = [a, b].filter((r) => r.status === 200);
    assert.equal(reussites.length, 1, 'une seule acceptation aboutit');

    const after = await h.api('GET', `/trucks/${truck.id}`, { token: client.token });
    assert.equal(after.body.freeVolumeM3, 5);
    assert.ok(after.body.freeWeightKg >= 0);
  });

  await t.test('annuler une mission sans trajet restitue la capacite du camion', async () => {
    const { transporter, client, truck } = await scenario();
    const mission = await h.createMission(client.token, {
      transporterId: transporter.profileId,
      truckId: truck.id,
      volumeM3: 15,
      weightKg: 2000,
    });

    await h.api('PATCH', '/missions/update-status', {
      token: transporter.token,
      body: { missionId: mission.id, status: 'ACCEPTED' },
    });
    await h.api('PATCH', '/missions/update-status', {
      token: client.token,
      body: { missionId: mission.id, status: 'CANCELLED', reason: 'Report' },
    });

    const after = await h.api('GET', `/trucks/${truck.id}`, { token: client.token });
    assert.equal(after.body.freeVolumeM3, 20);
    assert.equal(after.body.freeWeightKg, 3500);
  });

  await t.test('refuse une creation de mission sans trajet depassant la capacite libre du camion', async () => {
    const { transporter, client, truck } = await scenario();
    const commun = { transporterId: transporter.profileId, truckId: truck.id };

    const premiere = await h.createMission(client.token, { ...commun, volumeM3: 15, weightKg: 2000 });
    await h.api('PATCH', '/missions/update-status', {
      token: transporter.token,
      body: { missionId: premiere.id, status: 'ACCEPTED' },
    });

    // Le camion n'a plus que 5 m3 libres ; une nouvelle demande de 10 m3 tient
    // dans sa capacite totale (20) mais pas dans ce qu'il lui reste.
    const { status } = await h.api('POST', '/missions/create', {
      token: client.token,
      body: {
        transporterId: transporter.profileId,
        truckId: truck.id,
        goodsType: 'Palettes',
        volumeM3: 10,
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
