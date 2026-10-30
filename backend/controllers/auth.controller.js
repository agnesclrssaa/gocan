const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../src/lib/prisma');

const createToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

const toPublicUser = ({ id, name, email, role, approvalStatus }) => ({
  id,
  name,
  email,
  role,
  approval_status: approvalStatus,
});

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { id: true, name: true, email: true, role: true, approvalStatus: true },
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
    const { name, email, password, role = 'customer' } = req.body;
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
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email sudah terdaftar.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role,
      },
    });

    return res.status(201).json({
      user: toPublicUser(user),
      token: createToken(user),
    });
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

module.exports = { getMe, register, login };
