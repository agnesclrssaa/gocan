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
  canteen: {
    select: {
      id: true,
      name: true,
      building: true,
      location: true,
      imageUrl: true,
    },
  },
};

const getPublicProfile = (user, req) => ({
  ...user,
  avatarUrl: user.avatarUrl
    ? new URL(user.avatarUrl, `${req.protocol}://${req.get('host')}`).toString()
    : null,
});

const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: profileSelect,
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Profil pengguna tidak ditemukan.' });
    }
    return res.json({ success: true, data: getPublicProfile(user, req) });
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        message: 'Data profil tidak valid.',
      });
    }

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
      'bankName',
      'accountNumber',
      'accountHolderName',
    ]);
    if (Object.keys(body).some((field) => !allowedFields.has(field))) {
      return res.status(400).json({
        success: false,
        message: 'Payload profil memuat field yang tidak dapat diperbarui.',
      });
    }

    if (Object.keys(body).length === 0 && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Masukkan setidaknya satu data profil untuk diperbarui.',
      });
    }

    if (
      body.name !== undefined &&
      (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Nama wajib berupa teks dengan panjang 2 hingga 100 karakter.',
      });
    }

    if (
      body.phoneNumber !== undefined &&
      body.phoneNumber !== null &&
      body.phoneNumber !== '' &&
      (typeof body.phoneNumber !== 'string' || !/^\d{10,14}$/.test(body.phoneNumber.trim()))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Nomor telepon harus terdiri dari 10 hingga 14 digit angka.',
      });
    }

    const optionalTextFields = [
      'defaultBuilding',
      'defaultRoom',
      'bankName',
      'accountNumber',
      'accountHolderName',
    ];
    for (const field of optionalTextFields) {
      const value = body[field];
      const maxLength = 120;
      if (value !== undefined && value !== null && (typeof value !== 'string' || value.length > maxLength)) {
        return res.status(400).json({
          success: false,
          message: `Field ${field} harus berupa teks maksimal ${maxLength} karakter.`,
        });
      }
    }

    if (
      body.avatarUrl !== undefined &&
      (typeof body.avatarUrl !== 'string' || body.avatarUrl.length > 2048)
    ) {
      return res.status(400).json({
        success: false,
        message: 'URL foto profil harus berupa teks maksimal 2048 karakter.',
      });
    }

    const data = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.phoneNumber !== undefined) {
      data.phoneNumber = typeof body.phoneNumber === 'string' && body.phoneNumber.trim()
        ? body.phoneNumber.trim()
        : null;
    }
    for (const field of optionalTextFields) {
      if (body[field] !== undefined) {
        data[field] = typeof body[field] === 'string' ? body[field].trim() || null : null;
      }
    }
    if (req.file) {
      data.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    const user = await prisma.$transaction(async (transaction) => {
      const updatedUser = await transaction.user.update({
        where: { id: req.auth.userId },
        data,
        select: profileSelect,
      });

      if (req.auth.role === 'canteen' && body.name !== undefined && updatedUser.canteen) {
        const canteen = await transaction.canteen.update({
          where: { id: updatedUser.canteen.id },
          data: { name: data.name },
          select: {
            id: true,
            name: true,
            building: true,
            location: true,
            imageUrl: true,
          },
        });
        return { ...updatedUser, canteen };
      }

      return updatedUser;
    });
    return res.json({ success: true, data: getPublicProfile(user, req) });
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
