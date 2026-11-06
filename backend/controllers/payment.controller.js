const prisma = require('../src/lib/prisma');
const { createPickupQrCode, verifyMidtransNotification } = require('../utils/qrGenerator');

const MIDTRANS_SANDBOX_URL = 'https://api.sandbox.midtrans.com';
const MIDTRANS_PRODUCTION_URL = 'https://api.midtrans.com';

const generateQris = async (req, res, next) => {
  const orderId = Number(req.body?.orderId);
  const requestedAmount = req.body?.totalAmount;
  if (
    !Number.isSafeInteger(orderId) ||
    orderId <= 0 ||
    typeof requestedAmount !== 'number' ||
    !Number.isSafeInteger(requestedAmount) ||
    requestedAmount <= 0
  ) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_PAYMENT_REQUEST',
      message: 'ID pesanan dan total pembayaran positif wajib disertakan.',
    });
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    return res.status(503).json({
      success: false,
      code: 'PAYMENT_GATEWAY_NOT_CONFIGURED',
      message: 'Pembayaran QRIS belum tersedia karena payment gateway belum dikonfigurasi.',
    });
  }

  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.auth.userId },
      select: {
        id: true,
        totalPrice: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        paymentReference: true,
        qrisPayload: true,
        qrisExpiresAt: true,
      },
    });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    if (order.paymentMethod !== 'QRIS') {
      return res.status(409).json({
        success: false,
        code: 'PAYMENT_METHOD_MISMATCH',
        message: 'Pesanan ini tidak menggunakan pembayaran QRIS.',
      });
    }

    if (!Number.isSafeInteger(order.totalPrice) || order.totalPrice !== requestedAmount) {
      return res.status(400).json({
        success: false,
        code: 'PAYMENT_AMOUNT_MISMATCH',
        message: 'Total pembayaran tidak sesuai dengan total pesanan.',
      });
    }
    if (
      order.paymentStatus === 'PAID' ||
      !['PENDING', 'PENDING_PAYMENT'].includes(order.status.toUpperCase())
    ) {
      return res.status(409).json({
        success: false,
        code: 'ORDER_NOT_PAYABLE',
        message: 'Pesanan ini tidak dapat dibayarkan.',
      });
    }
    if (
      order.paymentMethod === 'QRIS' &&
      order.paymentReference &&
      order.qrisPayload &&
      order.qrisExpiresAt > new Date()
    ) {
      return res.json({
        success: true,
        data: {
          orderId: order.id,
          totalAmount: order.totalPrice,
          qrisPayload: order.qrisPayload,
          qrisExpiresAt: order.qrisExpiresAt,
        },
      });
    }

    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + 15 * 60 * 1000);
    const paymentReference = `gocan-${order.id}-${issuedAt.getTime()}`;
    const orderTimeParts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(issuedAt);
    const orderTime = Object.fromEntries(orderTimeParts.map(({ type, value }) => [type, value]));
    const midtransOrderTime =
      `${orderTime.year}-${orderTime.month}-${orderTime.day} ${orderTime.hour}:${orderTime.minute}:${orderTime.second} +0700`;
    const gatewayUrl = process.env.MIDTRANS_IS_PRODUCTION === 'true'
      ? MIDTRANS_PRODUCTION_URL
      : MIDTRANS_SANDBOX_URL;
    const auth = Buffer.from(`${serverKey}:`).toString('base64');
    const gatewayResponse = await fetch(`${gatewayUrl}/v2/charge`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        payment_type: 'qris',
        transaction_details: {
          order_id: paymentReference,
          gross_amount: order.totalPrice,
        },
        qris: { acquirer: 'gopay' },
        custom_expiry: {
          order_time: midtransOrderTime,
          expiry_duration: 15,
          unit: 'minute',
        },
      }),
      signal: AbortSignal.timeout(15000),
    });
    let gatewayData;
    try {
      gatewayData = await gatewayResponse.json();
    } catch (error) {
      console.error('Midtrans returned a non-JSON QRIS response:', error);
      return res.status(502).json({
        success: false,
        code: 'PAYMENT_GATEWAY_ERROR',
        message: 'Payment gateway mengembalikan respons yang tidak dapat diproses.',
      });
    }
    if (!gatewayResponse.ok || typeof gatewayData.qr_string !== 'string' || !gatewayData.qr_string) {
      console.error('Midtrans QRIS generation failed:', gatewayData.status_message || gatewayResponse.status);
      return res.status(502).json({
        success: false,
        code: 'PAYMENT_GATEWAY_ERROR',
        message: 'Payment gateway gagal membuat QRIS. Silakan coba kembali.',
      });
    }

    const gatewayExpiry = gatewayData.expiry_time ? new Date(gatewayData.expiry_time) : expiresAt;
    const qrisExpiresAt = new Date(Math.min(gatewayExpiry.getTime(), expiresAt.getTime()));
    if (!Number.isFinite(qrisExpiresAt.getTime()) || qrisExpiresAt <= issuedAt) {
      return res.status(502).json({
        success: false,
        code: 'INVALID_GATEWAY_EXPIRY',
        message: 'Payment gateway mengembalikan waktu kedaluwarsa yang tidak valid.',
      });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: 'QRIS',
        paymentStatus: 'PENDING',
        paymentReference,
        qrisPayload: gatewayData.qr_string,
        qrisExpiresAt,
      },
    });
    return res.json({
      success: true,
      data: {
        orderId: order.id,
        totalAmount: order.totalPrice,
        qrisPayload: gatewayData.qr_string,
        qrisExpiresAt,
      },
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        code: 'PAYMENT_GATEWAY_TIMEOUT',
        message: 'Payment gateway tidak merespons. Silakan coba kembali.',
      });
    }
    return next(error);
  }
};

const handleMidtransNotification = async (req, res, next) => {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey || !verifyMidtransNotification(req.body, serverKey)) {
    return res.status(401).json({ success: false, message: 'Signature notifikasi pembayaran tidak valid.' });
  }

  try {
    const order = await prisma.order.findFirst({
      where: { paymentReference: req.body.order_id },
      select: {
        id: true,
        userId: true,
        totalPrice: true,
        paymentMethod: true,
        paymentStatus: true,
        qrisExpiresAt: true,
      },
    });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pesanan pembayaran tidak ditemukan.' });
    }
    if (Number(req.body.gross_amount) !== order.totalPrice) {
      return res.status(400).json({ success: false, message: 'Total pembayaran notifikasi tidak sesuai.' });
    }

    const transactionStatus = req.body.transaction_status;
    const isPaid = transactionStatus === 'settlement' ||
      (transactionStatus === 'capture' && req.body.fraud_status === 'accept');
    if (
      !isPaid ||
      order.paymentMethod !== 'QRIS' ||
      order.paymentStatus === 'PAID' ||
      !order.qrisExpiresAt ||
      order.qrisExpiresAt <= new Date()
    ) {
      return res.json({ success: true });
    }

    const updated = await prisma.order.updateMany({
      where: {
        id: order.id,
        paymentStatus: 'PENDING',
        status: { in: ['pending', 'PENDING_PAYMENT'] },
      },
      data: {
        paymentStatus: 'PAID',
        status: 'PAID',
        pickupQrCode: createPickupQrCode({ orderId: order.id, userId: order.userId }),
      },
    });
    if (updated.count === 0) {
      const current = await prisma.order.findUnique({
        where: { id: order.id },
        select: { paymentStatus: true },
      });
      if (current?.paymentStatus !== 'PAID') {
        return res.status(409).json({
          success: false,
          message: 'Status pesanan berubah sebelum konfirmasi pembayaran diproses.',
        });
      }
    }
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

module.exports = { generateQris, handleMidtransNotification };
