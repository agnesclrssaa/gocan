const prisma = require('../src/lib/prisma');

const submitRating = async (req, res, next) => {
  const canteenId = req.params.canteenId || req.params.id;
  const { stars, reviewText } = req.body || {};
  const orderId = req.params.orderId === undefined
    ? req.body?.orderId
    : Number(req.params.orderId);

  if (
    (canteenId !== undefined && (typeof canteenId !== 'string' || !canteenId.trim())) ||
    !Number.isSafeInteger(orderId) ||
    orderId <= 0 ||
    !Number.isInteger(stars) ||
    stars < 1 ||
    stars > 5 ||
    (reviewText !== undefined &&
      reviewText !== null &&
      (typeof reviewText !== 'string' || reviewText.length > 2000))
  ) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_RATING',
      message: 'ID pesanan, nilai bintang 1-5, dan ulasan yang valid wajib diberikan.',
    });
  }

  try {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.auth.userId,
        ...(canteenId ? { canteenId } : {}),
      },
      select: { id: true, status: true, canteenId: true },
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: 'Pesanan tidak ditemukan untuk akun dan kantin ini.',
      });
    }

    if (order.status.toUpperCase() !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        code: 'ORDER_NOT_COMPLETED',
        message: 'Pesanan hanya dapat diberi ulasan setelah selesai.',
      });
    }

    const rating = await prisma.$transaction(async (transaction) => {
      const createdRating = await transaction.rating.create({
        data: {
          userId: req.auth.userId,
          canteenId: order.canteenId,
          orderId,
          stars,
          reviewText: typeof reviewText === 'string' ? reviewText.trim() || null : null,
        },
        include: { user: { select: { name: true } } },
      });
      const aggregate = await transaction.rating.aggregate({
        where: { canteenId: order.canteenId },
        _avg: { stars: true },
        _count: { _all: true },
      });
      await transaction.canteen.update({
        where: { id: order.canteenId },
        data: {
          avgRating: aggregate._avg.stars || 0,
          totalReviews: aggregate._count._all,
        },
      });
      return {
        rating: createdRating,
        avgRating: aggregate._avg.stars || 0,
        totalReviews: aggregate._count._all,
      };
    });

    return res.status(201).json({
      success: true,
      ...rating,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_RATED',
        message: 'Pesanan ini sudah pernah diberi ulasan.',
      });
    }
    return next(error);
  }
};

const listRatings = async (req, res, next) => {
  try {
    const rawPage = req.query.page === undefined ? '1' : req.query.page;
    const rawLimit = req.query.limit === undefined ? '10' : req.query.limit;
    const page = Number(rawPage);
    const limit = Number(rawLimit);
    if (
      typeof rawPage !== 'string' ||
      typeof rawLimit !== 'string' ||
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_PAGINATION',
        message: 'Parameter page harus positif dan limit harus antara 1 hingga 100.',
      });
    }

    const canteen = await prisma.canteen.findUnique({
      where: { id: req.params.id },
      select: { avgRating: true, totalReviews: true },
    });
    if (!canteen) {
      return res.status(404).json({ error: 'Kantin tidak ditemukan.' });
    }

    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        where: { canteenId: req.params.id },
        select: {
          id: true,
          stars: true,
          reviewText: true,
          createdAt: true,
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.rating.count({ where: { canteenId: req.params.id } }),
    ]);

    return res.json({
      ratings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      ...canteen,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { listRatings, submitRating };
