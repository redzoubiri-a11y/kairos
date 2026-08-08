const { Router } = require('express');
const controller = require('../controllers/truck.controller');
const validate = require('../middleware/validate');
const { requireAuth, requireRole, requireVerifiedTransporter } = require('../middleware/auth');
const schemas = require('../validators');

const router = Router();

router.use(requireAuth);

// Clients browsing the map.
router.get('/available', validate(schemas.truck.available, 'query'), controller.listAvailable);

// Transporter-owned resources.
router.post('/create', requireRole('TRANSPORTER'), validate(schemas.truck.create), controller.create);
router.get('/mine', requireRole('TRANSPORTER'), controller.listMine);
router.get('/:id', validate(schemas.common.idParam, 'params'), controller.getById);
router.patch(
  '/:id',
  requireRole('TRANSPORTER'),
  validate(schemas.common.idParam, 'params'),
  validate(schemas.truck.update),
  controller.update
);
router.patch(
  '/:id/position',
  requireRole('TRANSPORTER'),
  requireVerifiedTransporter,
  validate(schemas.common.idParam, 'params'),
  validate(schemas.truck.position),
  controller.updatePosition
);
router.delete(
  '/:id',
  requireRole('TRANSPORTER'),
  validate(schemas.common.idParam, 'params'),
  controller.remove
);

module.exports = router;
