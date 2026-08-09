const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../middleware/auth');
const { toPublicUser } = require('../utils/serialize');
const documentService = require('./document.service');

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
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('Utilisateur introuvable');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw ApiError.badRequest('Mot de passe actuel incorrect');

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });
  return { success: true };
}

module.exports = { signup, login, me, updateProfile, changePassword };
