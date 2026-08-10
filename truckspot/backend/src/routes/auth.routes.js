const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const env = require('../config/env');
const schemas = require('../validators');

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Trop de tentatives, reessayez dans 15 minutes' } },
  skip: () => env.disableRateLimit,
});

router.post('/signup', authLimiter, validate(schemas.auth.signup), controller.signup);
router.post('/login', authLimiter, validate(schemas.auth.login), controller.login);
router.get('/me', requireAuth, controller.me);
router.patch('/me', requireAuth, validate(schemas.auth.updateProfile), controller.updateProfile);
router.post(
  '/change-password',
  requireAuth,
  validate(schemas.auth.changePassword),
  controller.changePassword
);

router.post(
  '/forgot-password',
  authLimiter,
  validate(schemas.auth.forgotPassword),
  controller.forgotPassword
);
router.post(
  '/reset-password',
  authLimiter,
  validate(schemas.auth.resetPassword),
  controller.resetPassword
);

module.exports = router;
