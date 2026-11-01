const { Router } = require('express');
const {
  createOrder,
  listCanteenOrders,
  listCourierOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { listOrders, getOrder, cancelOrder } = require('../controllers/orders.controller');
const requireAuth = require('../middlewares/requireAuth');
const requireRole = require('../middlewares/requireRole');

const router = Router();

router.use(requireAuth);
router.get('/', listOrders);
router.post('/', createOrder);
router.get('/canteen', requireRole('canteen'), listCanteenOrders);
router.get('/courier', requireRole('courier'), listCourierOrders);
router.get('/:id', getOrder);
router.post('/:id/cancel', cancelOrder);
router.patch('/:id/status', requireRole('canteen', 'courier'), updateOrderStatus);

module.exports = router;
