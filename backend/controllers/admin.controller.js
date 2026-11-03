const prisma = require('../src/lib/prisma');

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const parseOrderItems = (order) => ({ ...order, items: JSON.parse(order.items) });

const getOverview = async (_req, res, next) => {
  try {
    const today = startOfToday();
    const [users, customers, canteens, runners, couriers, pendingApprovals, activeOrders, todayOrders, revenue, unassignedOrders, unassignedOrderCount, availableRunners] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'customer' } }),
        prisma.canteen.count(),
        prisma.user.count({ where: { role: 'runner', approvalStatus: 'approved' } }),
        prisma.user.count({ where: { role: 'courier', approvalStatus: 'approved' } }),
        prisma.user.count({ where: { role: 'runner', approvalStatus: 'pending' } }),
        prisma.order.count({ where: { status: { in: ['pending', 'cooking', 'ready', 'delivering'] } } }),
        prisma.order.count({ where: { createdAt: { gte: today } } }),
        prisma.order.aggregate({
          where: { createdAt: { gte: today } },
          _sum: { totalPrice: true },
        }),
        prisma.order.findMany({
          where: { status: 'ready', orderType: 'delivery', courierId: null },
          include: {
            user: { select: { name: true } },
            canteen: { select: { name: true } },
          },
          orderBy: { updatedAt: 'asc' },
          take: 10,
        }),
        prisma.order.count({
          where: { status: 'ready', orderType: 'delivery', courierId: null },
        }),
        prisma.user.findMany({
          where: { role: { in: ['runner', 'courier'] }, approvalStatus: 'approved' },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        }),
      ]);

    return res.json({
      generatedAt: new Date().toISOString(),
      metrics: {
        users,
        customers,
        canteens,
        runners,
        couriers,
        pendingApprovals,
        activeOrders,
        todayOrders,
        todayRevenue: revenue._sum.totalPrice || 0,
        unassignedOrderCount,
      },
      unassignedOrders: unassignedOrders.map(parseOrderItems),
      availableRunners,
    });
  } catch (error) {
    return next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const { role, approvalStatus, search } = req.query;
    const where = {};
    if (['customer', 'canteen', 'runner', 'courier', 'admin'].includes(role)) {
      where.role = role;
    }
    if (['pending', 'approved', 'rejected'].includes(approvalStatus)) {
      where.approvalStatus = approvalStatus;
    }
    if (typeof search === 'string' && search.trim()) {
      where.OR = [
        { name: { contains: search.trim() } },
        { email: { contains: search.trim() } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        createdAt: true,
        canteen: { select: { id: true, name: true, isOpen: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return res.json(users);
  } catch (error) {
    return next(error);
  }
};

const updateUserApproval = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const approvalStatus = req.body?.approvalStatus;
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'ID pengguna tidak valid.' });
    }
    if (!['approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({ error: 'Status persetujuan harus approved atau rejected.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'runner') {
      return res.status(404).json({ error: 'Pendaftaran runner tidak ditemukan.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { approvalStatus },
      select: { id: true, name: true, email: true, role: true, approvalStatus: true },
    });
    return res.json({ user: updatedUser });
  } catch (error) {
    return next(error);
  }
};

const assignOrder = async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const runnerId = Number(req.body?.runnerId);
    if (!Number.isSafeInteger(orderId) || orderId <= 0 || !Number.isSafeInteger(runnerId) || runnerId <= 0) {
      return res.status(400).json({ error: 'ID pesanan atau runner tidak valid.' });
    }

    const runner = await prisma.user.findFirst({
      where: {
        id: runnerId,
        role: { in: ['runner', 'courier'] },
        approvalStatus: 'approved',
      },
      select: { id: true },
    });
    if (!runner) {
      return res.status(404).json({ error: 'Runner aktif tidak ditemukan.' });
    }

    const assigned = await prisma.order.updateMany({
      where: { id: orderId, status: 'ready', orderType: 'delivery', courierId: null },
      data: { courierId: runner.id },
    });
    if (assigned.count !== 1) {
      return res.status(409).json({ error: 'Pesanan sudah ditugaskan atau belum siap diantar.' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true } },
        canteen: { select: { name: true } },
        courier: { select: { id: true, name: true } },
      },
    });
    return res.json({ order: parseOrderItems(order) });
  } catch (error) {
    return next(error);
  }
};

module.exports = { assignOrder, getOverview, listUsers, updateUserApproval };
