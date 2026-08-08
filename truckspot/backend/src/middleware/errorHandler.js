const multer = require('multer');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: `Route inconnue: ${req.method} ${req.originalUrl}` } });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { message: err.message, details: err.details } });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: { message: `Upload refuse: ${err.message}` } });
  }

  if (err?.code === 'P2002') {
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'champ';
    return res.status(409).json({ error: { message: `Valeur deja utilisee (${target})` } });
  }

  if (err?.code === 'P2025') {
    return res.status(404).json({ error: { message: 'Ressource introuvable' } });
  }

  console.error('[unhandled]', err);
  res.status(500).json({
    error: {
      message: 'Erreur serveur interne',
      ...(env.isProduction ? {} : { stack: err?.stack }),
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
