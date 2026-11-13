import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { CheckCircle2, Clock3, FileText, RefreshCw, Utensils, X } from 'lucide-react';

const statusTabs = [
  { id: 'baru', label: 'Baru', statuses: ['pending'] },
  { id: 'dimasak', label: 'Dimasak', statuses: ['cooking'] },
  { id: 'siap', label: 'Siap Diambil', statuses: ['ready', 'delivering'] },
  { id: 'selesai', label: 'Selesai', statuses: ['completed'] },
  { id: 'dibatalkan', label: 'Dibatalkan', statuses: ['cancelled'] },
];

const getDisplayStatus = (status) => {
  if (status === 'pending') return 'baru';
  if (status === 'cooking') return 'dimasak';
  if (status === 'ready' || status === 'delivering') return 'siap';
  if (status === 'completed') return 'selesai';
  if (status === 'cancelled') return 'dibatalkan';
  return 'lainnya';
};

const getItemSummary = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item) => {
      const name = item.name || item.menu_name || 'Menu';
      const note = item.notes || item.note;
      return `${item.quantity || 1}× ${name}${note ? ` (${note})` : ''}`;
    })
    .join(', ');

export default function CanteenOrders() {
  const [activeTab, setActiveTab] = useState('baru');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [notificationMsg, setNotificationMsg] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      const data = await api.get('/orders/canteen');
      setOrders(data);
    } catch (error) {
      setOrdersError(`Gagal memuat pesanan: ${error.message}`);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId, status) => {
    setUpdatingOrderId(orderId);
    setOrdersError(null);
    try {
      const { order } = await api.patch(`/orders/${orderId}/status`, { status });
      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) => currentOrder.id === orderId ? order : currentOrder)
      );
      setNotificationMsg(`Pesanan #${orderId} sekarang berstatus ${status}.`);
      setTimeout(() => setNotificationMsg(null), 3000);
    } catch (error) {
      setOrdersError(`Gagal memperbarui status pesanan #${orderId}: ${error.message}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const filteredOrders = orders.filter(
    (order) => getDisplayStatus(order.status) === activeTab
  );

  return (
    <div className="space-y-6">
      {notificationMsg && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-3 rounded-xl border border-blue-500/40 bg-slate-900 px-5 py-3.5 text-white shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-blue-400" />
          <span className="text-xs font-semibold sm:text-sm">{notificationMsg}</span>
          <button
            type="button"
            onClick={() => setNotificationMsg(null)}
            aria-label="Tutup notifikasi"
            className="ml-2 p-1 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <header className="merchant-card-glow bg-white border border-slate-200 flex flex-col justify-between gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-slate-950">
            <Utensils className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">Pesanan Kantin</h1>
            <p className="text-xs text-slate-500">Kelola pesanan masuk dan perbarui status persiapannya.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchOrders}
          disabled={loadingOrders}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loadingOrders ? 'animate-spin' : ''}`} />
          Segarkan
        </button>
      </header>

      <nav aria-label="Filter status pesanan" className="merchant-card-glow bg-white border border-slate-200 flex gap-1.5 overflow-x-auto rounded-xl p-2">
        {statusTabs.map((tab) => {
          const count = orders.filter((order) => tab.statuses.includes(order.status)).length;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === tab.id ? 'bg-white text-blue-800' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {ordersError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {ordersError}
        </div>
      )}

      <section aria-label="Daftar pesanan" className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-slate-900">
            Daftar Pesanan ({filteredOrders.length}) · {statusTabs.find((tab) => tab.id === activeTab)?.label}
          </h2>
          <span className="text-[11px] text-slate-400">Data dari server GoCan</span>
        </div>

        {loadingOrders && (
          <div role="status" className="merchant-card-glow bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
            Memuat pesanan kantin...
          </div>
        )}

        {!loadingOrders && filteredOrders.map((order) => (
          <article
            key={order.id}
            data-testid="canteen-order-card"
            className="merchant-card-glow space-y-4 rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-900">Pesanan #{order.id}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
                    : 'Waktu tidak tersedia'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-blue-700">
                  Rp {Number(order.totalPrice || 0).toLocaleString('id-ID')}
                </p>
                {order.status === 'cancelled' ? (
                  <span className="mt-1 inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                    Dibatalkan Pembeli
                  </span>
                ) : (
                  <p className="mt-1 text-xs font-semibold capitalize text-slate-500">{order.status}</p>
                )}
              </div>
            </div>

            <div className="merchant-card-glow rounded-xl border border-slate-200/60 bg-white p-3 text-sm text-slate-700">
              {getItemSummary(order.items) || 'Detail item belum tersedia'}
            </div>

            {order.status === 'cancelled' && (
              <div className="merchant-card-glow rounded-xl border border-red-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-red-500" />
                  <h4 className="text-sm font-bold text-red-800">Informasi Pembatalan</h4>
                </div>
                <dl className="mt-3 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Alasan Pembatalan
                    </dt>
                    <dd className="mt-1 text-slate-800">
                      {order.cancelReason || 'Alasan tidak tersedia'}
                    </dd>
                  </div>
                  {order.cancelNote && (
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Catatan Pembatalan
                      </dt>
                      <dd className="mt-1 whitespace-pre-wrap text-slate-800">
                        {order.cancelNote}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            <div className="flex justify-end border-t border-slate-100 pt-3">
              {order.status === 'pending' && (
                <button
                  type="button"
                  disabled={updatingOrderId === order.id}
                  onClick={() => updateOrderStatus(order.id, 'cooking')}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {updatingOrderId === order.id ? 'Menyimpan...' : 'Terima Pesanan'}
                </button>
              )}
              {order.status === 'cooking' && (
                <button
                  type="button"
                  disabled={updatingOrderId === order.id}
                  onClick={() => updateOrderStatus(order.id, 'ready')}
                  className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-600 disabled:cursor-wait disabled:opacity-60"
                >
                  {updatingOrderId === order.id ? 'Menyimpan...' : 'Siap Diambil'}
                </button>
              )}
              {order.status === 'ready' && (
                <span className="text-xs font-semibold text-amber-700">Menunggu kurir mengambil pesanan</span>
              )}
            </div>
          </article>
        ))}

        {!loadingOrders && !ordersError && filteredOrders.length === 0 && (
          <div className="merchant-card-glow bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
            Tidak ada pesanan pada status ini.
          </div>
        )}
      </section>
    </div>
  );
}
