const crypto = require('crypto');
const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');
const { driver } = require('./storage.service');
const documentService = require('./document.service');

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

  return documentService.decorateProfile(profile);
}

async function getMine(userId) {
  const profile = await prisma.transporterProfile.findUnique({
    where: { userId },
    include: PROFILE_INCLUDE,
  });
  if (!profile) throw ApiError.notFound('Aucun profil transporteur pour ce compte');
  return documentService.decorateProfile(profile);
}

async function update(userId, data) {
  await getMine(userId);
  const profile = await prisma.transporterProfile.update({
    where: { userId },
    data,
    include: PROFILE_INCLUDE,
  });
  return documentService.decorateProfile(profile);
}

async function uploadDocuments(userId, files, types) {
  const profile = await getMine(userId);

  if (!files?.length) throw ApiError.badRequest('Aucun fichier recu');
  if (files.length !== types.length) {
    throw ApiError.badRequest('Un type de document est requis pour chaque fichier');
  }
  // Un seul fichier par type dans une meme requete : l'ecran n'affiche qu'une
  // carte par type, et deux RC envoyes ensemble laisseraient un doublon que le
  // remplacement ci-dessous ne peut pas trancher.
  if (new Set(types).size !== types.length) {
    throw ApiError.badRequest('Un seul fichier par type de document');
  }

  // Written to storage first: a row pointing at a missing object would be worse
  // than an orphan object nobody references.
  const stored = [];
  for (const [index, file] of files.entries()) {
    const storageKey = await driver.save(file, `transporters/${profile.id}`);
    stored.push({
      id: crypto.randomUUID(),
      transporterId: profile.id,
      type: types[index],
      storageKey,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });
  }

  // Une piece du meme type est remplacee, pas empilee : l'ecran n'affiche
  // qu'une carte par type, et rien n'appelait jamais driver.remove(). Un
  // transporteur qui corrigeait un RC illisible laissait donc l'ancien dans le
  // stockage indefiniment — une piece d'identite que plus personne ne consulte
  // et que rien ne purge — et l'administrateur voyait deux RC sans savoir
  // lequel faisait foi.
  const remplacees = await prisma.transporterDocument.findMany({
    where: { transporterId: profile.id, type: { in: types } },
  });

  const documents = await prisma.$transaction(async (tx) => {
    if (remplacees.length) {
      await tx.transporterDocument.deleteMany({
        where: { id: { in: remplacees.map((doc) => doc.id) } },
      });
    }

    const crees = [];
    for (const data of stored) {
      crees.push(await tx.transporterDocument.create({ data }));
    }

    // Any new document set sends the profile back to the moderation queue.
    await tx.transporterProfile.update({
      where: { id: profile.id },
      data: {
        verificationStatus: 'PENDING',
        rejectionReason: null,
        // Sans cela le back-office affichait « Verifie le <date> » sur un
        // dossier redevenu en attente.
        verifiedAt: null,
      },
    });

    return crees;
  });

  // Les objets ne partent qu'une fois la transaction acquittee, et un echec de
  // suppression ne fait pas echouer l'envoi : un objet orphelin reste moins
  // grave qu'une ligne pointant vers un fichier absent.
  for (const doc of remplacees) {
    await driver.remove(doc.storageKey).catch((error) => {
      console.warn(`[storage] suppression impossible (${doc.storageKey}):`, error.message);
    });
  }

  return documentService.withUrls(documents);
}

module.exports = { create, getMine, update, uploadDocuments };
