const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

test('auth', async (t) => {
  await h.startServer();
  await h.resetDb();
  t.after(() => h.stopServer());

  await t.test('inscrit un client et renvoie un jeton', async () => {
    const email = h.uniqueEmail('client');
    const { status, body } = await h.api('POST', '/auth/signup', {
      body: { email, password: 'Password123!', fullName: 'Karim Belkacem', role: 'CLIENT' },
    });

    assert.equal(status, 201);
    assert.ok(body.token);
    assert.equal(body.user.email, email);
    assert.equal(body.user.role, 'CLIENT');
  });

  await t.test("n'expose jamais le hash du mot de passe", async () => {
    const signup = await h.createTransporter({ verified: false });
    assert.ok(!JSON.stringify(signup).includes('passwordHash'));

    const { body } = await h.api('GET', '/auth/me', { token: signup.token });
    assert.ok(!JSON.stringify(body).includes('passwordHash'));
  });

  await t.test('refuse un email deja utilise', async () => {
    const email = h.uniqueEmail('doublon');
    const payload = { email, password: 'Password123!', fullName: 'Premier', role: 'CLIENT' };

    assert.equal((await h.api('POST', '/auth/signup', { body: payload })).status, 201);
    assert.equal((await h.api('POST', '/auth/signup', { body: payload })).status, 409);
  });

  await t.test('refuse un mot de passe trop court et un email invalide', async () => {
    const { status, body } = await h.api('POST', '/auth/signup', {
      body: { email: 'pas-un-email', password: 'court', fullName: 'X', role: 'CLIENT' },
    });

    assert.equal(status, 400);
    assert.ok(Array.isArray(body.error.details));
  });

  await t.test('refuse un transporteur sans informations entreprise', async () => {
    const { status } = await h.api('POST', '/auth/signup', {
      body: {
        email: h.uniqueEmail('sans-entreprise'),
        password: 'Password123!',
        fullName: 'Sans Entreprise',
        role: 'TRANSPORTER',
      },
    });

    assert.equal(status, 400);
  });

  await t.test("interdit de s'inscrire directement en administrateur", async () => {
    const { status } = await h.api('POST', '/auth/signup', {
      body: {
        email: h.uniqueEmail('faux-admin'),
        password: 'Password123!',
        fullName: 'Faux Admin',
        role: 'ADMIN',
      },
    });

    assert.equal(status, 400);
  });

  await t.test('cree le profil transporteur en attente de verification', async () => {
    const transporter = await h.createTransporter({ verified: false });
    assert.equal(transporter.user.transporter.verificationStatus, 'PENDING');
  });

  await t.test('renvoie le meme message pour un email inconnu et un mot de passe errone', async () => {
    const client = await h.createClient();

    const wrongPassword = await h.api('POST', '/auth/login', {
      body: { email: client.user.email, password: 'MauvaisMotDePasse1!' },
    });
    const unknownEmail = await h.api('POST', '/auth/login', {
      body: { email: h.uniqueEmail('inconnu'), password: 'Password123!' },
    });

    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.equal(wrongPassword.body.error.message, unknownEmail.body.error.message);
  });

  await t.test('rejette une requete sans jeton ou avec un jeton invalide', async () => {
    assert.equal((await h.api('GET', '/auth/me')).status, 401);
    assert.equal((await h.api('GET', '/auth/me', { token: 'jeton-bidon' })).status, 401);
  });

  await t.test('met a jour le profil et change le mot de passe', async () => {
    const client = await h.createClient();

    const updated = await h.api('PATCH', '/auth/me', {
      token: client.token,
      body: { fullName: 'Nouveau Nom' },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.fullName, 'Nouveau Nom');

    const wrongCurrent = await h.api('POST', '/auth/change-password', {
      token: client.token,
      body: { currentPassword: 'MauvaisMotDePasse1!', newPassword: 'NouveauPass123!' },
    });
    assert.equal(wrongCurrent.status, 400);

    const changed = await h.api('POST', '/auth/change-password', {
      token: client.token,
      body: { currentPassword: 'Password123!', newPassword: 'NouveauPass123!' },
    });
    assert.equal(changed.status, 200);

    const relogin = await h.api('POST', '/auth/login', {
      body: { email: client.user.email, password: 'NouveauPass123!' },
    });
    assert.equal(relogin.status, 200);
  });

  await t.test('refuse la connexion d un compte desactive', async () => {
    const client = await h.createClient();
    await h.prisma.user.update({ where: { id: client.user.id }, data: { isActive: false } });

    const { status } = await h.api('POST', '/auth/login', {
      body: { email: client.user.email, password: 'Password123!' },
    });
    assert.equal(status, 403);
  });
});
