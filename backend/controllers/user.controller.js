const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');

const profileSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phoneNumber: true,
  avatarUrl: true,
  defaultBuilding: true,
  defaultRoom: true,
  bankName: true,
  accountNumber: true,
  accountHolderName: true,
};

const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: profileSelect,
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Profil pengguna tidak ditemukan.' });
    }
    return res.json({ success: true, data: user });
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const body = req.body || {};
    if (Object.prototype.hasOwnProperty.call(body, 'email')) {
      return res.status(400).json({
        success: false,
        code: 'EMAIL_UPDATE_NOT_ALLOWED',
        message: 'Alamat email tidak dapat diubah melalui endpoint profil.',
      });
    }

    const allowedFields = new Set([
      'name',
      'phoneNumber',
      'avatarUrl',
      'defaultBuilding',
      'defaultRoom',
    ]);
    if (Object.keys(body).some((field) => !allowedFields.has(field))) {
      return res.status(400).json({
        success: false,
        message: 'Payload profil memuat field yang tidak dapat diperbarui.',
      });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Nama wajib berupa teks dengan panjang 2 hingga 100 karakter.',
      });
    }

    if (
      body.phoneNumber !== undefined &&
      body.phoneNumber !== null &&
      (typeof body.phoneNumber !== 'string' || !/^\d{10,14}$/.test(body.phoneNumber))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Nomor telepon harus terdiri dari 10 hingga 14 digit angka.',
      });
    }

    const optionalTextFields = ['avatarUrl', 'defaultBuilding', 'defaultRoom'];
    for (const field of optionalTextFields) {
      const value = body[field];
      const maxLength = field === 'avatarUrl' ? 2048 : 120;
      if (value !== undefined && value !== null && (typeof value !== 'string' || value.length > maxLength)) {
        return res.status(400).json({
          success: false,
          message: `Field ${field} harus berupa teks maksimal ${maxLength} karakter.`,
        });
      }
    }

    const data = { name };
    if (body.phoneNumber !== undefined) {
      data.phoneNumber = typeof body.phoneNumber === 'string' ? body.phoneNumber : null;
    }
    for (const field of optionalTextFields) {
      if (body[field] !== undefined) {
        data[field] = typeof body[field] === 'string' ? body[field].trim() || null : null;
      }
    }

    const user = await prisma.user.update({
      where: { id: req.auth.userId },
      data,
      select: profileSelect,
    });
    return res.json({ success: true, data: user });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Profil pengguna tidak ditemukan.' });
    }
    return next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Kata sandi saat ini dan kata sandi baru wajib diisi.',
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_NEW_PASSWORD',
        message: 'Kata sandi baru minimal 6 karakter.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { id: true, password: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_CURRENT_PASSWORD',
        message: 'Kata sandi saat ini tidak sesuai.',
      });
    }

    const password = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password },
      select: { id: true },
    });
    return res.json({ success: true, message: 'Kata sandi berhasil diperbarui.' });
  } catch (error) {
    return next(error);
  }
};

module.exports = { changePassword, getProfile, updateProfile };
