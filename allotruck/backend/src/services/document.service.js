const prisma = require('../config/prisma');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { driver } = require('./storage.service');

// Identity documents are never public: clients receive an API URL that requires a
// token, not a link to the underlying object.
function documentUrl(document) {
  return `${env.publicUrl}/api/transporters/documents/${document.id}`;
}

function withUrl(document) {
  if (!document) return document;
  const { storageKey, ...rest } = document;
  return { ...rest, url: documentUrl(document) };
}

function withUrls(documents = []) {
  return documents.map(withUrl);
}

// Attaches the public-facing URL to a transporter profile and hides storage keys.
function decorateProfile(profile) {
  if (!profile?.documents) return profile;
  return { ...profile, documents: withUrls(profile.documents) };
}

// Same treatment for the transporter profile nested in an authenticated user.
function decorateUser(user) {
  if (!user?.transporter) return user;
  return { ...user, transporter: decorateProfile(user.transporter) };
}

async function getAccessible(user, documentId) {
  const document = await prisma.transporterDocument.findUnique({
    where: { id: documentId },
    include: { transporter: { select: { userId: true } } },
  });
  if (!document) throw ApiError.notFound('Document introuvable');

  const isOwner = document.transporter.userId === user.id;
  if (!isOwner && user.role !== 'ADMIN') {
    throw ApiError.forbidden("Vous n'avez pas acces a ce document");
  }

  return document;
}

async function openStream(document) {
  return driver.createReadStream(document.storageKey);
}

async function signedUrl(document) {
  return driver.signedUrl(document.storageKey);
}

module.exports = {
  documentUrl,
  withUrl,
  withUrls,
  decorateProfile,
  decorateUser,
  getAccessible,
  openStream,
  signedUrl,
  driverName: () => driver.name,
};
