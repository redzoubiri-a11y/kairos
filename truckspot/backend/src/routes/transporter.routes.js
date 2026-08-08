const { Router } = require('express');
const controller = require('../controllers/transporter.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const schemas = require('../validators');

const router = Router();

router.use(requireAuth);

router.post('/create', validate(schemas.transporter.create), controller.create);
router.get('/me', controller.getMine);
router.patch('/me', validate(schemas.transporter.update), controller.update);
router.post(
  '/upload-docs',
  upload.array('files', 4),
  validate(schemas.transporter.uploadDocs),
  controller.uploadDocs
);

module.exports = router;
