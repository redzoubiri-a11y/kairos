const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../middleware/auth');
const { toPublicUser } = require('../utils/serialize');
const documentService = require('./document.service');
const mailer = require('./mailer.service');

const USER_INCLUDE = {
  transporter: {
    include: { documents: true, _count: { select: { trucks: true, trips: true } } },
  },
};

async function signup({ email, password, fullName, phone, role, company }) {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw ApiError.conflict('Un compte existe deja avec cet email');

  if (role === 'TRANSPORTER' && !company) {
    throw ApiError.badRequest('Les informations entreprise sont requises pour un transporteur', [
      { field: 'company', message: 'companyName et city sont requis' },
    ]);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      fullName,
      phone,
      role,
      ...(role === 'TRANSPORTER'
        ? {
            transporter: {
              create: {
                companyName: company.companyName,
                city: company.city,
                address: company.address,
                rcNumber: company.rcNumber,
                nifNumber: company.nifNumber,
              },
            },
          }
        : {}),
    },
    include: USER_INCLUDE,
  });

  return { token: signToken(user), user: documentService.decorateUser(toPublicUser(user)) };
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: USER_INCLUDE,
  });

  // Same error for unknown email and wrong password: no account enumeration.
  if (!user) throw ApiError.unauthorized('Email ou mot de passe incorrect');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Email ou mot de passe incorrect');
  if (!user.isActive) throw ApiError.forbidden('Compte desactive');

  return { token: signToken(user), user: documentService.decorateUser(toPublicUser(user)) };
}

async function me(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: USER_INCLUDE });
  if (!user) throw ApiError.notFound('Utilisateur introuvable');
  return documentService.decorateUser(toPublicUser(user));
}

async function updateProfile(userId, data) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    include: USER_INCLUDE,
  });
  return documentService.decorateUser(toPublicUser(user));
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: USER_INCLUDE });
  if (!user) throw ApiError.notFound('Utilisateur introuvable');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw ApiError.badRequest('Mot de passe actuel incorrect');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await bcrypt.hash(newPassword, 10),
      passwordChangedAt: new Date(),
      tokenVersion: { increment: 1 },
    },
    include: USER_INCLUDE,
  });

  // Les autres sessions tombent avec l'increment ; celle qui fait la demande
  // recoit un jeton a la nouvelle version, pour ne pas se deconnecter elle-meme.
  return { success: true, token: signToken(updated) };
}

const CODE_LENGTH = 6;

function generateCode() {
  // randomInt plutot que Math.random : le code protege l'acces a un compte.
  return String(crypto.randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, '0');
}

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function sameHash(a, b) {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

async function requestPasswordReset({ email }) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Reponse identique que le compte existe ou non : demander une
  // reinitialisation ne doit pas reveler qui est inscrit. Meme chose pour un
  // compte desactive, sinon la reponse trahit son existence.
  if (!user || !user.isActive) return { success: true };

  // Une seule demande vivante a la fois : les codes precedents disparaissent.
  await prisma.passwordResetCode.deleteMany({ where: { userId: user.id, usedAt: null } });

  const code = generateCode();
  await prisma.passwordResetCode.create({
    data: {
      userId: user.id,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + env.resetCodeTtlMinutes * 60_000),
    },
  });

  await mailer.sendPasswordResetCode(user, code);
  return { success: true };
}

async function resetPassword({ email, code, password }) {
  const normalizedEmail = email.toLowerCase().trim();
  // Message unique pour toutes les issues : un code faux, expire, deja utilise
  // ou rattache a un email inconnu se ressemblent vus du dehors.
  const rejet = ApiError.badRequest('Code invalide ou expire');

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.isActive) throw rejet;

  const record = await prisma.passwordResetCode.findFirst({
    where: { userId: user.id, usedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  if (!record) throw rejet;
  if (record.expiresAt.getTime() < Date.now()) throw rejet;
  if (record.attempts >= env.resetCodeMaxAttempts) throw rejet;

  if (!sameHash(record.codeHash, hashCode(code))) {
    await prisma.passwordResetCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw rejet;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.passwordResetCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: user.id },
      // L'increment ferme les sessions ouvertes : reinitialiser sans cela
      // laisserait un intrus connecte jusqu'a l'expiration de son jeton.
      data: { passwordHash, passwordChangedAt: new Date(), tokenVersion: { increment: 1 } },
    }),
  ]);

  return { success: true };
}

module.exports = {
  signup,
  login,
  me,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
};
