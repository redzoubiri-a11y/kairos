const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

function buildKey(prefix, mimeType) {
  return `${prefix}/${crypto.randomUUID()}${EXTENSIONS[mimeType] ?? ''}`;
}

// --- Local disk -------------------------------------------------------------
// Fine for development and for a host with a persistent volume. Anything with an
// ephemeral filesystem (Railway, Render, Fly without a volume) loses the files on
// every redeploy — use the s3 driver there.

const uploadRoot = path.resolve(process.cwd(), env.uploadDir);

const localDriver = {
  name: 'local',

  async save({ buffer, mimetype }, prefix) {
    const key = buildKey(prefix, mimetype);
    const target = path.join(uploadRoot, key);
    await fsp.mkdir(path.dirname(target), { recursive: true });
    await fsp.writeFile(target, buffer);
    return key;
  },

  // Resolved against uploadRoot and checked: a crafted key must not escape it.
  resolve(key) {
    const target = path.resolve(uploadRoot, key);
    if (!target.startsWith(uploadRoot + path.sep)) {
      throw ApiError.badRequest('Chemin de document invalide');
    }
    return target;
  },

  async createReadStream(key) {
    const target = this.resolve(key);
    await fsp.access(target).catch(() => {
      throw ApiError.notFound('Fichier introuvable');
    });
    return fs.createReadStream(target);
  },

  async remove(key) {
    await fsp.rm(this.resolve(key), { force: true });
  },
};

// --- S3-compatible ----------------------------------------------------------
// Works with AWS S3, Cloudflare R2, Scaleway, MinIO. The bucket stays private:
// documents are read back through a short-lived signed URL.

function createS3Driver() {
  let client;
  let S3;
  let signer;

  function ensureClient() {
    if (client) return client;

    try {
      S3 = require('@aws-sdk/client-s3');
      signer = require('@aws-sdk/s3-request-presigner');
    } catch {
      throw new Error(
        "STORAGE_DRIVER=s3 requiert les paquets @aws-sdk/client-s3 et @aws-sdk/s3-request-presigner"
      );
    }

    for (const key of ['s3Bucket', 's3AccessKeyId', 's3SecretAccessKey']) {
      if (!env[key]) throw new Error(`STORAGE_DRIVER=s3 requiert la variable ${key}`);
    }

    client = new S3.S3Client({
      region: env.s3Region,
      ...(env.s3Endpoint ? { endpoint: env.s3Endpoint, forcePathStyle: true } : {}),
      credentials: {
        accessKeyId: env.s3AccessKeyId,
        secretAccessKey: env.s3SecretAccessKey,
      },
    });

    return client;
  }

  return {
    name: 's3',

    async save({ buffer, mimetype }, prefix) {
      const c = ensureClient();
      const key = buildKey(prefix, mimetype);
      await c.send(
        new S3.PutObjectCommand({
          Bucket: env.s3Bucket,
          Key: key,
          Body: buffer,
          ContentType: mimetype,
        })
      );
      return key;
    },

    async signedUrl(key, expiresIn = 300) {
      const c = ensureClient();
      return signer.getSignedUrl(
        c,
        new S3.GetObjectCommand({ Bucket: env.s3Bucket, Key: key }),
        { expiresIn }
      );
    },

    async remove(key) {
      const c = ensureClient();
      await c.send(new S3.DeleteObjectCommand({ Bucket: env.s3Bucket, Key: key }));
    },
  };
}

const driver = env.storageDriver === 's3' ? createS3Driver() : localDriver;

if (driver.name === 'local') {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

module.exports = { driver, uploadRoot, EXTENSIONS };
