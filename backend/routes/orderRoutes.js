const { Router } = require('express');
const {
  createOrder,
  listCanteenOrders,
  listCourierOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
<<<<<<< HEAD
const { listOrders } = require('../controllers/orders.controller');
=======
const { listOrders, getOrder, cancelOrder } = require('../controllers/orders.controller');
>>>>>>> 8466e8d987e5d2648f68fd3799c0a99c630dbd0a
const requireAuth = require('../middlewares/requireAuth');
const requireRole = require('../middlewares/requireRole');

const router = Router();

router.use(requireAuth);
router.get('/', listOrders);
router.post('/', createOrder);
router.get('/canteen', requireRole('canteen'), listCanteenOrders);
router.get('/courier', requireRole('courier'), listCourierOrders);
<<<<<<< HEAD
=======
router.get('/:id', getOrder);
router.post('/:id/cancel', cancelOrder);
>>>>>>> 8466e8d987e5d2648f68fd3799c0a99c630dbd0a
router.patch('/:id/status', requireRole('canteen', 'courier'), updateOrderStatus);

module.exports = router;
