const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');
const mailer = require('../src/services/mailer.service');

// Le pilote `log` garde les messages en memoire : c'est ainsi qu'on relit le
// code sans serveur SMTP, en test comme en developpement.
function lastCode() {
  const messages = mailer.readOutbox();
  const last = messages[messages.length - 1];
  if (!last) return null;
  const found = last.text.match(/\b(\d{6})\b/);
  return found ? found[1] : null;
}

async function demanderCode(email) {
  mailer.clearOutbox();
  const response = await h.api('POST', '/auth/forgot-password', { body: { email } });
  return { response, code: lastCode() };
}

test('reinitialisation de mot de passe', async (t) => {
  await h.startServer();
  await h.resetDb();
  t.after(() => h.stopServer());

  await t.test('un compte oublie recoit un code et peut se reconnecter', async () => {
    const client = await h.createClient();

    const { response, code } = await demanderCode(client.user.email);
    assert.equal(response.status, 200);
    assert.match(code, /^\d{6}$/);

    const reset = await h.api('POST', '/auth/reset-password', {
      body: { email: client.user.email, code, password: 'NouveauMotDePasse1' },
    });
    assert.equal(reset.status, 200);

    const connexion = await h.api('POST', '/auth/login', {
      body: { email: client.user.email, password: 'NouveauMotDePasse1' },
    });
    assert.equal(connexion.status, 200);
    assert.ok(connexion.body.token);
  });

  await t.test("l'ancien mot de passe ne fonctionne plus", async () => {
    const client = await h.createClient();
    const { code } = await demanderCode(client.user.email);

    await h.api('POST', '/auth/reset-password', {
      body: { email: client.user.email, code, password: 'NouveauMotDePasse1' },
    });

    const ancien = await h.api('POST', '/auth/login', {
      body: { email: client.user.email, password: 'Password123!' },
    });
    assert.equal(ancien.status, 401);
  });

  // Demander une reinitialisation ne doit pas reveler qui est inscrit : la
  // reponse est la meme pour un email inconnu.
  await t.test('ne trahit pas l existence d un compte', async () => {
    const connu = await h.createClient();

    const existant = await h.api('POST', '/auth/forgot-password', {
      body: { email: connu.user.email },
    });
    const inconnu = await h.api('POST', '/auth/forgot-password', {
      body: { email: 'personne@truckspot.dz' },
    });

    assert.equal(existant.status, inconnu.status);
    assert.deepEqual(existant.body, inconnu.body);
  });

  await t.test('n envoie aucun message pour un email inconnu', async () => {
    mailer.clearOutbox();

    await h.api('POST', '/auth/forgot-password', { body: { email: 'fantome@truckspot.dz' } });

    assert.deepEqual(mailer.readOutbox(), []);
  });

  await t.test('un code errone est refuse sans distinction de message', async () => {
    const client = await h.createClient();
    const { code } = await demanderCode(client.user.email);
    const faux = code === '000000' ? '111111' : '000000';

    const errone = await h.api('POST', '/auth/reset-password', {
      body: { email: client.user.email, code: faux, password: 'NouveauMotDePasse1' },
    });
    const inconnu = await h.api('POST', '/auth/reset-password', {
      body: { email: 'personne@truckspot.dz', code: faux, password: 'NouveauMotDePasse1' },
    });

    assert.equal(errone.status, 400);
    assert.equal(errone.body.error.message, inconnu.body.error.message);
  });

  await t.test('un code ne sert qu une fois', async () => {
    const client = await h.createClient();
    const { code } = await demanderCode(client.user.email);

    const premier = await h.api('POST', '/auth/reset-password', {
      body: { email: client.user.email, code, password: 'NouveauMotDePasse1' },
    });
    assert.equal(premier.status, 200);

    const second = await h.api('POST', '/auth/reset-password', {
      body: { email: client.user.email, code, password: 'EncoreUnAutre1' },
    });
    assert.equal(second.status, 400);
  });

  await t.test('un code expire est refuse', async () => {
    const client = await h.createClient();
    const { code } = await demanderCode(client.user.email);

    await h.prisma.passwordResetCode.updateMany({
      where: { userId: client.user.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    const { status } = await h.api('POST', '/auth/reset-password', {
      body: { email: client.user.email, code, password: 'NouveauMotDePasse1' },
    });
    assert.equal(status, 400);
  });

  // Un code a six chiffres se devine en un million d'essais : le compteur est
  // ce qui rend l'attaque impraticable.
  await t.test('bloque apres cinq essais errones, meme avec le bon code ensuite', async () => {
    const client = await h.createClient();
    const { code } = await demanderCode(client.user.email);
    const faux = code === '000000' ? '111111' : '000000';

    for (let i = 0; i < 5; i += 1) {
      const essai = await h.api('POST', '/auth/reset-password', {
        body: { email: client.user.email, code: faux, password: 'NouveauMotDePasse1' },
      });
      assert.equal(essai.status, 400);
    }

    const avecLeBon = await h.api('POST', '/auth/reset-password', {
      body: { email: client.user.email, code, password: 'NouveauMotDePasse1' },
    });
    assert.equal(avecLeBon.status, 400);
  });

  await t.test('une nouvelle demande annule le code precedent', async () => {
    const client = await h.createClient();
    const premier = await demanderCode(client.user.email);
    const second = await demanderCode(client.user.email);

    assert.notEqual(premier.code, null);
    const ancien = await h.api('POST', '/auth/reset-password', {
      body: { email: client.user.email, code: premier.code, password: 'NouveauMotDePasse1' },
    });
    assert.equal(ancien.status, 400);

    const recent = await h.api('POST', '/auth/reset-password', {
      body: { email: client.user.email, code: second.code, password: 'NouveauMotDePasse1' },
    });
    assert.equal(recent.status, 200);
  });

  await t.test('le code n est pas stocke en clair', async () => {
    const client = await h.createClient();
    const { code } = await demanderCode(client.user.email);

    const stocke = await h.prisma.passwordResetCode.findFirst({
      where: { userId: client.user.id },
    });
    assert.notEqual(stocke.codeHash, code);
    assert.equal(stocke.codeHash.length, 64);
  });

  await t.test('refuse un code mal forme sans consommer d essai', async () => {
    const client = await h.createClient();
    await demanderCode(client.user.email);

    const malForme = await h.api('POST', '/auth/reset-password', {
      body: { email: client.user.email, code: 'abcdef', password: 'NouveauMotDePasse1' },
    });
    assert.equal(malForme.status, 400);

    const stocke = await h.prisma.passwordResetCode.findFirst({
      where: { userId: client.user.id },
    });
    assert.equal(stocke.attempts, 0);
  });

  await t.test('refuse un mot de passe trop court', async () => {
    const client = await h.createClient();
    const { code } = await demanderCode(client.user.email);

    const { status } = await h.api('POST', '/auth/reset-password', {
      body: { email: client.user.email, code, password: 'court' },
    });
    assert.equal(status, 400);
  });

  await t.test('ignore la casse de l email', async () => {
    const client = await h.createClient();
    const { code } = await demanderCode(client.user.email.toUpperCase());

    assert.ok(code, 'le code part malgre la casse');
    const { status } = await h.api('POST', '/auth/reset-password', {
      body: { email: client.user.email.toUpperCase(), code, password: 'NouveauMotDePasse1' },
    });
    assert.equal(status, 200);
  });

  await t.test('un compte desactive ne recoit pas de code', async () => {
    const client = await h.createClient();
    const admin = await h.createAdmin();
    await h.api('PATCH', `/admin/users/${client.user.id}/active`, {
      token: admin.token,
      body: { isActive: false },
    });

    const { response, code } = await demanderCode(client.user.email);

    // Meme reponse qu'un compte actif : la desactivation ne se devine pas.
    assert.equal(response.status, 200);
    assert.equal(code, null);
  });
});

test('fermeture des sessions apres changement de mot de passe', async (t) => {
  await h.startServer();
  t.after(() => h.stopServer());

  // Le defaut corrige : reinitialiser son mot de passe ne chassait personne. Un
  // jeton vole restait valable jusqu'a sept jours.
  await t.test('une reinitialisation invalide les jetons deja emis', async () => {
    const client = await h.createClient();
    const ancienJeton = client.token;

    const avant = await h.api('GET', '/auth/me', { token: ancienJeton });
    assert.equal(avant.status, 200);

    const { code } = await demanderCode(client.user.email);
    await h.api('POST', '/auth/reset-password', {
      body: { email: client.user.email, code, password: 'NouveauMotDePasse1' },
    });

    const apres = await h.api('GET', '/auth/me', { token: ancienJeton });
    assert.equal(apres.status, 401);
  });

  await t.test('la websocket refuse elle aussi un jeton perime', async () => {
    const client = await h.createClient();
    const ancienJeton = client.token;

    const { code } = await demanderCode(client.user.email);
    await h.api('POST', '/auth/reset-password', {
      body: { email: client.user.email, code, password: 'NouveauMotDePasse1' },
    });

    await assert.rejects(() => h.connectSocket(ancienJeton));
  });

  await t.test('changer son mot de passe ferme les autres sessions', async () => {
    const client = await h.createClient();
    const premiereSession = client.token;

    const seconde = await h.api('POST', '/auth/login', {
      body: { email: client.user.email, password: 'Password123!' },
    });

    const changement = await h.api('POST', '/auth/change-password', {
      token: seconde.body.token,
      body: { currentPassword: 'Password123!', newPassword: 'NouveauMotDePasse1' },
    });
    assert.equal(changement.status, 200);

    const ancienne = await h.api('GET', '/auth/me', { token: premiereSession });
    assert.equal(ancienne.status, 401);
  });

  // Se deconnecter soi-meme en changeant son mot de passe serait absurde : la
  // reponse porte un jeton neuf.
  await t.test('la session qui change le mot de passe recoit un jeton neuf', async () => {
    const client = await h.createClient();

    const changement = await h.api('POST', '/auth/change-password', {
      token: client.token,
      body: { currentPassword: 'Password123!', newPassword: 'NouveauMotDePasse1' },
    });
    assert.equal(changement.status, 200);
    assert.ok(changement.body.token, 'un jeton de remplacement est renvoye');

    const suite = await h.api('GET', '/auth/me', { token: changement.body.token });
    assert.equal(suite.status, 200);
  });
});
