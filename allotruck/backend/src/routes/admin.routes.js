const { Router } = require('express');
const controller = require('../controllers/admin.controller');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const schemas = require('../validators');

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/stats', controller.stats);
router.get('/transporters', validate(schemas.admin.listTransporters, 'query'), controller.listTransporters);
router.get(
  '/transporters/:id',
  validate(schemas.common.idParam, 'params'),
  controller.getTransporter
);
router.patch(
  '/verify-transporter',
  validate(schemas.admin.verifyTransporter),
  controller.verifyTransporter
);
router.get('/trips', validate(schemas.trip.list, 'query'), controller.listTrips);
router.get('/missions', validate(schemas.mission.list, 'query'), controller.listMissions);
router.get('/users', validate(schemas.admin.listUsers, 'query'), controller.listUsers);
router.patch(
  '/users/:id/active',
  validate(schemas.common.idParam, 'params'),
  validate(schemas.admin.setUserActive),
  controller.setUserActive
);

module.exports = router;
