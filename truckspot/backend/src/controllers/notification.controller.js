const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notification.service');
const deviceService = require('../services/device.service');

const list = asyncHandler(async (req, res) => {
  const { unreadOnly, take } = req.validatedQuery;
  res.json({ items: await notificationService.list(req.user.id, { unreadOnly, take }) });
});

const markAllRead = asyncHandler(async (req, res) => {
  res.json(await notificationService.markAllRead(req.user.id));
});

const registerDevice = asyncHandler(async (req, res) => {
  res.status(201).json(await deviceService.register(req.user.id, req.body));
});

const unregisterDevice = asyncHandler(async (req, res) => {
  res.json(await deviceService.unregister(req.user.id, req.body.token));
});

const listDevices = asyncHandler(async (req, res) => {
  res.json({ items: await deviceService.list(req.user.id) });
});

module.exports = { list, markAllRead, registerDevice, unregisterDevice, listDevices };
