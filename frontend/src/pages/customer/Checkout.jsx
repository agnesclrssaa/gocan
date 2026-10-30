import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  Store,
  QrCode,
  AlertCircle,
  Building2,
  Navigation,
  DoorOpen,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  CheckCircle2,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../lib/api';
import Navbar from '../../components/common/Navbar';

const CAMPUS_BUILDING_PRESETS = [
  'Gedung Benedictus (Rektorat & Pascasarjana)',
  'Gedung Agustinus (Fakultas Teknik & Vokasi)',
  'Gedung Fransiskus (Fakultas Bisnis)',
  'Gedung Perpustakaan Dinoyo',
];

const MEETING_POINT_PRESETS = [
  'Lobby Depan Lift Lt. 3',
  'Lobby Utama Lt. 1',
  'Area Dropzone Mobil',
  'Tangga Sayap Timur',
];

export const Checkout = () => {
  const { user } = useAuth();
  const { cartItems, currentCanteen, totalFoodPrice, totalItems, clearCart } = useCart();
  const navigate = useNavigate();

  const [isOrderSubmitted, setIsOrderSubmitted] = useState(false);
  const [orderType, setOrderType] = useState('delivery'); // 'delivery' | 'pickup'
  const [scheduleType, setScheduleType] = useState('scheduled'); // 'now' | 'scheduled'
  
  // Delivery details
  const [building, setBuilding] = useState('Gedung Benedictus (Rektorat & Pascasarjana)');
  const [meetingPoint, setMeetingPoint] = useState('Lobby Depan Lift Lt. 3');
  const [classInfo, setClassInfo] = useState('Ruang Kuliah 3.02');
  const [additionalNote, setAdditionalNote] = useState('Tolong kabari jika sudah sampai lobby lantai 3');

  // Pickup notes
  const [pickupNote, setPickupNote] = useState('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('gocan_pay'); // 'gocan_pay' | 'cash'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fee calculation matching mockup
  const deliveryFee = orderType === 'delivery' ? 3000 : 0;
  const platformFee = orderType === 'delivery' ? 1150 : 0;
  const grandTotal = totalFoodPrice + deliveryFee + platformFee;

  useEffect(() => {
    if (cartItems.length === 0 && !isOrderSubmitted) {
      navigate('/cart', { replace: true });
    }
  }, [cartItems.length, isOrderSubmitted, navigate]);

  if (cartItems.length === 0 && !isOrderSubmitted) {
    return (
      <div className="min-h-screen bg-[#F0F4F9] flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0A2E6E] border-t-transparent" />
          <span>Mengalihkan ke keranjang...</span>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();
    if (submitting) return;

    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    if (orderType === 'delivery') {
      if (!building.trim() || !meetingPoint.trim() || !classInfo.trim()) {
        setError('Mohon lengkapi Gedung, Ruangan/Kelas, dan Titik Temu.');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      const { order } = await api.post('/orders', {
        items: cartItems,
        totalPrice: grandTotal,
        canteenId: currentCanteen?.id || cartItems[0]?.canteen_id,
      });

      setIsOrderSubmitted(true);
      clearCart();
      navigate(`/order-success/${order.id}`, { replace: true });
    } catch (err) {
      console.error('Gagal memproses submit pesanan:', err);
      setError(
        err.message
          ? `Gagal membuat pesanan: ${err.message}`
          : 'Terjadi gangguan saat memproses pesanan. Keranjang Anda tetap tersimpan.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F9] text-slate-800 pb-20">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        {/* Error notification */}
        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 border border-red-200 text-red-700 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="font-bold text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg"
            >
              Tutup
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Options & Form */}
          <div className="lg:col-span-8 space-y-5">
            {/* 1. MODE PENGAMBILAN */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
              <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-4">
                MODE PENGAMBILAN
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setOrderType('delivery')}
                  className={`rounded-2xl p-4 text-center transition cursor-pointer ${
                    orderType === 'delivery'
                      ? 'bg-[#0A2E6E] text-white shadow-md'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-base">Delivery</p>
                  <p className={`text-xs mt-0.5 ${orderType === 'delivery' ? 'text-blue-100' : 'text-slate-500'}`}>
                    Diantar ke titik temu
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType('pickup')}
                  className={`rounded-2xl p-4 text-center transition cursor-pointer ${
                    orderType === 'pickup'
                      ? 'bg-[#0A2E6E] text-white shadow-md'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-base">Pickup</p>
                  <p className={`text-xs mt-0.5 ${orderType === 'pickup' ? 'text-blue-100' : 'text-slate-500'}`}>
                    Ambil sendiri
                  </p>
                </button>
              </div>
            </div>

            {/* 2. JADWAL PESANAN */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                JADWAL PESANAN
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setScheduleType('now')}
                  className={`rounded-2xl p-4 text-center transition cursor-pointer ${
                    scheduleType === 'now'
                      ? 'bg-[#0A2E6E] text-white shadow-md'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-sm">Pesan Sekarang</p>
                  <p className={`text-xs mt-0.5 ${scheduleType === 'now' ? 'text-blue-100' : 'text-slate-500'}`}>
                    Diproses langsung
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleType('scheduled')}
                  className={`rounded-2xl p-4 text-center transition cursor-pointer ${
                    scheduleType === 'scheduled'
                      ? 'bg-[#0A2E6E] text-white shadow-md'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-sm">Pesan Terjadwal</p>
                  <p className={`text-xs mt-0.5 ${scheduleType === 'scheduled' ? 'text-blue-100' : 'text-slate-500'}`}>
                    Pilih tanggal & waktu
                  </p>
                </button>
              </div>

              {scheduleType === 'scheduled' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <p className="text-xs text-slate-500">Tanggal Terjadwal</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">Kamis, 21 Februari 2024</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <p className="text-xs text-slate-500">Waktu Pengantaran</p>
                    <p className="text-sm font-bold text-[#0A2E6E] mt-1">12:15 WIB · Saat Istirahat</p>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-500">
                <span className="font-bold text-slate-700 uppercase tracking-wide block mb-1">
                  CATATAN SCHEDULED ORDER
                </span>
                Pesanan akan diproses mendekati waktu yang dipilih. Perubahan jadwal sebaiknya dilakukan sebelum pesanan dikonfirmasi.
              </div>
            </div>

            {/* 3. INFORMASI PENGIRIMAN */}
            {orderType === 'delivery' ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  INFORMASI PENGIRIMAN
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <label className="text-xs text-slate-500 block mb-1">Gedung Tujuan</label>
                    <input
                      type="text"
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                      className="w-full bg-transparent font-bold text-sm text-slate-800 outline-none"
                    />
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <label className="text-xs text-slate-500 block mb-1">Kelas / Ruangan</label>
                    <input
                      type="text"
                      value={classInfo}
                      onChange={(e) => setClassInfo(e.target.value)}
                      className="w-full bg-transparent font-bold text-sm text-slate-800 outline-none"
                    />
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <label className="text-xs text-slate-500 block mb-1">Titik Temu</label>
                    <input
                      type="text"
                      value={meetingPoint}
                      onChange={(e) => setMeetingPoint(e.target.value)}
                      className="w-full bg-transparent font-bold text-sm text-slate-800 outline-none"
                    />
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Status Jadwal</p>
                    <p className="text-sm font-bold text-[#0A2E6E]">Terjadwal · Kamis, 21 Feb 2024 · 12:15 WIB</p>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-xs text-slate-500 block mb-1">Catatan Tambahan untuk Runner</label>
                  <input
                    type="text"
                    value={additionalNote}
                    onChange={(e) => setAdditionalNote(e.target.value)}
                    placeholder="Contoh: Titipkan di meja lobby depan satpam jika belum keluar kelas..."
                    className="w-full bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-medium border border-slate-200 outline-none focus:border-[#0A2E6E]"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  INFORMASI PENGAMBILAN (PICKUP)
                </h2>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-500">Kantin Tujuan</p>
                  <p className="text-base font-bold text-slate-800 mt-1">{currentCanteen?.name || 'Kantin Pak Brazil'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Area Foodcourt Utama Kampus UKWMS Dinoyo</p>
                </div>
                <div>
                  <label htmlFor="pickup-note" className="text-xs text-slate-500 block mb-1">Catatan Pesanan untuk Kantin</label>
                  <input
                    id="pickup-note"
                    type="text"
                    value={pickupNote}
                    onChange={(e) => setPickupNote(e.target.value)}
                    placeholder="Contoh: Sambal dipisah ya bu..."
                    className="w-full bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-medium border border-slate-200 outline-none focus:border-[#0A2E6E]"
                  />
                </div>
              </div>
            )}

            {/* 4. VERIFIKASI PENGAMBILAN (PICKUP) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                VERIFIKASI PENGAMBILAN (PICKUP)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3.5 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-200 shrink-0">
                    <QrCode className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">E-ticket QR</p>
                    <p className="text-xs text-slate-500">Nomor antrean tampil setelah pembayaran</p>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200 shrink-0">
                    <CreditCard className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">QRIS Pengambilan</p>
                    <p className="text-xs text-slate-500">Scan QRIS khusus untuk verifikasi pickup</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-500">
                <span className="font-bold text-slate-700 uppercase tracking-wide block mb-1">
                  CATATAN PICKUP
                </span>
                {orderType === 'delivery'
                  ? 'Metode verifikasi hanya digunakan bila mode pengambilan diubah ke Pickup. Pilihan aktif saat ini tetap Delivery.'
                  : 'Tunjukkan E-ticket QR kepada kasir kantin saat mengambil pesanan Anda.'}
              </div>
            </div>

            {/* 5. METODE PEMBAYARAN */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                METODE PEMBAYARAN
              </h2>

              <div
                onClick={() => setPaymentMethod('gocan_pay')}
                className={`flex items-center justify-between p-4 rounded-2xl border transition cursor-pointer ${
                  paymentMethod === 'gocan_pay'
                    ? 'border-[#0A2E6E] ring-1 ring-[#0A2E6E] bg-white'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200">
                    <CreditCard className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Online – Gocan Pay / QRIS</p>
                    <p className="text-xs text-slate-500">Saldo: Rp 50.000</p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  paymentMethod === 'gocan_pay' ? 'text-[#0A2E6E]' : 'text-slate-300'
                }`}>
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              <div
                onClick={() => setPaymentMethod('cash')}
                className={`flex items-center justify-between p-4 rounded-2xl border transition cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'border-[#0A2E6E] ring-1 ring-[#0A2E6E] bg-white'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-200">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Tunai / COD</p>
                    <p className="text-xs text-slate-500">
                      {orderType === 'delivery' ? 'Bayar ke runner saat pesanan tiba' : 'Bayar langsung di kasir kantin'}
                    </p>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  paymentMethod === 'cash' ? 'text-[#0A2E6E]' : 'text-slate-300'
                }`}>
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Summary & CTA */}
          <div className="lg:col-span-4 space-y-5">
            {/* RINGKASAN PESANAN */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                RINGKASAN PESANAN
              </h2>

              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex justify-between items-center">
                  <span>Subtotal Makanan</span>
                  <span className="font-semibold text-slate-800">
                    Rp {totalFoodPrice.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Ongkir Flat Mahasiswa</span>
                  <span className="font-semibold text-slate-800">
                    {deliveryFee === 0 ? 'Rp 0' : `Rp ${deliveryFee.toLocaleString('id-ID')}`}
                  </span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between items-center">
                    <span>Komisi Delivery (Rp 3.500)</span>
                    <span className="font-semibold text-slate-800">
                      Rp {platformFee.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800">Total Pembayaran</span>
                  <span className="text-xl font-bold text-[#DC2626]">
                    Rp {grandTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* APABILA PILIH PICKUP */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
              <p className="text-[11px] font-bold text-[#DC2626] uppercase tracking-wide mb-3">
                APABILA PILIH PICKUP (AMBIL SENDIRI):
              </p>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center shrink-0">
                  <QrCode className="w-7 h-7 text-slate-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">No Antrean Ambil: #P-042</p>
                  <p className="text-xs text-slate-500 mt-0.5">Tunjukkan QR di kasir Kantin Brazil</p>
                </div>
              </div>
            </div>

            {/* CTA BUTTON: BOLD RED */}
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={submitting || !user}
              className={`w-full py-4 px-6 rounded-full font-bold text-base text-white shadow-md transition text-center cursor-pointer ${
                submitting || !user
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-[#DC2626] hover:bg-[#B91C1C] active:scale-98'
              }`}
            >
              {submitting ? 'Memproses Pesanan...' : 'Pesan & Bayar Sekarang'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
