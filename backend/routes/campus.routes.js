const { Router } = require('express');
const {
  createCampus,
  deleteCampus,
  listCampuses,
  updateCampus,
} = require('../controllers/campus.controller');
const requireAuth = require('../middlewares/requireAuth');
const requireRole = require('../middlewares/requireRole');

const router = Router();

router.get('/', listCampuses);
router.post('/', requireAuth, requireRole('admin'), createCampus);
router.put('/:campusId', requireAuth, requireRole('admin'), updateCampus);
router.delete('/:campusId', requireAuth, requireRole('admin'), deleteCampus);

module.exports = router;
