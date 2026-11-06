const { Router } = require('express');
const {
  getMe,
  login,
  register,
  updateRunnerProfile,
} = require('../controllers/auth.controller');
const requireAuth = require('../middlewares/requireAuth');
const requireRole = require('../middlewares/requireRole');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.patch('/runner-profile', requireAuth, requireRole('runner'), updateRunnerProfile);

module.exports = router;
