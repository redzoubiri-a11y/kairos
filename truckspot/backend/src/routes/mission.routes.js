const { Router } = require('express');
const controller = require('../controllers/mission.controller');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const schemas = require('../validators');

const router = Router();

router.use(requireAuth);

router.post('/create', requireRole('CLIENT'), validate(schemas.mission.create), controller.create);
router.get('/list', validate(schemas.mission.list, 'query'), controller.list);
router.patch('/update-status', validate(schemas.mission.updateStatus), controller.updateStatus);
router.get('/:id', validate(schemas.common.idParam, 'params'), controller.getById);

module.exports = router;
