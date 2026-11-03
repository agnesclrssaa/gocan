const { Router } = require('express');
const {
  assignOrder,
  getOverview,
  listUsers,
  updateUserApproval,
} = require('../controllers/admin.controller');
const requireAuth = require('../middlewares/requireAuth');
const requireRole = require('../middlewares/requireRole');

const router = Router();

router.use(requireAuth, requireRole('admin'));
router.get('/overview', getOverview);
router.get('/users', listUsers);
router.patch('/users/:id/approval', updateUserApproval);
router.patch('/orders/:id/assign', assignOrder);

module.exports = router;
