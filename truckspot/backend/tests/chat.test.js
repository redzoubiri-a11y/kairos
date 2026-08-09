const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

test('chat et temps reel', async (t) => {
  await h.startServer();
  await h.resetDb();
  t.after(() => h.stopServer());

  async function scenario() {
    const transporter = await h.createTransporter();
    const client = await h.createClient();
    const truck = await h.createTruck(transporter.token);
    const trip = await h.createTrip(transporter.token, truck.id);
    const mission = await h.createMission(client.token, {
      transporterId: transporter.profileId,
      truckId: truck.id,
      tripId: trip.id,
    });
    return { transporter, client, truck, trip, mission };
  }

  await t.test('conserve l historique dans l ordre chronologique', async () => {
    const { transporter, client, mission } = await scenario();

    await h.api('POST', '/chat/send', {
      token: client.token,
      body: { missionId: mission.id, content: 'Bonjour, chargement pret a 6h.' },
    });
    await h.api('POST', '/chat/send', {
      token: transporter.token,
      body: { missionId: mission.id, content: 'Bien recu, je serai la.' },
    });

    const { body } = await h.api('GET', `/chat/history?missionId=${mission.id}`, {
      token: client.token,
    });

    assert.equal(body.items.length, 2);
    assert.equal(body.items[0].content, 'Bonjour, chargement pret a 6h.');
    assert.equal(body.items[1].content, 'Bien recu, je serai la.');
  });

  await t.test('marque les messages recus comme lus', async () => {
    const { transporter, client, mission } = await scenario();

    await h.api('POST', '/chat/send', {
      token: transporter.token,
      body: { missionId: mission.id, content: 'Un message a lire' },
    });

    const read = await h.api('PATCH', `/chat/${mission.id}/read`, { token: client.token });
    assert.equal(read.status, 200);
    assert.equal(read.body.updated, 1);
  });

  await t.test('ferme la conversation d une mission annulee', async () => {
    const { client, mission } = await scenario();

    await h.api('PATCH', '/missions/update-status', {
      token: client.token,
      body: { missionId: mission.id, status: 'CANCELLED' },
    });

    const { status } = await h.api('POST', '/chat/send', {
      token: client.token,
      body: { missionId: mission.id, content: 'apres annulation' },
    });
    assert.equal(status, 400);
  });

  await t.test('refuse un message vide', async () => {
    const { client, mission } = await scenario();
    const { status } = await h.api('POST', '/chat/send', {
      token: client.token,
      body: { missionId: mission.id, content: '' },
    });
    assert.equal(status, 400);
  });

  await t.test('rejette une connexion websocket sans jeton valide', async () => {
    await assert.rejects(() => h.connectSocket('jeton-invalide'), /invalide|expire/i);
  });

  await t.test('interdit a un tiers de rejoindre le salon d une mission', async () => {
    const { mission } = await scenario();
    const outsider = await h.createClient();
    const socket = await h.connectSocket(outsider.token);

    try {
      const ack = await h.emitWithAck(socket, 'mission:join', mission.id);
      assert.equal(ack.ok, false);
    } finally {
      socket.close();
    }
  });

  await t.test('diffuse un message dans le salon sans doublon', async () => {
    const { transporter, client, mission } = await scenario();
    const clientSocket = await h.connectSocket(client.token);
    const transporterSocket = await h.connectSocket(transporter.token);

    try {
      assert.equal((await h.emitWithAck(clientSocket, 'mission:join', mission.id)).ok, true);
      assert.equal((await h.emitWithAck(transporterSocket, 'mission:join', mission.id)).ok, true);

      const roomMessages = [];
      const inboxMessages = [];
      clientSocket.on('chat:message', (m) => roomMessages.push(m));
      clientSocket.on('chat:inbox', (m) => inboxMessages.push(m));

      const ack = await h.emitWithAck(transporterSocket, 'chat:send', {
        missionId: mission.id,
        content: 'Message temps reel',
      });
      assert.equal(ack.ok, true);

      await new Promise((resolve) => setTimeout(resolve, 400));

      assert.equal(roomMessages.length, 1, 'un seul message dans le salon');
      assert.equal(roomMessages[0].content, 'Message temps reel');
      assert.equal(inboxMessages.length, 1, 'une seule notification personnelle');
    } finally {
      clientSocket.close();
      transporterSocket.close();
    }
  });

  await t.test('pousse la nouvelle mission au transporteur en direct', async () => {
    const transporter = await h.createTransporter();
    const client = await h.createClient();
    const truck = await h.createTruck(transporter.token);
    const socket = await h.connectSocket(transporter.token);

    try {
      const incoming = h.waitFor(socket, 'mission:new');
      await h.createMission(client.token, {
        transporterId: transporter.profileId,
        truckId: truck.id,
      });

      const mission = await incoming;
      assert.equal(mission.status, 'PENDING');
      assert.equal(mission.clientId, client.user.id);
    } finally {
      socket.close();
    }
  });

  await t.test('accepte la position envoyee par le transporteur, la refuse au client', async () => {
    const { transporter, client, truck } = await scenario();
    const transporterSocket = await h.connectSocket(transporter.token);
    const clientSocket = await h.connectSocket(client.token);

    try {
      const ok = await h.emitWithAck(transporterSocket, 'truck:position', {
        truckId: truck.id,
        latitude: 36.8,
        longitude: 3.1,
      });
      assert.equal(ok.ok, true);
      assert.equal(ok.truck.latitude, 36.8);

      const refused = await h.emitWithAck(clientSocket, 'truck:position', {
        truckId: truck.id,
        latitude: 0,
        longitude: 0,
      });
      assert.equal(refused.ok, false);
    } finally {
      transporterSocket.close();
      clientSocket.close();
    }
  });
});
