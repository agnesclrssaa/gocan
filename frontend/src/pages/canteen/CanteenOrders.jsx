import { useAuth } from '../../context/AuthContext';
import DemoPaymentPanel from '../../components/common/DemoPaymentPanel';
import { formatOrderDate, normalizeOrderStatus } from '../../lib/orderStatus';
import PickupScanner from '../../components/common/PickupScanner';
import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, asArray } from '../../lib/api';
import SkeletonLoader from '../../components/SkeletonLoader';
import { CheckCircle2, Clock3, FileText, MapPin, RefreshCw, Utensils, X } from 'lucide-react';
import { belongsToCanteen, filterCanteenOrders } from '../../lib/canteenCampus';

const statusTabs = [
  { id: 'baru', label: 'Baru', statuses: ['pending'] },
  { id: 'dimasak', label: 'Dimasak', statuses: ['cooking'] },
  { id: 'siap', label: 'Siap Diambil', statuses: ['ready', 'delivering'] },
  { id: 'selesai', label: 'Selesai', statuses: ['completed'] },
  { id: 'dibatalkan', label: 'Dibatalkan', statuses: ['cancelled'] },
];

const getDisplayStatus = (status) => ({
  pending: 'baru',
  cooking: 'dimasak',
  ready: 'siap',
  delivering: 'siap',
  completed: 'selesai',
  cancelled: 'dibatalkan',
}[normalizeOrderStatus(status)] || 'lainnya');

const normalizeOrders = (response) =>
  asArray(response).map((order) => ({
    ...order,
    status: normalizeOrderStatus(order.status),
  }));

const isDigitalPaymentPending = (order) =>
  ['QRIS', 'DEBIT'].includes(String(order.paymentMethod || '').toUpperCase()) &&
  String(order.paymentStatus || '').toUpperCase() !== 'PAID';

const getItemSummary = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item) => {
      const name = item?.name || item?.menu_name || 'Menu';
      const note = item?.notes || item?.note;
      return `${Number(item?.quantity ?? 1) || 1}× ${name}${note ? ` (${note})` : ''}`;
    })
    .join(', ');

const formatPrice = (value) => {
  const amount = Number(value ?? 0);
  return (Number.isFinite(amount) ? amount : 0).toLocaleString('id-ID');
};

export default function CanteenOrders() {
  const { profile } = useAuth();
  const { canteen } = useOutletContext();
  const canteenId = canteen?.canteenId || canteen?.id || '';
  const campusId = canteen?.campusId || '';
  const campusName = canteen?.campusName || '';
  const campusCity = canteen?.campusCity || '';
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
      setOrders(normalizeOrders(filterCanteenOrders(asArray(data), {
        id: canteenId,
        campusId,
        campusName,
        campusCity,
      })));
    } catch (error) {
      setOrdersError(`Gagal memuat pesanan: ${error.message}`);
    } finally {
      setLoadingOrders(false);
    }
  }, [canteenId, campusId, campusName, campusCity]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId, status) => {
    const currentOrder = orders.find((order) => order?.id === orderId);
    if (!currentOrder || !belongsToCanteen(currentOrder, canteen)) {
      setOrdersError('Pesanan tidak termasuk kampus atau kantin yang sedang dikelola.');
      return;
    }

    setUpdatingOrderId(orderId);
    setOrdersError(null);
    try {
      const response = await api.patch(`/orders/${orderId}/status`, { status });
      if (!response?.order) {
        throw new Error('Respons pesanan dari server tidak valid.');
      }
      const order = normalizeOrders([{
        ...response.order,
        canteenId: response.order.canteenId || currentOrder.canteenId,
        campusId: response.order.campusId || currentOrder.campusId,
        campusName: response.order.campusName || currentOrder.campusName,
        campusCity: response.order.campusCity || currentOrder.campusCity,
      }])[0];
      if (!belongsToCanteen(order, canteen)) {
        throw new Error('Respons pesanan tidak cocok dengan kantin yang sedang dikelola.');
      }
      setOrders((currentOrders) =>
        normalizeOrders(currentOrders).map((currentOrder) => currentOrder?.id === orderId ? order : currentOrder)
      );
      setNotificationMsg(`Pesanan #${orderId} sekarang berstatus ${status}.`);
      setTimeout(() => setNotificationMsg(null), 3000);
    } catch (error) {
      setOrdersError(`Gagal memperbarui status pesanan #${orderId}: ${error.message}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const safeOrders = normalizeOrders(orders);
  const filteredOrders = safeOrders.filter(
    (order) => getDisplayStatus(order?.status) === activeTab
  );

  return (
    <div className="space-y-6">
      {notificationMsg && (
        <div className="mobile-role-toast fixed right-6 top-20 z-50 flex items-center gap-3 rounded-xl border border-blue-500/40 bg-slate-900 px-5 py-3.5 text-white shadow-sm">
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
<PickupScanner onVerified={fetchOrders} />
      <nav aria-label="Filter status pesanan" className="merchant-card-glow bg-white border border-slate-200 flex gap-1.5 overflow-x-auto rounded-xl p-2">
        {statusTabs.map((tab) => {
          const count = safeOrders.filter((order) => getDisplayStatus(order?.status) === tab.id).length;
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
            Daftar Pesanan ({loadingOrders ? '…' : filteredOrders.length}) · {statusTabs.find((tab) => tab.id === activeTab)?.label}
          </h2>
          <span className="text-[11px] text-slate-400">Data dari server GoCan</span>
        </div>

        {loadingOrders && (
          <SkeletonLoader variant="order" count={2} className="!grid-cols-1" />
        )}

        {!loadingOrders && filteredOrders.map((order) => (
          <article
            key={order?.id}
            data-testid="canteen-order-card"
            className="merchant-card-glow space-y-4 rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-900">Pesanan #{order?.id ?? '—'}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatOrderDate(order?.createdAt)}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#2152B7]">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {order?.campusName || canteen?.campusName || 'Kampus belum tercatat'}
                  {(order?.campusCity || canteen?.campusCity) && ` · ${order?.campusCity || canteen?.campusCity}`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-blue-700">
                  <span className="gocan-price">Rp {formatPrice(order?.totalPrice)}</span>
                </p>
                {order?.status === 'cancelled' ? (
                  <span className="mt-1 inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                    Dibatalkan Pembeli
                  </span>
                ) : (
                  <p className="mt-1 text-xs font-semibold capitalize text-slate-500">{order?.status || 'Status tidak tersedia'}</p>
                )}
              </div>
            </div>

            <div className="merchant-card-glow rounded-xl border border-slate-200/60 bg-white p-3 text-sm text-slate-700">
              {getItemSummary(order.items) || 'Detail item belum tersedia'}
            </div>

{String(order?.orderType || '').toUpperCase() === 'SCHEDULED' && (
  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
    <p className="flex items-center gap-2 text-sm font-bold text-[#2152B7]">
      <Clock3 className="h-4 w-4 shrink-0" />
      Pesanan terjadwal
    </p>

    <p className="mt-2 text-sm text-slate-700">
      Mulai penyiapan: {formatOrderDate(order.scheduledTime)}
    </p>

    <p className="mt-2 text-xs leading-relaxed text-slate-500">
      Pesanan mulai diproses oleh petugas sesuai jadwal.
      Sistem menolak tindakan Terima Pesanan sebelum
      waktu penyiapan tiba.
    </p>
  </div>
)}

{['admin', 'canteen'].includes(profile?.role) &&
  ['QRIS', 'DEBIT'].includes(
    String(order.paymentMethod).toUpperCase()
  ) &&
  String(order.paymentReference || '').startsWith('DEMO-') && (
    <DemoPaymentPanel
      key={`payment-${order.id}`}
      orderId={order.id}
      onConfirmed={fetchOrders}
    />
  )}

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
                <div className="space-y-2 text-right">
                  {isDigitalPaymentPending(order) && (
                    <p className="text-xs font-semibold text-amber-800">
                      Menunggu konfirmasi pembayaran. Pesanan belum dapat diproses.
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={
                      updatingOrderId === order.id ||
                      isDigitalPaymentPending(order)
                    }
                    onClick={() => updateOrderStatus(order.id, 'cooking')}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingOrderId === order.id
                      ? 'Menyimpan...'
                      : 'Terima Pesanan'}
                  </button>
                </div>
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
  <div className="text-right">
    <p className="text-xs font-semibold text-amber-700">
      {String(order?.fulfillmentType || '').toLowerCase() === 'pickup'
        ? 'Menunggu pelanggan mengambil pesanan'
        : 'Menunggu Campus Runner mengambil pesanan'}
    </p>

    {String(order?.fulfillmentType || '').toLowerCase() === 'pickup' && (
      <p className="mt-1 text-xs text-slate-500">
        Gunakan scanner di atas untuk memverifikasi QR E-ticket pelanggan.
      </p>
    )}
  </div>
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
