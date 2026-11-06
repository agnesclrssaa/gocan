const prisma = require('../src/lib/prisma');

const normalizeOrderStatus = (status) => ({
  PENDING_PAYMENT: 'pending',
  PAID: 'pending',
  PREPARING: 'cooking',
  READY_FOR_PICKUP: 'ready',
  DELIVERING: 'delivering',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}[status] || status);

const listOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.auth.userId },
      select: {
        id: true,
        userId: true,
        canteenId: true,
        items: true,
        totalPrice: true,
        orderType: true,
        fulfillmentType: true,
        scheduledTime: true,
        paymentMethod: true,
        paymentStatus: true,
        qrisExpiresAt: true,
        pickupQrCode: true,
        isPickupVerified: true,
        buildingName: true,
        meetingPoint: true,
        classInfo: true,
        deliveryNote: true,
        status: true,
        subtotal: true,
        deliveryFee: true,
        serviceFee: true,
        deliveryDiscount: true,
        foodDiscount: true,
        totalAmount: true,
        canteenEarnings: true,
        runnerEarnings: true,
        platformRevenue: true,
        destinationBuilding: true,
        destinationFloor: true,
        destinationRoom: true,
        cancelReason: true,
        cancelNote: true,
        courierId: true,
        createdAt: true,
        updatedAt: true,
        canteen: { select: { name: true, location: true } },
        courier: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(orders.map((order) => {
      let items = [];
      try {
        const parsedItems = JSON.parse(order.items);
        items = Array.isArray(parsedItems) ? parsedItems : [];
      } catch (parseError) {
        console.error(`Gagal membaca rincian item pesanan #${order.id}:`, parseError);
      }
      return {
        ...order,
        status: normalizeOrderStatus(order.status),
        items,
        isScheduled: order.orderType === 'SCHEDULED',
      };
    }));
  } catch (error) {
    return next(error);
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

    return res.json({
      order: {
        ...order,
        status: normalizeOrderStatus(order.status),
        items: JSON.parse(order.items),
        isScheduled: order.orderType === 'SCHEDULED',
      },
    });
  } catch (error) {
    return next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const allowedReasons = [
      'Ingin mengubah item pesanan',
      'Salah memilih lokasi gedung / ruang kelas',
      'Waktu penyiapan terlalu lama',
      'Ingin mengganti metode pembayaran',
      'Lainnya',
    ];
    const { cancelReason, cancelNote = '' } = req.body || {};
    if (!allowedReasons.includes(cancelReason)) {
      return res.status(400).json({ error: 'Alasan pembatalan tidak valid.' });
    }
    if (typeof cancelNote !== 'string' || cancelNote.length > 1000) {
      return res.status(400).json({ error: 'Catatan pembatalan tidak valid.' });
    }

    const orderId = Number(req.params.id);
    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: 'ID pesanan tidak valid.' });
    }

    const result = await prisma.order.updateMany({
      where: {
        id: orderId,
        userId: req.auth.userId,
        status: { in: ['pending', 'PENDING_PAYMENT'] },
      },
      data: {
        status: 'CANCELLED',
        cancelReason,
        cancelNote: cancelNote.trim() || null,
      },
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

    return res.json({
      success: true,
      order: {
        id: orderId,
        status: 'cancelled',
        cancelReason,
        cancelNote: cancelNote.trim() || null,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const verifyPickup = async (req, res, next) => {
  const { pickupQrCode } = req.body || {};
  if (typeof pickupQrCode !== 'string' || pickupQrCode.length < 20 || pickupQrCode.length > 512) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_OR_USED_QR',
      message: 'Kode QR tidak valid atau sudah pernah digunakan.',
    });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { pickupQrCode },
      include: {
        user: { select: { id: true, name: true } },
        canteen: { select: { id: true } },
      },
    });
    const isReady = order?.status === 'READY_FOR_PICKUP' || order?.status === 'ready';
    const paymentSettled = order?.paymentStatus === 'PAID' || order?.paymentMethod === 'CASH';
    if (!order || order.isPickupVerified || !paymentSettled || !isReady) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_OR_USED_QR',
        message: 'Kode QR tidak valid atau sudah pernah digunakan.',
      });
    }

    if (req.auth.role === 'canteen') {
      if (order.fulfillmentType !== 'pickup') {
        return res.status(403).json({ success: false, message: 'E-Ticket ini bukan pesanan pickup kantin.' });
      }
      const canteenUser = await prisma.user.findUnique({
        where: { id: req.auth.userId },
        select: { canteenId: true },
      });
      if (!canteenUser?.canteenId || canteenUser.canteenId !== order.canteenId) {
        return res.status(403).json({ success: false, message: 'Pesanan bukan milik kantin Anda.' });
      }
    } else if (order.fulfillmentType !== 'delivery' || order.courierId !== req.auth.userId) {
      return res.status(403).json({ success: false, message: 'Pesanan antar belum ditugaskan kepada Runner ini.' });
    }

    const items = JSON.parse(order.items);
    const itemsSummary = items.map((item) => ({
      name: item.name || item.menuName || 'Menu',
      quantity: Number.isSafeInteger(Number(item.quantity)) ? Number(item.quantity) : 1,
    }));
    const updated = await prisma.order.updateMany({
      where: {
        id: order.id,
        pickupQrCode,
        isPickupVerified: false,
        status: order.status,
        OR: [{ paymentStatus: 'PAID' }, { paymentMethod: 'CASH' }],
      },
      data: { isPickupVerified: true, status: 'DELIVERING' },
    });
    if (updated.count !== 1) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_OR_USED_QR',
        message: 'Kode QR tidak valid atau sudah pernah digunakan.',
      });
    }

    return res.json({
      success: true,
      message: 'E-Ticket valid! Pesanan dapat diserahkan.',
      data: {
        orderId: order.id,
        customerName: order.user.name,
        itemsSummary,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { listOrders, getOrder, cancelOrder, verifyPickup };
