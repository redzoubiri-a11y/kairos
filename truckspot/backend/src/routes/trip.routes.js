const { Router } = require('express');
const controller = require('../controllers/trip.controller');
const validate = require('../middleware/validate');
const { requireAuth, requireRole, requireVerifiedTransporter } = require('../middleware/auth');
const schemas = require('../validators');

const router = Router();

router.use(requireAuth);

router.post(
  '/create',
  requireRole('TRANSPORTER'),
  requireVerifiedTransporter,
  validate(schemas.trip.create),
  controller.create
);
router.get('/list', validate(schemas.trip.list, 'query'), controller.list);
router.get('/:id', validate(schemas.common.idParam, 'params'), controller.getById);
router.patch(
  '/:id',
  requireRole('TRANSPORTER'),
  validate(schemas.common.idParam, 'params'),
  validate(schemas.trip.update),
  controller.update
);
router.delete(
  '/:id',
  requireRole('TRANSPORTER'),
  validate(schemas.common.idParam, 'params'),
  controller.remove
);

module.exports = router;
