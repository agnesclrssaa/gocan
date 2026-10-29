import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Users,
  Store,
  Bike,
  Building2,
  CheckCircle,
  ArrowUpRight,
  Clock,
  ShieldAlert,
  Search,
  ExternalLink,
  ChevronRight,
  Check,
  X,
  PhoneCall,
  UserCheck
} from 'lucide-react';

export default function AdminDashboard() {
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [assignedRunner, setAssignedRunner] = useState('');
  const [dispatchSuccess, setDispatchSuccess] = useState('');

  // 5 Floating / Overdue orders (>15 mins)
  const [floatingOrders, setFloatingOrders] = useState([
    {
      id: 'ORD-1092',
      canteen: 'Stan 01 Soto Ayam',
      campus: 'Dinoyo',
      target: 'Ruang 302, Gedung B Lt. 3',
      waitTime: 18,
      customer: 'David Wijaya (Fak. Bisnis)',
      phone: '0812-3344-5566',
      total: 'Rp 28.500',
      reason: 'Runner terjebak jam kuliah ganti'
    },
    {
      id: 'ORD-1095',
      canteen: 'Stan 07 Kopi Teman',
      campus: 'Dinoyo',
      target: 'Lab Komputer Gedung A Lt. 2',
      waitTime: 16,
      customer: 'Siti Sarah (Informatika)',
      phone: '0813-8899-7711',
      total: 'Rp 18.000',
      reason: 'Kepadatan pesanan pagi'
    },
    {
      id: 'ORD-1098',
      canteen: 'Stan 04 Dapur Bu Siti',
      campus: 'Kalijudan',
      target: 'Gedung Farmasi Lt. 2',
      waitTime: 15,
      customer: 'Antonius (Teknik Kimia)',
      phone: '0857-1122-3344',
      total: 'Rp 24.000',
      reason: 'Runner di area ini sedang mengantar'
    },
    {
      id: 'ORD-1102',
      canteen: 'Stan 02 Bakso Campur',
      campus: 'Dinoyo',
      target: 'Perpustakaan Pusat Lt. 1',
      waitTime: 15,
      customer: 'Clarissa (Fak. Psikologi)',
      phone: '0821-4455-6677',
      total: 'Rp 22.000',
      reason: 'Belum ada runner ambil pesanan'
    },
    {
      id: 'ORD-1105',
      canteen: 'Stan 09 Ayam Crispy',
      campus: 'Kalijudan',
      target: 'Gedung Serba Guna',
      waitTime: 15,
      customer: 'Budi Hartono (Teknik Elektro)',
      phone: '0819-7788-9900',
      total: 'Rp 27.500',
      reason: 'Hujan rintik di koridor terbuka'
    }
  ]);

  const availableRunners = [
    { id: 'RUN-01', name: 'Andi Pratama', campus: 'Dinoyo', status: 'Standby di Kantin', ordersDone: 14 },
    { id: 'RUN-04', name: 'Nadia Rizky', campus: 'Dinoyo', status: 'Standby Gedung B', ordersDone: 11 },
    { id: 'RUN-07', name: 'Dimas Saputra', campus: 'Kalijudan', status: 'Standby Kantin Utama', ordersDone: 9 }
  ];

  const handleDispatch = (order) => {
    setSelectedOrder(order);
    setShowDispatchModal(true);
    setDispatchSuccess('');
  };

  const confirmDispatch = () => {
    if (!assignedRunner) return;
    setFloatingOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
    setDispatchSuccess(`Pesanan ${selectedOrder.id} berhasil di-assign darurat ke ${assignedRunner}!`);
    setTimeout(() => {
      setShowDispatchModal(false);
      setSelectedOrder(null);
      setAssignedRunner('');
      setDispatchSuccess('');
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ringkasan Platform Hari Ini</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Live Realtime
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Pantau metrik utama, performa operasional, SLA antaran, dan transaksi hari ini di seluruh kampus mitra UKWMS.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link
            to="/admin-portal/campus"
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            Kelola Kampus
          </Link>
          <Link
            to="/admin-portal/finance"
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-xs"
          >
            Laporan Finansial
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics (Matches Mockup gocan-admin-dashboard-desktop.png) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Pendapatan Gross */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
            <span>Pendapatan Gross</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">Rp 4.250.000</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.4% vs hari kemarin</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total perputaran uang hari ini</p>
        </div>

        {/* Metric 2: Komisi Gocan 5% */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
            <span>Komisi Gocan 5%</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 tracking-tight">Rp 212.500</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
            <span>Potongan otomatis transaksi</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pendapatan bersih platform GoCan</p>
        </div>

        {/* Metric 3: Pesanan Aktif */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
            <span>Pesanan Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">146 Order</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-blue-600 font-semibold">
            <span>● 92 Selesai • 49 Proses • 5 Mengambang</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Diproses kantin dan diantar runner</p>
        </div>

        {/* Metric 4: Kurir Aktif */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase mb-2">
            <span>Kurir Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Bike className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight">32 Mahasiswa</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-semibold">
            <span>● 22 Dinoyo • 10 Kalijudan</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Runner aktif siaga antar gedung</p>
        </div>
      </div>

      {/* Middle Section: SLA Alert & Pendaftaran Menunggu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SLA Alert: 5 Orderan Mengambang > 15 Menit */}
        <div className="lg:col-span-2 bg-gradient-to-br from-rose-50 to-red-50/60 border-2 border-rose-300/80 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black shadow-md shadow-rose-600/20 shrink-0">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-rose-950 tracking-tight">
                    {floatingOrders.length} Orderan Mengambang!
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white">
                    SLA Alert &gt; 15 Mnt
                  </span>
                </div>
                <p className="text-xs text-rose-700 mt-0.5">
                  Ada pesanan delivery belum diambil runner melebihi SLA normal (10 menit). Butuh intervensi admin segera!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right hidden sm:block">
                <span className="text-[11px] text-rose-600 block">SLA Standar: 10 Mnt</span>
                <span className="text-xs font-bold text-rose-900">Intervensi: {floatingOrders.length} Order</span>
              </div>
            </div>
          </div>

          {/* List of floating orders */}
          <div className="space-y-2.5">
            {floatingOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl p-3.5 border border-rose-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-rose-400 transition"
              >
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0 animate-ping" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{order.id}</span>
                      <span className="text-xs font-semibold text-slate-600">({order.canteen})</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-600">
                        {order.campus}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>Tujuan: <strong className="text-slate-800">{order.target}</strong></span>
                      <span>Pemesan: {order.customer}</span>
                      <span className="text-rose-600 font-medium">⚠️ {order.reason}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-black text-xs">
                      ⏱️ {order.waitTime} Menit
                    </span>
                    <span className="block text-[11px] text-slate-500 font-semibold">{order.total}</span>
                  </div>
                  <button
                    onClick={() => handleDispatch(order)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <span>Atur / Dispatch</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {floatingOrders.length === 0 && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 text-center text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Semua orderan telah ter-dispatch dengan lancar! SLA kembali normal (&lt; 10 menit).
              </div>
            )}
          </div>
        </div>

        {/* Verifikasi Pendaftaran (2 Menunggu) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-900 text-sm">Verifikasi Pendaftaran</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                2 Menunggu
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              1 Stan kantin baru dan 1 kurir mahasiswa UKWMS telah mengunggah berkas pendaftaran dan menunggu aktivasi.
            </p>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">Kedai Kopi Kita (Dinoyo)</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Stan Kantin
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Ibu Sri Rahayu • Berkas NIB & Foto Menu Lengkap</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">Bima Satria (Teknik Industri)</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Runner Mahasiswa
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">NRP 51023001 • KTM Aktif & SIM C Terverifikasi</p>
              </div>
            </div>
          </div>

          <Link
            to="/admin-portal/management"
            className="mt-5 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs text-center transition flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Buka Halaman Verifikasi</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Bottom Section: Rasio Pemesanan & Ringkasan Operasional Kampus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rasio Pick-up vs Delivery */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900 text-base">Komposisi Layanan Hari Ini</h3>
              <span className="text-xs font-semibold text-slate-500">146 Total Order</span>
            </div>

            {/* Visual ratio bar */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-800 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    Delivery Antar Gedung (Runner)
                  </span>
                  <span className="text-indigo-600 font-extrabold">72% (105 Order)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                  <div className="bg-indigo-600 h-3.5 rounded-full transition-all duration-500" style={{ width: '72%' }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Rata-rata waktu antar: 12.4 Menit</p>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-800 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Pick-up Mandiri (Tanpa Antre)
                  </span>
                  <span className="text-emerald-600 font-extrabold">28% (41 Order)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
                  <div className="bg-emerald-500 h-3.5 rounded-full transition-all duration-500" style={{ width: '28%' }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Rata-rata waktu siap: 7.2 Menit</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Mayoritas pesanan diantar ke <strong>Gedung B & Perpustakaan</strong></span>
            <span className="font-bold text-indigo-600">Peak Hour: 12.00 - 13.00</span>
          </div>
        </div>

        {/* Ringkasan Operasional Kampus Mitra */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-slate-900 text-base">Ringkasan Operasional Kampus</h3>
              <p className="text-xs text-slate-500">Performa transaksi dan kepatuhan SLA di masing-masing kampus</p>
            </div>
            <Link
              to="/admin-portal/campus"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              Lihat Detail Kampus →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Kampus</th>
                  <th className="py-2.5 px-3">Stan Buka</th>
                  <th className="py-2.5 px-3">Runner Aktif</th>
                  <th className="py-2.5 px-3">GMV Hari Ini</th>
                  <th className="py-2.5 px-3">Kepatuhan SLA</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 block">UKWMS Dinoyo (Utama)</span>
                    <span className="text-[11px] text-slate-400">Jl. Dinoyo 42-44</span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-700">14 / 16 Stan</td>
                  <td className="py-3 px-3 font-semibold text-slate-700">22 Mahasiswa</td>
                  <td className="py-3 px-3 font-black text-slate-900">Rp 2.850.000</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      98% Tepat Waktu
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to="/admin-portal/campus"
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 block">UKWMS Kalijudan</span>
                    <span className="text-[11px] text-slate-400">Jl. Kalijudan 37</span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-700">8 / 10 Stan</td>
                  <td className="py-3 px-3 font-semibold text-slate-700">10 Mahasiswa</td>
                  <td className="py-3 px-3 font-black text-slate-900">Rp 1.400.000</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                      94% Tepat Waktu
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to="/admin-portal/campus"
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 block">UKWMS Pakuwon City</span>
                    <span className="text-[11px] text-slate-400">Pakuwon City Laguna</span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">-</td>
                  <td className="py-3 px-3 text-slate-400">-</td>
                  <td className="py-3 px-3 text-slate-400">-</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      Tahap MoU
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to="/admin-portal/campus"
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] hover:bg-indigo-100 transition"
                    >
                      Cek MoU
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Interactive Modal: Auto-Dispatch / Manual Dispatch Runner */}
      {showDispatchModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Intervensi Dispatch Runner</h3>
                  <p className="text-[11px] text-slate-500">Order: {selectedOrder.id} ({selectedOrder.canteen})</p>
                </div>
              </div>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {dispatchSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="font-black text-slate-900 text-sm">{dispatchSuccess}</h4>
                <p className="text-xs text-slate-500">Notifikasi WhatsApp darurat telah dikirim ke kurir.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                  <p className="font-bold mb-1">Status Keterlambatan: {selectedOrder.waitTime} Menit</p>
                  <p className="text-[11px] text-rose-700">
                    Pemesan: <strong>{selectedOrder.customer}</strong> ({selectedOrder.phone})
                  </p>
                  <p className="text-[11px] text-rose-700">Tujuan: <strong>{selectedOrder.target}</strong></p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pilih Runner Siaga untuk Penugasan Darurat:
                  </label>
                  <div className="space-y-2">
                    {availableRunners
                      .filter((r) => r.campus === selectedOrder.campus)
                      .map((runner) => (
                        <label
                          key={runner.id}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition ${assignedRunner === runner.name
                              ? 'border-indigo-600 bg-indigo-50/60 font-bold'
                              : 'border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="runnerSelect"
                              checked={assignedRunner === runner.name}
                              onChange={() => setAssignedRunner(runner.name)}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                              <span className="text-slate-900 font-bold block">{runner.name}</span>
                              <span className="text-[11px] text-slate-500">{runner.status}</span>
                            </div>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                            {runner.ordersDone} order hari ini
                          </span>
                        </label>
                      ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowDispatchModal(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                  >
                    Batal
                  </button>
                  <button
                    disabled={!assignedRunner}
                    onClick={confirmDispatch}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white shadow-xs transition"
                  >
                    Kirim Penugasan Darurat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
