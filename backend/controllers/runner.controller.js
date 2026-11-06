const prisma = require('../src/lib/prisma');
const path = require('path');
const { privateUploadDirectory } = require('../middlewares/upload.middleware');

const parseOrderItems = (order) => {
  try {
    return {
      ...order,
      items: JSON.parse(order.items),
      isScheduled: order.orderType === 'SCHEDULED',
    };
  } catch (error) {
    error.message = `Format item pesanan ${order.id} tidak valid.`;
    throw error;
  }
};

const listAvailableOrders = async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['PAID', 'ready'] },
        fulfillmentType: 'delivery',
        courierId: null,
        runnerId: null,
      },
      include: {
        user: { select: { name: true, phoneNumber: true } },
        canteen: { select: { name: true, location: true } },
      },
      orderBy: { updatedAt: 'asc' },
    });
    return res.json(orders.map(parseOrderItems));
  } catch (error) {
    return next(error);
  }
};

const acceptOrder = async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId ?? req.body?.orderId);
    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: 'ID pesanan tidak valid.' });
    }

    const claimed = await prisma.order.updateMany({
      where: {
        id: orderId,
        status: { in: ['PAID', 'ready'] },
        fulfillmentType: 'delivery',
        courierId: null,
        runnerId: null,
      },
      data: {
        courierId: req.auth.userId,
        runnerId: req.auth.userId,
        status: 'PREPARING',
      },
    });
    if (claimed.count !== 1) {
      return res.status(409).json({
        error: 'Pesanan sudah diambil atau belum siap diantar.',
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, phoneNumber: true } },
        canteen: { select: { name: true, location: true } },
      },
    });
    return res.json({ order: parseOrderItems(order) });
  } catch (error) {
    return next(error);
  }
};

const getKtmPhoto = async (req, res, next) => {
  try {
    const runnerId = Number(req.params.id);
    if (!Number.isSafeInteger(runnerId) || runnerId <= 0) {
      return res.status(400).json({ error: 'ID Runner tidak valid.' });
    }
    if (req.auth.role !== 'admin' && req.auth.userId !== runnerId) {
      return res.status(403).json({ error: 'Anda tidak memiliki izin melihat foto KTM ini.' });
    }

    const runner = await prisma.user.findFirst({
      where: { id: runnerId, role: 'runner' },
      select: { ktmUrl: true },
    });
    if (!runner?.ktmUrl || !/^ktm-\d+-[a-f0-9]+\.(jpg|png|webp)$/.test(runner.ktmUrl)) {
      return res.status(404).json({ error: 'Foto KTM Runner tidak ditemukan.' });
    }

    return res.sendFile(path.join(privateUploadDirectory, runner.ktmUrl), (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { acceptOrder, getKtmPhoto, listAvailableOrders };
