const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/admin.service');
const tripService = require('../services/trip.service');
const missionService = require('../services/mission.service');

const listTransporters = asyncHandler(async (req, res) => {
  res.json(await adminService.listTransporters(req.validatedQuery));
});

const verifyTransporter = asyncHandler(async (req, res) => {
  const { transporterId, status, reason } = req.body;
  res.json(await adminService.verifyTransporter(transporterId, { status, reason }));
});

const listTrips = asyncHandler(async (req, res) => {
  res.json(await tripService.list({ ...req.validatedQuery, adminView: true }));
});

const listMissions = asyncHandler(async (req, res) => {
  res.json(await missionService.list(req.user, { ...req.validatedQuery, role: 'all' }));
});

const stats = asyncHandler(async (req, res) => {
  res.json(await adminService.stats());
});

const listUsers = asyncHandler(async (req, res) => {
  res.json(await adminService.listUsers(req.validatedQuery));
});

const setUserActive = asyncHandler(async (req, res) => {
  res.json(await adminService.setUserActive(req.params.id, req.body.isActive));
});

module.exports = {
  listTransporters,
  verifyTransporter,
  listTrips,
  listMissions,
  stats,
  listUsers,
  setUserActive,
};
