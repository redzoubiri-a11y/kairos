const { Router } = require('express');
const controller = require('../controllers/transporter.controller');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const schemas = require('../validators');

const router = Router();

router.use(requireAuth);

// Comme mission.create : reserve au role qui peut legitimement declencher
// cette action. Sans ce garde-fou, un compte ADMIN (aucun profil
// transporteur, donc jamais bloque par le conflit "profil deja existant")
// pouvait s'auto-convertir en TRANSPORTER via cette route et perdre ses
// privileges ADMIN, ceux-ci n'etant jamais reattribuables via l'app (les
// comptes ADMIN sont provisionnes uniquement par le script de seed).
router.post('/create', requireRole('CLIENT'), validate(schemas.transporter.create), controller.create);
router.get('/me', controller.getMine);
router.get(
  '/documents/:id',
  validate(schemas.common.idParam, 'params'),
  controller.getDocument
);
router.patch('/me', validate(schemas.transporter.update), controller.update);
router.post(
  '/upload-docs',
  upload.array('files', 4),
  validate(schemas.transporter.uploadDocs),
  controller.uploadDocs
);

module.exports = router;
