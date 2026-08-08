const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const uploadRoot = path.resolve(process.cwd(), env.uploadDir);
fs.mkdirSync(uploadRoot, { recursive: true });

const ALLOWED_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadRoot),
  filename: (req, file, cb) => {
    // Never trust the client filename for the path on disk.
    const ext = ALLOWED_MIME[file.mimetype] || '';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadBytes, files: 4 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME[file.mimetype]) {
      return cb(ApiError.badRequest('Format accepte: JPEG, PNG, WEBP ou PDF'));
    }
    cb(null, true);
  },
});

function publicUrlFor(filename) {
  return `${env.publicUrl}/${env.uploadDir}/${filename}`;
}

module.exports = { upload, uploadRoot, publicUrlFor };
