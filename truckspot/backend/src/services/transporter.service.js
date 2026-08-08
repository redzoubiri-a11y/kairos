const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { publicUrlFor } = require('../middleware/upload');

const PROFILE_INCLUDE = {
  documents: { orderBy: { createdAt: 'desc' } },
  trucks: true,
  user: { select: { id: true, fullName: true, email: true, phone: true } },
};

async function create(userId, data) {
  const existing = await prisma.transporterProfile.findUnique({ where: { userId } });
  if (existing) throw ApiError.conflict('Un profil transporteur existe deja pour ce compte');

  // Promote the account so the token role and the profile stay consistent.
  const [, profile] = await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { role: 'TRANSPORTER' } }),
    prisma.transporterProfile.create({ data: { ...data, userId }, include: PROFILE_INCLUDE }),
  ]);

  return profile;
}

async function getMine(userId) {
  const profile = await prisma.transporterProfile.findUnique({
    where: { userId },
    include: PROFILE_INCLUDE,
  });
  if (!profile) throw ApiError.notFound('Aucun profil transporteur pour ce compte');
  return profile;
}

async function update(userId, data) {
  await getMine(userId);
  return prisma.transporterProfile.update({
    where: { userId },
    data,
    include: PROFILE_INCLUDE,
  });
}

async function uploadDocuments(userId, files, types) {
  const profile = await getMine(userId);

  if (!files?.length) throw ApiError.badRequest('Aucun fichier recu');
  if (files.length !== types.length) {
    throw ApiError.badRequest('Un type de document est requis pour chaque fichier');
  }

  const documents = await prisma.$transaction(
    files.map((file, index) =>
      prisma.transporterDocument.create({
        data: {
          transporterId: profile.id,
          type: types[index],
          fileUrl: publicUrlFor(file.filename),
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
        },
      })
    )
  );

  // Any new document set sends the profile back to the moderation queue.
  await prisma.transporterProfile.update({
    where: { id: profile.id },
    data: { verificationStatus: 'PENDING', rejectionReason: null },
  });

  return documents;
}

module.exports = { create, getMine, update, uploadDocuments };
