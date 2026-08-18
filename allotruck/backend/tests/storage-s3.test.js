const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// A minimal S3-compatible endpoint: enough to exercise the real AWS SDK path
// (SigV4 signing, path-style addressing, presigned GET) without a live bucket.
function startFakeS3() {
  const objects = new Map();

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const [, bucket, ...rest] = url.pathname.split('/');
    const key = rest.join('/');

    if (req.method === 'PUT') {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        objects.set(`${bucket}/${key}`, {
          body: Buffer.concat(chunks),
          contentType: req.headers['content-type'],
        });
        res.writeHead(200, { ETag: '"fake"' }).end();
      });
      return;
    }

    if (req.method === 'GET') {
      // A presigned GET must carry the signature in the query string.
      const signed = url.searchParams.has('X-Amz-Signature');
      const object = objects.get(`${bucket}/${key}`);
      if (!object) return res.writeHead(404).end();
      res.writeHead(200, {
        'Content-Type': object.contentType ?? 'application/octet-stream',
        'x-signed-request': String(signed),
      });
      return res.end(object.body);
    }

    if (req.method === 'DELETE') {
      objects.delete(`${bucket}/${key}`);
      return res.writeHead(204).end();
    }

    res.writeHead(405).end();
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () =>
      resolve({ server, objects, port: server.address().port })
    );
  });
}

test('driver de stockage s3', async (t) => {
  const fake = await startFakeS3();

  // Must be set before storage.service reads the configuration.
  process.env.STORAGE_DRIVER = 's3';
  process.env.S3_ENDPOINT = `http://127.0.0.1:${fake.port}`;
  process.env.S3_REGION = 'us-east-1';
  process.env.S3_BUCKET = 'allotruck-test';
  process.env.S3_ACCESS_KEY_ID = 'test-key';
  process.env.S3_SECRET_ACCESS_KEY = 'test-secret';

  const { driver } = require('../src/services/storage.service');

  t.after(() => new Promise((resolve) => fake.server.close(resolve)));

  assert.equal(driver.name, 's3', 'STORAGE_DRIVER=s3 selectionne bien le driver s3');

  const payload = Buffer.from('contenu du registre de commerce');
  let key;

  await t.test('televerse l objet sous un prefixe par transporteur', async () => {
    key = await driver.save({ buffer: payload, mimetype: 'image/png' }, 'transporters/abc');

    assert.match(key, /^transporters\/abc\/[0-9a-f-]{36}\.png$/);
    const stored = fake.objects.get(`allotruck-test/${key}`);
    assert.ok(stored, 'objet present dans le bucket');
    assert.deepEqual(stored.body, payload);
    assert.equal(stored.contentType, 'image/png');
  });

  await t.test('genere une URL signee qui restitue le contenu', async () => {
    const url = await driver.signedUrl(key, 300);

    assert.ok(url.startsWith(`http://127.0.0.1:${fake.port}/allotruck-test/`));
    assert.match(url, /X-Amz-Signature=/);
    assert.match(url, /X-Amz-Expires=300/);

    const response = await fetch(url);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-signed-request'), 'true');
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), payload);
  });

  await t.test('supprime un objet', async () => {
    await driver.remove(key);
    assert.equal(fake.objects.has(`allotruck-test/${key}`), false);
  });

  await t.test('deux envois ne se marchent pas dessus', async () => {
    const first = await driver.save({ buffer: payload, mimetype: 'application/pdf' }, 'transporters/x');
    const second = await driver.save({ buffer: payload, mimetype: 'application/pdf' }, 'transporters/x');

    assert.notEqual(first, second);
    assert.match(first, /\.pdf$/);
  });
});
