import RunnerRatingForm from '../../components/customer/RunnerRatingForm';
import CanteenRatingForm from '../../components/customer/CanteenRatingForm';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  Clock3,
  MapPin,
  RefreshCw,
  MessageCircle,
  X,
} from 'lucide-react';

import { api } from '../../lib/api';
import Navbar from '../../components/common/Navbar';
import LoadingScreen from '../../components/LoadingScreen';
import {
  formatOrderDate,
  formatRupiah,
  getOrderPresentation,
  getOrderTotal,
  normalizeOrderStatus,
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
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loadedOrderId, setLoadedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [openingChat, setOpeningChat] = useState('');
  const [chatError, setChatError] = useState('');

  const [cancelling, setCancelling] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [cancelNote, setCancelNote] = useState('');
  const [cancelError, setCancelError] = useState(null);

  const requestVersion = useRef(0);
  const activeOrderId = useRef(orderId);
  const cancelDialogRef = useRef(null);
  const cancelTriggerRef = useRef(null);

  const openOrderChat = async (targetUserId, partner) => {
    if (!targetUserId || openingChat) return;
    setOpeningChat(partner);
    setChatError('');
    try {
      const { conversation } = await api.post('/chats', {
        targetUserId,
        orderId: order.id,
      });
      navigate(`/chat/${conversation.id}`);
    } catch (requestError) {
      console.error(`Gagal membuka chat dengan ${partner}:`, requestError);
      setChatError(requestError.message || `Chat dengan ${partner} gagal dibuka.`);
    } finally {
      setOpeningChat('');
    }
  };

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

      if (
        response?.success !== true ||
        String(response.order?.id) !== String(orderId) ||
        normalizeOrderStatus(response.order?.status) !== 'cancelled'
      ) {
        throw new Error('Server belum mengonfirmasi pembatalan pesanan.');
      }

      setOrder((currentOrder) =>
        currentOrder ? { ...currentOrder, ...response.order } : currentOrder
      );

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
    return (
      <div className="min-h-screen bg-[#F0F4F9]">
        <Navbar />

        <LoadingScreen message="Memuat status pesanan..." />
      </div>
    );
  }

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
                    <span className="min-w-0 flex-1">
                      {item.quantity || 1}x{' '}
                      {item.name || item.menu_name || 'Menu'}
                      {item.notes && (
                        <span className="mt-1 block break-words text-xs font-normal text-slate-500">
                          Catatan: {item.notes}
                        </span>
                      )}
                    </span>

                    <span className="gocan-price shrink-0 font-semibold">
                      {formatRupiah(
                        (Number(item.price) || 0) *
                          (Number(item.quantity) || 1)
                      )}
                    </span>
                  </div>
                ))}

                {order.promoCode && (
                  <div className="flex justify-between gap-4 text-sm font-semibold text-emerald-700">
                    <span>Kode promo {order.promoCode}</span>
                    <span className="gocan-price">− {formatRupiah(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-100 pt-3 font-bold">
                  <span>Total</span>
                  <span className="gocan-price">
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

<div className="mt-6 space-y-2">
  {chatError && (
    <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
      {chatError}
    </p>
  )}
  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
    {order.canteen?.users?.[0]?.id && (
      <button
        type="button"
        disabled={Boolean(openingChat)}
        onClick={() => openOrderChat(order.canteen.users[0].id, 'Kantin')}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-[#dc0413] transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-60"
      >
        <MessageCircle className="h-4 w-4" />
        {openingChat === 'Kantin' ? 'Membuka chat...' : 'Chat dengan Kantin'}
      </button>
    )}

    {!isPickup && (order.courier || order.runner) && (
      <button
        type="button"
        disabled={Boolean(openingChat)}
        onClick={() => openOrderChat(order.courier?.id || order.runner?.id, 'Runner')}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-[#2152B7] transition hover:bg-blue-100 disabled:cursor-wait disabled:opacity-60"
      >
        <MessageCircle className="h-4 w-4" />
        {openingChat === 'Runner' ? 'Membuka chat...' : 'Chat dengan Runner'}
      </button>
    )}
  </div>
</div>

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
    className="mt-4 block rounded-full bg-[#2152B7] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-[#193F91]"
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