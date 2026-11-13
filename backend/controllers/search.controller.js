const prisma = require('../src/lib/prisma');

const search = async (req, res, next) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!query) {
      return res.json({
        success: true,
        data: { canteens: [], menus: [] },
      });
    }

    if (query.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Kata pencarian maksimal 100 karakter.',
      });
    }

    const [canteens, menus] = await Promise.all([
      prisma.canteen.findMany({
        where: {
          isOpen: true,
          OR: [
            { name: { contains: query } },
            { building: { contains: query } },
          ],
        },
        orderBy: { name: 'asc' },
        take: 8,
      }),
      prisma.menu.findMany({
        where: {
          isActive: true,
          isDeleted: false,
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
          ],
        },
        include: {
          canteen: {
            select: { id: true, name: true, building: true, imageUrl: true },
          },
        },
        orderBy: { name: 'asc' },
        take: 10,
      }),
    ]);

    return res.json({
      success: true,
      data: { canteens, menus },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { search };
