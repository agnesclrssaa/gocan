const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Pilih file gambar pada field "image".',
    });
  }

  return res.status(200).json({
    success: true,
    url: `/uploads/${req.file.filename}`,
    message: 'Foto berhasil diunggah',
  });
};

const uploadKtmImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Pilih foto KTM pada field "image".',
    });
  }

  return res.status(200).json({
    success: true,
    url: req.file.filename,
    message: 'Foto KTM berhasil diunggah',
  });
};

module.exports = { uploadImage, uploadKtmImage };
