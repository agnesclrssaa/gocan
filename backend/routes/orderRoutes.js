const { Router } = require('express');
const {
  createOrder,
  listCanteenOrders,
  listCourierOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const {
  listOrders,
  getOrder,
  cancelOrder,
  verifyPickup,
} = require('../controllers/orders.controller');
const requireAuth = require('../middlewares/requireAuth');
const requireApprovedRunner = require('../middlewares/requireApprovedRunner');
const requireRole = require('../middlewares/requireRole');
const { submitRating } = require('../controllers/rating.controller');

const router = Router();

router.use(requireAuth);
router.post('/verify-pickup', requireRole('canteen', 'runner'), requireApprovedRunner, verifyPickup);
router.get('/', listOrders);
router.post('/', requireRole('customer'), createOrder);
router.get('/canteen', requireRole('canteen'), listCanteenOrders);
router.get('/courier', requireRole('runner', 'courier'), requireApprovedRunner, listCourierOrders);
router.post('/:orderId/rating', requireRole('customer'), submitRating);
router.get('/:id', getOrder);
router.post('/:id/cancel', cancelOrder);
router.patch('/:id/status', requireRole('canteen', 'runner', 'courier'), requireApprovedRunner, updateOrderStatus);

module.exports = router;
