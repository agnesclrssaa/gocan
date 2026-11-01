const prisma = require('../src/lib/prisma');

const listOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.auth.userId },
      include: {
        canteen: { select: { name: true, location: true } },
        courier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders.map((order) => ({ ...order, items: JSON.parse(order.items) })));
  } catch (error) {
    next(error);
  }
};

const getOrder = async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: 'ID pesanan tidak valid.' });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.auth.userId },
      include: {
        canteen: { select: { name: true, location: true } },
        courier: { select: { id: true, name: true } },
      },
    });
    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
    }

    return res.json({ order: { ...order, items: JSON.parse(order.items) } });
  } catch (error) {
    return next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: 'ID pesanan tidak valid.' });
    }

    const result = await prisma.order.updateMany({
      where: { id: orderId, userId: req.auth.userId, status: 'pending' },
      data: { status: 'cancelled' },
    });
    if (result.count !== 1) {
      const orderExists = await prisma.order.findFirst({
        where: { id: orderId, userId: req.auth.userId },
        select: { id: true },
      });
      if (!orderExists) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
      }
      return res.status(409).json({ error: 'Pesanan hanya dapat dibatalkan sebelum diproses kantin.' });
    }

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

module.exports = { listOrders, getOrder, cancelOrder };
