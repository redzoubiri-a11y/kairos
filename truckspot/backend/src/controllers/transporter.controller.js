const asyncHandler = require('../utils/asyncHandler');
const transporterService = require('../services/transporter.service');

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

module.exports = { create, getMine, update, uploadDocs };
