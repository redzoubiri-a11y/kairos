const { Router } = require('express');
const controller = require('../controllers/chat.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const schemas = require('../validators');

const router = Router();

router.use(requireAuth);

router.post('/send', validate(schemas.chat.send), controller.send);
router.get('/history', validate(schemas.chat.history, 'query'), controller.history);
router.patch(
  '/:missionId/read',
  validate(schemas.common.missionIdParam, 'params'),
  controller.markRead
);

module.exports = router;
