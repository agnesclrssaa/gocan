const { Router } = require('express');
const { getMe, login, register } = require('../controllers/auth.controller');
const requireAuth = require('../middlewares/requireAuth');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);

module.exports = router;
