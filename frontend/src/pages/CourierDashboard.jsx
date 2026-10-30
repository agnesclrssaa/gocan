import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertCircle, Bike, CheckCircle2, PackageCheck, RefreshCw } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const formatRupiah = (amount) =>
  `Rp ${Number(amount || 0).toLocaleString('id-ID')}`;

function OrderCard({ order, actionLabel, onAction, busy }) {
  const items = Array.isArray(order.items) ? order.items : null;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Pesanan #{order.id}
          </p>
          <p className="mt-1 text-lg font-extrabold text-[#0A2E6E]">
            {formatRupiah(order.totalPrice)}
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold capitalize text-amber-800">
          {order.status}
        </span>
      </div>

      <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-700">
        {items
          ? items.map((item, index) => (
              <li key={`${item.id || item.name}-${index}`} className="flex justify-between gap-3">
                <span>{item.quantity || 1}× {item.name || 'Menu'}</span>
                <span className="shrink-0 font-semibold">
                  {formatRupiah((Number(item.price) || 0) * (Number(item.quantity) || 1))}
                </span>
              </li>
            ))
          : <li role="alert" className="text-red-700">Data item pesanan tidak valid.</li>}
      </ul>

      <button
        type="button"
        onClick={() => onAction(order.id)}
        disabled={busy}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A2E6E] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#082252] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {actionLabel === 'Selesai Diantar'
          ? <CheckCircle2 className="h-4 w-4" />
          : <Bike className="h-4 w-4" />}
        {busy ? 'Memproses...' : actionLabel}
      </button>
    </article>
  );
}

export default function CourierDashboard() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/orders/courier');
      setOrders(data);
    } catch (requestError) {
      console.error('Gagal memuat pesanan kurir:', requestError);
      setError(requestError.message || 'Gagal memuat daftar pesanan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (profile?.role !== 'courier') {
    return <Navigate to="/unauthorized" replace />;
  }

  const updateStatus = async (orderId, status) => {
    setBusyOrderId(orderId);
    setError(null);
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      await fetchOrders();
    } catch (requestError) {
      console.error(`Gagal mengubah status pesanan ${orderId}:`, requestError);
      setError(requestError.message || 'Gagal memperbarui status pesanan.');
    } finally {
      setBusyOrderId(null);
    }
  };

  const readyOrders = orders.filter((order) => order.status === 'ready');
  const deliveringOrders = orders.filter((order) => order.status === 'delivering');

  return (
    <div className="min-h-screen bg-[#F0F4F9] pb-12 text-slate-800">
      <Navbar />
      <main className="mx-auto max-w-6xl space-y-7 px-4 pt-7 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-700">
              <Bike className="h-4 w-4" />
              Portal Kurir GoCan
            </p>
            <h1 className="mt-1 text-2xl font-black text-[#0A2E6E] sm:text-3xl">
              Dashboard Kurir
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Ambil pesanan siap antar dan perbarui status pengiriman.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-medium text-slate-500">
            Memuat pesanan...
          </div>
        ) : (
          <>
            <section aria-labelledby="ready-orders-heading" className="space-y-4">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-emerald-700" />
                <h2 id="ready-orders-heading" className="text-lg font-extrabold text-slate-900">
                  Siap Diambil
                </h2>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  {readyOrders.length}
                </span>
              </div>
              {readyOrders.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {readyOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      actionLabel="Ambil Pesanan"
                      onAction={(id) => updateStatus(id, 'delivering')}
                      busy={busyOrderId === order.id}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  Belum ada pesanan yang siap diambil.
                </p>
              )}
            </section>

            <section aria-labelledby="delivering-orders-heading" className="space-y-4">
              <div className="flex items-center gap-2">
                <Bike className="h-5 w-5 text-blue-700" />
                <h2 id="delivering-orders-heading" className="text-lg font-extrabold text-slate-900">
                  Sedang Diantar
                </h2>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                  {deliveringOrders.length}
                </span>
              </div>
              {deliveringOrders.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {deliveringOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      actionLabel="Selesai Diantar"
                      onAction={(id) => updateStatus(id, 'completed')}
                      busy={busyOrderId === order.id}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                  Belum ada pesanan yang sedang diantar.
                </p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
