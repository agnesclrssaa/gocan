import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import Navbar from '../../components/common/Navbar';

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
    if (!window.confirm('Yakin ingin membatalkan pesanan ini?')) return;

    try {
      setCancelling(true);
      await api.post(`/orders/${orderId}/cancel`, {});
      await fetchOrder();
    } catch (requestError) {
      console.error('Gagal membatalkan pesanan:', requestError);
      setError(requestError.message || 'Gagal membatalkan pesanan.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading || loadedOrderId !== orderId) {
    return (
      <div className="min-h-screen bg-[#F0F4F9]">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-32">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#0A2E6E] border-t-transparent" />
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
          <Link to="/history" className="text-sm font-bold text-[#0A2E6E] hover:underline">
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

        <header className="rounded-3xl bg-[#0A2E6E] p-6 text-white shadow-lg sm:p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
            ID PESANAN #{order.id}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold">
            {status === 'completed'
              ? 'Pesanan selesai'
              : status === 'cancelled'
                ? 'Pesanan dibatalkan'
                : 'Pantau pesanan Anda'}
          </h1>
          <p className="mt-1 text-sm text-blue-100">
            {canteen?.name || 'Kantin'} · {order.orderType === 'pickup' ? 'Ambil sendiri' : 'Diantar'}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-5">
          <section className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Status pesanan
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Status diperbarui otomatis setiap beberapa detik.
              </p>
            </div>

            {status === 'cancelled' ? (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                Pesanan ini telah dibatalkan.
              </p>
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
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
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
                {order.orderType === 'delivery' && (
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
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="mt-6 w-full rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {cancelling ? 'Membatalkan...' : 'Batalkan pesanan'}
                </button>
              )}
            </section>
            <Link to="/history" className="block text-center text-sm font-bold text-[#0A2E6E] hover:underline">
              Kembali ke pesanan saya
            </Link>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default OrderTracking;
