import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import { api } from '../../lib/api';
import Navbar from '../../components/common/Navbar';

const CANCEL_REASONS = [
  'Ingin mengubah item pesanan',
  'Salah memilih lokasi gedung / ruang kelas',
  'Waktu penyiapan terlalu lama',
  'Ingin mengganti metode pembayaran',
  'Lainnya',
];

const ORDER_STEPS = [
  { status: 'pending', label: 'Pesanan diterima' },
  { status: 'cooking', label: 'Pesanan sedang disiapkan' },
  { status: 'ready', label: 'Pesanan siap diambil kurir' },
  { status: 'delivering', label: 'Pesanan sedang diantar' },
  { status: 'completed', label: 'Pesanan selesai' },
];

const getActiveStep = (status) => ORDER_STEPS.findIndex((step) => step.status === status);

export const OrderTracking = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loadedOrderId, setLoadedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [cancelNote, setCancelNote] = useState('');
  const [cancelError, setCancelError] = useState(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      const { order: currentOrder } = await api.get(`/orders/${orderId}`);
      setOrder(currentOrder);
      setError(null);
    } catch (requestError) {
      console.error('Gagal memuat detail pesanan:', requestError);
      setOrder((currentOrder) =>
        String(currentOrder?.id) === orderId ? currentOrder : null
      );
      setError(requestError.message || 'Pesanan tidak ditemukan atau terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
      setLoadedOrderId(orderId);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    const intervalId = window.setInterval(fetchOrder, 10000);
    return () => window.clearInterval(intervalId);
  }, [fetchOrder]);

  const handleCancelOrder = async () => {
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
      const response = await api.post(`/orders/${orderId}/cancel`, cancellation);
      setOrder((currentOrder) => ({
        ...currentOrder,
        ...response.order,
        ...cancellation,
        status: 'cancelled',
      }));
      setIsCancelModalOpen(false);
      await fetchOrder();
    } catch (requestError) {
      console.error('Gagal membatalkan pesanan:', requestError);
      setCancelError(requestError.message || 'Gagal membatalkan pesanan.');
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

  if (loading || loadedOrderId !== orderId) {
    return (
      <div className="min-h-screen bg-[#F0F4F9]">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-32">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2152B7] border-t-transparent" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Memuat status pesanan...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F0F4F9]">
        <Navbar />
        <main className="mx-auto max-w-3xl space-y-4 px-4 pt-10">
          <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error || 'Pesanan tidak ditemukan.'}
          </p>
          <Link to="/history" className="text-sm font-bold text-[#2152B7] hover:underline">
            Kembali ke pesanan saya
          </Link>
        </main>
      </div>
    );
  }

  const status = order.status;
  const activeStep = getActiveStep(status);
  const items = Array.isArray(order.items) ? order.items : [];
  const canteen = order.canteen;

  return (
    <div className="min-h-screen bg-[#F0F4F9] pb-20 text-slate-800">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 pt-8 sm:px-6 lg:px-8">
        {error && (
          <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        <header className="customer-card rounded-3xl bg-[#2152B7] p-6 text-white shadow-lg sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-white/90">
            ID PESANAN #{order.id}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold">
            {status === 'completed'
              ? 'Pesanan selesai'
              : status === 'cancelled'
                ? 'Pesanan dibatalkan'
                : 'Pantau pesanan Anda'}
          </h1>
          <p className="mt-1 text-sm text-white/90">
            {canteen?.name || 'Kantin'} · {(order.fulfillmentType || order.orderType) === 'pickup' ? 'Ambil sendiri' : 'Diantar'}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-5">
          <section className="customer-card space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Status pesanan
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Status diperbarui otomatis setiap beberapa detik.
              </p>
            </div>

            {status === 'cancelled' ? (
              <div className="customer-card space-y-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-slate-700">
                <p>Pesanan ini telah dibatalkan.</p>
                {order.cancelReason && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Alasan Pembatalan</p>
                    <p className="mt-1 font-semibold">{order.cancelReason}</p>
                  </div>
                )}
                {order.cancelNote && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Catatan Tambahan</p>
                    <p className="mt-1 whitespace-pre-wrap">{order.cancelNote}</p>
                  </div>
                )}
              </div>
            ) : (
              <ol className="space-y-4">
                {ORDER_STEPS.map((step, index) => {
                  const isComplete = index <= activeStep;
                  return (
                    <li key={step.status} className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          isComplete ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className={isComplete ? 'font-semibold text-slate-900' : 'text-slate-500'}>
                        {step.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
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
                    <span>{item.quantity || 1}x {item.name || item.menu_name || 'Menu'}</span>
                    <span className="font-semibold">
                      Rp {((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-slate-100 pt-3 font-bold">
                  <span>Total</span>
                  <span>Rp {Number(order.totalPrice).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-5 lg:col-span-2">
            <section className="customer-card rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Informasi pesanan
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-slate-500">Kantin</dt>
                  <dd className="font-semibold text-slate-900">{canteen?.name || 'Kantin'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Status</dt>
                  <dd className="font-semibold text-slate-900">{status}</dd>
                </div>
                {order.courier && (
                  <div>
                    <dt className="text-slate-500">Kurir</dt>
                    <dd className="font-semibold text-slate-900">{order.courier.name}</dd>
                  </div>
                )}
                {(order.fulfillmentType || order.orderType) === 'delivery' && (
                  <>
                    {order.buildingName && (
                      <div>
                        <dt className="text-slate-500">Gedung</dt>
                        <dd className="font-semibold text-slate-900">{order.buildingName}</dd>
                      </div>
                    )}
                    {order.classInfo && (
                      <div>
                        <dt className="text-slate-500">Ruangan / kelas</dt>
                        <dd className="font-semibold text-slate-900">{order.classInfo}</dd>
                      </div>
                    )}
                    {order.meetingPoint && (
                      <div>
                        <dt className="text-slate-500">Titik temu</dt>
                        <dd className="font-semibold text-slate-900">{order.meetingPoint}</dd>
                      </div>
                    )}
                    {order.deliveryNote && (
                      <div>
                        <dt className="text-slate-500">Catatan</dt>
                        <dd className="font-semibold text-slate-900">{order.deliveryNote}</dd>
                      </div>
                    )}
                  </>
                )}
              </dl>
              {status === 'pending' && (
                <button
                  type="button"
                  onClick={() => {
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
            <Link to="/history" className="block text-center text-sm font-bold text-[#2152B7] hover:underline">
              Kembali ke pesanan saya
            </Link>
          </aside>
        </div>
      </main>

      {isCancelModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCancelModal();
          }}
        >
          <section
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
                <h2 id="cancel-order-title" className="text-lg font-extrabold text-slate-900">
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
                <label key={reason} className="customer-card flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
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

            <label htmlFor="cancel-note" className="mt-5 block text-sm font-bold text-slate-700">
              Catatan Tambahan (opsional)
            </label>
            <textarea
              id="cancel-note"
              value={cancelNote}
              onChange={(event) => setCancelNote(event.target.value)}
              disabled={cancelling}
              maxLength={1000}
              rows={3}
              placeholder="Tuliskan alasan spesifik Anda (opsional)..."
              className="mt-2 w-full resize-y rounded-xl border border-slate-200 p-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:ring-2 focus:ring-red-100 disabled:bg-slate-50"
            />

            {cancelError && (
              <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
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
                {cancelling ? 'Membatalkan...' : 'Ya, Batalkan Pesanan'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
