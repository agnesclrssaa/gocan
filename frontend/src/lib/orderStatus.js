const STATUS_ALIASES = {
  PENDING: 'pending',
  PENDING_PAYMENT: 'pending',
  PAID: 'pending',
  COOKING: 'cooking',
  PREPARING: 'cooking',
  READY: 'ready',
  READY_FOR_PICKUP: 'ready',
  DELIVERING: 'delivering',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  CANCELED: 'cancelled',
};

export const normalizeOrderStatus = (status) =>
  STATUS_ALIASES[String(status || '').toUpperCase()] || 'unknown';

export const formatRupiah = (value) => {
  const amount = Number(value);

  return `Rp ${
    Number.isFinite(amount)
      ? Math.max(0, amount).toLocaleString('id-ID')
      : '0'
  }`;
};

export const formatOrderDate = (value) => {
  if (!value) return 'Waktu belum tersedia';

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return 'Waktu belum tersedia';
  }

  return `${date.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  })} WIB`;
};

export const getOrderTotal = (order) =>
  Number(order.totalAmount) > 0
    ? order.totalAmount
    : (order.totalPrice ?? 0);

export function getOrderPresentation(order = {}) {
  const status = normalizeOrderStatus(order.status);

  const isPickup =
    String(order.fulfillmentType || order.orderType || '')
      .toLowerCase() === 'pickup';

  const fulfillmentLabel = isPickup
    ? 'Ambil sendiri'
    : 'Diantar Campus Runner';

  const rawMethod = String(order.paymentMethod || '').toUpperCase();
  const method = rawMethod === 'GOCAN_PAY' ? 'QRIS' : rawMethod;

  const methodLabel =
    {
      CASH: 'Tunai',
      QRIS: 'QRIS',
      DEBIT: 'Kartu debit',
    }[method] || 'Belum tersedia';

  const paymentStatus =
    String(order.paymentStatus || '').toUpperCase();

  const isCash = method === 'CASH';

  const isPaid =
    paymentStatus === 'PAID' ||
    (!isCash && String(order.status).toUpperCase() === 'PAID');

  const paymentFailed = [
    'FAILED',
    'DENIED',
    'EXPIRED',
    'CANCELLED',
    'CANCELED',
  ].includes(paymentStatus);

  const awaitingPayment =
    status === 'pending' &&
    ['QRIS', 'DEBIT'].includes(method) &&
    !isPaid;

  const isTerminal =
    status === 'completed' || status === 'cancelled';

  const isScheduled =
    Boolean(order.isScheduled) ||
    String(order.orderType).toUpperCase() === 'SCHEDULED';

  const pickupVerificationPending =
    isPickup && status === 'delivering';

  let paymentLabel = 'Belum dikonfirmasi';
  let paymentTone = 'amber';

  if (isPaid) {
    paymentLabel = 'Lunas';
    paymentTone = 'green';
  } else if (paymentFailed) {
    paymentLabel =
      paymentStatus === 'EXPIRED'
        ? 'Kedaluwarsa'
        : 'Pembayaran belum berhasil';

    paymentTone = 'red';
  } else if (isCash) {
    paymentLabel =
      status === 'completed'
        ? 'Tunai belum dikonfirmasi'
        : 'Bayar tunai saat diterima';
  } else if (method === 'QRIS' || method === 'DEBIT') {
    paymentLabel = 'Menunggu pembayaran';
  }

  const descriptions = {
    pending: {
      label: awaitingPayment
        ? paymentFailed
          ? 'Periksa pembayaran'
          : 'Menunggu pembayaran'
        : 'Pesanan diterima',

      description: awaitingPayment
        ? 'Pesanan sudah tersimpan. Pembayaran perlu dikonfirmasi sebelum kantin mulai memprosesnya.'
        : 'Pesanan sudah diterima sistem dan menunggu mulai disiapkan oleh kantin.',

      tone: awaitingPayment ? 'amber' : 'blue',
    },

    cooking: {
      label: 'Sedang disiapkan',
      description:
        'Kantin sedang menyiapkan makanan dan minuman pesanan Anda.',
      tone: 'blue',
    },

    ready: {
      label: isPickup
        ? 'Siap diambil di kantin'
        : 'Siap dijemput runner',

      description: isPickup
        ? 'Pesanan sudah siap. Datang ke kantin dan tunjukkan tiket pengambilan kepada petugas.'
        : 'Pesanan sudah siap di kantin dan menunggu diambil oleh Campus Runner.',

      tone: 'green',
    },

    delivering: isPickup
      ? {
          label: order.isPickupVerified
            ? 'Pengambilan terverifikasi'
            : 'Menunggu konfirmasi pengambilan',

          description: order.isPickupVerified
            ? 'Pengambilan telah diverifikasi petugas. Status selesai masih menunggu konfirmasi.'
            : 'Konfirmasi pengambilan sedang diproses. Periksa kembali status atau hubungi petugas kantin.',

          tone: 'amber',
        }
      : {
          label: 'Sedang diantar',
          description:
            'Campus Runner sedang mengantar pesanan ke lokasi yang tercantum.',
          tone: 'blue',
        },

    completed: {
      label: 'Pesanan selesai',

      description: isPickup
        ? 'Pesanan telah selesai diambil. Terima kasih sudah memesan di GoCan.'
        : 'Pesanan telah selesai diantar. Terima kasih sudah memesan di GoCan.',

      tone: 'green',
    },

    cancelled: {
      label: 'Pesanan dibatalkan',
      description:
        'Pesanan ini telah dibatalkan dan tidak dilanjutkan ke tahap berikutnya.',
      tone: 'red',
    },

    unknown: {
      label: 'Status belum tersedia',
      description:
        'Status pesanan belum dapat ditampilkan. Muat ulang untuk memeriksa pembaruan.',
      tone: 'slate',
    },
  };

  const summary = descriptions[status];

  const steps = [
    {
      key: 'payment',
      label: isCash
        ? 'Metode tunai dipilih'
        : 'Konfirmasi pembayaran',

      description: isCash
        ? isPickup
          ? 'Pembayaran dilakukan di kasir kantin saat pengambilan.'
          : 'Pembayaran dilakukan ke runner saat pesanan diterima.'
        : 'Pembayaran dikonfirmasi sebelum pesanan mulai disiapkan.',
    },

    {
      key: 'pending',
      label: 'Pesanan diterima',
      description: 'Pesanan masuk ke antrean kantin.',
    },

    {
      key: 'cooking',
      label: 'Sedang disiapkan',
      description: 'Kantin menyiapkan pesanan Anda.',
    },

    {
      key: 'ready',

      label: pickupVerificationPending
        ? 'Konfirmasi pengambilan'
        : isPickup
          ? 'Siap diambil di kantin'
          : 'Siap dijemput runner',

      description: pickupVerificationPending
        ? order.isPickupVerified
          ? 'Pengambilan terverifikasi. Menunggu konfirmasi status selesai.'
          : 'Petugas sedang mengonfirmasi pengambilan pesanan.'
        : isPickup
          ? 'Tunjukkan tiket pengambilan kepada petugas kantin.'
          : 'Runner mengambil pesanan dari kantin.',
    },

    ...(!isPickup
      ? [
          {
            key: 'delivering',
            label: 'Sedang diantar',
            description:
              'Runner menuju lokasi pengantaran Anda.',
          },
        ]
      : []),

    {
      key: 'completed',
      label: 'Pesanan selesai',

      description: isPickup
        ? 'Pengambilan pesanan selesai dikonfirmasi.'
        : 'Pesanan selesai diantar ke pemesan.',
    },
  ];

  const activeKey = awaitingPayment
    ? 'payment'
    : isPickup && status === 'delivering'
      ? 'ready'
      : status;

  const activeStep = steps.findIndex(
    (step) => step.key === activeKey
  );

  const canCancel = ['pending', 'PENDING_PAYMENT'].includes(
    String(order.status || '')
  );

  return {
    status,
    isPickup,
    fulfillmentLabel,
    methodLabel,
    paymentLabel,
    paymentTone,
    isPaid,
    awaitingPayment,
    isTerminal,
    isScheduled,
    canCancel,
    steps,
    activeStep,
    ...summary,
  };
}

export const ORDER_TONES = {
  blue: 'border-blue-200 bg-blue-50 text-blue-800',
  amber: 'border-amber-200 bg-amber-50 text-amber-900',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  red: 'border-red-200 bg-red-50 text-red-800',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
};