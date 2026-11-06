const { Router } = require('express');
const {
  changePassword,
  getProfile,
  updateProfile,
} = require('../controllers/user.controller');
const requireAuth = require('../middlewares/requireAuth');

const router = Router();

router.use(requireAuth);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

module.exports = router;
