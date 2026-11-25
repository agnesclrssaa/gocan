const prisma = require('../src/lib/prisma');

const DEFAULT_PROMO = {
  code: 'LAPERUTS',
  title: 'PROMO UTS - Diskon 35%',
  discountType: 'PERCENTAGE',
  discountValue: 35,
  maxDiscount: 10000,
  minOrder: 15000,
  isActive: true,
};

const ensureDefaultPromo = async () => {
  const promoCount = await prisma.promo.count();
  if (promoCount === 0) {
    await prisma.promo.upsert({
      where: { code: DEFAULT_PROMO.code },
      update: {},
      create: DEFAULT_PROMO,
    });
  }
};

const validatePromo = async ({ code, subtotal, campusId }) => {
  if (typeof code !== 'string' || !code.trim()) {
    return { error: 'Masukkan kode promo terlebih dahulu.', status: 400 };
  }
  if (!Number.isFinite(subtotal) || subtotal < 0 || subtotal > Number.MAX_SAFE_INTEGER) {
    return { error: 'Subtotal pesanan tidak valid.', status: 400 };
  }
  if (campusId != null && typeof campusId !== 'string') {
    return { error: 'Kampus pesanan tidak valid.', status: 400 };
  }

  await ensureDefaultPromo();
  const normalizedCode = code.trim().toUpperCase();
  const promo = await prisma.promo.findUnique({ where: { code: normalizedCode } });
  if (!promo) {
    return { error: 'Kode promo tidak ditemukan.', status: 404 };
  }
  if (!promo.isActive) {
    return { error: 'Kode promo sudah tidak aktif.', status: 400 };
  }
  if (promo.validUntil && promo.validUntil <= new Date()) {
    return { error: 'Masa berlaku kode promo telah berakhir.', status: 400 };
  }
  if (promo.campusId && promo.campusId !== campusId) {
    return { error: 'Kode promo tidak berlaku untuk kampus pesanan ini.', status: 400 };
  }
  if (subtotal < promo.minOrder) {
    return {
      error: `Minimal subtotal untuk promo ini adalah Rp ${promo.minOrder.toLocaleString('id-ID')}.`,
      status: 400,
    };
  }

  if (promo.discountValue < 0 || promo.minOrder < 0 || (promo.maxDiscount != null && promo.maxDiscount < 0)) {
    return { error: 'Pengaturan nilai promo tidak valid.', status: 500 };
  }

  let discountAmount;
  if (promo.discountType === 'PERCENTAGE') {
    discountAmount = Math.floor((subtotal * promo.discountValue) / 100);
  } else if (promo.discountType === 'FIXED') {
    discountAmount = promo.discountValue;
  } else {
    return { error: 'Pengaturan tipe diskon promo tidak valid.', status: 500 };
  }

  if (!Number.isSafeInteger(discountAmount) || discountAmount < 0) {
    return { error: 'Pengaturan nilai diskon promo tidak valid.', status: 500 };
  }
  if (promo.maxDiscount != null) {
    discountAmount = Math.min(discountAmount, promo.maxDiscount);
  }
  discountAmount = Math.min(discountAmount, subtotal);

  return {
    valid: true,
    code: promo.code,
    title: promo.title,
    discountAmount,
    finalSubtotal: subtotal - discountAmount,
  };
};

module.exports = { ensureDefaultPromo, validatePromo };
