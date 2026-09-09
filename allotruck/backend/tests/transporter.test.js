const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

test('creation de profil transporteur', async (t) => {
  await h.startServer();
  await h.resetDb();
  t.after(() => h.stopServer());

  await t.test('un client peut ouvrir un profil transporteur', async () => {
    const client = await h.createClient();

    const { status, body } = await h.api('POST', '/transporters/create', {
      token: client.token,
      body: { companyName: 'Nouveau Transport', city: 'Oran' },
    });

    assert.equal(status, 201);
    assert.equal(body.companyName, 'Nouveau Transport');
  });

  await t.test('un admin ne peut pas s auto-convertir en transporteur', async () => {
    const admin = await h.createAdmin();

    const { status } = await h.api('POST', '/transporters/create', {
      token: admin.token,
      body: { companyName: 'Faux Transport', city: 'Oran' },
    });

    assert.equal(status, 403);
  });

  await t.test('un transporteur existant ne peut pas recreer de profil', async () => {
    const transporter = await h.createTransporter();

    const { status } = await h.api('POST', '/transporters/create', {
      token: transporter.token,
      body: { companyName: 'Autre Transport', city: 'Alger' },
    });

    assert.equal(status, 403);
  });
});
