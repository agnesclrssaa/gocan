const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const jwt = require('jsonwebtoken');
const prisma = require('../src/lib/prisma');

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
      !/^ktm-\d+-[a-f0-9]+\.(jpg|png|webp)$/.test(ktmUrl.trim())
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

module.exports = { getMe, login, register, updateRunnerProfile };
