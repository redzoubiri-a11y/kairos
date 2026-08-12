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

  // Le defaut corrige : rien n'expirait une position. Un camion apercu une fois
  // il y a trois semaines restait affiche comme disponible, a une position
  // qu'il avait quittee depuis longtemps.
  await t.test('un camion dont la position a vieilli sort de la carte', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const client = await h.createClient();

    const frais = await h.api('GET', '/trucks/available', { token: client.token });
    assert.ok(frais.body.items.some((item) => item.id === truck.id));

    await h.prisma.truck.update({
      where: { id: truck.id },
      data: { lastPositionAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    });

    const perime = await h.api('GET', '/trucks/available', { token: client.token });
    assert.ok(!perime.body.items.some((item) => item.id === truck.id));
  });

  await t.test('la fenetre de fraicheur est reglable par la requete', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const client = await h.createClient();

    await h.prisma.truck.update({
      where: { id: truck.id },
      data: { lastPositionAt: new Date(Date.now() - 90 * 60 * 1000) },
    });

    const large = await h.api('GET', '/trucks/available?freshWithinMinutes=180', {
      token: client.token,
    });
    assert.ok(large.body.items.some((item) => item.id === truck.id));

    const etroite = await h.api('GET', '/trucks/available?freshWithinMinutes=30', {
      token: client.token,
    });
    assert.ok(!etroite.body.items.some((item) => item.id === truck.id));
  });

  await t.test('une fenetre de fraicheur absurde est refusee', async () => {
    const client = await h.createClient();

    const zero = await h.api('GET', '/trucks/available?freshWithinMinutes=0', {
      token: client.token,
    });
    assert.equal(zero.status, 400);

    const enorme = await h.api('GET', '/trucks/available?freshWithinMinutes=100000', {
      token: client.token,
    });
    assert.equal(enorme.status, 400);
  });

  // Sans cet horodatage a la creation, le camion n'aurait aucun age de position
  // et la fenetre de fraicheur l'ecarterait alors qu'il vient d'etre declare.
  await t.test('un camion declare avec sa position apparait immediatement', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const client = await h.createClient();

    assert.ok(truck.lastPositionAt, 'la position declaree est datee');

    const { body } = await h.api('GET', '/trucks/available', { token: client.token });
    assert.ok(body.items.some((item) => item.id === truck.id));
  });

  await t.test('une position diffusee remet le camion sur la carte', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const client = await h.createClient();

    await h.prisma.truck.update({
      where: { id: truck.id },
      data: { lastPositionAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    });

    const socket = await h.connectSocket(transporter.token);
    try {
      const ack = await h.emitWithAck(socket, 'truck:position', {
        truckId: truck.id,
        latitude: 36.76,
        longitude: 3.06,
      });
      assert.equal(ack.ok, true);
    } finally {
      socket.disconnect();
    }

    const { body } = await h.api('GET', '/trucks/available', { token: client.token });
    assert.ok(body.items.some((item) => item.id === truck.id));
  });

  await t.test('le transporteur voit si son camion est encore sur la carte', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);

    const visible = await h.api('GET', '/trucks/mine', { token: transporter.token });
    assert.equal(visible.body.items.find((t2) => t2.id === truck.id).visibleOnMap, true);

    await h.prisma.truck.update({
      where: { id: truck.id },
      data: { lastPositionAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    });

    const perime = await h.api('GET', '/trucks/mine', { token: transporter.token });
    assert.equal(perime.body.items.find((t2) => t2.id === truck.id).visibleOnMap, false);
  });

  await t.test('un camion mis en indisponible n est plus annonce comme visible', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);

    await h.api('PATCH', `/trucks/${truck.id}`, {
      token: transporter.token,
      body: { isAvailable: false },
    });

    const { body } = await h.api('GET', '/trucks/mine', { token: transporter.token });
    assert.equal(body.items.find((t2) => t2.id === truck.id).visibleOnMap, false);
  });

  await t.test('les camions des transporteurs non verifies restent hors de la carte', async () => {
    const unverified = await h.createTransporter({ verified: false });
    const truck = await h.createTruck(unverified.token);
    const client = await h.createClient();

    const { body } = await h.api('GET', '/trucks/available', { token: client.token });
    assert.ok(!body.items.some((item) => item.id === truck.id));
  });

  // Le defaut corrige : aucun travail de fond ne fait vieillir un trajet. Un
  // depart declare pour le 12 aout restait propose en septembre, et le client
  // envoyait une mission sur un trajet parti depuis longtemps.
  await t.test('un trajet dont le depart est passe sort de la recherche', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const trip = await h.createTrip(transporter.token, truck.id);
    const client = await h.createClient();

    const avant = await h.api('GET', '/trips/list', { token: client.token });
    assert.ok(avant.body.items.some((item) => item.id === trip.id));

    await h.prisma.trip.update({
      where: { id: trip.id },
      data: { departureAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    });

    const apres = await h.api('GET', '/trips/list', { token: client.token });
    assert.ok(!apres.body.items.some((item) => item.id === trip.id));
  });

  // Le transporteur a explicitement declare qu'il roulait : sa capacite libre
  // reste reservable en cours de route.
  await t.test('un trajet en cours reste propose malgre un depart passe', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const trip = await h.createTrip(transporter.token, truck.id);
    const client = await h.createClient();

    await h.prisma.trip.update({
      where: { id: trip.id },
      data: {
        departureAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        status: 'IN_PROGRESS',
      },
    });

    const { body } = await h.api('GET', '/trips/list', { token: client.token });
    assert.ok(body.items.some((item) => item.id === trip.id));
  });

  await t.test('un depart tout juste passe reste dans le delai de grace', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const trip = await h.createTrip(transporter.token, truck.id);
    const client = await h.createClient();

    // Le transporteur charge encore : une heure de retard ne doit pas le retirer.
    await h.prisma.trip.update({
      where: { id: trip.id },
      data: { departureAt: new Date(Date.now() - 60 * 60 * 1000) },
    });

    const { body } = await h.api('GET', '/trips/list', { token: client.token });
    assert.ok(body.items.some((item) => item.id === trip.id));
  });

  await t.test('le transporteur garde ses trajets passes et sait qu ils ne sont plus proposes', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const trip = await h.createTrip(transporter.token, truck.id);

    const frais = await h.api('GET', '/trips/list?mine=true', { token: transporter.token });
    assert.equal(frais.body.items.find((t2) => t2.id === trip.id).visibleInSearch, true);

    await h.prisma.trip.update({
      where: { id: trip.id },
      data: { departureAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    });

    const passe = await h.api('GET', '/trips/list?mine=true', { token: transporter.token });
    const found = passe.body.items.find((t2) => t2.id === trip.id);
    assert.ok(found, 'le trajet reste dans son historique');
    assert.equal(found.visibleInSearch, false);
  });

  await t.test("l'administrateur voit aussi les trajets dont le depart est passe", async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const trip = await h.createTrip(transporter.token, truck.id);
    const admin = await h.createAdmin();

    await h.prisma.trip.update({
      where: { id: trip.id },
      data: { departureAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    });

    const { body } = await h.api('GET', '/admin/trips', { token: admin.token });
    assert.ok(body.items.some((item) => item.id === trip.id));
  });

  await t.test('repousser le depart remet le trajet dans la recherche', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const trip = await h.createTrip(transporter.token, truck.id);
    const client = await h.createClient();

    await h.prisma.trip.update({
      where: { id: trip.id },
      data: { departureAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    });

    const repousse = await h.api('PATCH', `/trips/${trip.id}`, {
      token: transporter.token,
      body: { departureAt: h.tomorrowAt(7) },
    });
    assert.equal(repousse.status, 200);

    const { body } = await h.api('GET', '/trips/list', { token: client.token });
    assert.ok(body.items.some((item) => item.id === trip.id));
  });

  // Le defaut corrige : une mission exige un minimum positif de volume et de
  // poids, donc un trajet epuise sur l'une des deux dimensions ne peut deja
  // plus en accepter aucune. Le laisser dans la recherche menait un client a
  // un formulaire qui refuse systematiquement, sans jamais dire pourquoi.
  await t.test('un trajet sans volume libre sort de la recherche', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const trip = await h.createTrip(transporter.token, truck.id);
    const client = await h.createClient();

    await h.prisma.trip.update({ where: { id: trip.id }, data: { freeVolumeM3: 0 } });

    const { body } = await h.api('GET', '/trips/list', { token: client.token });
    assert.ok(!body.items.some((item) => item.id === trip.id));
  });

  await t.test('un trajet sans charge libre sort de la recherche', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const trip = await h.createTrip(transporter.token, truck.id);
    const client = await h.createClient();

    await h.prisma.trip.update({ where: { id: trip.id }, data: { freeWeightKg: 0 } });

    const { body } = await h.api('GET', '/trips/list', { token: client.token });
    assert.ok(!body.items.some((item) => item.id === trip.id));
  });

  // La capacite prime sur le statut : un trajet EN_COURS echappe au delai de
  // grace du depart, mais pas a l'epuisement de sa capacite.
  await t.test('un trajet en cours mais epuise sort aussi de la recherche', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const trip = await h.createTrip(transporter.token, truck.id);
    const client = await h.createClient();

    await h.prisma.trip.update({
      where: { id: trip.id },
      data: { status: 'IN_PROGRESS', freeVolumeM3: 0 },
    });

    const { body } = await h.api('GET', '/trips/list', { token: client.token });
    assert.ok(!body.items.some((item) => item.id === trip.id));
  });

  await t.test('le transporteur voit pourquoi son trajet epuise n est plus propose', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const trip = await h.createTrip(transporter.token, truck.id);

    await h.prisma.trip.update({ where: { id: trip.id }, data: { freeVolumeM3: 0 } });

    const { body } = await h.api('GET', '/trips/list?mine=true', { token: transporter.token });
    const found = body.items.find((item) => item.id === trip.id);
    assert.equal(found.visibleInSearch, false);
    assert.equal(found.searchBlockedReason, 'CAPACITY_EXHAUSTED');
  });

  await t.test('distingue le motif : capacite epuisee prime sur un depart passe', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const trip = await h.createTrip(transporter.token, truck.id);

    await h.prisma.trip.update({
      where: { id: trip.id },
      data: { freeVolumeM3: 0, departureAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    });

    const { body } = await h.api('GET', '/trips/list?mine=true', { token: transporter.token });
    const found = body.items.find((item) => item.id === trip.id);
    assert.equal(found.searchBlockedReason, 'CAPACITY_EXHAUSTED');
  });

  await t.test('mine=true garde un motif nul pour un trajet visible', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    await h.createTrip(transporter.token, truck.id);

    const { body } = await h.api('GET', '/trips/list?mine=true', { token: transporter.token });
    assert.equal(body.items[0].visibleInSearch, true);
    assert.equal(body.items[0].searchBlockedReason, null);
  });

  // Une mission annulee apres acceptation restitue la capacite (deja teste
  // cote missions) : le trajet doit redevenir trouvable, pas rester exclu.
  await t.test('restituer la capacite remet le trajet dans la recherche', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const trip = await h.createTrip(transporter.token, truck.id, {
      freeVolumeM3: 5,
      freeWeightKg: 500,
    });
    const client = await h.createClient();
    const mission = await h.createMission(client.token, {
      transporterId: transporter.profileId,
      truckId: truck.id,
      tripId: trip.id,
      volumeM3: 5,
      weightKg: 500,
    });

    await h.api('PATCH', '/missions/update-status', {
      token: transporter.token,
      body: { missionId: mission.id, status: 'ACCEPTED' },
    });
    const epuise = await h.api('GET', '/trips/list', { token: client.token });
    assert.ok(!epuise.body.items.some((item) => item.id === trip.id));

    await h.api('PATCH', '/missions/update-status', {
      token: client.token,
      body: { missionId: mission.id, status: 'CANCELLED', reason: 'Report' },
    });
    const restaure = await h.api('GET', '/trips/list', { token: client.token });
    assert.ok(restaure.body.items.some((item) => item.id === trip.id));
  });

  await t.test('un minimum de volume explicite reste applique en plus du plancher', async () => {
    const transporter = await h.createTransporter();
    const truck = await h.createTruck(transporter.token);
    const trip = await h.createTrip(transporter.token, truck.id, { freeVolumeM3: 5 });
    const client = await h.createClient();

    const { body } = await h.api('GET', '/trips/list?minFreeVolumeM3=10', { token: client.token });
    assert.ok(!body.items.some((item) => item.id === trip.id));
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
