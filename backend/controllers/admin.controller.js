const prisma = require('../src/lib/prisma');
const { sendRunnerApprovalEmail } = require('../utils/email');

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const parseOrderItems = (order) => ({
  ...order,
  items: JSON.parse(order.items),
  isScheduled: order.orderType === 'SCHEDULED',
});

const getOverview = async (_req, res, next) => {
  try {
    const today = startOfToday();
    const [users, customers, canteens, runners, couriers, pendingApprovals, activeOrders, todayOrders, revenue, unassignedOrders, unassignedOrderCount, availableRunners] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'customer' } }),
        prisma.canteen.count(),
        prisma.user.count({ where: { role: 'runner', approvalStatus: { in: ['approved', 'APPROVED'] } } }),
        prisma.user.count({ where: { role: 'courier', approvalStatus: { in: ['approved', 'APPROVED'] } } }),
        prisma.user.count({ where: { role: 'runner', approvalStatus: { in: ['pending', 'PENDING'] } } }),
        prisma.order.count({
          where: {
            status: {
              in: [
                'pending', 'cooking', 'ready', 'delivering',
                'PENDING_PAYMENT', 'PAID', 'PREPARING', 'READY_FOR_PICKUP', 'DELIVERING',
              ],
            },
          },
        }),
        prisma.order.count({ where: { createdAt: { gte: today } } }),
        prisma.order.aggregate({
          where: { createdAt: { gte: today }, paymentStatus: 'PAID' },
          _sum: { totalPrice: true },
        }),
        prisma.order.findMany({
          where: {
            status: { in: ['PAID', 'ready'] },
            fulfillmentType: 'delivery',
            courierId: null,
            runnerId: null,
          },
          include: {
            user: { select: { name: true } },
            canteen: { select: { name: true } },
          },
          orderBy: { updatedAt: 'asc' },
          take: 10,
        }),
        prisma.order.count({
          where: {
            status: { in: ['PAID', 'ready'] },
            fulfillmentType: 'delivery',
            courierId: null,
            runnerId: null,
          },
        }),
        prisma.user.findMany({
          where: { role: { in: ['runner', 'courier'] }, approvalStatus: { in: ['approved', 'APPROVED'] } },
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
      where.approvalStatus = { in: [approvalStatus, approvalStatus.toUpperCase()] };
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
  req.body = {
    status: req.body?.approvalStatus,
    reason: req.body?.reason,
  };
  return updateRunnerApproval(req, res, next);
};

const listRunners = async (req, res, next) => {
  try {
    const rawStatus = req.query.status;
    const status = typeof rawStatus === 'string' ? rawStatus.toUpperCase() : undefined;
    if (status && !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        error: 'Filter status harus PENDING, APPROVED, atau REJECTED.',
      });
    }

    const runners = await prisma.user.findMany({
      where: {
        role: 'runner',
        ...(status
          ? { approvalStatus: { in: [status, status.toLowerCase()] } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        rejectionReason: true,
        nrp: true,
        phoneNumber: true,
        ktmUrl: true,
        bankName: true,
        accountNumber: true,
        accountHolderName: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(runners);
  } catch (error) {
    return next(error);
  }
};

const updateRunnerApproval = async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    const status = typeof req.body?.status === 'string'
      ? req.body.status.toUpperCase()
      : '';
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'ID pengguna tidak valid.' });
    }
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        error: 'Status persetujuan harus APPROVED atau REJECTED.',
      });
    }
    if (status === 'REJECTED' && (reason.length < 5 || reason.length > 1000)) {
      return res.status(400).json({ error: 'Alasan penolakan wajib diisi antara 5 hingga 1000 karakter.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'runner') {
      return res.status(404).json({ error: 'Pendaftaran runner tidak ditemukan.' });
    }
    if (status === 'APPROVED') {
      const hasProfile = [
        user.nrp,
        user.phoneNumber,
        user.ktmUrl,
        user.bankName,
        user.accountNumber,
        user.accountHolderName,
      ].every((value) => typeof value === 'string' && value.trim());
      if (!user.email.toLowerCase().endsWith('@ukwms.ac.id') || !hasProfile) {
        return res.status(409).json({
          error: 'Runner harus menggunakan email kampus dan melengkapi identitas, KTM, serta data rekening sebelum disetujui.',
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        approvalStatus: status,
        rejectionReason: status === 'REJECTED' ? reason : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        rejectionReason: true,
      },
    });

    let notification;
    try {
      notification = await sendRunnerApprovalEmail({
        name: updatedUser.name,
        email: updatedUser.email,
        status: status.toLowerCase(),
        reason,
      });
      if (!notification.sent) {
        console.warn(`Runner approval email for user ${userId} was not sent: ${notification.message}`);
      }
    } catch (error) {
      console.error(`Runner approval email for user ${userId} failed:`, error);
      notification = {
        sent: false,
        message: 'Status berhasil diperbarui, tetapi email notifikasi gagal dikirim.',
      };
    }
    return res.json({ user: updatedUser, notification });
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
        approvalStatus: { in: ['approved', 'APPROVED'] },
      },
      select: { id: true },
    });
    if (!runner) {
      return res.status(404).json({ error: 'Runner aktif tidak ditemukan.' });
    }

    const assigned = await prisma.order.updateMany({
      where: {
        id: orderId,
        status: { in: ['PAID', 'ready'] },
        fulfillmentType: 'delivery',
        courierId: null,
        runnerId: null,
      },
      data: {
        courierId: runner.id,
        runnerId: runner.id,
        status: 'PREPARING',
      },
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

module.exports = {
  assignOrder,
  getOverview,
  listRunners,
  listUsers,
  updateRunnerApproval,
  updateUserApproval,
};
