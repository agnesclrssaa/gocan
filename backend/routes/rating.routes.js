const { Router } = require('express');
const { listRatings, submitRating } = require('../controllers/rating.controller');
const requireAuth = require('../middlewares/requireAuth');
const requireRole = require('../middlewares/requireRole');

const router = Router();

router.get('/:id/ratings', listRatings);
router.post('/:id/rating', requireAuth, requireRole('customer'), submitRating);

module.exports = router;
