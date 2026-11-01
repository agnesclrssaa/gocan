const prisma = require('../src/lib/prisma');

const createOrder = async (req, res, next) => {
  try {
    let {
      items,
      totalPrice,
      canteenId,
      orderType = 'delivery',
      buildingName,
      meetingPoint,
      classInfo,
      deliveryNote,
    } = req.body || {};

    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch {
        return res.status(400).json({ error: 'Format items harus berupa JSON yang valid.' });
      }
    }

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      !items.every((item) => item && typeof item === 'object' && !Array.isArray(item)) ||
      typeof totalPrice !== 'number' ||
      !Number.isFinite(totalPrice) ||
      totalPrice < 0 ||
      !['delivery', 'pickup'].includes(orderType) ||
      [buildingName, meetingPoint, classInfo, deliveryNote].some(
        (value) =>
          value !== undefined &&
          value !== null &&
          (typeof value !== 'string' || value.length > 500)
      )
    ) {
      return res.status(400).json({
        error: 'Items harus berisi minimal satu menu dan totalPrice harus berupa angka non-negatif.',
      });
    }

    const itemCanteenIds = [
      ...new Set(items.map((item) => item.canteenId || item.canteen_id).filter(Boolean)),
    ];
    if (itemCanteenIds.length > 1 || (canteenId && itemCanteenIds.some((id) => id !== canteenId))) {
      return res.status(400).json({ error: 'Satu pesanan hanya dapat berasal dari satu kantin.' });
    }

    canteenId = canteenId || itemCanteenIds[0];
    if (typeof canteenId !== 'string' || !canteenId) {
      return res.status(400).json({ error: 'ID kantin wajib disertakan pada pesanan.' });
    }

    const canteen = await prisma.canteen.findUnique({ where: { id: canteenId }, select: { id: true } });
    if (!canteen) {
      return res.status(400).json({ error: 'Kantin pada pesanan tidak ditemukan.' });
    }

    const order = await prisma.order.create({
      data: {
        userId: req.auth.userId,
        canteenId,
        items: JSON.stringify(items),
        totalPrice,
        orderType,
        buildingName: orderType === 'delivery' ? buildingName?.trim() || null : null,
        meetingPoint: orderType === 'delivery' ? meetingPoint?.trim() || null : null,
        classInfo: orderType === 'delivery' ? classInfo?.trim() || null : null,
        deliveryNote: deliveryNote?.trim() || null,
      },
    });

    return res.status(201).json({
      order: { ...order, items },
    });
  } catch (error) {
    return next(error);
  }
};

const parseOrderItems = (order) => ({ ...order, items: JSON.parse(order.items) });

const listCanteenOrders = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { canteenId: true },
    });
    if (!user?.canteenId) {
      return res.status(403).json({ error: 'Akun ini belum terhubung ke kantin.' });
    }

    const orders = await prisma.order.findMany({
      where: { canteenId: user.canteenId, status: 'pending' },
      orderBy: { createdAt: 'asc' },
    });
    return res.json(orders.map(parseOrderItems));
  } catch (error) {
    return next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const targetStatus = req.body?.status;
    const userRole = req.auth.role;
    const allowedStatuses =
      userRole === 'canteen' ? ['cooking', 'ready'] : ['delivering', 'completed'];
    if (!allowedStatuses.includes(targetStatus)) {
      return res.status(400).json({ error: 'Status tujuan tidak valid untuk peran akun ini.' });
    }

    const orderId = Number(req.params.id);
    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: 'ID pesanan tidak valid.' });
    }

    let updatedOrder;
    if (userRole === 'canteen') {
      const user = await prisma.user.findUnique({
        where: { id: req.auth.userId },
        select: { canteenId: true },
      });
      if (!user?.canteenId) {
        return res.status(403).json({ error: 'Akun ini belum terhubung ke kantin.' });
      }

      const currentOrder = await prisma.order.findFirst({
        where: { id: orderId, canteenId: user.canteenId },
      });
      if (!currentOrder) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan untuk kantin ini.' });
      }
      const validTransition =
        (currentOrder.status === 'pending' && targetStatus === 'cooking') ||
        (currentOrder.status === 'cooking' && targetStatus === 'ready');
      if (!validTransition) {
        return res.status(409).json({
          error: `Status pesanan tidak dapat diubah dari ${currentOrder.status} ke ${targetStatus}.`,
        });
      }

      updatedOrder = await prisma.order.update({
        where: { id: currentOrder.id },
        data: { status: targetStatus },
      });
    } else if (targetStatus === 'delivering') {
      const claimed = await prisma.order.updateMany({
        where: { id: orderId, status: 'ready', courierId: null },
        data: { status: 'delivering', courierId: req.auth.userId },
      });
      if (claimed.count !== 1) {
        return res.status(409).json({ error: 'Pesanan sudah diambil atau belum siap diantar.' });
      }
      updatedOrder = await prisma.order.findUnique({ where: { id: orderId } });
    } else {
      const completed = await prisma.order.updateMany({
        where: {
          id: orderId,
          status: 'delivering',
          courierId: req.auth.userId,
        },
        data: { status: 'completed' },
      });
      if (completed.count !== 1) {
        return res.status(404).json({ error: 'Pesanan antar tidak ditemukan untuk akun kurir ini.' });
      }
      updatedOrder = await prisma.order.findUnique({ where: { id: orderId } });
    }

    return res.json({ order: parseOrderItems(updatedOrder) });
  } catch (error) {
    return next(error);
  }
};

const listCourierOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { status: 'ready', courierId: null },
          { status: 'delivering', courierId: req.auth.userId },
        ],
      },
      orderBy: { updatedAt: 'asc' },
    });
    return res.json(orders.map(parseOrderItems));
  } catch (error) {
    return next(error);
  }
};

module.exports = { createOrder, listCanteenOrders, listCourierOrders, updateOrderStatus };
