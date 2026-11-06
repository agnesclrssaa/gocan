import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Bike, Download, RefreshCw, Search, Store, Users } from 'lucide-react';
import { api } from '../../lib/api';

const roleLabels = {
  customer: 'Customer',
  canteen: 'Mitra kantin',
  runner: 'Runner',
  courier: 'Kurir',
  admin: 'Admin',
};

const statusLabels = {
  pending: 'Menunggu',
  approved: 'Aktif',
  rejected: 'Ditolak',
};

export default function AdminManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setUsers(await api.get('/admin/users'));
    } catch (loadError) {
      setError(loadError.message || 'Gagal memuat daftar akun.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.get('/admin/users')
      .then((data) => {
        if (active) setUsers(data);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Gagal memuat daftar akun.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesSearch = !query || `${user.name} ${user.email} ${user.canteen?.name || ''}`.toLowerCase().includes(query);
      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, search]);

  const exportCsv = () => {
    const rows = [
      ['Nama', 'Email', 'Peran', 'Kantin', 'Status'],
      ...visibleUsers.map((user) => [
        user.name,
        user.email,
        roleLabels[user.role] || user.role,
        user.canteen?.name || '',
        statusLabels[user.approvalStatus] || user.approvalStatus,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'gocan-akun.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const roleOptions = [
    { value: 'all', label: 'Semua akun', icon: Users },
    { value: 'canteen', label: 'Mitra kantin', icon: Store },
    { value: 'runner', label: 'Runner', icon: Bike },
    { value: 'courier', label: 'Kurir', icon: Bike },
    { value: 'customer', label: 'Customer', icon: Users },
    { value: 'admin', label: 'Admin', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Pengelolaan Akun</h1>
          <p className="mt-1 text-sm text-slate-500">Data pengguna yang tersimpan di GoCan dan persetujuan pendaftaran runner.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={exportCsv} disabled={!visibleUsers.length} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 disabled:opacity-50">
            <Download className="h-4 w-4" /> Ekspor CSV
          </button>
          <button type="button" onClick={loadUsers} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-[#0A2E6E] px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat ulang
          </button>
        </div>
      </header>

      {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
        {[
          { label: 'Total akun', value: users.length, icon: Users },
          { label: 'Mitra kantin', value: users.filter((user) => user.role === 'canteen').length, icon: Store },
          { label: 'Runner', value: users.filter((user) => user.role === 'runner').length, icon: Bike },
          { label: 'Kurir', value: users.filter((user) => user.role === 'courier').length, icon: Bike },
          { label: 'Menunggu verifikasi', value: users.filter((user) => user.role === 'runner' && user.approvalStatus === 'pending').length, icon: Check },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500">
              {label}<Icon className="h-4 w-4 text-[#0A2E6E]" />
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">{loading ? '—' : value}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {roleOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRoleFilter(value)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${roleFilter === value ? 'bg-[#0A2E6E] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="relative mt-4 block max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, email, atau nama kantin"
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Nama akun</th>
                <th className="px-5 py-3">Peran</th>
                <th className="px-5 py-3">Kantin</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">{roleLabels[user.role] || user.role}</td>
                  <td className="px-5 py-3.5 text-slate-700">{user.canteen?.name || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.approvalStatus === 'approved' ? 'bg-emerald-50 text-emerald-700' : user.approvalStatus === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
                      {statusLabels[user.approvalStatus] || user.approvalStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {user.role === 'runner' ? (
                      <Link to="/admin-portal/runners" className="text-xs font-bold text-blue-700 hover:underline">
                        Tinjau profil
                      </Link>
                    ) : <span className="text-xs text-slate-400">—</span>}
                  </td>
                </tr>
              ))}
              {!loading && visibleUsers.length === 0 && (
                <tr><td colSpan="5" className="px-5 py-10 text-center text-sm text-slate-500">Tidak ada akun yang cocok.</td></tr>
              )}
              {loading && (
                <tr><td colSpan="5" className="px-5 py-10 text-center text-sm text-slate-500">Memuat akun...</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <footer className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          Menampilkan {visibleUsers.length} dari {users.length} akun yang dimuat.
        </footer>
      </section>
    </div>
  );
}
