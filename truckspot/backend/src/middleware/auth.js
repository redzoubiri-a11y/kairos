const jwt = require('jsonwebtoken');
const env = require('../config/env');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
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

module.exports = { signToken, verifyToken, requireAuth, requireRole, requireVerifiedTransporter };
