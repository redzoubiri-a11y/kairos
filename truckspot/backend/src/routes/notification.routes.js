const { Router } = require('express');
const controller = require('../controllers/notification.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const schemas = require('../validators');

const router = Router();

router.use(requireAuth);

router.get('/list', validate(schemas.common.notificationQuery, 'query'), controller.list);
router.patch('/read-all', controller.markAllRead);

router.post('/devices', validate(schemas.device.register), controller.registerDevice);
router.get('/devices', controller.listDevices);
router.delete('/devices', validate(schemas.device.unregister), controller.unregisterDevice);

module.exports = router;
