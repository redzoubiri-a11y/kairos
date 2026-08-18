const asyncHandler = require('../utils/asyncHandler');
const missionService = require('../services/mission.service');

const create = asyncHandler(async (req, res) => {
  res.status(201).json(await missionService.create(req.user, req.body));
});

const list = asyncHandler(async (req, res) => {
  res.json(await missionService.list(req.user, req.validatedQuery));
});

const getById = asyncHandler(async (req, res) => {
  const { mission } = await missionService.getAccessible(req.user, req.params.id);
  res.json(mission);
});

const updateStatus = asyncHandler(async (req, res) => {
  const { missionId, status, reason } = req.body;
  res.json(await missionService.updateStatus(req.user, missionId, status, reason));
});

module.exports = { create, list, getById, updateStatus };
