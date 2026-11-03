import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Bike,
  CheckCircle,
  Clock3,
  DollarSign,
  LoaderCircle,
  RefreshCw,
  Store,
  Users,
} from 'lucide-react';
import { api } from '../../lib/api';

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const metricsConfig = [
  { key: 'todayRevenue', label: 'Pendapatan hari ini', icon: DollarSign, format: currency.format },
  { key: 'todayOrders', label: 'Pesanan hari ini', icon: Clock3 },
  { key: 'activeOrders', label: 'Pesanan aktif', icon: Store },
  { key: 'users', label: 'Total pengguna', icon: Users },
  { key: 'canteens', label: 'Mitra kantin', icon: Store },
  { key: 'runners', label: 'Runner aktif', icon: Bike },
  { key: 'couriers', label: 'Kurir aktif', icon: Bike },
];

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [runnerId, setRunnerId] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setOverview(await api.get('/admin/overview'));
    } catch (loadError) {
      setError(loadError.message || 'Gagal memuat ringkasan admin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.get('/admin/overview')
      .then((data) => {
        if (active) setOverview(data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Gagal memuat ringkasan admin.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const assignOrder = async (event) => {
    event.preventDefault();
    if (!selectedOrder || !runnerId) return;

    try {
      setSaving(true);
      await api.patch(`/admin/orders/${selectedOrder.id}/assign`, { runnerId: Number(runnerId) });
      setSelectedOrder(null);
      setRunnerId('');
      setNotice(`Pesanan #${selectedOrder.id} berhasil ditugaskan.`);
      await loadOverview();
    } catch (saveError) {
      setError(saveError.message || 'Gagal menugaskan pesanan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Dashboard Admin</h1>
          <p className="mt-1 text-sm text-slate-500">Ringkasan GoCan dari data transaksi dan akun aktual.</p>
        </div>
        <button
          type="button"
          onClick={loadOverview}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Perbarui data
        </button>
      </header>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {notice}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metricsConfig.map(({ key, label, icon: Icon, format }) => (
          <div key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-black text-slate-900">
              {loading ? <LoaderCircle className="h-6 w-6 animate-spin text-slate-400" /> : format ? format(overview?.metrics?.[key] || 0) : (overview?.metrics?.[key] ?? 0).toLocaleString('id-ID')}
            </p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-black text-slate-900">Pesanan siap antar</h2>
              <p className="mt-1 text-xs text-slate-500">Pesanan delivery yang belum ditugaskan ke runner.</p>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
              {overview?.unassignedOrders?.length || 0} menunggu
            </span>
          </div>
          {loading && !overview ? (
            <p className="py-8 text-center text-sm text-slate-500">Memuat pesanan...</p>
          ) : overview?.unassignedOrders?.length ? (
            <div className="space-y-3">
              {overview.unassignedOrders.map((order) => (
                <div key={order.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Pesanan #{order.id} · {order.canteen?.name || 'Kantin'}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {order.user?.name || 'Pemesan'} · {order.items.length} item · {currency.format(order.totalPrice)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{order.buildingName || order.meetingPoint || 'Lokasi belum dicantumkan'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrder(order);
                      setRunnerId('');
                    }}
                    className="rounded-lg bg-[#0A2E6E] px-3 py-2 text-xs font-bold text-white hover:bg-[#082457]"
                  >
                    Tugaskan runner
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-emerald-50 p-5 text-center text-sm font-medium text-emerald-800">
              Tidak ada pesanan yang menunggu runner.
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-black text-slate-900">Tindakan admin</h2>
          <p className="mt-1 text-xs text-slate-500">Pendaftaran runner yang perlu ditinjau.</p>
          <div className="my-4 rounded-xl bg-amber-50 p-4">
            <p className="text-3xl font-black text-amber-800">{overview?.metrics?.pendingApprovals ?? 0}</p>
            <p className="text-xs font-semibold text-amber-800">Runner menunggu persetujuan</p>
          </div>
          <Link
            to="/admin-portal/management"
            className="block rounded-lg bg-slate-900 px-4 py-2.5 text-center text-xs font-bold text-white hover:bg-slate-800"
          >
            Kelola akun dan pendaftaran
          </Link>
        </aside>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
          <form onSubmit={assignOrder} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <div>
              <h2 className="text-lg font-black text-slate-900">Tugaskan pesanan #{selectedOrder.id}</h2>
              <p className="mt-1 text-sm text-slate-500">Pilih runner yang sudah disetujui admin.</p>
            </div>
            <label className="block text-sm font-semibold text-slate-700">
              Runner
              <select
                required
                value={runnerId}
                onChange={(event) => setRunnerId(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="">Pilih runner</option>
                {(overview?.availableRunners || []).map((runner) => (
                  <option key={runner.id} value={runner.id}>{runner.name}</option>
                ))}
              </select>
            </label>
            {!overview?.availableRunners?.length && (
              <p className="text-sm text-amber-700">Belum ada runner yang disetujui. Setujui pendaftaran terlebih dahulu.</p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSelectedOrder(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">
                Batal
              </button>
              <button type="submit" disabled={saving || !overview?.availableRunners?.length} className="rounded-lg bg-[#0A2E6E] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Tugaskan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
