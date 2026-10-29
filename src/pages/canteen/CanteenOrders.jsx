import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  CheckCircle2,
  Search,
  Camera,
  Upload,
  RefreshCw,
  Clock,
  User,
  Check,
  X,
  AlertCircle,
  FileCheck,
  ChevronRight,
  Store,
  Sparkles,
  Zap,
  ScanLine
} from 'lucide-react';

export default function CanteenOrders() {
  const [activeTab, setActiveTab] = useState('baru');
  const [searchCode, setSearchCode] = useState('Gocan-82419');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(true);
  const [isPickupCompleted, setIsPickupCompleted] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState(null);

  // Orders list
  const [orders, setOrders] = useState([
    {
      id: '#Gocan-82419',
      type: 'DELIVERY',
      time: '11.45 WIB',
      items: '1x Ayam Geprek Sambal Korek, 2x Es Teh Manis Jumbo',
      customerName: 'Anastasya Widjaja',
      customerNrp: 'NRP: 5103021004',
      location: 'Benedictus Lt. 3 • Ruang 3.02',
      total: 'Rp 23.000',
      status: 'baru'
    },
    {
      id: '#Gocan-82418',
      type: 'DELIVERY',
      time: '11.42 WIB',
      items: '2x Nasi Goreng Telur, 1x Es Jeruk',
      customerName: 'Dimas Pratama',
      customerNrp: 'NRP: 5102201988',
      location: 'Benedictus Lt. 2 • Ruang 2.11',
      total: 'Rp 36.000',
      status: 'baru'
    },
    {
      id: '#Gocan-82417',
      type: 'PICKUP',
      time: '11.38 WIB',
      items: '1x Mie Goreng Seafood, 1x Es Teh Manis',
      customerName: 'Nadia Putri',
      customerNrp: 'NRP: 5101804211',
      location: 'Ambil di Stan 04 Pak Brazil',
      total: 'Rp 21.000',
      status: 'dimasak'
    },
    {
      id: '#Gocan-82415',
      type: 'PICKUP',
      time: '11.25 WIB',
      items: '1x Kulit Ayam Geprek Crispy, 1x Jus Alpukat',
      customerName: 'Kevin Sanjaya',
      customerNrp: 'NRP: 5102300412',
      location: 'Tiket QR #Gocan-82415 Siap Scan',
      total: 'Rp 25.000',
      status: 'siap'
    },
    {
      id: '#Gocan-82410',
      type: 'DELIVERY',
      time: '11.10 WIB',
      items: '1x Nasi Campur Komplit Pak Brazil',
      customerName: 'Budi Santoso',
      customerNrp: 'NRP: 5102100119',
      location: 'Gedung B Lt. 1',
      total: 'Rp 22.000',
      status: 'selesai'
    }
  ]);

  const advanceOrderStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    setNotificationMsg(`Pesanan ${orderId} dipindahkan ke status: "${newStatus.toUpperCase()}"!`);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleVerifyTicket = () => {
    if (searchCode.trim()) {
      setVerificationSuccess(true);
      setIsPickupCompleted(false);
      setNotificationMsg(`Tiket ${searchCode} valid! Mahasiswa siap mengambil.`);
      setTimeout(() => setNotificationMsg(null), 3000);
    }
  };

  const handleCompletePickup = () => {
    setIsPickupCompleted(true);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === searchCode || o.id === '#Gocan-82419' ? { ...o, status: 'selesai' } : o
      )
    );
    setNotificationMsg(`Pesanan telah diserahterimakan! Tiket pick-up selesai.`);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const filteredOrders = orders.filter((o) => o.status === activeTab);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-20 right-6 z-50 glass-card-dark text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/40 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs sm:text-sm font-semibold">{notificationMsg}</span>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-white ml-2 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Fast Switcher */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 antigravity-hover">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/25">
            <QrCode className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Pesanan & Scanner QR</h1>
            <p className="text-xs text-slate-500">
              Kelola status antrean makanan & verifikasi tiket pick-up mahasiswa tanpa antre.
            </p>
          </div>
        </div>

        {/* Floating Pill Switcher for Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-full glass-card border border-white/60 shadow-xs self-start sm:self-auto overflow-x-auto max-w-full">
          {[
            { id: 'baru', label: 'Baru', badge: orders.filter((o) => o.status === 'baru').length, pulse: true },
            { id: 'dimasak', label: 'Dimasak', badge: orders.filter((o) => o.status === 'dimasak').length },
            { id: 'siap', label: 'Siap', badge: orders.filter((o) => o.status === 'siap').length },
            { id: 'selesai', label: 'Selesai', badge: orders.filter((o) => o.status === 'selesai').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
            >
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${activeTab === tab.id
                      ? 'bg-white text-emerald-800'
                      : tab.pulse
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: Left Orders Queue | Right Futuristic QR Scanner HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Orders Queue Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <span>Daftar Pesanan ({filteredOrders.length})</span>
              <span className="text-xs font-semibold text-emerald-700 capitalize">• Status: {activeTab}</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Real-time update</span>
          </div>

          <div className="space-y-3.5">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="glass-card rounded-2xl p-5 border border-white/60 shadow-xs antigravity-hover space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm sm:text-base text-slate-900">{order.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${order.type === 'DELIVERY'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                      >
                        {order.type === 'DELIVERY' ? '🛵 Antar Gedung' : '🚶 Ambil Sendiri'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {order.customerName} ({order.customerNrp}) • Waktu: {order.time}
                    </p>
                  </div>

                  <span className="text-sm font-black text-emerald-700 shrink-0">{order.total}</span>
                </div>

                <div className="p-3 rounded-xl bg-white/70 border border-slate-200/60 text-xs">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Item Pesanan:</span>
                  <p className="font-bold text-slate-800">{order.items}</p>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <span>Lokasi Antar / Drop:</span>
                    <strong className="text-slate-700">{order.location}</strong>
                  </p>
                </div>

                {/* Step Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  {order.status === 'baru' && (
                    <button
                      onClick={() => advanceOrderStatus(order.id, 'dimasak')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Mulai Masak</span>
                    </button>
                  )}

                  {order.status === 'dimasak' && (
                    <button
                      onClick={() => advanceOrderStatus(order.id, 'siap')}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Makanan Siap Diambil</span>
                    </button>
                  )}

                  {order.status === 'siap' && (
                    <button
                      onClick={() => advanceOrderStatus(order.id, 'selesai')}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Serahkan & Selesaikan</span>
                    </button>
                  )}

                  {order.status === 'selesai' && (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Selesai Diserahkan
                    </span>
                  )}
                </div>
              </div>
            ))}

            {filteredOrders.length === 0 && (
              <div className="glass-card rounded-2xl p-8 text-center space-y-2 text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="font-bold text-sm text-slate-800">Tidak ada pesanan di tab ini</p>
                <p className="text-xs text-slate-400">Semua pesanan pada status {activeTab} telah diproses dengan lancar.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Futuristic Futuristic QR Scanner HUD Camera */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card rounded-3xl p-6 border border-white/60 shadow-xl antigravity-hover space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <ScanLine className="w-5 h-5 text-emerald-600 animate-pulse" />
                  Scanner Tiket Pick-up
                </h3>
                <p className="text-xs text-slate-500">Scan QR Code tiket mahasiswa di meja kantin</p>
              </div>

              <button
                onClick={() => setIsCameraActive(!isCameraActive)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${isCameraActive
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{isCameraActive ? 'Tutup Scanner' : 'Buka Kamera'}</span>
              </button>
            </div>

            {/* Futuristic Scanner Viewport */}
            <div className="relative aspect-4/3 rounded-2xl bg-slate-950 overflow-hidden border-2 border-emerald-500/40 shadow-inner flex items-center justify-center">
              {/* Sci-Fi Target Grid & HUD Background */}
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />

              {/* Sci-Fi Corner Brackets */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-emerald-400" />

              {/* Animated Laser Scanning Beam */}
              <div className="absolute inset-x-8 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce" />

              {/* Center Target Box */}
              <div className="relative z-10 w-44 h-44 rounded-2xl border border-dashed border-emerald-400/80 bg-emerald-950/40 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center space-y-2">
                <QrCode className="w-12 h-12 text-emerald-400/80 animate-pulse" />
                <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-300 font-bold">
                  {isCameraActive ? 'Arahkan QR Tiket ke Kamera' : 'Scanner Standby (Tekan Buka)'}
                </span>
              </div>

              {/* HUD live status badge */}
              <div className="absolute top-3 inset-x-0 flex justify-center">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 flex items-center gap-1.5 backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  GoCan Optic Sensor v2.4 Active
                </span>
              </div>
            </div>

            {/* Manual Code Input Option */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Atau Ketik Kode Tiket Pick-up Mahasiswa:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    placeholder="Contoh: Gocan-82419"
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-slate-200 bg-white/90 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  onClick={handleVerifyTicket}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Verifikasi
                </button>
              </div>
            </div>

            {/* Verification Result Card */}
            {verificationSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-300/80 shadow-2xs space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-slate-900">Tiket Terverifikasi Valid!</h4>
                      <p className="text-[10px] text-emerald-700 font-mono">Kode: {searchCode}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                    Siap Diserahkan
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-700 pt-1 border-t border-emerald-200/60 font-medium">
                  <p>Pemesan: <strong>Anastasya Widjaja (NRP 5103021004)</strong></p>
                  <p>Item: 1x Ayam Geprek Sambal Korek, 2x Es Teh Manis Jumbo</p>
                  <p className="font-black text-emerald-800">Total Lunas (QRIS): Rp 23.000</p>
                </div>

                <button
                  disabled={isPickupCompleted}
                  onClick={handleCompletePickup}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm ${isPickupCompleted
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                    }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isPickupCompleted ? 'Makanan Sudah Diserahkan' : 'Serahkan Makanan & Selesaikan'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
