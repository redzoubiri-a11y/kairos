const jwt = require('jsonwebtoken');
const env = require('../config/env');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, ver: user.tokenVersion ?? 0 }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

// Un jeton dont la version est depassee ne vaut plus : c'est ce qui ferme les
// sessions ouvertes lors d'un changement de mot de passe. Les jetons emis avant
// l'introduction du compteur n'en portent pas — ils valent la version 0, et
// restent donc valables tant que le mot de passe n'a pas change.
function isTokenCurrent(payload, user) {
  return (payload.ver ?? 0) === (user.tokenVersion ?? 0);
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw ApiError.unauthorized();
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw ApiError.unauthorized('Token invalide ou expire');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { transporter: { select: { id: true, verificationStatus: true } } },
    });

    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Compte introuvable ou desactive');
    }

    if (!isTokenCurrent(payload, user)) {
      throw ApiError.unauthorized('Mot de passe modifie, reconnectez-vous');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Reserve aux roles: ${roles.join(', ')}`));
    }
    next();
  };
}

// A transporter must have a profile AND be verified by an admin before it can
// publish trips or answer missions.
function requireVerifiedTransporter(req, res, next) {
  if (!req.user?.transporter) {
    return next(ApiError.forbidden('Profil transporteur manquant'));
  }
  if (req.user.transporter.verificationStatus !== 'VERIFIED') {
    return next(ApiError.forbidden('Compte transporteur non verifie par un administrateur'));
  }
  next();
}

module.exports = {
  signToken,
  verifyToken,
  isTokenCurrent,
  requireAuth,
  requireRole,
  requireVerifiedTransporter,
};
