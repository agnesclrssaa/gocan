const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { randomBytes } = require('crypto');

const uploadDirectory = path.join(__dirname, '..', 'uploads');
const avatarUploadDirectory = path.join(uploadDirectory, 'avatars');
const privateUploadDirectory = path.join(__dirname, '..', 'private-uploads');
const allowedImageTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

fs.mkdirSync(uploadDirectory, { recursive: true });
fs.mkdirSync(avatarUploadDirectory, { recursive: true });
fs.mkdirSync(privateUploadDirectory, { recursive: true });

const createUploader = (directory, prefix) => multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, directory),
    filename: (_req, file, callback) => {
      const extension = allowedImageTypes.get(file.mimetype);
      const uniqueSuffix = randomBytes(6).toString('hex');
      callback(null, `${prefix}-${Date.now()}-${uniqueSuffix}${extension}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      return callback(new Error('Hanya file gambar JPEG, PNG, atau WebP yang diizinkan.'));
    }
    return callback(null, true);
  },
});

const upload = createUploader(uploadDirectory, 'menu');
const uploadAvatar = createUploader(avatarUploadDirectory, 'avatar');
const uploadKtm = createUploader(privateUploadDirectory, 'ktm');

module.exports = {
  upload,
  uploadAvatar,
  uploadKtm,
  multer,
  privateUploadDirectory,
};
