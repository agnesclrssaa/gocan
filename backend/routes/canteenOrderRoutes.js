const { Router } = require('express');
const { listCanteenOrders } = require('../controllers/orderController');
const requireAuth = require('../middlewares/requireAuth');
const requireRole = require('../middlewares/requireRole');

const router = Router();

router.use(requireAuth, requireRole('canteen'));
router.get('/orders', listCanteenOrders);

module.exports = router;
