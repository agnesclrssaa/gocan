const { Router } = require('express');
const {
  changePassword,
  getProfile,
  updateProfile,
} = require('../controllers/user.controller');
const requireAuth = require('../middlewares/requireAuth');
const { uploadAvatar, multer } = require('../middlewares/upload.middleware');

const router = Router();

const uploadSingleAvatar = (req, res, next) => {
  uploadAvatar.single('avatar')(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'Ukuran foto profil maksimal 5 MB.'
        : 'Unggah satu file gambar menggunakan field "avatar".';
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
router.put('/profile', uploadSingleAvatar, updateProfile);
router.put('/change-password', changePassword);

module.exports = router;
