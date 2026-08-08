const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

test('camions et trajets', async (t) => {
  await h.startServer();
  await h.resetDb();
  t.after(() => h.stopServer());

  await t.test('un client ne peut pas creer de camion', async () => {
    const client = await h.createClient();
    const { status } = await h.api('POST', '/trucks/create', {
      token: client.token,
      body: { plateNumber: '16-99999-24', type: 'FOURGON', capacityKg: 1000, volumeM3: 10 },
    });

    assert.equal(status, 403);
  });

  await t.test('un transporteur non verifie ne peut ni publier ni se localiser', async () => {
    const transporter = await h.createTransporter({ verified: false });
    const truck = await h.createTruck(transporter.token);
    assert.ok(truck.id, 'le camion peut etre enregistre avant la verification');

    const position = await h.api('PATCH', `/trucks/${truck.id}/position`, {
      token: transporter.token,
      body: { latitude: 36.75, longitude: 3.05 },
    });
    assert.equal(position.status, 403);

    const trip = await h.api('POST', '/trips/create', {
      token: transporter.token,
      body: {
        truckId: truck.id,
        originCity: 'Alger',
        originLat: 36.7538,
        originLng: 3.0588,
        destinationCity: 'Oran',
        destinationLat: 35.6971,
        destinationLng: -0.6308,
        departureAt: h.tomorrowAt(),
        freeVolumeM3: 10,
        freeWeightKg: 1000,
      },
    });
    assert.equal(trip.status, 403);
  });

  await t.test('un transporteur ne peut pas agir sur le camion d un autre', async () => {
    const owner = await h.createTransporter();
    const intruder = await h.createTransporter();
    const truck = await h.createTruck(owner.token);

    const update = await h.api('PATCH', `/trucks/${truck.id}`, {
      token: intruder.token,
      body: { isAvailable: false },
    });
    assert.equal(update.status, 403);

    const removal = await h.api('DELETE', `/trucks/${truck.id}`, { token: intruder.token });
    assert.equal(removal.status, 403);
  });

  await t.test('refuse un volume libre superieur a la capacite du camion', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token, { volumeM3: 20, capacityKg: 3500 });

    const tooMuchVolume = await h.api('POST', '/trips/create', {
      token: transporter.token,
      body: {
        truckId: truck.id,
        originCity: 'Alger',
        originLat: 36.7538,
        originLng: 3.0588,
        destinationCity: 'Oran',
        destinationLat: 35.6971,
        destinationLng: -0.6308,
        departureAt: h.tomorrowAt(),
        freeVolumeM3: 50,
        freeWeightKg: 1000,
      },
    });
    assert.equal(tooMuchVolume.status, 400);

    const tooMuchWeight = await h.api('POST', '/trips/create', {
      token: transporter.token,
      body: {
        truckId: truck.id,
        originCity: 'Alger',
        originLat: 36.7538,
        originLng: 3.0588,
        destinationCity: 'Oran',
        destinationLat: 35.6971,
        destinationLng: -0.6308,
        departureAt: h.tomorrowAt(),
        freeVolumeM3: 10,
        freeWeightKg: 99000,
      },
    });
    assert.equal(tooMuchWeight.status, 400);
  });

  await t.test('la recherche geographique calcule la distance et exclut le hors rayon', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const trip = await h.createTrip(transporter.token, truck.id);
    const client = await h.createClient();

    const near = await h.api('GET', '/trips/list?latitude=36.75&longitude=3.06&radiusKm=50', {
      token: client.token,
    });
    assert.equal(near.status, 200);
    const found = near.body.items.find((item) => item.id === trip.id);
    assert.ok(found, 'le trajet proche est trouve');
    assert.equal(typeof found.distanceKm, 'number');
    assert.ok(found.distanceKm < 5);

    const far = await h.api('GET', '/trips/list?latitude=19.0&longitude=1.0&radiusKm=10', {
      token: client.token,
    });
    assert.ok(!far.body.items.some((item) => item.id === trip.id));
  });

  await t.test('les filtres volume et marchandise sont appliques', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const trip = await h.createTrip(transporter.token, truck.id, {
      freeVolumeM3: 18,
      goodsTypes: ['Palettes'],
    });
    const client = await h.createClient();

    const tooDemanding = await h.api('GET', '/trips/list?minFreeVolumeM3=500', { token: client.token });
    assert.ok(!tooDemanding.body.items.some((item) => item.id === trip.id));

    const matching = await h.api('GET', '/trips/list?goodsType=Palettes', { token: client.token });
    assert.ok(matching.body.items.some((item) => item.id === trip.id));

    const otherGoods = await h.api('GET', '/trips/list?goodsType=Cereales', { token: client.token });
    assert.ok(!otherGoods.body.items.some((item) => item.id === trip.id));
  });

  await t.test('la carte filtre les camions par ville, type et volume', async () => {
    const alger = await h.createTransporter();
    const oran = await h.createTransporter({ company: { companyName: 'Oran Transport', city: 'Oran' } });
    const algerTruck = await h.createTruck(alger.token, { type: 'FOURGON', volumeM3: 20 });
    const oranTruck = await h.createTruck(oran.token, { type: 'FRIGO', volumeM3: 70, capacityKg: 20000 });
    const client = await h.createClient();

    const byCity = await h.api('GET', '/trucks/available?city=Oran', { token: client.token });
    assert.equal(byCity.status, 200);
    assert.ok(byCity.body.items.some((item) => item.id === oranTruck.id));
    assert.ok(!byCity.body.items.some((item) => item.id === algerTruck.id));

    const byType = await h.api('GET', '/trucks/available?type=FRIGO', { token: client.token });
    assert.ok(byType.body.items.some((item) => item.id === oranTruck.id));
    assert.ok(!byType.body.items.some((item) => item.id === algerTruck.id));

    const byVolume = await h.api('GET', '/trucks/available?minVolumeM3=50', { token: client.token });
    assert.ok(byVolume.body.items.some((item) => item.id === oranTruck.id));
    assert.ok(!byVolume.body.items.some((item) => item.id === algerTruck.id));
  });

  await t.test('les camions des transporteurs non verifies restent hors de la carte', async () => {
    const unverified = await h.createTransporter({ verified: false });
    const truck = await h.createTruck(unverified.token);
    const client = await h.createClient();

    const { body } = await h.api('GET', '/trucks/available', { token: client.token });
    assert.ok(!body.items.some((item) => item.id === truck.id));
  });

  await t.test('un parametre de requete inconnu est rejete', async () => {
    const client = await h.createClient();
    const { status } = await h.api('GET', '/trips/list?parametreInconnu=1', { token: client.token });
    assert.equal(status, 400);
  });

  await t.test('mine=true renvoie uniquement les trajets du transporteur', async () => {
    const mine = await h.createTransporter();
    const other = await h.createTransporter();
    const myTruck = await h.createTruck(mine.token);
    const otherTruck = await h.createTruck(other.token);
    const myTrip = await h.createTrip(mine.token, myTruck.id);
    const otherTrip = await h.createTrip(other.token, otherTruck.id);

    const { body } = await h.api('GET', '/trips/list?mine=true', { token: mine.token });
    assert.ok(body.items.some((item) => item.id === myTrip.id));
    assert.ok(!body.items.some((item) => item.id === otherTrip.id));
  });
});
