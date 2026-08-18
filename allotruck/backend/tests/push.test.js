const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// Faux service Expo Push : enregistre les requetes recues et renvoie les tickets
// que l'on souhaite, y compris les erreurs qui invalident un jeton.
function startFakeExpo() {
  const requests = [];
  let nextTickets = null;

  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const messages = JSON.parse(Buffer.concat(chunks).toString());
      requests.push({ messages, authorization: req.headers.authorization });

      const data = nextTickets
        ? nextTickets(messages)
        : messages.map(() => ({ status: 'ok', id: 'ticket-fake' }));
      nextTickets = null;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data }));
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () =>
      resolve({
        server,
        requests,
        port: server.address().port,
        replyWith(fn) {
          nextTickets = fn;
        },
      })
    );
  });
}

const TOKEN_A = 'ExponentPushToken[aaaaaaaaaaaaaaaaaaaaaa]';
const TOKEN_B = 'ExponentPushToken[bbbbbbbbbbbbbbbbbbbbbb]';

test('notifications push', async (t) => {
  const expo = await startFakeExpo();

  // Doit etre positionne avant le chargement de la configuration.
  process.env.EXPO_PUSH_URL = `http://127.0.0.1:${expo.port}/push/send`;
  process.env.EXPO_ACCESS_TOKEN = 'jeton-expo-de-test';
  process.env.PUSH_ENABLED = 'true';

  const h = require('./helpers');
  const pushService = require('../src/services/push.service');

  await h.startServer();
  await h.resetDb();
  t.after(async () => {
    await h.stopServer();
    await new Promise((resolve) => expo.server.close(resolve));
  });

  await t.test("refuse un jeton qui n'est pas au format Expo", async () => {
    const client = await h.createClient();
    const { status } = await h.api('POST', '/notifications/devices', {
      token: client.token,
      body: { token: 'pas-un-jeton-expo', platform: 'ANDROID' },
    });
    assert.equal(status, 400);
  });

  await t.test('enregistre un appareil et le liste', async () => {
    const client = await h.createClient();

    const created = await h.api('POST', '/notifications/devices', {
      token: client.token,
      expect: 201,
      body: { token: TOKEN_A, platform: 'ANDROID', deviceName: 'Pixel 8' },
    });
    assert.equal(created.body.platform, 'ANDROID');
    assert.equal(created.body.deviceName, 'Pixel 8');
    assert.ok(!JSON.stringify(created.body).includes(TOKEN_A), 'le jeton n est pas renvoye');

    const list = await h.api('GET', '/notifications/devices', { token: client.token });
    assert.equal(list.body.items.length, 1);
  });

  await t.test('un enregistrement repete ne cree pas de doublon', async () => {
    const client = await h.createClient();
    const body = { token: TOKEN_B, platform: 'IOS' };

    await h.api('POST', '/notifications/devices', { token: client.token, expect: 201, body });
    await h.api('POST', '/notifications/devices', { token: client.token, expect: 201, body });

    const list = await h.api('GET', '/notifications/devices', { token: client.token });
    assert.equal(list.body.items.length, 1);
  });

  await t.test('un appareil qui change de compte suit son nouveau proprietaire', async () => {
    const first = await h.createClient();
    const second = await h.createClient();
    const body = { token: TOKEN_A, platform: 'ANDROID' };

    await h.api('POST', '/notifications/devices', { token: first.token, expect: 201, body });
    await h.api('POST', '/notifications/devices', { token: second.token, expect: 201, body });

    const firstList = await h.api('GET', '/notifications/devices', { token: first.token });
    const secondList = await h.api('GET', '/notifications/devices', { token: second.token });
    assert.equal(firstList.body.items.length, 0, 'retire du premier compte');
    assert.equal(secondList.body.items.length, 1, 'rattache au second compte');
  });

  await t.test('la deconnexion retire uniquement son propre appareil', async () => {
    const owner = await h.createClient();
    const other = await h.createClient();
    await h.api('POST', '/notifications/devices', {
      token: owner.token,
      expect: 201,
      body: { token: TOKEN_A, platform: 'ANDROID' },
    });

    const foreign = await h.api('DELETE', '/notifications/devices', {
      token: other.token,
      body: { token: TOKEN_A },
    });
    assert.equal(foreign.body.removed, 0, "un tiers ne peut pas supprimer l'appareil d'autrui");

    const own = await h.api('DELETE', '/notifications/devices', {
      token: owner.token,
      body: { token: TOKEN_A },
    });
    assert.equal(own.body.removed, 1);
  });

  await t.test('exige une authentification', async () => {
    assert.equal((await h.api('GET', '/notifications/devices')).status, 401);
    assert.equal(
      (await h.api('POST', '/notifications/devices', { body: { token: TOKEN_A, platform: 'IOS' } }))
        .status,
      401
    );
  });

  await t.test('une nouvelle mission declenche un envoi push au transporteur', async () => {
    const transporter = await h.createTransporter();
    const client = await h.createClient();
    const truck = await h.createTruck(transporter.token);

    await h.api('POST', '/notifications/devices', {
      token: transporter.token,
      expect: 201,
      body: { token: TOKEN_A, platform: 'ANDROID' },
    });

    expo.requests.length = 0;
    const mission = await h.createMission(client.token, {
      transporterId: transporter.profileId,
      truckId: truck.id,
    });
    await pushService.flush();

    assert.equal(expo.requests.length, 1, 'un seul appel a Expo');
    const [sent] = expo.requests;
    assert.equal(sent.authorization, 'Bearer jeton-expo-de-test');
    assert.equal(sent.messages.length, 1);

    const [message] = sent.messages;
    assert.equal(message.to, TOKEN_A);
    assert.equal(message.title, 'Nouvelle demande de mission');
    assert.match(message.body, /Alger → Oran/);
    assert.equal(message.data.missionId, mission.id);
    assert.equal(message.data.type, 'MISSION_CREATED');
    assert.ok(message.data.notificationId, 'permet au mobile de retrouver la notification');
  });

  await t.test('aucun envoi si le destinataire n a pas enregistre d appareil', async () => {
    const transporter = await h.createTransporter();
    const client = await h.createClient();
    const truck = await h.createTruck(transporter.token);

    expo.requests.length = 0;
    await h.createMission(client.token, {
      transporterId: transporter.profileId,
      truckId: truck.id,
    });
    await pushService.flush();

    assert.equal(expo.requests.length, 0);
  });

  await t.test('un jeton refuse par Expo est supprime de la base', async () => {
    const transporter = await h.createTransporter();
    const client = await h.createClient();
    const truck = await h.createTruck(transporter.token);

    await h.api('POST', '/notifications/devices', {
      token: transporter.token,
      expect: 201,
      body: { token: TOKEN_A, platform: 'ANDROID' },
    });

    expo.replyWith((messages) =>
      messages.map(() => ({
        status: 'error',
        message: 'device not registered',
        details: { error: 'DeviceNotRegistered' },
      }))
    );

    await h.createMission(client.token, {
      transporterId: transporter.profileId,
      truckId: truck.id,
    });
    await pushService.flush();

    const list = await h.api('GET', '/notifications/devices', { token: transporter.token });
    assert.equal(list.body.items.length, 0, 'le jeton obsolete a ete purge');
  });

  await t.test('une panne du service Expo ne fait pas echouer la mission', async () => {
    const transporter = await h.createTransporter();
    const client = await h.createClient();
    const truck = await h.createTruck(transporter.token);

    await h.api('POST', '/notifications/devices', {
      token: transporter.token,
      expect: 201,
      body: { token: TOKEN_B, platform: 'IOS' },
    });

    // Expo injoignable le temps de cet envoi.
    await new Promise((resolve) => expo.server.close(resolve));

    const mission = await h.createMission(client.token, {
      transporterId: transporter.profileId,
      truckId: truck.id,
    });
    await pushService.flush();

    assert.equal(mission.status, 'PENDING', 'la mission est bien creee');

    const notifications = await h.api('GET', '/notifications/list', { token: transporter.token });
    assert.ok(
      notifications.body.items.some((n) => n.type === 'MISSION_CREATED'),
      'la notification in-app reste enregistree'
    );
  });
});
