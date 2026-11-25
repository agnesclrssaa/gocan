const { Router } = require('express');
const { listPromos, validatePromoCode } = require('../controllers/promos.controller');

const router = Router();

router.get('/', listPromos);
router.post('/validate', validatePromoCode);

module.exports = router;
