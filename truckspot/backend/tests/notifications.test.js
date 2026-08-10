const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

// Les notifications sont produites par les evenements de mission. Pour eprouver
// la pagination il en faut plus qu'un scenario n'en genere, et a des instants
// maitrises : on les insere donc directement.
async function seedNotifications(userId, count, { readAt = null } = {}) {
  const base = Date.UTC(2026, 0, 1, 8, 0, 0);
  const rows = Array.from({ length: count }, (_, i) => ({
    userId,
    type: 'MISSION_STATUS',
    title: `Notification ${i + 1}`,
    body: 'Corps de la notification',
    readAt,
    // Une minute d'ecart : l'ordre est deterministe, du plus ancien au plus recent.
    createdAt: new Date(base + i * 60_000),
  }));
  await h.prisma.notification.createMany({ data: rows });
}

test('notifications', async (t) => {
  await h.startServer();
  await h.resetDb();
  t.after(() => h.stopServer());

  await t.test('renvoie les plus recentes en premier', async () => {
    const client = await h.createClient();
    await seedNotifications(client.user.id, 3);

    const { status, body } = await h.api('GET', '/notifications/list', { token: client.token });

    assert.equal(status, 200);
    assert.deepEqual(
      body.items.map((n) => n.title),
      ['Notification 3', 'Notification 2', 'Notification 1']
    );
  });

  await t.test('ne montre a personne les notifications d un autre compte', async () => {
    const alice = await h.createClient();
    const bob = await h.createClient();
    await seedNotifications(alice.user.id, 2);

    const { body } = await h.api('GET', '/notifications/list', { token: bob.token });

    assert.deepEqual(body.items, []);
  });

  await t.test('exige une session', async () => {
    const { status } = await h.api('GET', '/notifications/list');
    assert.equal(status, 401);
  });

  // Le defaut corrige : au-dela de `take`, les plus anciennes etaient
  // inatteignables faute de curseur.
  await t.test('remonte les plus anciennes avec le curseur before', async () => {
    const client = await h.createClient();
    await seedNotifications(client.user.id, 5);

    const first = await h.api('GET', '/notifications/list?take=2', { token: client.token });
    assert.deepEqual(
      first.body.items.map((n) => n.title),
      ['Notification 5', 'Notification 4']
    );

    const oldest = first.body.items[first.body.items.length - 1].createdAt;
    const second = await h.api(
      `GET`,
      `/notifications/list?take=2&before=${encodeURIComponent(oldest)}`,
      { token: client.token }
    );

    assert.deepEqual(
      second.body.items.map((n) => n.title),
      ['Notification 3', 'Notification 2']
    );
  });

  await t.test('rend une liste vide une fois la plus ancienne depassee', async () => {
    const client = await h.createClient();
    await seedNotifications(client.user.id, 2);

    const all = await h.api('GET', '/notifications/list', { token: client.token });
    const oldest = all.body.items[all.body.items.length - 1].createdAt;

    const { body } = await h.api(
      'GET',
      `/notifications/list?before=${encodeURIComponent(oldest)}`,
      { token: client.token }
    );

    assert.deepEqual(body.items, []);
  });

  await t.test('combine le curseur et le filtre non-lues', async () => {
    const client = await h.createClient();
    await seedNotifications(client.user.id, 3);
    const lues = await h.prisma.notification.findMany({
      where: { userId: client.user.id },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    await h.prisma.notification.update({
      where: { id: lues[0].id },
      data: { readAt: new Date() },
    });

    const { body } = await h.api('GET', '/notifications/list?unreadOnly=true', {
      token: client.token,
    });

    assert.deepEqual(
      body.items.map((n) => n.title),
      ['Notification 2', 'Notification 1']
    );
  });

  await t.test('refuse un curseur qui n est pas une date', async () => {
    const client = await h.createClient();

    const { status } = await h.api('GET', '/notifications/list?before=hier', {
      token: client.token,
    });

    assert.equal(status, 400);
  });

  await t.test('refuse un parametre inconnu', async () => {
    const client = await h.createClient();

    const { status } = await h.api('GET', '/notifications/list?page=2', { token: client.token });

    assert.equal(status, 400);
  });

  await t.test('marque tout comme lu et ne recompte pas deux fois', async () => {
    const client = await h.createClient();
    await seedNotifications(client.user.id, 4);

    const first = await h.api('PATCH', '/notifications/read-all', { token: client.token });
    assert.equal(first.status, 200);
    assert.equal(first.body.updated, 4);

    const second = await h.api('PATCH', '/notifications/read-all', { token: client.token });
    assert.equal(second.body.updated, 0);

    const { body } = await h.api('GET', '/notifications/list?unreadOnly=true', {
      token: client.token,
    });
    assert.deepEqual(body.items, []);
  });

  await t.test('ne marque pas comme lues les notifications des autres', async () => {
    const alice = await h.createClient();
    const bob = await h.createClient();
    await seedNotifications(alice.user.id, 2);
    await seedNotifications(bob.user.id, 3);

    await h.api('PATCH', '/notifications/read-all', { token: alice.token });

    const { body } = await h.api('GET', '/notifications/list?unreadOnly=true', {
      token: bob.token,
    });
    assert.equal(body.items.length, 3);
  });

  await t.test('plafonne take a 100', async () => {
    const client = await h.createClient();

    const { status } = await h.api('GET', '/notifications/list?take=500', { token: client.token });

    assert.equal(status, 400);
  });
});
