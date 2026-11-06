const prisma = require('../src/lib/prisma');
const { createPickupQrCode } = require('../utils/qrGenerator');

const SERVICE_FEE = 1000;
const DELIVERY_PROMO_MINIMUM = 25000;
const DELIVERY_PROMO_DISCOUNT = 1000;

const normalizeOrderStatus = (status) => ({
  PENDING_PAYMENT: 'pending',
  PAID: 'pending',
  PREPARING: 'cooking',
  READY_FOR_PICKUP: 'ready',
  DELIVERING: 'delivering',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}[status] || status);

const INVALID_SCHEDULED_TIME = {
  success: false,
  code: 'INVALID_SCHEDULED_TIME',
  message: 'Waktu penyiapan terjadwal minimal 30 menit dari sekarang dan sesuai jam operasional kantin.',
};

const isValidScheduledTime = (scheduledTime, createdAt) => {
  if (typeof scheduledTime !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/i.test(scheduledTime)) {
    return false;
  }

  const parsedTime = new Date(scheduledTime);
  if (!Number.isFinite(parsedTime.getTime()) || parsedTime.getTime() < createdAt.getTime() + 30 * 60 * 1000) {
    return false;
  }

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(parsedTime);
  const timeParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const hour = Number(timeParts.hour);
  const minute = Number(timeParts.minute);
  const second = Number(timeParts.second);
  return hour >= 7 && (
    hour < 17 ||
    (hour === 17 && minute === 0 && second === 0 && parsedTime.getMilliseconds() === 0)
  );
};

const createOrder = async (req, res, next) => {
  try {
    let {
      items,
      canteenId,
      orderType: requestedOrderType,
      fulfillmentType: requestedFulfillmentType,
      paymentMethod: requestedPaymentMethod = 'QRIS',
      scheduledTime,
      destinationBuilding,
      destinationFloor,
      destinationRoom,
      notes,
      buildingName,
      meetingPoint,
      classInfo,
      deliveryNote,
    } = req.body || {};
    const legacyFulfillmentType = ['delivery', 'pickup'].includes(requestedOrderType)
      ? requestedOrderType
      : undefined;
    const orderType = legacyFulfillmentType
      ? 'IMMEDIATE'
      : (requestedOrderType || 'IMMEDIATE');
    const fulfillmentType = requestedFulfillmentType || legacyFulfillmentType || 'delivery';
    const paymentMethod = requestedPaymentMethod === 'gocan_pay'
      ? 'QRIS'
      : requestedPaymentMethod === 'cash'
        ? 'CASH'
        : requestedPaymentMethod;
    const createdAt = new Date();
    destinationBuilding = destinationBuilding ?? buildingName;
    destinationRoom = destinationRoom ?? classInfo;
    notes = notes ?? deliveryNote ?? meetingPoint;
    const floor = destinationFloor === undefined || destinationFloor === null || destinationFloor === ''
      ? 1
      : Number(destinationFloor);

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
      !Number.isSafeInteger(floor) ||
      floor < 1 ||
      floor > 100 ||
      !['IMMEDIATE', 'SCHEDULED'].includes(orderType) ||
      !['delivery', 'pickup'].includes(fulfillmentType) ||
      !['QRIS', 'CASH'].includes(paymentMethod) ||
      [destinationBuilding, destinationRoom, notes, buildingName, meetingPoint, classInfo, deliveryNote].some(
        (value) =>
          value !== undefined &&
          value !== null &&
          (typeof value !== 'string' || value.length > 500)
      )
    ) {
      return res.status(400).json({
        error: 'Item pesanan, tipe pesanan, metode pembayaran, dan lokasi tujuan harus valid.',
      });
    }

    if (
      (orderType === 'SCHEDULED' && !isValidScheduledTime(scheduledTime, createdAt)) ||
      (orderType === 'IMMEDIATE' && scheduledTime != null)
    ) {
      return res.status(400).json(INVALID_SCHEDULED_TIME);
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

    const canteen = await prisma.canteen.findUnique({
      where: { id: canteenId },
      select: { id: true, isOpen: true },
    });
    if (!canteen) {
      return res.status(400).json({ error: 'Kantin pada pesanan tidak ditemukan.' });
    }
    if (!canteen.isOpen) {
      return res.status(409).json({ error: 'Kantin sedang tutup dan tidak menerima pesanan.' });
    }

    const invalidItem = items.find((item) =>
      typeof item.id !== 'string' ||
      !Number.isSafeInteger(Number(item.quantity ?? 1)) ||
      Number(item.quantity ?? 1) < 1 ||
      Number(item.quantity ?? 1) > 99
    );
    if (invalidItem) {
      return res.status(400).json({ error: 'Setiap item harus memiliki ID menu dan jumlah antara 1 hingga 99.' });
    }
    const menuIds = [...new Set(items.map((item) => item.id))];
    const availableMenus = await prisma.menu.findMany({
      where: {
        id: { in: menuIds },
        canteenId: canteen.id,
        isAvailable: true,
        isDeleted: false,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        netPrice: true,
        onlinePrice: true,
        imageUrl: true,
        canteenId: true,
      },
    });
    if (availableMenus.length !== menuIds.length) {
      return res.status(409).json({ error: 'Ada menu yang tidak tersedia atau sudah habis.' });
    }

    const menusById = new Map(availableMenus.map((menu) => [menu.id, menu]));
    const orderItems = items.map((item) => {
      const menu = menusById.get(item.id);
      const onlinePrice = menu.onlinePrice > 0 ? menu.onlinePrice : menu.price;
      return {
        id: menu.id,
        name: menu.name,
        quantity: Number(item.quantity ?? 1),
        price: onlinePrice,
        onlinePrice,
        imageUrl: menu.imageUrl,
        canteenId: menu.canteenId,
      };
    });
    const subtotal = orderItems.reduce((total, item) => total + item.onlinePrice * item.quantity, 0);
    const deliveryFee = fulfillmentType === 'delivery'
      ? 3000 + (Math.max(0, floor - 1) * 1000)
      : 0;
    const deliveryDiscount = fulfillmentType === 'delivery' && subtotal >= DELIVERY_PROMO_MINIMUM
      ? Math.min(DELIVERY_PROMO_DISCOUNT, deliveryFee)
      : 0;
    const serviceFee = SERVICE_FEE;
    const totalAmount = subtotal + (deliveryFee - deliveryDiscount) + serviceFee;
    const canteenEarnings = subtotal * 0.95;
    const runnerEarnings = deliveryFee * 0.9;
    const platformRevenue = (subtotal * 0.05) + (deliveryFee * 0.1) + serviceFee - deliveryDiscount;
    const isCash = paymentMethod === 'CASH';
    const initialStatus = isCash ? 'PAID' : 'PENDING_PAYMENT';

    let order = await prisma.order.create({
      data: {
        userId: req.auth.userId,
        customerId: req.auth.userId,
        canteenId,
        items: JSON.stringify(orderItems),
        totalPrice: totalAmount,
        subtotal,
        deliveryFee,
        serviceFee,
        deliveryDiscount,
        foodDiscount: 0,
        totalAmount,
        canteenEarnings,
        runnerEarnings,
        platformRevenue,
        orderType,
        fulfillmentType,
        paymentMethod,
        paymentStatus: 'PENDING',
        status: initialStatus,
        scheduledTime: orderType === 'SCHEDULED' ? new Date(scheduledTime) : null,
        createdAt,
        destinationBuilding: fulfillmentType === 'delivery' ? destinationBuilding?.trim() || null : null,
        destinationFloor: fulfillmentType === 'delivery' ? floor : null,
        destinationRoom: fulfillmentType === 'delivery' ? destinationRoom?.trim() || null : null,
        buildingName: fulfillmentType === 'delivery' ? destinationBuilding?.trim() || null : null,
        meetingPoint: fulfillmentType === 'delivery' ? meetingPoint?.trim() || null : null,
        classInfo: fulfillmentType === 'delivery' ? destinationRoom?.trim() || null : null,
        deliveryNote: notes?.trim() || null,
      },
    });
    if (isCash) {
      order = await prisma.order.update({
        where: { id: order.id },
        data: {
          pickupQrCode: createPickupQrCode({ orderId: order.id, userId: req.auth.userId }),
        },
      });
    }

    return res.status(201).json({
      order: {
        ...order,
        status: normalizeOrderStatus(order.status),
        items: orderItems,
        isScheduled: order.orderType === 'SCHEDULED',
      },
    });
  } catch (error) {
    return next(error);
  }
};

const parseOrderItems = (order) => ({
  ...order,
  status: normalizeOrderStatus(order.status),
  items: JSON.parse(order.items),
  isScheduled: order.orderType === 'SCHEDULED',
});

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
      where: { canteenId: user.canteenId },
      orderBy: { createdAt: 'desc' },
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

    if (userRole === 'runner' || userRole === 'courier') {
      const courier = await prisma.user.findUnique({
        where: { id: req.auth.userId },
        select: { approvalStatus: true },
      });
      if (!courier || courier.approvalStatus?.toUpperCase() !== 'APPROVED') {
        return res.status(403).json({ error: 'Akun runner belum disetujui admin.' });
      }
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
      const currentStatus = currentOrder.status.toUpperCase();
      const validTransition =
        ((currentStatus === 'PENDING' || currentStatus === 'PAID') && targetStatus === 'cooking') ||
        ((currentStatus === 'COOKING' || currentStatus === 'PREPARING') && targetStatus === 'ready');
      if (!validTransition) {
        return res.status(409).json({
          error: `Status pesanan tidak dapat diubah dari ${currentOrder.status} ke ${targetStatus}.`,
        });
      }

      updatedOrder = await prisma.order.update({
        where: { id: currentOrder.id },
        data: {
          status: targetStatus === 'cooking'
            ? (currentStatus === 'PAID' ? 'PREPARING' : 'cooking')
            : (currentStatus === 'PREPARING' ? 'READY_FOR_PICKUP' : 'ready'),
        },
      });
    } else if (targetStatus === 'delivering') {
      const claimed = await prisma.order.updateMany({
        where: {
          id: orderId,
          status: { in: ['ready', 'READY_FOR_PICKUP'] },
          isPickupVerified: true,
          OR: [
            { courierId: req.auth.userId },
            { runnerId: req.auth.userId },
          ],
        },
        data: { status: 'DELIVERING' },
      });
      if (claimed.count !== 1) {
        return res.status(409).json({ error: 'Pesanan sudah diambil atau belum siap diantar.' });
      }
      updatedOrder = await prisma.order.findUnique({ where: { id: orderId } });
    } else {
      const completed = await prisma.order.updateMany({
        where: {
          id: orderId,
          status: { in: ['delivering', 'DELIVERING'] },
          OR: [{ courierId: req.auth.userId }, { runnerId: req.auth.userId }],
        },
        data: { status: 'COMPLETED', paymentStatus: 'PAID' },
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
    const courier = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { approvalStatus: true },
    });
    if (!courier || courier.approvalStatus?.toUpperCase() !== 'APPROVED') {
      return res.status(403).json({ error: 'Akun runner belum disetujui admin.' });
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { status: 'PAID', fulfillmentType: 'delivery', courierId: null, runnerId: null },
          { status: 'ready', courierId: null },
          { status: 'ready', courierId: req.auth.userId },
          { status: { in: ['delivering', 'DELIVERING'] }, courierId: req.auth.userId },
          { status: { in: ['PREPARING', 'READY_FOR_PICKUP'] }, runnerId: req.auth.userId },
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
