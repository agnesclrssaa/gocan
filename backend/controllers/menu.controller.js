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
      where: { canteenId: canteen.id, isDeleted: false },
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
  const netPrice = Number(body?.netPrice ?? body?.price);
  if (
    typeof body?.name !== 'string' ||
    !body.name.trim() ||
    !Number.isSafeInteger(netPrice) ||
    netPrice < 1 ||
    (body.category !== undefined && body.category !== null && typeof body.category !== 'string') ||
    (body.description !== undefined && body.description !== null && typeof body.description !== 'string') ||
    (body.imageUrl !== undefined && typeof body.imageUrl !== 'string') ||
    (body.isAvailable !== undefined && typeof body.isAvailable !== 'boolean')
  ) {
    return null;
  }

  const onlinePrice = Math.ceil((netPrice * 1.05) / 500) * 500;
  const imageUrl = body.imageUrl?.trim() || 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80';
  return {
    name: body.name.trim(),
    price: onlinePrice,
    netPrice,
    onlinePrice,
    commissionRate: 0.05,
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
      where: {
        id: req.params.id || req.params.menuId,
        canteenId: canteen.id,
        isDeleted: false,
        isActive: true,
      },
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
    const menuId = req.params.id || req.params.menuId;
    if (typeof menuId !== 'string' || !menuId.trim()) {
      return res.status(404).json({
        success: false,
        code: 'MENU_NOT_FOUND',
        message: 'Menu tidak ditemukan.',
      });
    }

    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      select: { id: true, canteenId: true, isDeleted: true },
    });
    if (!menu || menu.isDeleted) {
      return res.status(404).json({
        success: false,
        code: 'MENU_NOT_FOUND',
        message: 'Menu tidak ditemukan.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { canteenId: true },
    });
    if (!user?.canteenId || user.canteenId !== menu.canteenId) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_ACCESS',
        message: 'Anda tidak memiliki hak akses untuk menghapus menu stan lain.',
      });
    }

    await prisma.menu.update({
      where: { id: menu.id },
      data: {
        isActive: false,
        isDeleted: true,
        isAvailable: false,
        deletedAt: new Date(),
      },
    });
    return res.status(200).json({
      success: true,
      message: 'Menu berhasil dihapus',
    });
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
      select: {
        id: true,
        name: true,
        building: true,
        location: true,
        imageUrl: true,
      },
    });

    if (!canteen) {
      return res.status(404).json({ error: 'Kantin tidak ditemukan.' });
    }

    const menus = await prisma.menu.findMany({
      where: { canteenId: canteen.id, isDeleted: false, isActive: true },
      include: {
        canteen: {
          select: {
            id: true,
            name: true,
            building: true,
            location: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    return res.json(menus.map((menu) => ({
      ...menu,
      canteenName: menu.canteen.name,
    })));
  } catch (error) {
    return next(error);
  }
};

const listBestSellers = async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: { in: ['completed', 'COMPLETED'] } },
      select: { id: true, items: true },
    });
    const salesByMenuId = new Map();

    for (const order of orders) {
      let items;
      try {
        items = JSON.parse(order.items);
      } catch (error) {
        console.warn(`Melewati item pesanan ${order.id} dengan format JSON tidak valid:`, error);
        continue;
      }

      if (!Array.isArray(items)) continue;

      for (const item of items) {
        if (!item || typeof item.id !== 'string') continue;
        const quantity = Number(item.quantity ?? 1);
        if (!Number.isSafeInteger(quantity) || quantity <= 0) continue;

        salesByMenuId.set(
          item.id,
          (salesByMenuId.get(item.id) || 0) + quantity
        );
      }
    }

    if (salesByMenuId.size === 0) {
      const menus = await prisma.menu.findMany({
        where: { isAvailable: true, isDeleted: false, isActive: true },
        include: { canteen: { select: { name: true } } },
        orderBy: { name: 'asc' },
        take: 6,
      });
      return res.json(
        menus.map((menu) => ({ ...menu, canteenName: menu.canteen.name, totalSold: 0 }))
      );
    }

    const menus = await prisma.menu.findMany({
      where: {
        id: { in: [...salesByMenuId.keys()] },
        isDeleted: false,
        isActive: true,
      },
      include: { canteen: { select: { name: true } } },
    });
    const bestSellers = menus
      .map((menu) => ({
        ...menu,
        canteenName: menu.canteen.name,
        totalSold: salesByMenuId.get(menu.id),
      }))
      .sort((a, b) => b.totalSold - a.totalSold || a.name.localeCompare(b.name))
      .slice(0, 6);

    return res.json(bestSellers);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listCanteens,
  listCanteenMenus,
  listBestSellers,
  getMyCanteen,
  updateMyCanteen,
  createMenu,
  updateMenu,
  deleteMenu,
};
