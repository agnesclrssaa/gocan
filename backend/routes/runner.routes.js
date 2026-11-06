const { Router } = require('express');
const {
  acceptOrder,
  getKtmPhoto,
  listAvailableOrders,
} = require('../controllers/runner.controller');
const requireAuth = require('../middlewares/requireAuth');
const requireApprovedRunner = require('../middlewares/requireApprovedRunner');
const requireRole = require('../middlewares/requireRole');

const router = Router();

router.get('/:id/ktm', requireAuth, requireRole('runner', 'admin'), getKtmPhoto);
router.use(requireAuth, requireRole('runner'), requireApprovedRunner);
router.get('/available-orders', listAvailableOrders);
router.post('/accept-order', acceptOrder);
router.post('/accept-order/:orderId', acceptOrder);

module.exports = router;
