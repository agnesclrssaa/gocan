import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock3,
  MapPin,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import Navbar from '../../components/common/Navbar';
import { getCustomerRoute, useCustomerPreview } from '../../lib/customerRoutes';

import {
  formatOrderDate,
  formatRupiah,
  getOrderPresentation,
  getOrderTotal,
  normalizeOrderStatus,
  ORDER_TONES,
} from '../../lib/orderStatus';

const OrderCard = ({ order, preview }) => {
  const items = Array.isArray(order.items) ? order.items : [];

  const itemCount = items.reduce(
    (total, item) => total + (Number(item.quantity) || 1),
    0
  );

  const presentation = getOrderPresentation(order);

  return (
    <article className="customer-card rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-900">
              {order.canteen?.name || 'Kantin'}
            </h3>

            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                ORDER_TONES[presentation.tone]
              }`}
            >
              {presentation.label}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            #{order.id}
            {' · '}
            {itemCount} item
            {' · '}
            {formatOrderDate(order.createdAt)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <span className="gocan-price font-bold">
            {formatRupiah(getOrderTotal(order))}
          </span>

          <Link
  to={getCustomerRoute(`/order/${order.id}`, preview)}
  aria-label={`Lihat detail pesanan ${order.id}`}
  className="rounded-full border border-blue-200 px-4 py-2 text-sm font-bold text-[#2152B7] transition hover:bg-blue-50"
>
  Detail
</Link>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        {presentation.description}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
          <MapPin className="h-3.5 w-3.5" />
          {presentation.fulfillmentLabel}
        </span>

        <span
          className={`rounded-full border px-3 py-1.5 font-semibold ${
            ORDER_TONES[presentation.paymentTone]
          }`}
        >
          {presentation.methodLabel}
          {' · '}
          {presentation.paymentLabel}
        </span>
      </div>

      {presentation.isScheduled && order.scheduledTime && (
        <p className="mt-3 flex items-start gap-1.5 text-xs font-semibold text-[#2152B7]">
          <Clock3 className="h-4 w-4 shrink-0" />
          <span>
            Terjadwal: {formatOrderDate(order.scheduledTime)}
          </span>
        </p>
      )}

      {items.length > 0 && (
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
          {items
            .map(
              (item) =>
                `${item.quantity || 1}x ${
                  item.name || item.menu_name || 'Menu'
                }`
            )
            .join(', ')}
        </p>
      )}
    </article>
  );
};

export const History = () => {
  const preview = useCustomerPreview();
  const { user } = useAuth();
  const userId = user?.id;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const latestRequest = useRef(0);
  const loadedUserRef = useRef(null);

  const fetchOrders = useCallback(
    async (signal) => {
      const version = ++latestRequest.current;

      if (!userId) {
        setOrders([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        const data = await api.get('/orders', { signal });

        if (
          signal?.aborted ||
          version !== latestRequest.current
        ) {
          return;
        }

        const validOrders = Array.isArray(data)
          ? data.filter((order) => order && order.id != null)
          : [];

        setOrders(validOrders);
        setError(null);

        loadedUserRef.current = userId;

        setLoadedUserId(userId);
        setLastUpdated(new Date());
      } catch (requestError) {
        if (
          signal?.aborted ||
          version !== latestRequest.current
        ) {
          return;
        }

        console.error(
          'Gagal mengambil riwayat pesanan:',
          requestError
        );

        if (loadedUserRef.current !== userId) {
          setOrders([]);
        }

        setLoadedUserId(userId);

        setError(
          'Pembaruan pesanan belum dapat dimuat. Data terakhir yang sudah dimuat tetap ditampilkan. Silakan coba lagi.'
        );
      } finally {
        if (
          !signal?.aborted &&
          version === latestRequest.current
        ) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [userId]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchOrders(controller.signal);

    const intervalId = window.setInterval(() => {
      fetchOrders(controller.signal);
    }, 15000);

    return () => {
      controller.abort();
      latestRequest.current += 1;
      window.clearInterval(intervalId);
    };
  }, [fetchOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const currentOrders =
    loadedUserId === userId ? orders : [];

  const isLoading =
    loading || loadedUserId !== userId;

  const activeOrders = currentOrders.filter(
    (order) =>
      !['completed', 'cancelled'].includes(
        normalizeOrderStatus(order.status)
      )
  );

  const pastOrders = currentOrders.filter(
    (order) =>
      ['completed', 'cancelled'].includes(
        normalizeOrderStatus(order.status)
      )
  );

  return (
    <div className="min-h-screen bg-[#F0F4F9] pb-20 text-slate-800">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl space-y-8 px-4 pt-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Pesanan Saya
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Riwayat pesanan untuk{' '}
              {user?.name || user?.email || 'akun Anda'}.
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Diperbarui otomatis setiap 15 detik.
              {lastUpdated && loadedUserId === userId
                ? ` Terakhir: ${formatOrderDate(lastUpdated)}.`
                : ''}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Kembali ke Beranda
            </Link>

            <button
              type="button"
              disabled={refreshing}
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-full bg-[#2152B7] px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
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
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Pesanan sedang berjalan{' '}
            {!isLoading && `(${activeOrders.length})`}
          </h2>

          {isLoading ? (
            <p className="customer-card rounded-2xl bg-white p-5 text-sm text-slate-500">
              Memuat pesanan...
            </p>
          ) : activeOrders.length > 0 ? (
activeOrders.map((order) => (
  <OrderCard
    key={order.id}
    order={order}
    preview={preview}
  />
))
) : error && !currentOrders.length ? (
  <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
    Pesanan belum dapat ditampilkan. Tekan Perbarui
    untuk mencoba lagi.
  </p>
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
            Riwayat pesanan{' '}
            {!isLoading && `(${pastOrders.length})`}
          </h2>

          {isLoading ? (
            <p className="customer-card rounded-2xl bg-white p-5 text-sm text-slate-500">
              Memuat riwayat...
            </p>
          ) : pastOrders.length > 0 ? (
pastOrders.map((order) => (
  <OrderCard
    key={order.id}
    order={order}
    preview={preview}
  />
))
) : error && !currentOrders.length ? null : (
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