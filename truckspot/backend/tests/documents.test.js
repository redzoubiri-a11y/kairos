const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');

// 1x1 PNG, small enough to inline.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

test('documents transporteur', async (t) => {
  const baseUrl = await h.startServer();
  await h.resetDb();
  t.after(() => h.stopServer());

  async function uploadDocs(token, entries = [{ type: 'RC', mime: 'image/png', body: PNG }]) {
    const form = new FormData();
    for (const entry of entries) {
      form.append('files', new Blob([entry.body], { type: entry.mime }), entry.name ?? 'doc.png');
      form.append('types', entry.type);
    }

    const response = await fetch(`${baseUrl}/api/transporters/upload-docs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
  }

  await t.test('televerse un document et renvoie une URL authentifiee', async () => {
    const transporter = await h.createTransporter({ verified: false });
    const { status, body } = await uploadDocs(transporter.token);

    assert.equal(status, 201);
    assert.equal(body.documents.length, 1);
    assert.equal(body.documents[0].type, 'RC');
    assert.match(body.documents[0].url, /\/api\/transporters\/documents\//);
  });

  await t.test("n'expose jamais la cle de stockage", async () => {
    const transporter = await h.createTransporter({ verified: false });
    await uploadDocs(transporter.token);

    const upload = await uploadDocs(transporter.token, [{ type: 'PATENTE', mime: 'image/png', body: PNG }]);
    assert.ok(!JSON.stringify(upload.body).includes('storageKey'));

    const profile = await h.api('GET', '/transporters/me', { token: transporter.token });
    assert.ok(!JSON.stringify(profile.body).includes('storageKey'));

    const me = await h.api('GET', '/auth/me', { token: transporter.token });
    assert.ok(!JSON.stringify(me.body).includes('storageKey'));

    const admin = await h.createAdmin();
    const list = await h.api('GET', '/admin/transporters', { token: admin.token });
    assert.ok(!JSON.stringify(list.body).includes('storageKey'));
  });

  await t.test('le proprietaire peut relire son document', async () => {
    const transporter = await h.createTransporter({ verified: false });
    const { body } = await uploadDocs(transporter.token);
    const documentId = body.documents[0].id;

    const response = await fetch(`${baseUrl}/api/transporters/documents/${documentId}`, {
      headers: { Authorization: `Bearer ${transporter.token}` },
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.deepEqual(bytes, PNG);
  });

  await t.test("un administrateur peut relire le document d'un transporteur", async () => {
    const transporter = await h.createTransporter({ verified: false });
    const admin = await h.createAdmin();
    const { body } = await uploadDocs(transporter.token);

    const response = await fetch(`${baseUrl}/api/transporters/documents/${body.documents[0].id}`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    assert.equal(response.status, 200);
  });

  await t.test('un document est inaccessible sans jeton', async () => {
    const transporter = await h.createTransporter({ verified: false });
    const { body } = await uploadDocs(transporter.token);

    const response = await fetch(`${baseUrl}/api/transporters/documents/${body.documents[0].id}`);
    assert.equal(response.status, 401);
  });

  await t.test("un autre transporteur ne peut pas lire le document d'autrui", async () => {
    const owner = await h.createTransporter({ verified: false });
    const intruder = await h.createTransporter({ verified: false });
    const client = await h.createClient();
    const { body } = await uploadDocs(owner.token);
    const url = `${baseUrl}/api/transporters/documents/${body.documents[0].id}`;

    for (const token of [intruder.token, client.token]) {
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      assert.equal(response.status, 403);
    }
  });

  await t.test('aucun fichier n est servi en statique', async () => {
    const transporter = await h.createTransporter({ verified: false });
    await uploadDocs(transporter.token);

    const document = await h.prisma.transporterDocument.findFirst({
      where: { transporter: { userId: transporter.user.id } },
    });

    const response = await fetch(`${baseUrl}/uploads/${document.storageKey}`);
    assert.equal(response.status, 404);
  });

  await t.test('refuse un type MIME non autorise', async () => {
    const transporter = await h.createTransporter({ verified: false });
    const { status } = await uploadDocs(transporter.token, [
      { type: 'RC', mime: 'application/x-sh', body: Buffer.from('#!/bin/sh\n') },
    ]);
    assert.equal(status, 400);
  });

  await t.test('exige un type par fichier', async () => {
    const transporter = await h.createTransporter({ verified: false });

    const form = new FormData();
    form.append('files', new Blob([PNG], { type: 'image/png' }), 'a.png');
    form.append('types', 'RC');
    form.append('types', 'PATENTE');

    const response = await fetch(`${baseUrl}/api/transporters/upload-docs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${transporter.token}` },
      body: form,
    });
    assert.equal(response.status, 400);
  });

  await t.test('un nouvel envoi remet le dossier en moderation', async () => {
    const transporter = await h.createTransporter({ verified: true });
    await uploadDocs(transporter.token);

    const { body } = await h.api('GET', '/transporters/me', { token: transporter.token });
    assert.equal(body.verificationStatus, 'PENDING');
  });

  await t.test('renvoie 404 pour un document inexistant', async () => {
    const admin = await h.createAdmin();
    const response = await fetch(
      `${baseUrl}/api/transporters/documents/00000000-0000-4000-8000-000000000000`,
      { headers: { Authorization: `Bearer ${admin.token}` } }
    );
    assert.equal(response.status, 404);
  });
});
