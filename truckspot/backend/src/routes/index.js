const { Router } = require('express');

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

router.use('/auth', require('./auth.routes'));
router.use('/transporters', require('./transporter.routes'));
router.use('/trucks', require('./truck.routes'));
router.use('/trips', require('./trip.routes'));
router.use('/missions', require('./mission.routes'));
router.use('/chat', require('./chat.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
