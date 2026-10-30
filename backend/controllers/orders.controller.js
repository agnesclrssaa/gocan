const prisma = require('../src/lib/prisma');

const listOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.auth.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders.map((order) => ({ ...order, items: JSON.parse(order.items) })));
  } catch (error) {
    next(error);
  }
};

module.exports = { listOrders };
