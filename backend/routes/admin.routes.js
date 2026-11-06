const { Router } = require('express');
const {
  assignOrder,
  getOverview,
  listRunners,
  listUsers,
  updateRunnerApproval,
  updateUserApproval,
} = require('../controllers/admin.controller');
const requireAuth = require('../middlewares/requireAuth');
const requireRole = require('../middlewares/requireRole');

const router = Router();

router.use(requireAuth, requireRole('admin'));
router.get('/overview', getOverview);
router.get('/users', listUsers);
router.get('/runners', listRunners);
router.patch('/runners/:id/approval', updateRunnerApproval);
router.patch('/users/:id/approval', updateUserApproval);
router.patch('/orders/:id/assign', assignOrder);

module.exports = router;
