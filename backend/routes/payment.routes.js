const { Router } = require('express');
const { generateQris, handleMidtransNotification } = require('../controllers/payment.controller');
const requireAuth = require('../middlewares/requireAuth');
const requireRole = require('../middlewares/requireRole');

const router = Router();

router.post('/qris/generate', requireAuth, requireRole('customer'), generateQris);
router.post('/qris/notification', handleMidtransNotification);

module.exports = router;
