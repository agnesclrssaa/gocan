const prisma = require('../src/lib/prisma');

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

module.exports = { listCanteens, listCanteenMenus };
