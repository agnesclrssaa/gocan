const prisma = require('../src/lib/prisma');
const { ensureDefaultCampuses } = require('../services/campus.service');

const campusSelect = {
  id: true,
  campusId: true,
  name: true,
  city: true,
  address: true,
  image: true,
  latitude: true,
  longitude: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

const validateCampusBody = (body, { partial = false } = {}) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Data kampus tidak valid.' };
  }

  if (body.campusId !== undefined) {
    return { error: 'Campus ID tidak dapat diubah.' };
  }

  const data = {};
  const requiredFields = ['name', 'city', 'address'];
  for (const field of requiredFields) {
    const value = body[field];
    if (value === undefined && partial) continue;
    if (typeof value !== 'string' || !value.trim()) {
      return { error: `${field === 'name' ? 'Nama kampus' : field === 'city' ? 'Kota' : 'Alamat'} wajib diisi.` };
    }
    if (value.trim().length > 500) {
      return { error: `${field === 'address' ? 'Alamat' : field === 'name' ? 'Nama kampus' : 'Kota'} maksimal 500 karakter.` };
    }
    data[field] = value.trim();
  }

  if (body.status !== undefined) {
    if (!['active', 'inactive'].includes(body.status)) {
      return { error: 'Status kampus harus active atau inactive.' };
    }
    data.status = body.status;
  } else if (!partial) {
    data.status = 'active';
  }

  if (body.image !== undefined) {
    if (body.image !== null && (typeof body.image !== 'string' || body.image.length > 2048)) {
      return { error: 'URL foto kampus tidak valid.' };
    }
    const image = typeof body.image === 'string' ? body.image.trim() : '';
    if (image) {
      try {
        const parsedImage = new URL(image);
        if (!['http:', 'https:'].includes(parsedImage.protocol)) {
          return { error: 'URL foto kampus harus menggunakan HTTP atau HTTPS.' };
        }
      } catch {
        return { error: 'URL foto kampus tidak valid.' };
      }
    }
    data.image = image || null;
  } else if (!partial) {
    data.image = null;
  }

  for (const [field, limit] of [['latitude', 90], ['longitude', 180]]) {
    if (body[field] === undefined && partial) continue;
    const value = body[field];
    if (value === null || value === '') {
      data[field] = null;
      continue;
    }
    if ((typeof value !== 'string' && typeof value !== 'number') || !Number.isFinite(Number(value)) || Math.abs(Number(value)) > limit) {
      return { error: `${field === 'latitude' ? 'Latitude' : 'Longitude'} berada di luar rentang yang valid.` };
    }
    data[field] = String(value).trim();
  }

  return { data };
};

const listCampuses = async (req, res, next) => {
  try {
    await ensureDefaultCampuses();

    const where = {};
    if (req.query.status !== undefined) {
      if (!['active', 'inactive'].includes(req.query.status)) {
        return res.status(400).json({ error: 'Filter status harus active atau inactive.' });
      }
      where.status = req.query.status;
    }

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    if (search) {
      where.OR = ['campusId', 'name', 'city', 'address'].map((field) => ({
        [field]: { contains: search, mode: 'insensitive' },
      }));
    }

    const campuses = await prisma.campus.findMany({
      where,
      select: campusSelect,
      orderBy: [{ campusId: 'asc' }],
    });
    return res.json(campuses);
  } catch (error) {
    return next(error);
  }
};

const createCampus = async (req, res, next) => {
  const { data, error: validationError } = validateCampusBody(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    await ensureDefaultCampuses();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const campus = await prisma.$transaction(async (transaction) => {
          const records = await transaction.campus.findMany({
            select: { campusId: true },
          });
          const highestId = records.reduce((highest, record) => {
            const match = /^CAMPUS(\d+)$/i.exec(record.campusId);
            return match ? Math.max(highest, Number(match[1])) : highest;
          }, 0);
          let sequence = highestId + 1;
          const usedIds = new Set(records.map((record) => record.campusId));
          let campusId = `CAMPUS${String(sequence).padStart(3, '0')}`;
          while (usedIds.has(campusId)) {
            sequence += 1;
            campusId = `CAMPUS${String(sequence).padStart(3, '0')}`;
          }

          return transaction.campus.create({
            data: { ...data, campusId },
            select: campusSelect,
          });
        });
        return res.status(201).json({ campus });
      } catch (error) {
        const target = error.meta?.target;
        const campusIdCollision =
          error.code === 'P2002' &&
          (target === 'campusId' || (Array.isArray(target) && target.includes('campusId')));
        if (!campusIdCollision || attempt === 2) throw error;
      }
    }
    return res.status(409).json({ error: 'Campus ID tidak berhasil dibuat. Silakan coba lagi.' });
  } catch (error) {
    return next(error);
  }
};

const updateCampus = async (req, res, next) => {
  const { data, error: validationError } = validateCampusBody(req.body, { partial: true });
  if (validationError) return res.status(400).json({ error: validationError });
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Masukkan setidaknya satu informasi kampus untuk diperbarui.' });
  }

  try {
    const result = await prisma.campus.updateMany({
      where: { campusId: req.params.campusId },
      data,
    });
    if (result.count !== 1) {
      return res.status(404).json({ error: 'Kampus tidak ditemukan.' });
    }

    const campus = await prisma.campus.findUnique({
      where: { campusId: req.params.campusId },
      select: campusSelect,
    });
    return res.json({ campus });
  } catch (error) {
    return next(error);
  }
};

const deleteCampus = async (req, res, next) => {
  try {
    const campus = await prisma.campus.findUnique({
      where: { campusId: req.params.campusId },
      select: {
        campusId: true,
        _count: { select: { users: true, canteens: true, orders: true } },
      },
    });
    if (!campus) return res.status(404).json({ error: 'Kampus tidak ditemukan.' });

    const { users, canteens, orders } = campus._count;
    if (users + canteens + orders > 0) {
      return res.status(409).json({
        error: 'Kampus masih memiliki pengguna, kantin, atau pesanan terkait. Nonaktifkan kampus agar relasi dan riwayat tetap aman.',
      });
    }

    await prisma.campus.delete({ where: { campusId: campus.campusId } });
    return res.json({ success: true, message: 'Kampus berhasil dihapus.' });
  } catch (error) {
    if (error.code === 'P2003' || error.code === 'P2014') {
      return res.status(409).json({
        error: 'Kampus masih memiliki data terkait. Nonaktifkan kampus, bukan menghapusnya.',
      });
    }
    return next(error);
  }
};

module.exports = { createCampus, deleteCampus, listCampuses, updateCampus };
