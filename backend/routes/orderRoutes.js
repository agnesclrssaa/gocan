const {
  submitRunnerRating,
  getRunnerRating,
} = require('../controllers/runnerRating.controller');
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
const {
  submitRating,
  getOrderRating,
} = require('../controllers/rating.controller');
const router = Router();

router.use(requireAuth);
router.post(
  '/verify-pickup',
  requireRole('admin', 'canteen', 'runner'),
  requireApprovedRunner,
  verifyPickup
);
router.get('/', listOrders);
router.post('/', requireRole('customer'), createOrder);
router.get(
  '/canteen',
  requireRole('admin', 'canteen'),
  listCanteenOrders
);
router.get('/courier', requireRole('runner', 'courier'), requireApprovedRunner, listCourierOrders);
router.get(
  '/:orderId/rating',
  requireRole('customer'),
  getOrderRating
);
router.post('/:orderId/rating', requireRole('customer'), submitRating);
router.get(
  '/:orderId/runner-rating',
  requireRole('customer'),
  getRunnerRating
);

router.post(
  '/:orderId/runner-rating',
  requireRole('customer'),
  submitRunnerRating
);
router.get('/:id', getOrder);
router.post('/:id/cancel', cancelOrder);
router.patch('/:id/status', requireRole('canteen', 'runner', 'courier'), requireApprovedRunner, updateOrderStatus);

module.exports = router;
