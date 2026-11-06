const { Router } = require('express');
const { uploadImage, uploadKtmImage } = require('../controllers/upload.controller');
const { upload, uploadKtm, multer } = require('../middlewares/upload.middleware');
const requireAuth = require('../middlewares/requireAuth');
const requireRole = require('../middlewares/requireRole');

const router = Router();

const uploadSingleImage = (req, res, next) => {
  return runSingleUpload(upload, req, res, next);
};

const uploadSingleKtm = (req, res, next) => runSingleUpload(uploadKtm, req, res, next);

const runSingleUpload = (uploader, req, res, next) => {
  uploader.single('image')(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'Ukuran foto maksimal 5 MB.'
        : 'Unggah satu file gambar menggunakan field "image".';
      return res.status(400).json({ success: false, error: message });
    }

    if (error.message === 'Hanya file gambar JPEG, PNG, atau WebP yang diizinkan.') {
      return res.status(400).json({ success: false, error: error.message });
    }

    return next(error);
  });
};

router.post(
  '/',
  requireAuth,
  requireRole('canteen', 'admin', 'runner'),
  uploadSingleImage,
  uploadImage
);

router.post(
  '/ktm',
  requireAuth,
  requireRole('runner'),
  uploadSingleKtm,
  uploadKtmImage
);

module.exports = router;
