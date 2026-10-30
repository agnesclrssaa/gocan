import { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Building,
  Check,
  CheckCircle,
  X,
  Filter,
  Zap,
  Sparkles,
  ChevronRight,
  Navigation
} from 'lucide-react';

export default function RunnerOrders() {
  const { isOnline } = useOutletContext();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [takenJobId, setTakenJobId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Available delivery orders matching mockups
  const [orders, setOrders] = useState([
    {
      id: '#Gocan-91024',
      fee: 'Rp 3.500',
      from: 'Kantin Pak Brazil (Stan 04)',
      fromFloor: 'Area Kantin Utama Dinoyo',
      to: 'Gedung A Lt. 3 (Ruang 302)',
      toDetail: 'Fakultas Teknik • Pemesan: David Wijaya',
      distance: '180m',
      category: 'Gedung A',
      schedule: 'Langsung Antar',
      items: '1x Ayam Geprek, 1x Es Teh Jumbo',
      isHot: true
    },
    {
      id: '#Gocan-91220',
      fee: 'Rp 3.500',
      from: 'Kantin Dinoyo (Soto Lamongan)',
      fromFloor: 'Stan 02 Area Kantin',
      to: 'Gedung Benedictus Lt. 4 (Ruang 4.01)',
      toDetail: 'Fakultas Bisnis • Pemesan: Anastasya',
      distance: '95m',
      category: 'Benedictus',
      schedule: 'Langsung Antar',
      items: '2x Soto Ayam Madura',
      isHot: false
    },
    {
      id: '#Gocan-91318',
      fee: 'Rp 3.500',
      from: 'Kedai Kopi Teman',
      fromFloor: 'Area Parkir Depan Kantin',
      to: 'Lab Komputer Gedung B Lt. 2',
      toDetail: 'Informatika • Pemesan: Raka Pratama',
      distance: '240m',
      category: 'Gedung B',
      schedule: '12:00 WIB (10 Mnt Lagi)',
      items: '2x Es Kopi Susu Aren',
      isHot: false
    },
    {
      id: '#Gocan-91401',
      fee: 'Rp 3.500',
      from: 'Kantin Sego Sambel Dinoyo',
      fromFloor: 'Stan 09 Farmasi',
      to: 'Perpustakaan Pusat Lt. 2',
      toDetail: 'Area Belajar • Pemesan: Clarissa',
      distance: '120m',
      category: 'Perpustakaan',
      schedule: 'Langsung Antar',
      items: '1x Sego Sambel Kulit, 1x Air Mineral',
      isHot: true
    },
    {
      id: '#Gocan-91455',
      fee: 'Rp 3.500',
      from: 'Kantin Dapur Bu Siti',
      fromFloor: 'Stan 01 Dinoyo',
      to: 'Ruang Dosen Gedung Farmasi Lt. 2',
      toDetail: 'Fakultas Farmasi • Pemesan: Bpk. Antonius',
      distance: '310m',
      category: 'Farmasi',
      schedule: 'Langsung Antar',
      items: '1x Nasi Gudeg Telur',
      isHot: false
    }
  ]);

  const handleTakeJob = (order) => {
    setTakenJobId(order.id);
    setToastMessage(`Order ${order.id} berhasil diambil! Mengalihkan ke halaman proses antar...`);
    setTimeout(() => {
      navigate('/runner-portal/detail', { state: { order } });
    }, 1500);
  };

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'Semua') return true;
    return o.category === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 glass-card-dark text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/40 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Status Notice */}
      <div className="glass-card-dark rounded-2xl p-5 sm:p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 antigravity-hover">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/25">
            <Compass className="w-6 h-6 text-slate-950 animate-spin" style={{ animationDuration: '10s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Job Board Antar Gedung Dinoyo
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Tarif Flat Rp 3.500
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pilih orderan delivery terdekat untuk diantar dari stan kantin ke ruang kelas mahasiswa.
            </p>
          </div>
        </div>

        {/* Offline Warning Banner if runner toggled offline */}
        {!isOnline && (
          <div className="px-3.5 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 self-start md:self-auto">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Radar Offline. Nyalakan toggle status di pojok atas untuk mengambil order.</span>
          </div>
        )}
      </div>

      {/* Building Filter Pills (Antigravity Floating Switcher) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 glass-card-dark p-2 rounded-2xl border border-white/10 max-w-full">
        {['Semua', 'Gedung A', 'Benedictus', 'Gedung B', 'Perpustakaan', 'Farmasi'].map((zone) => (
          <button
            key={zone}
            onClick={() => setActiveFilter(zone)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${activeFilter === zone
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <span>{zone}</span>
            {zone === 'Semua' && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-slate-950 font-black">
                {orders.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stacked Floating Order Cards */}
      <div className="space-y-4">
        {filteredOrders.map((order, index) => (
          <div
            key={order.id}
            className="glass-card-dark rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl transition-all duration-300 antigravity-hover space-y-4 relative overflow-hidden group"
          >
            {/* Subtle glow orb inside card on hover */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all duration-500 pointer-events-none" />

            {/* Top Row: Order ID, Distance, Schedule, Fee */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-black text-white">{order.id}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  {order.distance}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                  {order.schedule}
                </span>
                {order.isHot && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    🔥 Siap Diambil
                  </span>
                )}
              </div>

              {/* Fee Badge */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400 block font-medium">Ongkir Bersih</span>
                  <span className="text-xl font-black text-emerald-400 tracking-tight">{order.fee}</span>
                </div>
              </div>
            </div>

            {/* Route Map Flow: Pickup Stan -> Target Ruang Kelas */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3 relative z-10">
              {/* Point A: Kantin */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <span className="text-xs">A</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                    Ambil di Kantin:
                  </span>
                  <p className="text-xs font-black text-white">{order.from}</p>
                  <p className="text-[11px] text-slate-400">{order.fromFloor}</p>
                </div>
              </div>

              {/* Dotted connecting line */}
              <div className="ml-3.5 border-l-2 border-dashed border-slate-700 h-3" />

              {/* Point B: Gedung Kuliah / Ruang Kelas */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <span className="text-xs">B</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                    Antar ke Ruang Kelas:
                  </span>
                  <p className="text-xs font-black text-emerald-300">{order.to}</p>
                  <p className="text-[11px] text-slate-400">{order.toDetail}</p>
                </div>
              </div>
            </div>

            {/* Order Items & Take Action Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 relative z-10">
              <div className="text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Menu: </span>
                <span>{order.items}</span>
              </div>

              <button
                disabled={!isOnline || takenJobId === order.id}
                onClick={() => handleTakeJob(order)}
                className={`py-3 px-6 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 self-stretch sm:self-auto ${!isOnline
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : takenJobId === order.id
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/40'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/30'
                  }`}
              >
                {takenJobId === order.id ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Order Diambil!</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Ambil Orderan (Rp 3.500)</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="glass-card-dark rounded-3xl p-10 text-center space-y-3 text-slate-400">
            <Compass className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-white">Tidak ada orderan di zona {activeFilter}</h4>
            <p className="text-xs text-slate-500">
              Semua orderan di zona ini telah diambil oleh rekan kurir mahasiswa lainnya.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
