const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { EXTENSIONS } = require('../services/storage.service');

// Files are held in memory then handed to the storage driver, so the same code
// path serves the local disk and an S3-compatible bucket. Bounded by
// maxUploadBytes x 4 files, which stays small.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadBytes, files: 4 },
  fileFilter: (req, file, cb) => {
    if (!EXTENSIONS[file.mimetype]) {
      return cb(ApiError.badRequest('Format accepte: JPEG, PNG, WEBP ou PDF'));
    }
    cb(null, true);
  },
});

module.exports = { upload };
