import { useState } from 'react';
import {
  Users,
  Store,
  Bike,
  Building,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Plus,
  Download,
  MapPin,
  Check,
  X,
  Eye,
  Edit,
  ShieldCheck,
  Globe,
  AlertCircle
} from 'lucide-react';

export default function AdminManagement() {
  const [notification, setNotification] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState('canteen');

  // 1. Data Customer Kampus
  const [customers, setCustomers] = useState([
    {
      id: 'USR-01',
      initials: 'NA',
      name: 'Nadia Putri',
      email: 'nadia@gocan.id',
      campus: 'Widya Mandala Dinoyo',
      role: 'Admin Kampus',
      status: 'Aktif',
      lastActive: '2 jam lalu'
    },
    {
      id: 'USR-02',
      initials: 'RP',
      name: 'Raka Pratama',
      email: 'raka@gocan.id',
      campus: 'Widya Mandala Dinoyo',
      role: 'Operator Lokasi',
      status: 'Menunggu',
      lastActive: '1 hari lalu'
    },
    {
      id: 'USR-03',
      initials: 'SF',
      name: 'Siti Farida',
      email: 'siti@gocan.id',
      campus: 'Widya Mandala Dinoyo',
      role: 'Admin Kantin',
      status: 'Aktif',
      lastActive: '30 menit lalu'
    }
  ]);

  // 2. Data Kantin Kampus
  const [canteens, setCanteens] = useState([
    {
      id: 'CAN-01',
      name: 'Kantin Sego Sambel Dinoyo',
      subtext: 'Pengajuan baru',
      location: 'Fakultas Farmasi Widya Mandala Dinoyo',
      menuCount: 24,
      status: 'Menunggu',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80'
    },
    {
      id: 'CAN-02',
      name: 'Kantin Pak Brazil Dinoyo',
      subtext: 'Rating 4.9',
      location: 'Kampus Utama Widya Mandala Dinoyo',
      menuCount: 42,
      status: 'Aktif',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=100&q=80'
    },
    {
      id: 'CAN-03',
      name: 'Kantin Mesra Dinoyo',
      subtext: 'Siap aktif',
      location: 'Gedung Administrasi Widya Mandala Dinoyo',
      menuCount: 31,
      status: 'Review',
      initials: 'KM'
    }
  ]);

  // 3. Data Kurir Kampus
  const [runners, setRunners] = useState([
    {
      id: 'RUN-01',
      initials: 'AP',
      name: 'Andi Pratama',
      subtext: 'Motor 01',
      zone: 'Widya Mandala Dinoyo',
      ordersToday: '24 hari ini',
      status: 'Aktif'
    },
    {
      id: 'RUN-02',
      initials: 'NR',
      name: 'Nadia Rizky',
      subtext: 'Motor 03',
      zone: 'Widya Mandala Dinoyo',
      ordersToday: '18 hari ini',
      status: 'Sibuk'
    },
    {
      id: 'RUN-03',
      initials: 'DS',
      name: 'Dimas Saputra',
      subtext: 'Motor 07',
      zone: 'Widya Mandala Dinoyo',
      ordersToday: '9 hari ini',
      status: 'Offline'
    }
  ]);

  // 4. Data Lokasi Kampus
  const [locations, setLocations] = useState([
    {
      id: 'LOC-01',
      initials: 'FF',
      name: 'Fakultas Farmasi Widya Mandala Dinoyo',
      subtext: 'Gedung utama',
      campus: 'Widya Mandala Dinoyo',
      type: 'Gedung',
      fee: 'Rp3.000',
      status: 'Aktif'
    },
    {
      id: 'LOC-02',
      initials: 'BK',
      name: 'Kampus Utama Widya Mandala Dinoyo',
      subtext: 'Area kantin',
      campus: 'Widya Mandala Dinoyo',
      type: 'Kantin',
      fee: 'Rp2.500',
      status: 'Aktif'
    },
    {
      id: 'LOC-03',
      initials: 'DC',
      name: 'Gedung Administrasi Widya Mandala Dinoyo',
      subtext: 'Perlu peninjauan',
      campus: 'Widya Mandala Dinoyo',
      type: 'Gedung',
      fee: 'Rp3.500',
      status: 'Review'
    }
  ]);

  // 5. Akses Website Kampus
  const campusAccess = [
    {
      id: 'UWM',
      name: 'Widya Mandala Dinoyo',
      subtext: 'Mitra utama',
      detail: '8 gedung • 14 kantin',
      website: 'Website aktif',
      status: 'Aktif'
    },
    {
      id: 'UDC',
      name: 'Widya Mandala Dinoyo',
      subtext: 'Menunggu aktivasi',
      detail: '3 gedung • 6 kantin',
      website: 'Menunggu aktivasi akses website',
      status: 'Menunggu'
    },
    {
      id: 'BNC',
      name: 'Widya Mandala Dinoyo',
      subtext: 'Akses penuh',
      detail: '5 gedung • 11 kantin',
      website: 'Website aktif',
      status: 'Aktif'
    }
  ];

  const triggerToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleApproveCanteen = (id) => {
    setCanteens((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'Aktif', subtext: 'Disetujui Admin' } : c))
    );
    triggerToast('Stan kantin berhasil disetujui & aktif di aplikasi!');
  };

  const handleRejectCanteen = (id) => {
    setCanteens((prev) => prev.filter((c) => c.id !== id));
    triggerToast('Pengajuan stan kantin ditolak.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-[#0A2E6E] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-white/20 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-xs sm:text-sm font-semibold">{notification}</span>
          <button onClick={() => setNotification('')} className="text-white/60 hover:text-white ml-2 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Summary Metric Cards matching mockup */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase block mb-1">CUSTOMER</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">128</div>
          <p className="text-[11px] text-slate-400 mt-1">12 user baru minggu ini</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase block mb-1">KANTIN</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">12</div>
          <p className="text-[11px] text-slate-400 mt-1">1 menunggu verifikasi</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase block mb-1">KURIR</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">45</div>
          <p className="text-[11px] text-slate-400 mt-1">6 kurir sedang aktif</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase block mb-1">LOKASI</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">16</div>
          <p className="text-[11px] text-slate-400 mt-1">3 lokasi perlu peninjauan</p>
        </div>
      </div>

      {/* Section 1: Daftar Customer Kampus */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">Daftar Customer Kampus</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ringkasan akun pengguna aktif dan status akses Widya Mandala Dinoyo
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => triggerToast('Ekspor data customer CSV dimulai...')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Export CSV
            </button>
            <button
              onClick={() => {
                setAddType('customer');
                setShowAddModal(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-[#0A2E6E] hover:bg-[#082457] text-white text-xs font-bold shadow-xs transition"
            >
              Tambah Customer
            </button>
          </div>
        </div>

        <div className="overflow-x-auto pt-1">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="pb-3 font-bold">CUSTOMER</th>
                <th className="pb-3 font-bold">KAMPUS</th>
                <th className="pb-3 font-bold">PERAN</th>
                <th className="pb-3 font-bold">STATUS</th>
                <th className="pb-3 font-bold">TERAKHIR</th>
                <th className="pb-3 font-bold text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0A2E6E] font-bold text-xs flex items-center justify-center shrink-0">
                        {c.initials}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{c.name}</span>
                        <span className="text-[11px] text-slate-400">{c.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-600">{c.campus}</td>
                  <td className="py-3.5 text-slate-700 font-medium">{c.role}</td>
                  <td className="py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'Aktif'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-500">{c.lastActive}</td>
                  <td className="py-3.5 text-right space-x-1.5">
                    <button className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
                      Detail
                    </button>
                    <button className="px-3 py-1 text-xs font-bold rounded-lg bg-[#0A2E6E] hover:bg-[#082457] text-white">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Daftar Kantin Kampus */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">Daftar Kantin Kampus</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola kantin aktif dan pengajuan baru Widya Mandala Dinoyo
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
              Filter
            </button>
            <button
              onClick={() => {
                setAddType('canteen');
                setShowAddModal(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-[#0A2E6E] hover:bg-[#082457] text-white text-xs font-bold shadow-xs transition"
            >
              Tambah Kantin
            </button>
          </div>
        </div>

        <div className="overflow-x-auto pt-1">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="pb-3 font-bold">KANTIN</th>
                <th className="pb-3 font-bold">LOKASI</th>
                <th className="pb-3 font-bold">MENU</th>
                <th className="pb-3 font-bold">STATUS</th>
                <th className="pb-3 font-bold text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {canteens.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      {c.image ? (
                        <img src={c.image} alt={c.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0A2E6E] font-bold text-xs flex items-center justify-center shrink-0">
                          {c.initials}
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-slate-900 block">{c.name}</span>
                        <span className="text-[11px] text-slate-400">{c.subtext}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-600">{c.location}</td>
                  <td className="py-3.5 text-slate-700 font-medium">{c.menuCount} menu</td>
                  <td className="py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'Aktif'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : c.status === 'Menunggu'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-blue-50 text-[#0A2E6E] border border-blue-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right space-x-1.5">
                    {c.status === 'Menunggu' ? (
                      <>
                        <button
                          onClick={() => handleRejectCanteen(c.id)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Tolak
                        </button>
                        <button
                          onClick={() => handleApproveCanteen(c.id)}
                          className="px-3 py-1 text-xs font-bold rounded-lg bg-[#0A2E6E] hover:bg-[#082457] text-white"
                        >
                          Setujui
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
                          Detail
                        </button>
                        <button className="px-3 py-1 text-xs font-bold rounded-lg bg-[#0A2E6E] hover:bg-[#082457] text-white">
                          Edit
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Daftar Kurir Kampus */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">Daftar Kurir Kampus</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitor performa kurir dan status ketersediaan armada Widya Mandala Dinoyo
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
              Export
            </button>
            <button
              onClick={() => {
                setAddType('runner');
                setShowAddModal(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-[#0A2E6E] hover:bg-[#082457] text-white text-xs font-bold shadow-xs transition"
            >
              Tambah Kurir
            </button>
          </div>
        </div>

        <div className="overflow-x-auto pt-1">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="pb-3 font-bold">KURIR</th>
                <th className="pb-3 font-bold">ZONA</th>
                <th className="pb-3 font-bold">ORDER</th>
                <th className="pb-3 font-bold">STATUS</th>
                <th className="pb-3 font-bold text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {runners.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0A2E6E] font-bold text-xs flex items-center justify-center shrink-0">
                        {r.initials}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{r.name}</span>
                        <span className="text-[11px] text-slate-400">{r.subtext}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-600">{r.zone}</td>
                  <td className="py-3.5 text-slate-700 font-medium">{r.ordersToday}</td>
                  <td className="py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === 'Aktif'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : r.status === 'Sibuk'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-600 border border-red-200'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right space-x-1.5">
                    <button className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
                      Detail
                    </button>
                    <button className="px-3 py-1 text-xs font-bold rounded-lg bg-[#0A2E6E] hover:bg-[#082457] text-white">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Daftar Lokasi Kampus */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">Daftar Lokasi Kampus</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola gedung, ongkir, dan titik layanan Widya Mandala Dinoyo
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
              Lihat Peta
            </button>
            <button
              onClick={() => {
                setAddType('location');
                setShowAddModal(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-[#0A2E6E] hover:bg-[#082457] text-white text-xs font-bold shadow-xs transition"
            >
              Tambah Lokasi
            </button>
          </div>
        </div>

        <div className="overflow-x-auto pt-1">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="pb-3 font-bold">LOKASI</th>
                <th className="pb-3 font-bold">KAMPUS</th>
                <th className="pb-3 font-bold">TIPE</th>
                <th className="pb-3 font-bold">ONGKIR</th>
                <th className="pb-3 font-bold">STATUS</th>
                <th className="pb-3 font-bold text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {locations.map((loc) => (
                <tr key={loc.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0A2E6E] font-bold text-xs flex items-center justify-center shrink-0">
                        {loc.initials}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{loc.name}</span>
                        <span className="text-[11px] text-slate-400">{loc.subtext}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-600">{loc.campus}</td>
                  <td className="py-3.5 text-slate-700 font-medium">{loc.type}</td>
                  <td className="py-3.5 font-bold text-slate-900">{loc.fee}</td>
                  <td className="py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        loc.status === 'Aktif'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-blue-50 text-[#0A2E6E] border border-blue-200'
                      }`}
                    >
                      {loc.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right space-x-1.5">
                    <button className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
                      Detail
                    </button>
                    <button className="px-3 py-1 text-xs font-bold rounded-lg bg-[#0A2E6E] hover:bg-[#082457] text-white">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5: Akses Website Kampus */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">Akses Website Kampus</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola akses website dan halaman Gocan Widya Mandala Dinoyo
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
              Lihat Semua
            </button>
            <button className="px-3.5 py-1.5 rounded-lg bg-[#0A2E6E] hover:bg-[#082457] text-white text-xs font-bold shadow-xs transition">
              Atur Akses
            </button>
          </div>
        </div>

        {/* Akses Website Banner */}
        <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-[#0A2E6E]">Akses Website Kampus</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Aktifkan halaman website Gocan Widya Mandala Dinoyo sesuai izin yang diberikan
            </p>
          </div>
          <button className="px-4 py-1.5 bg-[#0A2E6E] hover:bg-[#082457] text-white text-xs font-bold rounded-lg shadow-xs transition shrink-0">
            Atur
          </button>
        </div>

        {/* Website Access Table */}
        <div className="overflow-x-auto pt-1">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="pb-3 font-bold">KAMPUS</th>
                <th className="pb-3 font-bold">DETAIL</th>
                <th className="pb-3 font-bold">WEBSITE</th>
                <th className="pb-3 font-bold">STATUS</th>
                <th className="pb-3 font-bold text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campusAccess.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0A2E6E] font-bold text-xs flex items-center justify-center shrink-0">
                        {item.id}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{item.name}</span>
                        <span className="text-[11px] text-slate-400">{item.subtext}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-600">{item.detail}</td>
                  <td className="py-3.5 text-slate-700 font-medium">{item.website}</td>
                  <td className="py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'Aktif'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right space-x-1.5">
                    <button className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
                      Detail
                    </button>
                    <button className="px-3 py-1 text-xs font-bold rounded-lg bg-[#0A2E6E] hover:bg-[#082457] text-white">
                      Atur
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Item */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm capitalize">Tambah Data {addType}</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                triggerToast(`Data ${addType} baru berhasil ditambahkan!`);
                setShowAddModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kantin Pak Slamet"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0A2E6E]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kampus / Lokasi:</label>
                <input
                  type="text"
                  defaultValue="Widya Mandala Dinoyo"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0A2E6E]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0A2E6E] hover:bg-[#082457] text-white shadow-xs"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
