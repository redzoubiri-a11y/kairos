const asyncHandler = require('../utils/asyncHandler');
const truckService = require('../services/truck.service');

const create = asyncHandler(async (req, res) => {
  res.status(201).json(await truckService.create(req.user.id, req.body));
});

const listMine = asyncHandler(async (req, res) => {
  res.json({ items: await truckService.listMine(req.user.id) });
});

const listAvailable = asyncHandler(async (req, res) => {
  res.json({ items: await truckService.listAvailable(req.validatedQuery) });
});

const getById = asyncHandler(async (req, res) => {
  res.json(await truckService.getById(req.params.id));
});

const update = asyncHandler(async (req, res) => {
  res.json(await truckService.update(req.user.id, req.params.id, req.body));
});

const updatePosition = asyncHandler(async (req, res) => {
  res.json(await truckService.updatePosition(req.user.id, req.params.id, req.body));
});

const remove = asyncHandler(async (req, res) => {
  res.json(await truckService.remove(req.user.id, req.params.id));
});

module.exports = { create, listMine, listAvailable, getById, update, updatePosition, remove };
