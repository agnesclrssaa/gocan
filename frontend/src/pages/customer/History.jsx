import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import Navbar from '../../components/common/Navbar';
import { getCustomerRoute, useCustomerPreview } from '../../lib/customerRoutes';

const ORDER_STATUS_LABELS = {
  pending: 'Menunggu konfirmasi',
  cooking: 'Sedang disiapkan',
  ready: 'Siap diambil kurir',
  delivering: 'Sedang diantar',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const formatDate = (date) =>
  new Date(date).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const OrderCard = ({ order, preview }) => {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce((total, item) => total + (Number(item.quantity) || 1), 0);

  return (
    <article className="customer-card rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-900">
              {order.canteen?.name || 'Kantin'}
            </h3>
            <span className="rounded-md bg-[#2152B7] px-2.5 py-0.5 text-xs font-bold text-white">
              {ORDER_STATUS_LABELS[order.status] || order.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {itemCount} menu · {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <span className="font-bold text-[#DC2626]">
            Rp {Number(order.totalPrice).toLocaleString('id-ID')}
          </span>
          <Link
            to={getCustomerRoute(`/order/${order.id}`, preview)}
            className="text-sm font-bold text-[#2152B7] hover:underline"
          >
            Detail
          </Link>
        </div>
      </div>
      {items.length > 0 && (
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
          {items.map((item) => `${item.quantity || 1}x ${item.name || item.menu_name || 'Menu'}`).join(', ')}
        </p>
      )}
    </article>
  );
};

export const History = () => {
  const preview = useCustomerPreview();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      const data = await api.get('/orders');
      setOrders(Array.isArray(data) ? data : []);
      setError(null);
    } catch (requestError) {
      console.error('Gagal mengambil riwayat pesanan:', requestError);
      setOrders([]);
      setError('Riwayat pesanan belum dapat dimuat. Silakan coba kembali nanti.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
    const intervalId = window.setInterval(fetchOrders, 15000);
    return () => window.clearInterval(intervalId);
  }, [fetchOrders]);

  const activeOrders = orders.filter(
    (order) => order.status !== 'completed' && order.status !== 'cancelled'
  );
  const pastOrders = orders.filter(
    (order) => order.status === 'completed' || order.status === 'cancelled'
  );

  return (
    <div className="min-h-screen bg-[#F0F4F9] pb-20 text-slate-800">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl space-y-8 px-4 pt-8 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-2xl font-extrabold text-slate-900">Pesanan Saya</h1>
          <p className="mt-1 text-sm text-slate-500">
            Riwayat pesanan untuk {user?.name || user?.email || 'akun Anda'}.
          </p>
        </header>

        {error && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Pesanan sedang berjalan
          </h2>
          {loading ? (
            <p className="customer-card rounded-2xl bg-white p-5 text-sm text-slate-500">Memuat pesanan...</p>
          ) : activeOrders.length > 0 ? (
            activeOrders.map((order) => <OrderCard key={order.id} order={order} preview={preview} />)
          ) : (
            <div className="customer-card rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <ShoppingBag className="mx-auto mb-2 h-12 w-12 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                Belum ada pesanan yang sedang berjalan.
              </p>
              <Link
                to={getCustomerRoute('/', preview)}
                className="mt-4 inline-flex rounded-full bg-[#DC2626] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Mulai Pesan Makanan
              </Link>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Riwayat pesanan
          </h2>
          {loading ? (
            <p className="customer-card rounded-2xl bg-white p-5 text-sm text-slate-500">Memuat riwayat...</p>
          ) : pastOrders.length > 0 ? (
            pastOrders.map((order) => <OrderCard key={order.id} order={order} preview={preview} />)
          ) : (
            <div className="customer-card rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <ShoppingBag className="mx-auto mb-2 h-12 w-12 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                Belum ada riwayat pesanan
              </p>
              <Link
                to={getCustomerRoute('/', preview)}
                className="mt-4 inline-flex rounded-full bg-[#DC2626] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Mulai Pesan Makanan
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default History;
