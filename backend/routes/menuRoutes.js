const { Router } = require('express');
const { listCanteenMenus, listCanteens } = require('../controllers/menu.controller');

const router = Router();

router.get('/', listCanteens);
router.get('/:id/menus', listCanteenMenus);

module.exports = router;
