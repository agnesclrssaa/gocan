const prisma = require('../src/lib/prisma');
const { createPickupQrCode } = require('../utils/qrGenerator');

const parseOrderId = (value) => {
  if (!/^\d+$/.test(String(value || ''))) return null;

  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const findPaymentOrder = (id) =>
  prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      canteenId: true,
      paymentMethod: true,
      paymentStatus: true,
      paymentReference: true,
      status: true,
      totalPrice: true,
      pickupQrCode: true,
    },
  });

const canManageDemoPayment = async (auth, order) => {
  if (!order) return false;
  if (auth.role === 'admin') return true;
  if (auth.role !== 'canteen') return false;

  const operator = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { canteenId: true },
  });

  return Boolean(
    operator?.canteenId &&
    operator.canteenId === order.canteenId
  );
};

const isDemoOrder = (order) =>
  ['QRIS', 'DEBIT'].includes(order.paymentMethod) &&
  String(order.paymentReference || '').startsWith('DEMO-');

const paymentSummary = (order) => ({
  orderId: order.id,
  paymentMethod: order.paymentMethod,
  paymentStatus: order.paymentStatus,
  status: order.status,
  totalAmount: order.totalPrice,
  reference: order.paymentReference,
  isSimulation: true,
  qrPayload:
    order.paymentMethod === 'QRIS'
      ? `GOCAN-DEMO:${order.id}:${order.paymentReference}`
      : null,
});

const getDemoPayment = async (req, res, next) => {
  const orderId = parseOrderId(req.params.orderId);

  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: 'Nomor pesanan tidak valid.',
    });
  }

  try {
    const order = await findPaymentOrder(orderId);

  const canView =
  (
    req.auth.role === 'customer' &&
    order?.userId === req.auth.userId
  ) ||
  await canManageDemoPayment(req.auth, order);

    if (!order || !canView) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan untuk akun Anda.',
      });
    }

    if (!isDemoOrder(order)) {
      return res.status(409).json({
        success: false,
        message: 'Pesanan ini bukan pembayaran simulasi QRIS/debit.',
      });
    }

    return res.json({
      success: true,
      data: paymentSummary(order),
    });
  } catch (error) {
    return next(error);
  }
};

const confirmDemoPayment = async (req, res, next) => {
if (!['admin', 'canteen'].includes(req.auth.role)) {
  return res.status(403).json({
    success: false,
    message:
      'Konfirmasi simulasi hanya dapat dilakukan admin atau kantin pemilik pesanan.',
  });
}

  const orderId = parseOrderId(req.params.orderId);

  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: 'Nomor pesanan tidak valid.',
    });
  }

  try {
    const order = await findPaymentOrder(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan.',
      });
    }

if (!(await canManageDemoPayment(req.auth, order))) {
  return res.status(403).json({
    success: false,
    message: 'Pesanan ini bukan milik kantin Anda.',
  });
}

    if (!isDemoOrder(order)) {
      return res.status(409).json({
        success: false,
        message: 'Hanya pembayaran berreferensi DEMO yang dapat dikonfirmasi.',
      });
    }

    if (String(order.status).toUpperCase() === 'CANCELLED') {
      return res.status(409).json({
        success: false,
        message: 'Pesanan sudah dibatalkan.',
      });
    }

    if (order.paymentStatus === 'PAID') {
      return res.json({
        success: true,
        message: 'Pembayaran simulasi sudah dikonfirmasi sebelumnya.',
        data: paymentSummary(order),
      });
    }

    if (
      order.paymentStatus !== 'PENDING' ||
      !['PENDING', 'PENDING_PAYMENT'].includes(
        String(order.status).toUpperCase()
      )
    ) {
      return res.status(409).json({
        success: false,
        message: 'Status pesanan tidak dapat dikonfirmasi melalui simulasi.',
      });
    }

    const pickupQrCode =
      order.pickupQrCode ||
      createPickupQrCode({
        orderId: order.id,
        userId: order.userId,
      });

    const updated = await prisma.order.updateMany({
      where: {
        id: order.id,
        paymentReference: order.paymentReference,
        paymentStatus: 'PENDING',
        status: order.status,
      },
      data: {
        paymentStatus: 'PAID',
        status: 'PAID',
        pickupQrCode,
      },
    });

    if (updated.count !== 1) {
      return res.status(409).json({
        success: false,
        message: 'Status berubah. Muat ulang pesanan untuk memeriksa hasilnya.',
      });
    }

    const confirmedOrder = await findPaymentOrder(order.id);

    return res.json({
      success: true,
      message: 'Simulasi pembayaran berhasil. Tidak ada uang yang ditransaksikan.',
      data: paymentSummary(confirmedOrder),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDemoPayment,
  confirmDemoPayment,
};