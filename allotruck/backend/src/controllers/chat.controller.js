const asyncHandler = require('../utils/asyncHandler');
const chatService = require('../services/chat.service');

const send = asyncHandler(async (req, res) => {
  res.status(201).json(await chatService.send(req.user, req.body));
});

const history = asyncHandler(async (req, res) => {
  const { missionId, before, limit } = req.validatedQuery;
  res.json({ items: await chatService.history(req.user, missionId, { before, limit }) });
});

const markRead = asyncHandler(async (req, res) => {
  res.json(await chatService.markRead(req.user, req.params.missionId));
});

module.exports = { send, history, markRead };
