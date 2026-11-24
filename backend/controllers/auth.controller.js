const bcrypt = require('bcryptjs');
const { randomInt, randomUUID } = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = require('../src/lib/prisma');
const { sendPasswordResetEmail } = require('../utils/email');
const { ensureDefaultCampuses } = require('../services/campus.service');

const createToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

const toPublicUser = ({
  id,
  name,
  email,
  role,
  approvalStatus,
  rejectionReason,
  nrp,
  phoneNumber,
  ktmUrl,
  bankName,
  accountNumber,
  accountHolderName,
  avatarUrl,
  defaultBuilding,
  defaultRoom,
  campusId,
  campus,
  canteen,
}) => ({
  id,
  name,
  email,
  role,
  approval_status: approvalStatus?.toUpperCase(),
  approvalStatus: approvalStatus?.toUpperCase(),
  rejectionReason,
  nrp,
  phoneNumber,
  ktmUrl,
  bankName,
  accountNumber,
  accountHolderName,
  avatarUrl,
  defaultBuilding,
  defaultRoom,
  campusId,
  campus,
  canteen,
});

const runnerProfileSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  approvalStatus: true,
  rejectionReason: true,
  nrp: true,
  phoneNumber: true,
  ktmUrl: true,
  bankName: true,
  accountNumber: true,
  accountHolderName: true,
  avatarUrl: true,
  defaultBuilding: true,
  defaultRoom: true,
  campusId: true,
  campus: {
    select: {
      campusId: true,
      name: true,
      city: true,
      address: true,
      image: true,
      latitude: true,
      longitude: true,
      status: true,
    },
  },
  canteen: {
    select: {
      id: true,
      name: true,
      campusId: true,
      campus: {
        select: {
          campusId: true,
          name: true,
          city: true,
          address: true,
          status: true,
        },
      },
    },
  },
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: runnerProfileSelect,
    });

    if (!user) {
      return res.status(401).json({ error: 'Sesi pengguna tidak valid.' });
    }

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role = 'customer',
      nrp,
      phoneNumber,
      bankName,
      accountNumber,
      accountHolderName,
      campusId: requestedCampusId,
    } = req.body;
    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== 'string' ||
      password.length < 8 ||
      !['customer', 'canteen', 'runner'].includes(role)
    ) {
      return res.status(400).json({
        error: 'Nama, email valid, password minimal 8 karakter, dan role pendaftaran yang valid wajib diisi.',
      });
    }
    const campusId = typeof requestedCampusId === 'string'
      ? requestedCampusId.trim()
      : '';
    if (
      ['canteen', 'runner'].includes(role) &&
      !campusId
    ) {
      return res.status(400).json({ error: 'Kampus aktif wajib dipilih untuk mendaftar sebagai Mitra Kantin atau Runner.' });
    }
    if (requestedCampusId !== undefined && typeof requestedCampusId !== 'string') {
      return res.status(400).json({ error: 'Campus ID tidak valid.' });
    }

    await ensureDefaultCampuses();
    const selectedCampus = campusId
      ? await prisma.campus.findFirst({
          where: { campusId, status: 'active' },
          select: { campusId: true },
        })
      : null;
    if (campusId && !selectedCampus) {
      return res.status(400).json({ error: 'Kampus tidak ditemukan atau sudah nonaktif.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (role === 'runner' && !normalizedEmail.endsWith('@ukwms.ac.id')) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_STUDENT_EMAIL',
        message: 'Pendaftaran Campus Runner wajib menggunakan email resmi mahasiswa UKWMS (@ukwms.ac.id).',
      });
    }
    if (
      role === 'runner' &&
      [nrp, phoneNumber, bankName, accountNumber, accountHolderName].some(
        (value) => typeof value !== 'string' || !value.trim()
      )
    ) {
      return res.status(400).json({
        error: 'NRP, nomor telepon, dan data rekening pencairan wajib diisi untuk mendaftar sebagai Runner.',
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email sudah terdaftar.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.$transaction(async (transaction) => {
      const canteen = role === 'canteen'
        ? await transaction.canteen.create({
            data: {
              id: randomUUID(),
              campusId: selectedCampus.campusId,
              name: name.trim(),
              description: 'Mitra kantin GoCan',
            },
          })
        : null;

      return transaction.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role,
          campusId: selectedCampus?.campusId || null,
          approvalStatus: role === 'runner' ? 'PENDING' : 'APPROVED',
          ...(role === 'runner'
            ? {
                nrp: nrp.trim(),
                phoneNumber: phoneNumber.trim(),
                bankName: bankName.trim(),
                accountNumber: accountNumber.trim(),
                accountHolderName: accountHolderName.trim(),
              }
            : {}),
          ...(canteen ? { canteenId: canteen.id } : {}),
        },
        include: {
          campus: {
            select: {
              campusId: true,
              name: true,
              city: true,
              address: true,
              image: true,
              latitude: true,
              longitude: true,
              status: true,
            },
          },
          canteen: {
            include: { campus: true },
          },
        },
      });
    });

    return res.status(201).json({
      user: toPublicUser(user),
      token: createToken(user),
    });
  } catch (error) {
    return next(error);
  }
};

const updateRunnerProfile = async (req, res, next) => {
  try {
    const {
      nrp,
      phoneNumber,
      ktmUrl,
      bankName,
      accountNumber,
      accountHolderName,
    } = req.body || {};
    if (
      [nrp, phoneNumber, bankName, accountNumber, accountHolderName].some(
        (value) => typeof value !== 'string' || !value.trim()
      ) ||
      typeof ktmUrl !== 'string' ||
      !/^gocan\/ktm\/[A-Za-z0-9_-]+$/.test(ktmUrl.trim())
    ) {
      return res.status(400).json({
        error: 'NRP, nomor telepon, foto KTM, dan data rekening pencairan wajib diisi.',
      });
    }

    const existing = await prisma.user.findFirst({
      where: { id: req.auth.userId, role: 'runner' },
      select: { approvalStatus: true, email: true },
    });
    if (!existing) {
      return res.status(403).json({ error: 'Profil hanya tersedia untuk akun Runner.' });
    }
    if (!existing.email.toLowerCase().endsWith('@ukwms.ac.id')) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_STUDENT_EMAIL',
        message: 'Akun Campus Runner wajib menggunakan email resmi mahasiswa UKWMS (@ukwms.ac.id).',
      });
    }

    const user = await prisma.user.update({
      where: { id: req.auth.userId },
      data: {
        nrp: nrp.trim(),
        phoneNumber: phoneNumber.trim(),
        ktmUrl: ktmUrl.trim(),
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolderName: accountHolderName.trim(),
        approvalStatus: 'PENDING',
        rejectionReason: null,
      },
      select: runnerProfileSelect,
    });

    return res.json({ user: toPublicUser(user) });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email dan password wajib diisi.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        campus: true,
        canteen: { include: { campus: true } },
      },
    });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    return res.json({
      user: toPublicUser(user),
      token: createToken(user),
    });
  } catch (error) {
    return next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Email tidak valid.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email tidak terdaftar.' });
    }

    const resetOtp = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const resetOtpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { resetOtp, resetOtpExpiresAt },
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`Password reset OTP for ${user.email}: ${resetOtp}`);
    }

    await sendPasswordResetEmail({
      name: user.name,
      email: user.email,
      otp: resetOtp,
    });

    return res.json({
      success: true,
      message: 'Kode OTP telah dikirim ke email Anda.',
      ...(process.env.NODE_ENV !== 'production' ? { devOtp: resetOtp } : {}),
    });
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
    const { otp, newPassword } = req.body || {};
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof otp !== 'string' ||
      !/^\d{6}$/.test(otp) ||
      typeof newPassword !== 'string' ||
      newPassword.length < 8 ||
      newPassword.length > 128
    ) {
      return res.status(400).json({
        success: false,
        message: 'Email, kode OTP 6 digit, dan password baru minimal 8 karakter wajib diisi.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, resetOtp: true, resetOtpExpiresAt: true },
    });
    const now = new Date();
    if (
      !user ||
      user.resetOtp !== otp ||
      !user.resetOtpExpiresAt ||
      now >= user.resetOtpExpiresAt
    ) {
      return res.status(400).json({
        success: false,
        message: 'Kode OTP tidak valid atau sudah kedaluwarsa.',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const updated = await prisma.user.updateMany({
      where: {
        id: user.id,
        resetOtp: otp,
        resetOtpExpiresAt: { gt: now },
      },
      data: {
        password: hashedPassword,
        resetOtp: null,
        resetOtpExpiresAt: null,
      },
    });
    if (updated.count !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Kode OTP tidak valid atau sudah kedaluwarsa.',
      });
    }

    return res.json({ success: true, message: 'Password berhasil diperbarui' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  forgotPassword,
  getMe,
  login,
  register,
  resetPassword,
  updateRunnerProfile,
};
