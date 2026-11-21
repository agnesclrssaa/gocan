const prisma = require('../src/lib/prisma');
const path = require('path');
const { privateUploadDirectory } = require('../middlewares/upload.middleware');
const { mergeOrderItemNotes, orderItemNotesInclude } = require('../utils/orderItems');

const parseOrderItems = (order) => {
  try {
    return {
      ...order,
      items: mergeOrderItemNotes(order),
      isScheduled: order.orderType === 'SCHEDULED',
    };
  } catch (error) {
    error.message = `Format item pesanan ${order.id} tidak valid.`;
    throw error;
  }
};

const listAvailableOrders = async (req, res, next) => {
  try {
    const runner = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { campusId: true },
    });
    if (!runner?.campusId) {
      return res.status(403).json({ error: 'Akun Runner belum terhubung ke kampus. Hubungi Admin.' });
    }

    const campus = await prisma.campus.findFirst({
      where: { campusId: runner.campusId, status: 'active' },
      select: { campusId: true },
    });
    if (!campus) return res.json([]);

    const orders = await prisma.order.findMany({
      where: {
        campusId: runner.campusId,
        status: { in: ['PAID', 'ready'] },
        fulfillmentType: 'delivery',
        courierId: null,
        runnerId: null,
      },
      include: {
        campus: {
          select: { campusId: true, name: true, city: true, address: true, status: true },
        },
        orderItems: orderItemNotesInclude,
        user: { select: { name: true, phoneNumber: true } },
        canteen: {
          select: {
            id: true,
            name: true,
            location: true,
            campusId: true,
            campus: { select: { campusId: true, name: true, city: true, status: true } },
          },
        },
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

    const runner = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { campusId: true },
    });
    if (!runner?.campusId) {
      return res.status(403).json({ error: 'Akun Runner belum terhubung ke kampus. Hubungi Admin.' });
    }
    const activeCampus = await prisma.campus.findFirst({
      where: { campusId: runner.campusId, status: 'active' },
      select: { campusId: true },
    });
    if (!activeCampus) {
      return res.status(409).json({ error: 'Kampus Runner sedang nonaktif. Hubungi Admin.' });
    }

    const claimed = await prisma.order.updateMany({
      where: {
        id: orderId,
        campusId: runner.campusId,
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
        campus: {
          select: { campusId: true, name: true, city: true, address: true, status: true },
        },
        orderItems: orderItemNotesInclude,
        user: { select: { name: true, phoneNumber: true } },
        canteen: {
          select: {
            id: true,
            name: true,
            location: true,
            campusId: true,
            campus: { select: { campusId: true, name: true, city: true, status: true } },
          },
        },
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
      if (!error) return;
      if (!res.headersSent && (error.code === 'ENOENT' || error.status === 404)) {
        return res.status(404).json({ error: 'Foto KTM Runner tidak ditemukan.' });
      }
      return next(error);
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { acceptOrder, getKtmPhoto, listAvailableOrders };
