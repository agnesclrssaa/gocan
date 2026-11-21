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
        prisma.user.count({ where: { role: 'runner', approvalStatus: { equals: 'approved', mode: 'insensitive' } } }),
        prisma.user.count({ where: { role: 'courier', approvalStatus: { equals: 'approved', mode: 'insensitive' } } }),
        prisma.user.count({ where: { role: 'runner', approvalStatus: { equals: 'pending', mode: 'insensitive' } } }),
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
            campus: {
              select: { campusId: true, name: true, city: true, status: true },
            },
            user: { select: { name: true } },
            canteen: {
              select: {
                name: true,
                campusId: true,
                campus: { select: { campusId: true, name: true, city: true, status: true } },
              },
            },
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
          where: {
            role: { in: ['runner', 'courier'] },
            approvalStatus: { equals: 'approved', mode: 'insensitive' },
          },
          select: {
            id: true,
            name: true,
            campusId: true,
            campus: { select: { campusId: true, name: true, city: true, status: true } },
          },
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
      where.approvalStatus = { equals: approvalStatus, mode: 'insensitive' };
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
        campusId: true,
        campus: {
          select: { campusId: true, name: true, city: true, status: true },
        },
        approvalStatus: true,
        createdAt: true,
        canteen: {
          select: {
            id: true,
            name: true,
            isOpen: true,
            campusId: true,
            campus: {
              select: { campusId: true, name: true, city: true, status: true },
            },
          },
        },
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
          ? { approvalStatus: { equals: status, mode: 'insensitive' } }
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
        campusId: true,
        campus: {
          select: { campusId: true, name: true, city: true, status: true },
        },
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

    let notification = {
      sent: false,
      message: 'Status berhasil diperbarui, tetapi email notifikasi gagal dikirim.',
    };
    try {
      const emailResult = await sendRunnerApprovalEmail({
        name: updatedUser.name,
        email: updatedUser.email,
        status: status.toLowerCase(),
        reason,
      });
      if (emailResult && typeof emailResult.sent === 'boolean') {
        notification = emailResult;
      } else {
        console.error(`Runner approval email for user ${userId} returned an invalid result.`);
      }
    } catch (error) {
      console.error(`Runner approval email for user ${userId} failed:`, error);
    }
    if (!notification.sent) {
      console.warn(`Runner approval email for user ${userId} was not sent: ${notification.message}`);
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
        approvalStatus: { equals: 'approved', mode: 'insensitive' },
      },
      select: { id: true, campusId: true },
    });
    if (!runner) {
      return res.status(404).json({ error: 'Runner aktif tidak ditemukan.' });
    }
    if (!runner.campusId) {
      return res.status(409).json({ error: 'Runner belum terhubung ke kampus.' });
    }
    const activeCampus = await prisma.campus.findFirst({
      where: { campusId: runner.campusId, status: 'active' },
      select: { campusId: true },
    });
    if (!activeCampus) {
      return res.status(409).json({ error: 'Kampus Runner sedang nonaktif dan tidak dapat menerima penugasan baru.' });
    }

    const orderCampus = await prisma.order.findUnique({
      where: { id: orderId },
      select: { campusId: true },
    });
    if (!orderCampus || orderCampus.campusId !== runner.campusId) {
      return res.status(409).json({ error: 'Runner hanya dapat ditugaskan pada pesanan dari kampus yang sama.' });
    }

    const assigned = await prisma.order.updateMany({
      where: {
        id: orderId,
        campusId: runner.campusId,
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
        campus: {
          select: { campusId: true, name: true, city: true, status: true },
        },
        user: { select: { name: true } },
        canteen: {
          select: {
            name: true,
            campusId: true,
            campus: { select: { campusId: true, name: true, city: true, status: true } },
          },
        },
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
