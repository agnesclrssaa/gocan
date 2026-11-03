const { randomUUID } = require('crypto');
const prisma = require('../src/lib/prisma');

const getCanteenForUser = async (userId) => {
  return prisma.$transaction(async (transaction) => {
    let user = await transaction.user.findUnique({
      where: { id: userId },
      select: { canteenId: true, name: true },
    });
    if (!user) return null;

    if (!user.canteenId) {
      const newCanteenId = randomUUID();
      await transaction.canteen.create({
        data: {
          id: newCanteenId,
          name: user.name,
          description: 'Mitra kantin GoCan',
        },
      });
      const linked = await transaction.user.updateMany({
        where: { id: userId, canteenId: null },
        data: { canteenId: newCanteenId },
      });

      if (linked.count === 0) {
        await transaction.canteen.delete({ where: { id: newCanteenId } });
        user = await transaction.user.findUnique({
          where: { id: userId },
          select: { canteenId: true, name: true },
        });
      } else {
        user.canteenId = newCanteenId;
      }
    }

    return user?.canteenId
      ? transaction.canteen.findUnique({ where: { id: user.canteenId } })
      : null;
  });
};

const getMyCanteen = async (req, res, next) => {
  try {
    const canteen = await getCanteenForUser(req.auth.userId);
    if (!canteen) {
      return res.status(403).json({ error: 'Akun ini belum terhubung ke kantin.' });
    }

    const menus = await prisma.menu.findMany({
      where: { canteenId: canteen.id },
      orderBy: { name: 'asc' },
    });
    return res.json({ ...canteen, menus });
  } catch (error) {
    return next(error);
  }
};

const updateMyCanteen = async (req, res, next) => {
  try {
    if (typeof req.body?.isOpen !== 'boolean') {
      return res.status(400).json({ error: 'Status kantin harus berupa nilai boolean.' });
    }

    const canteen = await getCanteenForUser(req.auth.userId);
    if (!canteen) {
      return res.status(403).json({ error: 'Akun ini belum terhubung ke kantin.' });
    }

    const updatedCanteen = await prisma.canteen.update({
      where: { id: canteen.id },
      data: { isOpen: req.body.isOpen },
    });
    return res.json(updatedCanteen);
  } catch (error) {
    return next(error);
  }
};

const validateMenu = (body) => {
  const price = Number(body?.price);
  if (
    typeof body?.name !== 'string' ||
    !body.name.trim() ||
    !Number.isSafeInteger(price) ||
    price < 1 ||
    (body.category !== undefined && body.category !== null && typeof body.category !== 'string') ||
    (body.description !== undefined && body.description !== null && typeof body.description !== 'string') ||
    (body.imageUrl !== undefined && typeof body.imageUrl !== 'string') ||
    (body.isAvailable !== undefined && typeof body.isAvailable !== 'boolean')
  ) {
    return null;
  }

  const imageUrl = body.imageUrl?.trim() || 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80';
  return {
    name: body.name.trim(),
    price,
    category: body.category?.trim() || null,
    description: body.description?.trim() || null,
    imageUrl,
    isAvailable: body.isAvailable ?? true,
  };
};

const createMenu = async (req, res, next) => {
  try {
    const data = validateMenu(req.body);
    if (!data) {
      return res.status(400).json({ error: 'Nama menu, harga positif, dan detail menu yang valid wajib diisi.' });
    }

    const canteen = await getCanteenForUser(req.auth.userId);
    if (!canteen) {
      return res.status(403).json({ error: 'Akun ini belum terhubung ke kantin.' });
    }

    const menu = await prisma.menu.create({
      data: { id: randomUUID(), ...data, canteenId: canteen.id },
    });
    return res.status(201).json({ menu });
  } catch (error) {
    return next(error);
  }
};

const updateMenu = async (req, res, next) => {
  try {
    const data = validateMenu(req.body);
    if (!data) {
      return res.status(400).json({ error: 'Nama menu, harga positif, dan detail menu yang valid wajib diisi.' });
    }

    const canteen = await getCanteenForUser(req.auth.userId);
    if (!canteen) {
      return res.status(403).json({ error: 'Akun ini belum terhubung ke kantin.' });
    }

    const existingMenu = await prisma.menu.findFirst({
      where: { id: req.params.menuId, canteenId: canteen.id },
      select: { id: true },
    });
    if (!existingMenu) {
      return res.status(404).json({ error: 'Menu tidak ditemukan di kantin ini.' });
    }

    const menu = await prisma.menu.update({ where: { id: existingMenu.id }, data });
    return res.json({ menu });
  } catch (error) {
    return next(error);
  }
};

const deleteMenu = async (req, res, next) => {
  try {
    const canteen = await getCanteenForUser(req.auth.userId);
    if (!canteen) {
      return res.status(403).json({ error: 'Akun ini belum terhubung ke kantin.' });
    }

    const result = await prisma.menu.deleteMany({
      where: { id: req.params.menuId, canteenId: canteen.id },
    });
    if (result.count === 0) {
      return res.status(404).json({ error: 'Menu tidak ditemukan di kantin ini.' });
    }
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
};

const listCanteens = async (_req, res, next) => {
  try {
    const canteens = await prisma.canteen.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(canteens);
  } catch (error) {
    next(error);
  }
};

const listCanteenMenus = async (req, res, next) => {
  try {
    const canteen = await prisma.canteen.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });

    if (!canteen) {
      return res.status(404).json({ error: 'Kantin tidak ditemukan.' });
    }

    const menus = await prisma.menu.findMany({
      where: { canteenId: canteen.id },
      orderBy: { name: 'asc' },
    });
    return res.json(menus);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listCanteens,
  listCanteenMenus,
  getMyCanteen,
  updateMyCanteen,
  createMenu,
  updateMenu,
  deleteMenu,
};
