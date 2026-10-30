import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  TrendingUp,
  ShoppingBag,
  Star,
  CheckCircle,
  XCircle,
  X,
  Clock,
  ArrowUpRight,
  Flame,
  ChevronRight,
  Volume2,
  Sparkles,
  Store,
  Check,
  RefreshCw
} from 'lucide-react';

export default function CanteenDashboard() {
  const [periodFilter, setPeriodFilter] = useState('7hari');
  const [showOrderModal, setShowOrderModal] = useState(true);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState(null);
  const [soundPlaying, setSoundPlaying] = useState(true);

  // Incoming order data
  const [newOrder, setNewOrder] = useState({
    id: '#Gocan-92510',
    type: 'Delivery',
    total: 'Rp 33.000',
    items: '1x Kulit Ayam Brazil, 2x Es Teh Jumbo',
    customer: 'David Wijaya (Fakultas Teknik Lt. 3 • R302)',
    time: 'Baru saja (12 detik lalu)'
  });

  // Simulated audio wave equalizer animation
  useEffect(() => {
    if (showOrderModal) {
      setSoundPlaying(true);
    }
  }, [showOrderModal]);

  const handleAcceptOrder = (prepTime = '15 Min') => {
    setShowOrderModal(false);
    setAlertDismissed(true);
    setNotificationMsg(`Pesanan ${newOrder.id} Diterima! Estimasi siap: ${prepTime}. Segera masak.`);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const handleRejectOrder = () => {
    setShowOrderModal(false);
    setAlertDismissed(true);
    setNotificationMsg(`Pesanan ${newOrder.id} telah ditolak.`);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // 7 days trend data
  const trendData = [
    { day: 'Sen', orders: 18, revenue: 420000, height: '45%' },
    { day: 'Sel', orders: 24, revenue: 580000, height: '60%' },
    { day: 'Rab', orders: 32, revenue: 720000, height: '78%' },
    { day: 'Kam', orders: 28, revenue: 640000, height: '70%' },
    { day: 'Jum', orders: 40, revenue: 890000, height: '95%' },
    { day: 'Sab', orders: 35, revenue: 780000, height: '82%' },
    { day: 'Min', orders: 42, revenue: 845000, height: '100%' }
  ];

  // Best selling menus
  const bestSellers = [
    {
      id: 1,
      rank: 1,
      name: 'Kulit Ayam Geprek Crispy',
      category: 'Makanan Utama',
      sales: 62,
      price: 'Rp 15.000',
      percentage: '85%'
    },
    {
      id: 2,
      rank: 2,
      name: 'Jus Mangga Brazil (Dingin)',
      category: 'Minuman Segar',
      sales: 48,
      price: 'Rp 10.000',
      percentage: '68%'
    },
    {
      id: 3,
      rank: 3,
      name: 'Nasi Campur Komplit Pak Brazil',
      category: 'Makanan Utama',
      sales: 39,
      price: 'Rp 22.000',
      percentage: '54%'
    },
    {
      id: 4,
      rank: 4,
      name: 'Es Teh Manis Jumbo',
      category: 'Minuman Segar',
      sales: 74,
      price: 'Rp 5.000',
      percentage: '94%'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-20 right-6 z-50 glass-card-dark text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/40 animate-in fade-in slide-in-from-top-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <span className="text-xs sm:text-sm font-semibold">{notificationMsg}</span>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-white ml-2 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Top Header Navigation Bar with Glassmorphism */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 antigravity-hover">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/25 relative">
            <Store className="w-6 h-6 text-slate-950" />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Kantin Pak Brazil</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-800 border border-emerald-400/40">
                Stan 04 • Dinoyo
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>Universitas Katolik Widya Mandala Surabaya</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> 4.9 (420+ Review)
              </span>
            </p>
          </div>
        </div>

        {/* Navigation Pills (Antigravity Floating Switcher) */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-900/5 p-1 rounded-2xl border border-slate-200/60 backdrop-blur-md">
          <Link
            to="/canteen-portal"
            className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-md shadow-emerald-600/30 transition"
          >
            Dashboard
          </Link>
          <Link
            to="/canteen-portal/orders"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/80 transition"
          >
            Pesanan & QR
          </Link>
          <Link
            to="/canteen-portal/menu"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/80 transition"
          >
            Kelola Menu
          </Link>
        </div>
      </div>

      {/* 1. THREE FLOATING METRIC CARDS 3D (Antigravity Glassmorphism) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Pendapatan Hari Ini */}
        <div className="glass-card antigravity-hover rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-400/10 rounded-full blur-2xl group-hover:bg-emerald-400/25 transition-all duration-500" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pendapatan Hari Ini</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">Rp 845.000</p>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-emerald-700 font-bold">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span>+14.2% vs kemarin</span>
            <span className="text-slate-400 font-normal">({trendData[trendData.length - 1].orders} order)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">Penjualan bersih stan setelah komisi 5%</p>
        </div>

        {/* Metric 2: Order Masuk */}
        <div className="glass-card antigravity-hover rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-blue-400/10 rounded-full blur-2xl group-hover:bg-blue-400/25 transition-all duration-500" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pesanan Masuk</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-700 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">38 Pesanan</p>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-blue-700 font-bold">
            <span>● 32 Delivery Kurir</span>
            <span className="text-slate-400 font-normal">• 6 Ambil Sendiri</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">3 orderan baru sedang menunggu konfirmasi</p>
        </div>

        {/* Metric 3: Completed Order */}
        <div className="glass-card antigravity-hover rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-400/10 rounded-full blur-2xl group-hover:bg-amber-400/25 transition-all duration-500" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pesanan Selesai</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 flex items-center justify-center font-bold">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">35 Selesai</p>
          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-emerald-700 font-bold">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>92% Tingkat Keberhasilan SLA</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">Rata-rata waktu siap saji: 11.5 Menit</p>
        </div>
      </div>

      {/* Button to re-open incoming order test modal if dismissed */}
      {alertDismissed && (
        <div className="flex items-center justify-between glass-card p-3.5 rounded-xl border border-emerald-400/40">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600 animate-bounce" />
            Simulasi Antigravity: Ingin mencoba modal pop-up "Pesanan Baru Masuk" lagi?
          </span>
          <button
            onClick={() => {
              setShowOrderModal(true);
              setAlertDismissed(false);
            }}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Buka Simulasi Modal Baru</span>
          </button>
        </div>
      )}

      {/* 2. MAIN SPLIT: TREN PENJUALAN & MENU TERLARIS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Tren Pendapatan 7 Hari (Glass Card) */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-6 space-y-4 antigravity-hover">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Tren Penjualan Stan (7 Hari Terakhir)
              </h3>
              <p className="text-xs text-slate-500">Performa transaksi harian Kantin Pak Brazil UKWMS</p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
              {['7hari', '30hari'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodFilter(p)}
                  className={`px-3 py-1 rounded-lg transition ${periodFilter === p ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-500'
                    }`}
                >
                  {p === '7hari' ? '7 Hari' : '30 Hari'}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-60 pt-6 pb-2 px-2 border-t border-slate-200/60 flex flex-col justify-end">
            <div className="grid grid-cols-7 h-44 items-end gap-3 sm:gap-6 px-3">
              {trendData.map((d, i) => {
                const isMax = i === trendData.length - 1;
                return (
                  <div key={d.day} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="text-[10px] font-extrabold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Rp {(d.revenue / 1000).toFixed(0)}k
                    </div>
                    <div
                      className={`w-full max-w-[34px] rounded-t-xl transition-all duration-500 cursor-pointer ${isMax
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/40'
                          : 'bg-emerald-700/60 hover:bg-emerald-600'
                        }`}
                      style={{ height: d.height }}
                      title={`${d.day}: ${d.orders} Order - Rp ${d.revenue.toLocaleString('id-ID')}`}
                    />
                    <span className={`text-xs font-bold ${isMax ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
            <span>Puncak Penjualan: <strong>Jumat & Minggu (Peak Hour 11.30 - 13.00)</strong></span>
            <span className="font-bold text-emerald-700">Rata-rata: 32 Order / Hari</span>
          </div>
        </div>

        {/* Right: Menu Terlaris (Glass Card) */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-6 space-y-4 antigravity-hover">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                Menu Terlaris Hari Ini
              </h3>
              <p className="text-xs text-slate-500">Paling banyak dipesan mahasiswa UKWMS</p>
            </div>
            <Link
              to="/canteen-portal/menu"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 transition"
            >
              Kelola Menu →
            </Link>
          </div>

          <div className="space-y-3">
            {bestSellers.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-white/70 border border-slate-200/60 shadow-2xs space-y-1.5 hover:bg-white transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${item.rank === 1
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : item.rank === 2
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-orange-50 text-orange-700'
                        }`}
                    >
                      #{item.rank}
                    </span>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block leading-tight">{item.name}</span>
                      <span className="text-[10px] text-slate-400">{item.category} • {item.price}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-700">{item.sales} Terjual</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full"
                    style={{ width: item.percentage }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link
              to="/canteen-portal/orders"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs text-center transition flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Buka Antrean Pesanan Aktif</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. ALERT MODAL "PESANAN BARU MASUK" (Antigravity Floating Dialog with Sound Indicator) */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 sm:p-7 rounded-3xl shadow-2xl border border-white/50 animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
            {/* Top Sound / Audio Equalizer Wave Animation */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 relative shrink-0">
                  <Bell className="w-6 h-6 animate-bounce" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 ring-2 ring-white animate-ping" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 text-base tracking-tight">Pesanan Baru Masuk!</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700 border border-rose-300">
                      Live Order
                    </span>
                  </div>
                  {/* Realtime Audio Equalizer Indicator */}
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-rose-600 font-semibold">
                    <Volume2 className="w-4 h-4" />
                    <span>Alarm GoCan Berbunyi</span>
                    {/* Equalizer bars */}
                    <div className="flex items-end gap-0.5 h-3.5 ml-1">
                      <span className="w-1 bg-rose-500 rounded-full h-2 animate-pulse" />
                      <span className="w-1 bg-rose-600 rounded-full h-3.5 animate-bounce" />
                      <span className="w-1 bg-rose-500 rounded-full h-1.5 animate-pulse" />
                      <span className="w-1 bg-rose-600 rounded-full h-3 animate-bounce" />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowOrderModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Detail Box */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="font-black text-sm text-slate-900">{newOrder.id}</span>
                    <span className="text-[11px] text-slate-500 ml-2">({newOrder.time})</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-800">
                    🛵 {newOrder.type} Antar Gedung
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block font-medium">Pemesan:</span>
                  <p className="font-bold text-slate-900">{newOrder.customer}</p>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px] block font-medium">Item Menu:</span>
                  <p className="font-bold text-emerald-800 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/60 text-xs">
                    {newOrder.items}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Total Pembayaran (QRIS):</span>
                  <span className="font-black text-base text-slate-900">{newOrder.total}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-amber-50/80 border border-amber-200/60 p-3 rounded-xl flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Harap konfirmasi dalam waktu <strong>60 detik</strong> agar runner dapat segera mengambil.</span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleRejectOrder}
                  className="py-3 px-4 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs transition"
                >
                  Tolak Pesanan
                </button>
                <button
                  onClick={() => handleAcceptOrder('15 Menit')}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Terima (Siap 15 Mnt)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
