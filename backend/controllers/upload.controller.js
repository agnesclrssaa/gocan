const { uploadToCloudinary, uploadPrivateToCloudinary } = require('../utils/cloudinary');

const uploadImage = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Pilih file gambar pada field "image".',
    });
  }

  try {
    const url = await uploadToCloudinary(req.file.buffer, 'gocan/images');
    return res.status(200).json({
      success: true,
      url,
      message: 'Foto berhasil diunggah',
    });
  } catch (error) {
    return next(error);
  }
};

const uploadKtmImage = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Pilih foto KTM pada field "image".',
    });
  }

  try {
    const url = await uploadPrivateToCloudinary(req.file.buffer, 'gocan/ktm');
    return res.status(200).json({
      success: true,
      url,
      message: 'Foto KTM berhasil diunggah',
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { uploadImage, uploadKtmImage };
