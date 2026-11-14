const {
  getDemoPayment,
  confirmDemoPayment,
} = require('../controllers/demoPayment.controller');
const { Router } = require('express');
const { generateQris, handleMidtransNotification } = require('../controllers/payment.controller');
const requireAuth = require('../middlewares/requireAuth');
const requireRole = require('../middlewares/requireRole');

const router = Router();

router.post('/qris/generate', requireAuth, requireRole('customer'), generateQris);
router.post('/qris/notification', handleMidtransNotification);

router.get(
  '/demo/:orderId',
  requireAuth,
  requireRole('customer', 'admin', 'canteen'),
  getDemoPayment
);

router.post(
  '/demo/:orderId/confirm',
  requireAuth,
  requireRole('admin', 'canteen'),
  confirmDemoPayment
);

module.exports = router;
