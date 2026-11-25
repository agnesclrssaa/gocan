const { randomUUID } = require('node:crypto');
const prisma = require('../src/lib/prisma');
const { createPickupQrCode } = require('../utils/qrGenerator');
const { mergeOrderItemNotes, orderItemNotesInclude } = require('../utils/orderItems');
const { ensureDefaultCampuses } = require('../services/campus.service');
const { validatePromo } = require('../utils/promos');

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
    await ensureDefaultCampuses();
    let {
      items,
      canteenId,
      campusId: requestedCampusId,
      orderType: requestedOrderType,
      fulfillmentType: requestedFulfillmentType,
      paymentMethod: requestedPaymentMethod = 'QRIS',
      promoCode: requestedPromoCode,
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
      !['QRIS', 'DEBIT', 'CASH'].includes(paymentMethod) ||
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
      select: { id: true, isOpen: true, campusId: true },
    });
    if (!canteen) {
      return res.status(400).json({ error: 'Kantin pada pesanan tidak ditemukan.' });
    }
    if (!canteen.isOpen) {
      return res.status(409).json({ error: 'Kantin sedang tutup dan tidak menerima pesanan.' });
    }
    const campusId = typeof requestedCampusId === 'string' && requestedCampusId.trim()
      ? requestedCampusId.trim()
      : canteen.campusId;
    if (
      typeof campusId !== 'string' ||
      !campusId ||
      campusId !== canteen.campusId ||
      items.some((item) => item.campusId && item.campusId !== campusId)
    ) {
      return res.status(409).json({ error: 'Kampus keranjang tidak sesuai dengan kampus kantin.' });
    }
    const campus = await prisma.campus.findFirst({
      where: { campusId, status: 'active' },
      select: {
        campusId: true,
        name: true,
        city: true,
        address: true,
        status: true,
      },
    });
    if (!campus) {
      return res.status(409).json({ error: 'Kampus pesanan tidak tersedia atau sudah nonaktif.' });
    }

    const invalidItem = items.find((item) =>
      typeof item.id !== 'string' ||
      !Number.isSafeInteger(Number(item.quantity ?? 1)) ||
      Number(item.quantity ?? 1) < 1 ||
      Number(item.quantity ?? 1) > 99 ||
      (item.notes != null &&
        (typeof item.notes !== 'string' || item.notes.length > 1000))
    );
    if (invalidItem) {
      return res.status(400).json({
        error: 'Setiap item harus memiliki ID menu, jumlah antara 1 hingga 99, dan catatan maksimal 1000 karakter.',
      });
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
        notes: typeof item.notes === 'string' ? item.notes.trim() || null : null,
      };
    });
    const subtotal = orderItems.reduce((total, item) => total + item.onlinePrice * item.quantity, 0);
    let promoCode = null;
    let discountAmount = 0;
    if (requestedPromoCode != null && requestedPromoCode !== '') {
      if (typeof requestedPromoCode !== 'string') {
        return res.status(400).json({ error: 'Kode promo tidak valid.' });
      }
      const promoResult = await validatePromo({
        code: requestedPromoCode,
        subtotal,
        campusId,
      });
      if (promoResult.error) {
        return res.status(promoResult.status).json({ error: promoResult.error });
      }
      promoCode = promoResult.code;
      discountAmount = promoResult.discountAmount;
    }
    const deliveryFee = fulfillmentType === 'delivery'
      ? 3000 + (Math.max(0, floor - 1) * 1000)
      : 0;
    const deliveryDiscount = fulfillmentType === 'delivery' && subtotal >= DELIVERY_PROMO_MINIMUM
      ? Math.min(DELIVERY_PROMO_DISCOUNT, deliveryFee)
      : 0;
    const serviceFee = SERVICE_FEE;
    const totalAmount = subtotal + (deliveryFee - deliveryDiscount) + serviceFee - discountAmount;
    const canteenEarnings = subtotal * 0.95;
    const runnerEarnings = deliveryFee * 0.9;
    const platformRevenue =
      (subtotal * 0.05) + (deliveryFee * 0.1) + serviceFee - deliveryDiscount - discountAmount;
    const isCash = paymentMethod === 'CASH';
    const initialStatus = isCash ? 'PAID' : 'PENDING_PAYMENT';

    let order = await prisma.order.create({
      data: {
        userId: req.auth.userId,
        customerId: req.auth.userId,
        canteenId,
        campusId,
        items: JSON.stringify(orderItems),
        orderItems: {
          create: orderItems.map((item, position) => ({
            menuId: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
            position,
          })),
        },
        totalPrice: totalAmount,
        subtotal,
        promoCode,
        discountAmount,
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
        paymentReference:
        paymentMethod === 'CASH'
        ? null
        : `DEMO-${randomUUID()}`,
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
      include: {
        campus: {
          select: { campusId: true, name: true, city: true, address: true, status: true },
        },
        canteen: {
          select: {
            id: true,
            name: true,
            location: true,
            campusId: true,
            campus: {
              select: { campusId: true, name: true, city: true, status: true },
            },
          },
        },
      },
    });
    if (isCash) {
      order = await prisma.order.update({
        where: { id: order.id },
        data: {
          pickupQrCode: createPickupQrCode({ orderId: order.id, userId: req.auth.userId }),
        },
        include: {
          campus: {
            select: { campusId: true, name: true, city: true, address: true, status: true },
          },
          canteen: {
            select: {
              id: true,
              name: true,
              location: true,
              campusId: true,
              campus: {
                select: { campusId: true, name: true, city: true, status: true },
              },
            },
          },
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
  items: mergeOrderItemNotes(order),
  isScheduled: order.orderType === 'SCHEDULED',
});

const parseCourierOrder = (order) => {
  const parsedOrder = parseOrderItems(order);
  const customer = order.customer || order.user;
  const { users = [], ...canteen } = order.canteen || {};
  return {
    ...parsedOrder,
    customerId: order.customerId || customer?.id || order.userId,
    customer: customer
      ? { ...customer, phone: customer.phoneNumber || null }
      : null,
    canteen: order.canteen
      ? { ...canteen, ownerId: users[0]?.id || null }
      : null,
  };
};

const listCanteenOrders = async (req, res, next) => {
  try {
  if (req.auth.role === 'admin') {
  const orders = await prisma.order.findMany({
    include: {
      campus: {
        select: { campusId: true, name: true, city: true, status: true },
      },
      canteen: {
        select: {
          id: true,
          name: true,
          location: true,
          campusId: true,
          campus: {
            select: { campusId: true, name: true, city: true, status: true },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      courier: {
        select: {
          id: true,
          name: true,
        },
      },
      runner: {
        select: {
          id: true,
          name: true,
        },
      },
      orderItems: orderItemNotesInclude,
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(orders.map(parseOrderItems));
}  
    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { canteenId: true },
    });
    if (!user?.canteenId) {
      return res.status(403).json({ error: 'Akun ini belum terhubung ke kantin.' });
    }

    const orders = await prisma.order.findMany({
      where: { canteenId: user.canteenId },
      include: {
        campus: {
          select: { campusId: true, name: true, city: true, status: true },
        },
        canteen: {
          select: {
            id: true,
            name: true,
            location: true,
            campusId: true,
            campus: {
              select: { campusId: true, name: true, city: true, status: true },
            },
          },
        },
        orderItems: orderItemNotesInclude,
      },
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
    const isAdminOrCanteen = ['admin', 'canteen'].includes(userRole);
    const allowedStatuses = isAdminOrCanteen
      ? ['cooking', 'ready']
      : ['delivering', 'completed'];
    if (!allowedStatuses.includes(targetStatus)) {
      return res.status(400).json({ error: 'Status tujuan tidak valid untuk peran akun ini.' });
    }

    let courierCampusId = null;
    if (userRole === 'runner' || userRole === 'courier') {
      const courier = await prisma.user.findUnique({
        where: { id: req.auth.userId },
        select: { approvalStatus: true, campusId: true },
      });
      if (!courier || courier.approvalStatus?.toUpperCase() !== 'APPROVED') {
        return res.status(403).json({ error: 'Akun runner belum disetujui admin.' });
      }
      if (!courier.campusId) {
        return res.status(403).json({ error: 'Akun Runner belum terhubung ke kampus. Hubungi Admin.' });
      }
      courierCampusId = courier.campusId;
    }

    const orderId = Number(req.params.id);
    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: 'ID pesanan tidak valid.' });
    }

    let updatedOrder;
    if (isAdminOrCanteen) {
      let currentOrder;
      if (userRole === 'admin') {
        currentOrder = await prisma.order.findUnique({ where: { id: orderId } });
      } else {
        const user = await prisma.user.findUnique({
          where: { id: req.auth.userId },
          select: { canteenId: true },
        });
        if (!user?.canteenId) {
          return res.status(403).json({ error: 'Akun ini belum terhubung ke kantin.' });
        }

        currentOrder = await prisma.order.findFirst({
          where: { id: orderId, canteenId: user.canteenId },
        });
      }

      if (!currentOrder) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
      }
      if (
  targetStatus === 'cooking' &&
  String(currentOrder.orderType).toUpperCase() === 'SCHEDULED'
) {
  const scheduledDate = currentOrder.scheduledTime
    ? new Date(currentOrder.scheduledTime)
    : null;

  if (
    !scheduledDate ||
    !Number.isFinite(scheduledDate.getTime())
  ) {
    return res.status(409).json({
      success: false,
      code: 'INVALID_ORDER_SCHEDULE',
      message:
        'Jadwal pesanan tidak valid. Periksa data pesanan sebelum mulai menyiapkan.',
    });
  }

  if (scheduledDate.getTime() > Date.now()) {
    const scheduleLabel = scheduledDate.toLocaleString(
      'id-ID',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Jakarta',
      }
    );

    return res.status(409).json({
      success: false,
      code: 'SCHEDULE_NOT_DUE',
      message:
        `Pesanan ini dijadwalkan mulai disiapkan pada ${scheduleLabel} WIB. Belum dapat diproses sekarang.`,
    });
  }
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
          campusId: courierCampusId,
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
          campusId: courierCampusId,
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
      select: { approvalStatus: true, campusId: true },
    });
    if (!courier || courier.approvalStatus?.toUpperCase() !== 'APPROVED') {
      return res.status(403).json({ error: 'Akun runner belum disetujui admin.' });
    }
    if (!courier.campusId) {
      return res.status(403).json({ error: 'Akun Runner belum terhubung ke kampus. Hubungi Admin.' });
    }

    const orders = await prisma.order.findMany({
      where: {
        campusId: courier.campusId,
        OR: [
          { status: { in: ['PAID', 'ready'] }, fulfillmentType: 'delivery', courierId: null, runnerId: null },
          { status: 'ready', courierId: req.auth.userId },
          { status: { in: ['delivering', 'DELIVERING'] }, courierId: req.auth.userId },
          { status: { in: ['PREPARING', 'READY_FOR_PICKUP'] }, runnerId: req.auth.userId },
          { status: { in: ['COMPLETED', 'completed'] }, OR: [{ courierId: req.auth.userId }, { runnerId: req.auth.userId }] },
        ],
      },
      include: {
        campus: {
          select: { campusId: true, name: true, city: true, address: true, status: true },
        },
        canteen: {
          select: {
            id: true,
            name: true,
            location: true,
            campusId: true,
            campus: {
              select: { campusId: true, name: true, city: true, status: true },
            },
            users: {
              where: { role: 'canteen' },
              select: { id: true },
              take: 1,
            },
          },
        },
        customer: { select: { id: true, name: true, phoneNumber: true, email: true } },
        user: { select: { id: true, name: true, phoneNumber: true, email: true } },
        orderItems: orderItemNotesInclude,
      },
      orderBy: { updatedAt: 'asc' },
    });
    return res.json(orders.map(parseCourierOrder));
  } catch (error) {
    return next(error);
  }
};

module.exports = { createOrder, listCanteenOrders, listCourierOrders, updateOrderStatus };
