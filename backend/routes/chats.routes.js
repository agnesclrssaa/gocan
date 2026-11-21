const { Router } = require('express');
const {
  createChat,
  listChats,
  listMessages,
  sendMessage,
} = require('../controllers/chats.controller');
const requireAuth = require('../middlewares/requireAuth');
const requireRole = require('../middlewares/requireRole');

const router = Router();

router.use(requireAuth, requireRole('customer', 'canteen', 'canteen_staff', 'runner', 'courier'));
router.get('/', listChats);
router.post('/', createChat);
router.get('/:id/messages', listMessages);
router.post('/:id/messages', sendMessage);

module.exports = router;
