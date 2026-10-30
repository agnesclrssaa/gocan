import { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Wallet,
  ArrowDownToLine,
  MapPin,
  Clock,
  Navigation,
  Bike,
  CheckCircle,
  X,
  CreditCard,
  ChevronRight,
  TrendingUp,
  Building,
  Zap,
  Sparkles,
  Compass,
  Star,
  Check
} from 'lucide-react';

export default function RunnerDashboard() {
  const { isOnline, setIsOnline } = useOutletContext();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('185000');
  const [withdrawSuccess, setWithdrawSuccess] = useState(null);
  const [walletBalance, setWalletBalance] = useState(185000);
  const [payoutMethod, setPayoutMethod] = useState('gopay');

  // Daily stats
  const todayEarnings = 52500; // 15 trips * 3500
  const todayCompletedCount = 15;

  // Nearby available jobs
  const availableOrders = [
    {
      id: '#Gocan-82421',
      total: 'Rp 28.500',
      fee: 'Rp 3.500',
      pickup: 'Kantin Pak Brazil (Stan 04)',
      delivery: 'Gedung Benedictus Lt. 2 (R204)',
      distance: '0,3 km',
      prepStatus: 'Siap Diambil'
    },
    {
      id: '#Gocan-82422',
      total: 'Rp 32.000',
      fee: 'Rp 3.500',
      pickup: 'Kantin Dinoyo (Soto Lamongan)',
      delivery: 'Gedung A Lt. 3 (R302)',
      distance: '0,5 km',
      prepStatus: 'Siap Diambil'
    },
    {
      id: '#Gocan-82423',
      total: 'Rp 24.000',
      fee: 'Rp 3.500',
      pickup: 'Kedai Kopi Teman',
      delivery: 'Perpustakaan Pusat Lt. 2',
      distance: '0,4 km',
      prepStatus: 'Menunggu 3 Mnt'
    }
  ];

  // Delivery history
  const [history] = useState([
    {
      id: '#Gocan-82410',
      time: '12:15 WIB',
      canteen: 'Stan 04 Pak Brazil',
      destination: 'Gedung B Lt. 3 Ruang 302',
      fee: 'Rp 3.500',
      recipient: 'David Wijaya',
      status: 'Selesai'
    },
    {
      id: '#Gocan-82408',
      time: '11:45 WIB',
      canteen: 'Stan 02 Soto Ayam',
      destination: 'Lab Komputer Gedung A Lt. 2',
      fee: 'Rp 3.500',
      recipient: 'Siti Sarah',
      status: 'Selesai'
    },
    {
      id: '#Gocan-82404',
      time: '11:10 WIB',
      canteen: 'Stan 07 Kopi Teman',
      destination: 'Ruang Dosen Gedung Farmasi',
      fee: 'Rp 3.500',
      recipient: 'Pak Antonius M.Kom',
      status: 'Selesai'
    }
  ]);

  const handleWithdraw = (e) => {
    e.preventDefault();
    const amountNum = parseInt(withdrawAmount, 10);
    if (amountNum > 0 && amountNum <= walletBalance) {
      setWalletBalance((prev) => prev - amountNum);
      setWithdrawSuccess(`Pencairan dana Rp ${amountNum.toLocaleString('id-ID')} berhasil diproses ke ${payoutMethod.toUpperCase()}!`);
      setTimeout(() => {
        setWithdrawSuccess(null);
        setShowWithdrawModal(false);
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. FLOATING WALLET CARD (Antigravity Glassmorphism) */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-indigo-950/90 border border-emerald-500/30 shadow-[0_20px_50px_rgba(16,185,129,0.12)] backdrop-blur-2xl overflow-hidden antigravity-hover">
        {/* Neon Emerald Accent Ambient Glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Dompet Runner Mahasiswa UKWMS
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block font-medium">Total Saldo Tersedia</span>
              <div className="flex items-baseline gap-3 mt-1">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Rp {walletBalance.toLocaleString('id-ID')}
                </h1>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Siap Tarik
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Ongkir Hari Ini: <strong className="text-white">Rp {todayEarnings.toLocaleString('id-ID')}</strong></span>
              </div>
              <span className="text-slate-600">•</span>
              <div>
                <span>Trip Hari Ini: <strong className="text-white">{todayCompletedCount} Order</strong></span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition flex items-center justify-center gap-2"
            >
              <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" />
              <span>Tarik Saldo Instan</span>
            </button>

            <Link
              to="/runner-portal/orders"
              className="py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 backdrop-blur-md transition flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Buka Job Board</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. TOGGLE STATUS "AKTIF CARI ORDER" (Giant Floating Status Card) */}
      <div className={`rounded-2xl p-4 sm:p-5 border transition-all duration-300 backdrop-blur-xl ${isOnline
          ? 'bg-emerald-950/40 border-emerald-500/40 shadow-lg shadow-emerald-950/50'
          : 'bg-slate-900/60 border-slate-800'
        }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black transition-all ${isOnline
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'bg-slate-800 text-slate-400'
              }`}>
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  {isOnline ? 'Status: Aktif Cari Orderan Kampus' : 'Status: Istirahat (Off-Duty)'}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${isOnline
                    ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 animate-pulse'
                    : 'bg-slate-800 text-slate-400'
                  }`}>
                  {isOnline ? 'Radar On' : 'Offline'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isOnline
                  ? 'Posisi terdeteksi di Kampus Dinoyo. Anda akan menerima notifikasi orderan antar gedung.'
                  : 'Aktifkan toggle untuk mulai menerima penawaran antar makanan ke ruang kelas.'}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => setIsOnline(!isOnline)}
            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden self-start sm:self-auto ${isOnline ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-slate-950 shadow-md ring-0 transition duration-200 ease-in-out ${isOnline ? 'translate-x-6' : 'translate-x-0'
                }`}
            />
          </button>
        </div>
      </div>

      {/* 3. PERFORMANCE STATS CARDS */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="glass-card-dark rounded-2xl p-4 border border-white/10 antigravity-hover text-center sm:text-left">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Antaran Selesai</p>
          <p className="text-xl sm:text-2xl font-black text-white mt-1">15 Trip</p>
          <span className="text-[11px] text-emerald-400 font-semibold hidden sm:inline-block mt-0.5">
            ✓ 100% Selesai Tepat Waktu
          </span>
        </div>

        <div className="glass-card-dark rounded-2xl p-4 border border-white/10 antigravity-hover text-center sm:text-left">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Rata-rata Waktu</p>
          <p className="text-xl sm:text-2xl font-black text-white mt-1">9.4 Mnt</p>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline-block mt-0.5">
            SLA Maks: 15 Menit
          </span>
        </div>

        <div className="glass-card-dark rounded-2xl p-4 border border-white/10 antigravity-hover text-center sm:text-left">
          <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Rating Pelanggan</p>
          <div className="flex items-center justify-center sm:justify-start gap-1 mt-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-xl sm:text-2xl font-black text-white">4.95</span>
          </div>
          <span className="text-[11px] text-amber-300 font-medium hidden sm:inline-block mt-0.5">
            Top Runner Dinoyo
          </span>
        </div>
      </div>

      {/* 4. MAIN SPLIT: JOB BOARD RADAR & RIWAYAT PENGANTARAN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Job Radar (3 Orderan Terdekat) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
                <span>Job Radar Antar Gedung</span>
              </h3>
              <p className="text-xs text-slate-400">Orderan delivery terdekat di area UKWMS Dinoyo</p>
            </div>
            <Link
              to="/runner-portal/orders"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
            >
              Lihat Semua ({availableOrders.length}) →
            </Link>
          </div>

          <div className="space-y-3">
            {availableOrders.map((order) => (
              <div
                key={order.id}
                className="glass-card-dark rounded-2xl p-4 sm:p-5 border border-white/10 shadow-lg antigravity-hover space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-white">{order.id}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {order.distance}
                      </span>
                      <span className="text-[11px] text-slate-400">({order.prepStatus})</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{order.pickup}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      <strong className="text-white">{order.delivery}</strong>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-emerald-400 block">{order.fee}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Ongkir Runner</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-[11px] text-slate-400">Harga Makanan: {order.total} (QRIS)</span>
                  <Link
                    to="/runner-portal/detail"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5"
                  >
                    <span>Ambil Order</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Riwayat Pengantaran Hari Ini */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>Riwayat Pengantaran Hari Ini</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">{history.length} Selesai</span>
          </div>

          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="glass-card-dark rounded-2xl p-4 border border-white/10 space-y-2 text-xs antigravity-hover"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">{item.id}</span>
                      <span className="text-[10px] text-slate-400">{item.time} • {item.recipient}</span>
                    </div>
                  </div>
                  <span className="font-black text-emerald-400 text-xs">+{item.fee}</span>
                </div>

                <p className="text-[11px] text-slate-300 pl-8">
                  {item.canteen} → <strong className="text-slate-100">{item.destination}</strong>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. MODAL PENCAIRAN SALDO INSTAN */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card-dark max-w-md w-full p-6 sm:p-7 rounded-3xl border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <ArrowDownToLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Tarik Saldo Ongkir</h3>
                  <p className="text-[11px] text-slate-400">Pencairan tanpa potongan fee</p>
                </div>
              </div>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {withdrawSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="font-black text-white text-sm">{withdrawSuccess}</h4>
                <p className="text-xs text-slate-400">Saldo akan segera masuk dalam waktu 1-5 menit.</p>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block font-medium">Saldo Dompet Anda:</span>
                  <p className="text-2xl font-black text-emerald-400">Rp {walletBalance.toLocaleString('id-ID')}</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">Jumlah Penarikan (Rp):</label>
                  <input
                    type="number"
                    max={walletBalance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full p-3 rounded-xl border border-white/20 bg-slate-900/90 text-white font-mono font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">Pilih Rekening / E-Wallet Tujuan:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'gopay', label: 'GoPay (0812-3344-****)' },
                      { id: 'dana', label: 'DANA (0812-3344-****)' },
                      { id: 'bca', label: 'BCA (088192****)' },
                      { id: 'mandiri', label: 'Mandiri (14200****)' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPayoutMethod(m.id)}
                        className={`p-2.5 rounded-xl border text-left transition ${payoutMethod === m.id
                            ? 'border-emerald-500 bg-emerald-500/15 text-white font-bold'
                            : 'border-white/10 bg-slate-900/60 text-slate-400 hover:bg-slate-900'
                          }`}
                      >
                        <span className="block text-xs">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="px-4 py-2.5 text-xs font-bold rounded-xl text-slate-400 hover:bg-white/5 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/30 hover:brightness-110 transition"
                  >
                    Konfirmasi Penarikan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
