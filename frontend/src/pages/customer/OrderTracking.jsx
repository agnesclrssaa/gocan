import RunnerRatingForm from '../../components/customer/RunnerRatingForm';
import CanteenRatingForm from '../../components/customer/CanteenRatingForm';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  Clock3,
  MapPin,
  RefreshCw,
  X,
} from 'lucide-react';

import { api } from '../../lib/api';
import Navbar from '../../components/common/Navbar';
import {
  formatOrderDate,
  formatRupiah,
  getOrderPresentation,
  getOrderTotal,
  ORDER_TONES,
} from '../../lib/orderStatus';

const CANCEL_REASONS = [
  'Ingin mengubah item pesanan',
  'Salah memilih lokasi gedung / ruang kelas',
  'Waktu penyiapan terlalu lama',
  'Ingin mengganti metode pembayaran',
  'Lainnya',
];

export const OrderTracking = () => {
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loadedOrderId, setLoadedOrderId] = useState(null);
>>>>>>> 8466e8d987e5d2648f68fd3799c0a99c630dbd0a
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [cancelling, setCancelling] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [cancelNote, setCancelNote] = useState('');
  const [cancelError, setCancelError] = useState(null);

  const requestVersion = useRef(0);
  const activeOrderId = useRef(orderId);
  const cancelDialogRef = useRef(null);
  const cancelTriggerRef = useRef(null);

  const fetchOrder = useCallback(
    async (signal) => {
      if (!orderId) return;

      const version = ++requestVersion.current;

      try {
        const { order: currentOrder } = await api.get(
          `/orders/${encodeURIComponent(orderId)}`,
          { signal }
        );

        if (signal?.aborted || version !== requestVersion.current) {
          return;
        }

        if (
          !currentOrder ||
          String(currentOrder.id) !== String(orderId)
        ) {
          throw new Error(
            'Detail pesanan belum dapat dimuat. Silakan coba lagi.'
          );
        }

        setOrder(currentOrder);
        setError(null);
        setLastUpdated(new Date());
      } catch (requestError) {
        if (signal?.aborted || version !== requestVersion.current) {
          return;
        }

        console.error('Gagal memuat detail pesanan:', requestError);

        setOrder((currentOrder) =>
          String(currentOrder?.id) === orderId
            ? currentOrder
            : null
        );

        setError(
          requestError.message ||
            'Pesanan tidak ditemukan atau terjadi kesalahan koneksi.'
        );
      } finally {
        if (
          !signal?.aborted &&
          version === requestVersion.current
        ) {
          setLoading(false);
          setLoadedOrderId(orderId);
          setRefreshing(false);
        }
      }
    },
    [orderId]
  );

  useEffect(() => {
    activeOrderId.current = orderId;

    const controller = new AbortController();

    fetchOrder(controller.signal);

    const intervalId = window.setInterval(() => {
      fetchOrder(controller.signal);
    }, 10000);

    return () => {
      controller.abort();
      requestVersion.current += 1;
      window.clearInterval(intervalId);
    };
  }, [fetchOrder, orderId]);

  useEffect(() => {
    if (!isCancelModalOpen) return undefined;

    const trigger = cancelTriggerRef.current;
    const dialog = cancelDialogRef.current;

    dialog?.querySelector('button')?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !cancelling) {
        setIsCancelModalOpen(false);
      }

      if (event.key !== 'Tab') return;

      const controls = [
        ...(dialog?.querySelectorAll(
          'button:not(:disabled), input:not(:disabled), textarea:not(:disabled)'
        ) || []),
      ];

      const first = controls[0];
      const last = controls.at(-1);

      if (!first) {
        event.preventDefault();
        return;
      }

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      trigger?.focus();
    };
  }, [isCancelModalOpen, cancelling]);

  const handleCancelOrder = async () => {
    if (cancelling) return;

    if (!getOrderPresentation(order).canCancel) {
      setCancelError(
        'Status pesanan sudah berubah. Tutup dialog untuk melihat pembaruan terbaru.'
      );
      return;
    }

    if (!selectedReason) {
      setCancelError('Pilih alasan pembatalan terlebih dahulu.');
      return;
    }

    const cancellation = {
      status: 'cancelled',
      cancelReason: selectedReason,
      cancelNote: cancelNote.trim(),
    };

    try {
      setCancelling(true);
      setCancelError(null);

      const response = await api.post(
        `/orders/${orderId}/cancel`,
        cancellation
      );

      if (activeOrderId.current !== orderId) return;

      setOrder((currentOrder) => ({
        ...currentOrder,
        ...response.order,
        ...cancellation,
        status: 'cancelled',
      }));

      setIsCancelModalOpen(false);
      await fetchOrder();
    } catch (requestError) {
      console.error(
        'Gagal membatalkan pesanan:',
        requestError
      );

      setCancelError(
        requestError.message || 'Gagal membatalkan pesanan.'
      );
    } finally {
      setCancelling(false);
    }
  };

  const closeCancelModal = () => {
    if (cancelling) return;

    setIsCancelModalOpen(false);
    setSelectedReason('');
    setCancelNote('');
    setCancelError(null);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrder();
  };

  if (loading || loadedOrderId !== orderId) {
>>>>>>> 8466e8d987e5d2648f68fd3799c0a99c630dbd0a
    return (
      <div className="min-h-screen bg-[#F0F4F9]">
        <Navbar />

        <div className="flex flex-col items-center justify-center pt-32">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2152B7] border-t-transparent" />

          <p className="mt-4 text-sm font-semibold text-slate-500">
            Memuat status pesanan...
          </p>
        </div>
      </div>
    );
  }

<<<<<<< HEAD
  const orderType = order?.order_type || 'delivery';
  const status = order?.status || 'cooking';
  const isDelivery = orderType === 'delivery';

  // Format ID
  const displayId = orderId ? `#Gocan-${orderId.substring(0, 5).toUpperCase()}` : '#Gocan-82419';
  const canteenName = canteen?.name || 'Kantin Brazil';

  return (
    <div className="min-h-screen bg-[#F0F4F9] text-slate-800 pb-20">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Top Hero Banner matching mockup: Deep Navy #0A2E6E */}
        <div className="bg-[#0A2E6E] text-white rounded-3xl p-6 sm:p-8 relative shadow-lg overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-blue-200 tracking-wider uppercase mb-1">
                ID PESANAN {displayId}
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {status === 'completed'
                  ? 'Pesanan Telah Tiba & Selesai'
                  : status === 'cancelled'
                  ? 'Pesanan Dibatalkan'
                  : 'Pesanan sedang menuju titik temu'}
              </h1>
              <p className="text-sm text-blue-100 mt-1">
                Estimasi Tiba: 12:15 WIB (15 Menit Lagi)
              </p>
            </div>

            <div className="self-start sm:self-center">
              <span className="bg-[#F59E0B] text-slate-900 font-bold px-4 py-1.5 rounded-full text-xs tracking-wider uppercase shadow-sm">
                {status === 'completed' ? 'SELESAI' : status === 'cancelled' ? 'BATAL' : 'PROSES'}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Grid matching mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Stepper Lacak Perjalanan */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-400 tracking-wider uppercase">
                LACAK PERJALANAN PESANAN
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau progres pesanan secara real-time dari konfirmasi kantin sampai tiba di titik temu.
              </p>
            </div>

            {/* Stepper Timeline matching mockup */}
            <div className="relative pl-6 border-l-2 border-emerald-500 space-y-8 ml-3">
              {/* Step 1: Pesanan Dikonfirmasi Kantin (Green Check) */}
              <div className="relative">
                <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-white shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pesanan Dikonfirmasi Kantin
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    12.01 WIB • {canteenName} menyiapkan makanan Anda
                  </p>
                </div>
              </div>

              {/* Step 2: Kurir Menuju Gedungmu (Amber Dot active) */}
              <div className="relative">
                <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-[#F59E0B] text-white flex items-center justify-center ring-4 ring-white shadow-sm">
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0A2E6E]">
                    Kurir Mahasiswa Menuju Gedungmu
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    12.08 WIB • Kurir sedang naik tangga Benedictus
                  </p>
                </div>
              </div>

              {/* Step 3: Pesanan Sampai di Titik Temu (Gray) */}
              <div className="relative">
                <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center ring-4 ring-white">
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-500">
                    Pesanan Sampai di Titik Temu
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Estimasi 12.15 WIB
                  </p>
                </div>
              </div>
            </div>

            {/* Rincian Menu Pesanan */}
            {orderItems.length > 0 && (
              <div className="pt-6 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">
                  RINCIAN MENU
                </p>
                <div className="space-y-2 text-sm text-slate-700">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-1">
                      <span className="font-medium">
                        {item.quantity}x {item.menu_name || 'Menu'}
                      </span>
                      <span className="font-bold text-slate-800">
                        Rp {((Number(item.price) || 0) * (item.quantity || 1)).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Info Kurir, Alamat, E-ticket */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. INFO KURIR MAHASISWA */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                INFO KURIR MAHASISWA
              </h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                    alt="Kurir"
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      {runner?.full_name || 'Budi Santoso'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Fakultas Teknik • Kurir Gocan Resmi
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="tel:08123456789"
                    className="w-10 h-10 rounded-full bg-blue-50 text-[#0A2E6E] flex items-center justify-center hover:bg-blue-100 transition"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <a
                    href="https://wa.me/628123456789"
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* 2. ALAMAT TUJUAN */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                ALAMAT TUJUAN
              </h2>
              <h3 className="text-base font-bold text-slate-900">
                {delivery?.building_name || 'Gedung Benedictus, Lt. 3'}
              </h3>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">
                  Titik Temu: {delivery?.meeting_point || 'Lobby Depan Lift Lt. 3'}
                </p>
                <p className="text-slate-500">
                  Catatan: {delivery?.runner_notes || 'Tolong taruh di meja lobby jika belum sampai kelas'}
                </p>
              </div>
            </div>

            {/* 3. E-TICKET PENGAMBILAN */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  E-TICKET PENGAMBILAN
                </h2>
                <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  SIAP DIAMBIL
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">NO. PESANAN</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{displayId}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">KANTIN</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{canteenName}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-2">
                <div className="w-28 h-28 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center shrink-0">
                  <QrCode className="w-20 h-20 text-slate-800" />
                </div>
                <div className="text-xs text-slate-500 space-y-1.5">
                  <p className="font-bold text-slate-800">Scan QR untuk verifikasi pickup</p>
                  <p>Jadwal Pickup: <strong className="text-slate-700">Hari ini • 12:15 WIB</strong></p>
                  <p>Lokasi Pickup: <strong className="text-slate-700">{canteenName}</strong></p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-[11px] text-slate-500">
                <span className="font-bold text-[#0A2E6E] block mb-0.5">INSTRUKSI VERIFIKASI</span>
                Tunjukkan QR ini ke petugas kantin saat pickup. Pastikan nomor pesanan dan nama pemesan cocok sebelum pesanan diserahkan.
              </div>
            </div>
          </div>
=======
  if (!order) {
    return (
      <div className="min-h-screen bg-[#F0F4F9]">
        <Navbar />

        <main className="mx-auto max-w-3xl space-y-4 px-4 pt-10">
          <p
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error || 'Pesanan tidak ditemukan.'}
          </p>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-full bg-[#2152B7] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {refreshing ? 'Memuat...' : 'Coba lagi'}
          </button>

          <Link
            to="/history"
            className="block text-sm font-bold text-[#2152B7] hover:underline"
          >
            Kembali ke pesanan saya
          </Link>
        </main>
      </div>
    );
  }

  const presentation = getOrderPresentation(order);
  const { status, activeStep, steps, isPickup } = presentation;
  const items = Array.isArray(order.items) ? order.items : [];
  const canteen = order.canteen;

  return (
    <div className="min-h-screen bg-[#F0F4F9] pb-20 text-slate-800">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 pt-8 sm:px-6 lg:px-8">
        {error && (
          <p
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <header className="customer-card rounded-3xl bg-[#2152B7] p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-white/90">
              ID PESANAN #{order.id}
            </p>

            <Link
              to="/history"
              className="rounded-full border border-white/40 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10"
            >
              Pesanan saya
            </Link>
          </div>

          <h1 className="mt-2 text-2xl font-extrabold">
            {presentation.label}
          </h1>

          <p className="mt-1 text-sm text-white/90">
            {canteen?.name || 'Kantin'}
            {' · '}
            {presentation.fulfillmentLabel}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-5">
          <section className="customer-card space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Status pesanan
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Diperbarui otomatis setiap 10 detik.
                </p>
              </div>

              <button
                type="button"
                disabled={refreshing}
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-bold text-[#2152B7] hover:bg-blue-50 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${
                    refreshing
                      ? 'animate-spin motion-reduce:animate-none'
                      : ''
                  }`}
                />

                {refreshing ? 'Memuat...' : 'Perbarui'}
              </button>
            </div>

            <div
              role="status"
              aria-live="polite"
              className={`rounded-2xl border p-4 ${
                ORDER_TONES[presentation.tone]
              }`}
            >
              <p className="font-bold">
                {presentation.label}
              </p>

              <p className="mt-1 text-sm leading-relaxed">
                {presentation.description}
              </p>
            </div>

            {presentation.isScheduled && order.scheduledTime && (
              <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-sm">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#2152B7]" />

                <div>
                  <p className="font-bold text-[#2152B7]">
                    Pesanan terjadwal
                  </p>

                  <p className="mt-1 text-slate-700">
                    {formatOrderDate(order.scheduledTime)}
                  </p>
                </div>
              </div>
            )}

            {status === 'cancelled' ? (
              <div className="customer-card space-y-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-slate-700">
                <p>Pesanan ini telah dibatalkan.</p>

                {order.cancelReason && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Alasan Pembatalan
                    </p>

                    <p className="mt-1 font-semibold">
                      {order.cancelReason}
                    </p>
                  </div>
                )}

                {order.cancelNote && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Catatan Tambahan
                    </p>

                    <p className="mt-1 whitespace-pre-wrap">
                      {order.cancelNote}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <ol
                className="space-y-0"
                aria-label={
                  isPickup
                    ? 'Tahapan pesanan ambil sendiri'
                    : 'Tahapan pesanan delivery'
                }
              >
                {steps.map((step, index) => {
                  const isCurrent =
                    index === activeStep &&
                    status !== 'completed';

                  const isComplete =
                    index < activeStep ||
                    status === 'completed';

                  return (
                    <li
                      key={step.key}
                      aria-current={
                        isCurrent ? 'step' : undefined
                      }
                      className="relative flex gap-3 pb-6 last:pb-0"
                    >
                      {index < steps.length - 1 && (
                        <span
                          aria-hidden="true"
                          className={`absolute left-[17px] top-9 h-[calc(100%-2rem)] w-0.5 ${
                            isComplete
                              ? 'bg-emerald-300'
                              : 'bg-slate-200'
                          }`}
                        />
                      )}

                      <span
                        aria-hidden="true"
                        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          isComplete
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                              ? 'bg-[#2152B7] text-white ring-4 ring-blue-100'
                              : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isComplete ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </span>

                      <div className="min-w-0 flex-1 pt-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={`text-sm font-bold ${
                              isCurrent
                                ? 'text-[#2152B7]'
                                : isComplete
                                  ? 'text-slate-800'
                                  : 'text-slate-500'
                            }`}
                          >
                            {step.label}
                          </p>

                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isCurrent
                                ? 'bg-blue-50 text-blue-800'
                                : isComplete
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'bg-slate-50 text-slate-500'
                            }`}
                          >
                            {isCurrent
                              ? 'Tahap saat ini'
                              : isComplete
                                ? 'Selesai'
                                : 'Berikutnya'}
                          </span>
                        </div>

                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          {step.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {lastUpdated && (
              <p className="text-xs text-slate-400">
                Terakhir diperbarui:{' '}
                {formatOrderDate(lastUpdated)}
              </p>
            )}

            <div className="border-t border-slate-100 pt-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Rincian menu
              </h2>

              <div className="mt-3 space-y-2">
                {items.map((item, index) => (
                  <div
                    key={item.cartItemId || item.id || index}
                    className="flex justify-between gap-4 text-sm text-slate-700"
                  >
                    <span>
                      {item.quantity || 1}x{' '}
                      {item.name || item.menu_name || 'Menu'}
                    </span>

                    <span className="shrink-0 font-semibold">
                      {formatRupiah(
                        (Number(item.price) || 0) *
                          (Number(item.quantity) || 1)
                      )}
                    </span>
                  </div>
                ))}

                <div className="flex justify-between border-t border-slate-100 pt-3 font-bold">
                  <span>Total</span>
                  <span>
                    {formatRupiah(getOrderTotal(order))}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-5 lg:col-span-2">
          <CanteenRatingForm
  key={order.id}
  order={order}
/>  

<RunnerRatingForm
  key={`runner-${order.id}`}
  order={order}
  onSubmitRating={({ orderId, stars, reviewText }) =>
    api.post(
      `/orders/${encodeURIComponent(orderId)}/runner-rating`,
      {
        stars,
        reviewText,
      }
    )
  }
/>

            <section className="customer-card rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Informasi pesanan
              </h2>

              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-slate-500">Kantin</dt>
                  <dd className="font-semibold text-slate-900">
                    {canteen?.name || 'Kantin'}
                  </dd>
                </div>

                <div>
                  <dt className="text-slate-500">Status</dt>
                  <dd className="font-semibold text-slate-900">
                    {presentation.label}
                  </dd>
                </div>

                <div>
                  <dt className="text-slate-500">
                    Cara menerima pesanan
                  </dt>
                  <dd className="font-semibold text-slate-900">
                    {presentation.fulfillmentLabel}
                  </dd>
                </div>

                <div>
                  <dt className="text-slate-500">
                    Metode pembayaran
                  </dt>
                  <dd className="font-semibold text-slate-900">
                    {presentation.methodLabel}
                  </dd>
                </div>

                <div>
                  <dt className="text-slate-500">
                    Status pembayaran
                  </dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${
                        ORDER_TONES[presentation.paymentTone]
                      }`}
                    >
                      {presentation.paymentLabel}
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-slate-500">
                    Dipesan pada
                  </dt>
                  <dd className="font-semibold text-slate-900">
                    {formatOrderDate(order.createdAt)}
                  </dd>
                </div>

                {!isPickup && (order.courier || order.runner) && (
                  <div>
                    <dt className="text-slate-500">
                      Campus Runner
                    </dt>
                    <dd className="font-semibold text-slate-900">
                      {order.courier?.name || order.runner?.name}
                    </dd>
                  </div>
                )}

                {!isPickup && (
                  <>
                    {(order.destinationBuilding ||
                      order.buildingName) && (
                      <div>
                        <dt className="text-slate-500">
                          Gedung
                        </dt>
                        <dd className="break-words font-semibold text-slate-900">
                          {order.destinationBuilding ||
                            order.buildingName}
                        </dd>
                      </div>
                    )}

                    {(order.destinationRoom ||
                      order.classInfo) && (
                      <div>
                        <dt className="text-slate-500">
                          Ruangan / kelas
                        </dt>
                        <dd className="break-words font-semibold text-slate-900">
                          {order.destinationRoom ||
                            order.classInfo}
                        </dd>
                      </div>
                    )}

                    {order.meetingPoint && (
                      <div>
                        <dt className="text-slate-500">
                          Titik temu
                        </dt>
                        <dd className="break-words font-semibold text-slate-900">
                          {order.meetingPoint}
                        </dd>
                      </div>
                    )}
                  </>
                )}

                {isPickup && (
                  <div>
                    <dt className="flex items-center gap-1 text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />
                      Lokasi pengambilan
                    </dt>
                    <dd className="break-words font-semibold text-slate-900">
                      {canteen?.location ||
                        canteen?.name ||
                        'Kantin sesuai pesanan'}
                    </dd>
                  </div>
                )}

                {order.deliveryNote && (
                  <div>
                    <dt className="text-slate-500">
                      Catatan pesanan
                    </dt>
                    <dd className="break-words whitespace-pre-wrap font-semibold text-slate-900">
                      {order.deliveryNote}
                    </dd>
                  </div>
                )}
              </dl>

<div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
  <h3 className="text-sm font-bold text-[#2152B7]">
    E-ticket pesanan
  </h3>

  <p className="mt-2 text-xs leading-relaxed text-slate-600">
    {isPickup
      ? 'Buka tiket untuk melihat detail pesanan dan ketersediaan QR pengambilan.'
      : 'Buka tiket untuk melihat ringkasan pesanan dan informasi pembayaran.'}
  </p>

  <Link
    to={`/order-success/${order.id}`}
    className="mt-4 block rounded-full bg-[#2152B7] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-800"
  >
    Lihat E-ticket
  </Link>
</div>

              {presentation.canCancel && (
                <button
                  ref={cancelTriggerRef}
                  type="button"
                  onClick={() => {
                    setSelectedReason('');
                    setCancelNote('');
                    setCancelError(null);
                    setIsCancelModalOpen(true);
                  }}
                  disabled={cancelling}
                  className="mt-6 w-full rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Batalkan pesanan
                </button>
              )}
            </section>

            <Link
              to="/history"
              className="block text-center text-sm font-bold text-[#2152B7] hover:underline"
            >
              Kembali ke pesanan saya
            </Link>
          </aside>
>>>>>>> 8466e8d987e5d2648f68fd3799c0a99c630dbd0a
        </div>
      </main>

      {isCancelModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCancelModal();
            }
          }}
        >
          <section
            ref={cancelDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-order-title"
            className="customer-card my-auto w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
          >
            <header className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </span>

                <h2
                  id="cancel-order-title"
                  className="text-lg font-extrabold text-slate-900"
                >
                  Konfirmasi Pembatalan Pesanan
                </h2>
              </div>

              <button
                type="button"
                onClick={closeCancelModal}
                disabled={cancelling}
                aria-label="Tutup dialog"
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <fieldset className="mt-6 space-y-3">
              <legend className="mb-3 text-sm font-bold text-slate-700">
                Pilih alasan pembatalan
              </legend>

              {CANCEL_REASONS.map((reason) => (
                <label
                  key={reason}
                  className="customer-card flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700"
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    disabled={cancelling}
                    className="mt-0.5 h-4 w-4 accent-red-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </fieldset>

            <label
              htmlFor="cancel-note"
              className="mt-5 block text-sm font-bold text-slate-700"
            >
              Catatan Tambahan (opsional)
            </label>

            <textarea
              id="cancel-note"
              value={cancelNote}
              onChange={(event) =>
                setCancelNote(event.target.value)
              }
              disabled={cancelling}
              maxLength={1000}
              rows={3}
              placeholder="Tuliskan alasan spesifik Anda (opsional)..."
              className="mt-2 w-full resize-y rounded-xl border border-slate-200 p-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:ring-2 focus:ring-red-100 disabled:bg-slate-50"
            />

            {cancelError && (
              <p
                role="alert"
                className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {cancelError}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCancelModal}
                disabled={cancelling}
                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Kembali / Batal
              </button>

              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling || !selectedReason}
                className="rounded-full bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelling
                  ? 'Membatalkan...'
                  : 'Ya, Batalkan Pesanan'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;