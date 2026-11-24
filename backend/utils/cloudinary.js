const { randomUUID } = require('crypto');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinaryResult = (fileBuffer, folderName, options = {}) =>
  new Promise((resolve, reject) => {
    if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
      reject(new Error('Buffer gambar tidak valid.'));
      return;
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder: folderName, resource_type: 'image', ...options },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error('Cloudinary tidak mengembalikan hasil upload.'));
          return;
        }
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });

const uploadToCloudinary = async (fileBuffer, folderName) => {
  const result = await uploadToCloudinaryResult(fileBuffer, folderName);
  if (!result.secure_url) {
    throw new Error('Cloudinary tidak mengembalikan secure_url.');
  }
  return result.secure_url;
};

const uploadPrivateToCloudinary = async (fileBuffer, folderName) => {
  const result = await uploadToCloudinaryResult(fileBuffer, folderName, {
    type: 'private',
    public_id: `${folderName}/${randomUUID()}`,
  });
  if (!result.public_id) {
    throw new Error('Cloudinary tidak mengembalikan public_id.');
  }
  return result.public_id;
};

module.exports = { cloudinary, uploadToCloudinary, uploadPrivateToCloudinary };
