const asyncHandler = require('../utils/asyncHandler');
const tripService = require('../services/trip.service');

const create = asyncHandler(async (req, res) => {
  res.status(201).json(await tripService.create(req.user.id, req.body));
});

const list = asyncHandler(async (req, res) => {
  res.json(await tripService.list(req.validatedQuery, req.user));
});

const getById = asyncHandler(async (req, res) => {
  res.json(await tripService.getById(req.params.id));
});

const update = asyncHandler(async (req, res) => {
  res.json(await tripService.update(req.user.id, req.params.id, req.body));
});

const remove = asyncHandler(async (req, res) => {
  res.json(await tripService.remove(req.user.id, req.params.id));
});

module.exports = { create, list, getById, update, remove };
