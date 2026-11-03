const { Router } = require('express');
const {
  listCanteenMenus,
  listCanteens,
  getMyCanteen,
  updateMyCanteen,
  createMenu,
  updateMenu,
  deleteMenu,
} = require('../controllers/menu.controller');
const requireAuth = require('../middlewares/requireAuth');
const requireRole = require('../middlewares/requireRole');

const router = Router();

router.get('/', listCanteens);
router.get('/mine', requireAuth, requireRole('canteen'), getMyCanteen);
router.patch('/mine', requireAuth, requireRole('canteen'), updateMyCanteen);
router.post('/mine/menus', requireAuth, requireRole('canteen'), createMenu);
router.patch('/mine/menus/:menuId', requireAuth, requireRole('canteen'), updateMenu);
router.delete('/mine/menus/:menuId', requireAuth, requireRole('canteen'), deleteMenu);
router.get('/:id/menus', listCanteenMenus);

module.exports = router;
