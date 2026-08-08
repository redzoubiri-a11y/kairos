const asyncHandler = require('../utils/asyncHandler');
const transporterService = require('../services/transporter.service');
const documentService = require('../services/document.service');

const create = asyncHandler(async (req, res) => {
  res.status(201).json(await transporterService.create(req.user.id, req.body));
});

const getMine = asyncHandler(async (req, res) => {
  res.json(await transporterService.getMine(req.user.id));
});

const update = asyncHandler(async (req, res) => {
  res.json(await transporterService.update(req.user.id, req.body));
});

const uploadDocs = asyncHandler(async (req, res) => {
  const documents = await transporterService.uploadDocuments(req.user.id, req.files, req.body.types);
  res.status(201).json({ documents });
});

// Owner or admin only. The bucket / upload directory is never publicly readable,
// so this route is the single way back to an identity document.
const getDocument = asyncHandler(async (req, res) => {
  const document = await documentService.getAccessible(req.user, req.params.id);

  if (documentService.driverName() === 's3') {
    return res.redirect(302, await documentService.signedUrl(document));
  }

  res.setHeader('Content-Type', document.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.originalName)}"`);
  res.setHeader('Cache-Control', 'private, no-store');

  const stream = await documentService.openStream(document);
  stream.on('error', () => res.destroy());
  stream.pipe(res);
});

module.exports = { create, getMine, update, uploadDocs, getDocument };
