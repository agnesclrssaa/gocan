const prisma = require('../src/lib/prisma');

const parseOrderId = (value) => {
  if (!/^\d+$/.test(String(value || ''))) return null;

  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const findOwnedOrder = (orderId, userId) =>
  prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    select: {
      id: true,
      userId: true,
      status: true,
      fulfillmentType: true,
      courierId: true,
      runnerId: true,
    },
  });

const submitRunnerRating = async (req, res, next) => {
  const orderId = parseOrderId(req.params.orderId);
  const { stars, reviewText } = req.body || {};

  if (
    !orderId ||
    !Number.isInteger(stars) ||
    stars < 1 ||
    stars > 5 ||
    (
      reviewText !== undefined &&
      reviewText !== null &&
      (
        typeof reviewText !== 'string' ||
        reviewText.length > 2000
      )
    )
  ) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_RUNNER_RATING',
      message:
        'Nomor pesanan, nilai 1–5 bintang, dan ulasan maksimal 2.000 karakter wajib valid.',
    });
  }

  try {
    const order = await findOwnedOrder(
      orderId,
      req.auth.userId
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: 'Pesanan tidak ditemukan untuk akun Anda.',
      });
    }

    if (
      String(order.fulfillmentType).toLowerCase() !== 'delivery'
    ) {
      return res.status(400).json({
        success: false,
        code: 'NOT_DELIVERY_ORDER',
        message: 'Rating runner hanya tersedia untuk pesanan delivery.',
      });
    }

    if (String(order.status).toUpperCase() !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        code: 'ORDER_NOT_COMPLETED',
        message: 'Runner dapat dinilai setelah pesanan selesai.',
      });
    }

    // Identitas runner diambil dari pesanan, bukan dari input pelanggan.
    const runnerId = order.courierId ?? order.runnerId;

    if (!runnerId) {
      return res.status(400).json({
        success: false,
        code: 'RUNNER_NOT_ASSIGNED',
        message: 'Pesanan ini belum memiliki runner.',
      });
    }

    const runner = await prisma.user.findUnique({
      where: { id: runnerId },
      select: { id: true, role: true },
    });

    if (!runner || !['runner', 'courier'].includes(runner.role)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_RUNNER',
        message: 'Data runner pada pesanan tidak valid.',
      });
    }

    const rating = await prisma.runnerRating.create({
      data: {
        orderId: order.id,
        customerId: req.auth.userId,
        runnerId,
        stars,
        reviewText:
          typeof reviewText === 'string'
            ? reviewText.trim() || null
            : null,
      },
      select: {
        id: true,
        orderId: true,
        stars: true,
        reviewText: true,
        createdAt: true,
        runner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Rating runner berhasil disimpan.',
      data: rating,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        code: 'ALREADY_RATED',
        message: 'Pesanan ini sudah pernah diberi rating runner.',
      });
    }

    return next(error);
  }
};

const getRunnerRating = async (req, res, next) => {
  const orderId = parseOrderId(req.params.orderId);

  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: 'Nomor pesanan tidak valid.',
    });
  }

  try {
    const order = await findOwnedOrder(
      orderId,
      req.auth.userId
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan untuk akun Anda.',
      });
    }

    const rating = await prisma.runnerRating.findUnique({
      where: { orderId },
      select: {
        id: true,
        orderId: true,
        stars: true,
        reviewText: true,
        createdAt: true,
        runner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      data: rating,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  submitRunnerRating,
  getRunnerRating,
};