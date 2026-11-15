const { Router } = require('express');
const {
  changePassword,
  getProfile,
  updateProfile,
} = require('../controllers/user.controller');
const requireAuth = require('../middlewares/requireAuth');
const { uploadProfile, multer } = require('../middlewares/upload.middleware');

const router = Router();

const uploadProfileImages = (req, res, next) => {
  uploadProfile.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'canteenImage', maxCount: 1 },
  ])(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'Ukuran setiap foto maksimal 5 MB.'
        : 'Unggah maksimal satu foto profil dan satu foto banner kantin.';
      return res.status(400).json({ success: false, message });
    }

    if (error.message === 'Hanya file gambar JPEG, PNG, atau WebP yang diizinkan.') {
      return res.status(400).json({ success: false, message: error.message });
    }

    return next(error);
  });
};

router.use(requireAuth);
router.get('/profile', getProfile);
router.put('/profile', uploadProfileImages, updateProfile);
router.put('/change-password', changePassword);

module.exports = router;
