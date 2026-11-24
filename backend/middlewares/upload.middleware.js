const multer = require('multer');

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const createUploader = () => multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      return callback(new Error('Hanya file gambar JPEG, PNG, atau WebP yang diizinkan.'));
    }
    return callback(null, true);
  },
});

const upload = createUploader();
const uploadProfile = createUploader();
const uploadAvatar = createUploader();
const uploadKtm = createUploader();

module.exports = {
  upload,
  uploadProfile,
  uploadAvatar,
  uploadKtm,
  multer,
};
