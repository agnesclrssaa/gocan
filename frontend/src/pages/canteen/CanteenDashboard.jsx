import { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  CheckCircle,
  ArrowUpRight,
  Flame,
  ChevronRight,
  BarChart3,
  Clock,
} from 'lucide-react';
import { api } from '../../lib/api';

const formatPrice = (price) => `Rp ${Number(price || 0).toLocaleString('id-ID')}`;

const parseItems = (items) => {
  if (Array.isArray(items)) return items;
  if (typeof items !== 'string') return [];
  try {
    const parsedItems = JSON.parse(items);
    return Array.isArray(parsedItems) ? parsedItems : [];
  } catch {
    return [];
  }
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export default function CanteenDashboard() {
  const { canteen } = useOutletContext();
  const [periodFilter, setPeriodFilter] = useState(7);
  const [today] = useState(() => startOfDay(new Date()));
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrdersError(null);
    try {
      setOrders(await api.get('/orders/canteen'));
    } catch (error) {
      setOrdersError(`Gagal memuat ringkasan pesanan: ${error.message}`);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const todayOrders = orders.filter((order) => startOfDay(new Date(order.createdAt)).getTime() === today.getTime());
  const activeTodayOrders = todayOrders.filter((order) => order.status !== 'cancelled');
  const todayRevenue = activeTodayOrders.reduce((total, order) => total + (Number(order.totalPrice) || 0), 0);
  const todayPendingOrders = todayOrders.filter((order) => order.status === 'pending').length;
  const completedTodayOrders = todayOrders.filter((order) => order.status === 'completed').length;
  const deliveryTodayOrders = todayOrders.filter((order) => (order.fulfillmentType || order.orderType) === 'delivery').length;
  const pickupTodayOrders = todayOrders.filter((order) => (order.fulfillmentType || order.orderType) === 'pickup').length;

  const trendData = (() => {
    const count = periodFilter;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - count + 1);
    const days = Array.from({ length: count }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      return {
        date,
        label: count === 7
          ? date.toLocaleDateString('id-ID', { weekday: 'short' })
          : date.toLocaleDateString('id-ID', { day: 'numeric' }),
        orders: 0,
        revenue: 0,
      };
    });

    orders.forEach((order) => {
      if (order.status === 'cancelled') return;
      const orderDate = startOfDay(new Date(order.createdAt));
      const day = days.find((entry) => entry.date.getTime() === orderDate.getTime());
      if (day) {
        day.orders += 1;
        day.revenue += Number(order.totalPrice) || 0;
      }
    });

    const bucketSize = count === 30 ? 3 : 1;
    const chartDays = Array.from({ length: Math.ceil(count / bucketSize) }, (_, index) => {
      const bucket = days.slice(index * bucketSize, (index + 1) * bucketSize);
      return {
        ...bucket[0],
        label: count === 30
          ? bucket[0].date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
          : bucket[0].label,
        orders: bucket.reduce((total, day) => total + day.orders, 0),
        revenue: bucket.reduce((total, day) => total + day.revenue, 0),
      };
    });
    const maxRevenue = Math.max(...chartDays.map((day) => day.revenue), 0);
    return chartDays.map((day) => ({
      ...day,
      height: maxRevenue ? `${Math.max((day.revenue / maxRevenue) * 100, 2)}%` : '2%',
    }));
  })();

  const bestSellers = (() => {
    const sales = new Map();
    activeTodayOrders.forEach((order) => {
      parseItems(order.items).forEach((item) => {
        const name = item.name || item.menu_name || 'Menu';
        const quantity = Number(item.quantity) || 1;
        const existing = sales.get(name) || {
          name,
          category: item.category || 'Menu',
          price: Number(item.price || item.unitPrice) || 0,
          sales: 0,
        };
        existing.sales += quantity;
        sales.set(name, existing);
      });
    });

    const items = [...sales.values()].sort((first, second) => second.sales - first.sales).slice(0, 4);
    const maxSales = Math.max(...items.map((item) => item.sales), 1);
    return items.map((item, index) => ({
      ...item,
      rank: index + 1,
      percentage: `${(item.sales / maxSales) * 100}%`,
    }));
  })();

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Ringkasan Kantin</h1>
          <p className="mt-1 text-sm text-slate-500">{canteen?.name || 'Pantau penjualan dan pesanan kantin Anda.'}</p>
        </div>
        <button
          type="button"
          onClick={fetchOrders}
          disabled={loadingOrders}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 sm:self-auto"
        >
          <ArrowUpRight className={`h-4 w-4 ${loadingOrders ? 'animate-spin' : ''}`} />
          Segarkan Data
        </button>
      </header>

      {ordersError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {ordersError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <section className="merchant-card-glow rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pendapatan Hari Ini</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight text-slate-900">{loadingOrders ? 'Memuat...' : formatPrice(todayRevenue)}</p>
          <p className="mt-2 text-xs text-slate-500">{activeTodayOrders.length} pesanan, tidak termasuk pesanan batal</p>
        </section>

        <section className="merchant-card-glow rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pesanan Hari Ini</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight text-slate-900">{loadingOrders ? 'Memuat...' : todayOrders.length}</p>
          <p className="mt-2 text-xs text-slate-500">{deliveryTodayOrders} delivery · {pickupTodayOrders} ambil sendiri · {todayPendingOrders} menunggu</p>
        </section>

        <section className="merchant-card-glow rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pesanan Selesai Hari Ini</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight text-slate-900">{loadingOrders ? 'Memuat...' : completedTodayOrders}</p>
          <p className="mt-2 text-xs text-slate-500">Pesanan dengan status selesai</p>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="merchant-card-glow space-y-4 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <BarChart3 className="h-4 w-4 text-blue-700" />
                Tren Penjualan
              </h2>
              <p className="text-xs text-slate-500">Berdasarkan transaksi {periodFilter} hari terakhir</p>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-[11px] font-bold">
              {[7, 30].map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setPeriodFilter(period)}
                  aria-pressed={periodFilter === period}
                  className={`rounded-md px-3 py-1.5 ${periodFilter === period ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-500'}`}
                >
                  {period} Hari
                </button>
              ))}
            </div>
          </div>

          {loadingOrders ? (
            <p role="status" className="py-12 text-center text-sm text-slate-500">Memuat data penjualan...</p>
          ) : (
            <div className={`grid h-56 ${periodFilter === 30 ? 'grid-cols-10' : 'grid-cols-7'} items-end gap-2 border-t border-slate-100 px-1 pt-5 sm:gap-3`}>
              {trendData.map((day) => (
                <div key={day.date.toISOString()} className="group flex h-full min-w-0 flex-col items-center justify-end gap-2">
                  <span className="hidden text-[9px] text-slate-500 group-hover:block sm:block">
                    {day.revenue ? `${Math.round(day.revenue / 1000)}k` : ''}
                  </span>
                  <div
                    className="w-full max-w-8 rounded-t bg-blue-700 transition-colors group-hover:bg-blue-500"
                    style={{ height: day.height }}
                    title={`${day.date.toLocaleDateString('id-ID')}: ${day.orders} pesanan · ${formatPrice(day.revenue)}`}
                  />
                  <span className="text-[10px] font-semibold text-slate-600">{day.label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>{trendData.reduce((total, day) => total + day.orders, 0)} pesanan pada periode ini</span>
            <span className="font-bold text-blue-700">
              {formatPrice(trendData.reduce((total, day) => total + day.revenue, 0))}
            </span>
          </div>
        </section>

        <section className="merchant-card-glow space-y-4 rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Flame className="h-4 w-4 text-blue-700" />
              Menu Terlaris Hari Ini
            </h2>
            <p className="text-xs text-slate-500">Diurutkan dari jumlah item terjual.</p>
          </div>

          {bestSellers.length ? (
            <div className="space-y-3">
              {bestSellers.map((item) => (
                <div key={item.name} className="merchant-card-glow space-y-2 rounded-lg border border-slate-100 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-50 text-xs font-bold text-blue-800">#{item.rank}</span>
                      <div className="min-w-0">
                        <span className="block truncate text-xs font-bold text-slate-900">{item.name}</span>
                        <span className="text-[10px] text-slate-500">{item.category} · {formatPrice(item.price)}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-blue-700">{item.sales} terjual</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: item.percentage }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">
              {loadingOrders ? 'Memuat pesanan...' : 'Belum ada menu terjual hari ini.'}
            </p>
          )}

          <Link
            to="/canteen-portal/orders"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0A2E6E] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#082457]"
          >
            <Clock className="h-4 w-4" />
            Buka Antrean Pesanan
            <ChevronRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
