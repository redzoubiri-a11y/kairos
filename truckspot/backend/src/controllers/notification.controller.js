const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notification.service');

const list = asyncHandler(async (req, res) => {
  const { unreadOnly, take } = req.validatedQuery;
  res.json({ items: await notificationService.list(req.user.id, { unreadOnly, take }) });
});

const markAllRead = asyncHandler(async (req, res) => {
  res.json(await notificationService.markAllRead(req.user.id));
});

module.exports = { list, markAllRead };
