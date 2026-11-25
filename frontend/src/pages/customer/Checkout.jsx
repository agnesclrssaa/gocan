import {
  readDeliveryLocation,
  saveDeliveryLocation,
  subscribeDeliveryLocation,
} from '../../lib/deliveryLocation';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useCampus } from '../../context/CampusContext';
import { api } from '../../lib/api';
import Navbar from '../../components/common/Navbar';
import PromoCodeForm from '../../components/customer/PromoCodeForm';

const getDestinationFloor = (location) => {
  const floorMatch = location.match(/(?:lantai|lt\.?)\s*(\d+)/i);
  return floorMatch ? Number(floorMatch[1]) : 1;
};

export const Checkout = () => {
  const { user } = useAuth();
  const {
    cartItems,
    currentCanteen,
    cartCampusId,
    cartHasMixedCampuses,
    totalFoodPrice,
    clearCart,
    appliedPromo,
  } = useCart();
  const { selectedCampus } = useCampus();
  const navigate = useNavigate();

  const [isOrderSubmitted, setIsOrderSubmitted] = useState(false);
  const orderRequestRef = useRef(false);
  const [orderType, setOrderType] = useState('delivery'); // 'delivery' | 'pickup'
 const [scheduleType, setScheduleType] = useState('now');
const [scheduledDateTime, setScheduledDateTime] = useState('');
  
  // Delivery details
  const [savedLocation, setSavedLocation] = useState(
  readDeliveryLocation
);

const [building, setBuilding] = useState(savedLocation.building);
const [meetingPoint, setMeetingPoint] = useState(
  savedLocation.meetingPoint
);
const [classInfo, setClassInfo] = useState(savedLocation.classInfo);
const [additionalNote, setAdditionalNote] = useState(
  savedLocation.additionalNote
);

  // Pickup notes
  const [pickupNote, setPickupNote] = useState('');

  // Payment
const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
  return subscribeDeliveryLocation((location) => {
    setSavedLocation(location);
    setBuilding(location.building);
    setMeetingPoint(location.meetingPoint);
    setClassInfo(location.classInfo);
    setAdditionalNote(location.additionalNote);
  });
}, []);

const locationIsSaved =
  Boolean(building.trim()) &&
  building.trim() === savedLocation.building &&
  meetingPoint.trim() === savedLocation.meetingPoint &&
  classInfo.trim() === savedLocation.classInfo &&
  additionalNote.trim() === savedLocation.additionalNote;

const handleSaveDeliveryLocation = () => {
  const fields = [building, meetingPoint, classInfo, additionalNote];

  if (fields.some((value) => value.trim().length > 500)) {
    setError('Setiap kolom lokasi dan catatan maksimal 500 karakter.');
    return;
  }

  try {
    saveDeliveryLocation({
      building,
      meetingPoint,
      classInfo,
      additionalNote,
    });

    setError(null);
  } catch (saveError) {
    setError(
      saveError.message || 'Lokasi belum berhasil disimpan.'
    );
  }
};

  const destinationFloor = getDestinationFloor(meetingPoint);
  const deliveryFee = orderType === 'delivery'
    ? 3000 + (Math.max(0, destinationFloor - 1) * 1000)
    : 0;
const serviceFee = 1000;

const deliveryDiscount =
  orderType === 'delivery' && totalFoodPrice >= 25000
    ? Math.min(1000, deliveryFee)
    : 0;

const promoMatchesCart = Boolean(
  appliedPromo &&
  appliedPromo.validatedSubtotal === totalFoodPrice &&
  appliedPromo.validatedCampusId === cartCampusId
);
const promoNeedsRevalidation = Boolean(appliedPromo && !promoMatchesCart);
const promoDiscount = promoMatchesCart ? Number(appliedPromo.discountAmount) || 0 : 0;
const totalAmount =
  totalFoodPrice + deliveryFee - deliveryDiscount + serviceFee - promoDiscount;
const campusMatchesCart = Boolean(
  selectedCampus &&
  cartCampusId &&
  !cartHasMixedCampuses &&
  cartCampusId === selectedCampus.campusId
);

  useEffect(() => {
    if (cartItems.length === 0 && !isOrderSubmitted) {
      navigate('/cart', { replace: true });
    }
  }, [cartItems.length, isOrderSubmitted, navigate]);

  if (cartItems.length === 0 && !isOrderSubmitted) {
    return ( 
      <div className="min-h-screen bg-[#F0F4F9] flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2152B7] border-t-transparent" />
          <span>Mengalihkan ke keranjang...</span>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();
    if (
  submitting ||
  orderRequestRef.current ||
  isOrderSubmitted
) return;

    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    if (!campusMatchesCart) {
      setError('Kampus keranjang tidak sesuai dengan kampus aktif. Pastikan semua item berasal dari kampus yang dipilih sebelum membayar.');
      return;
    }

    if (orderType === 'delivery') {
      if (!building.trim() || !meetingPoint.trim() || !classInfo.trim()) {
        setError('Mohon lengkapi Gedung, Ruangan/Kelas, dan Titik Temu.');
        return;
      }
    }

    let scheduledTime = null;

if (scheduleType === 'scheduled') {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(scheduledDateTime)
  ) {
    setError('Pilih tanggal dan waktu pesanan terlebih dahulu.');
    return;
  }

  // Nilai input selalu ditafsirkan sebagai WIB.
  const selectedDate = new Date(
    `${scheduledDateTime}:00+07:00`
  );

  if (
    !Number.isFinite(selectedDate.getTime()) ||
    selectedDate.getTime() < Date.now() + 30 * 60 * 1000
  ) {
    setError('Jadwal pesanan minimal 30 menit dari sekarang.');
    return;
  }

  const [hour, minute] = scheduledDateTime
    .slice(11)
    .split(':')
    .map(Number);

  if (
    hour < 7 ||
    hour > 17 ||
    (hour === 17 && minute > 0)
  ) {
    setError(
      'Pilih waktu antara pukul 07.00 sampai 17.00 WIB.'
    );
    return;
  }

  scheduledTime = selectedDate.toISOString();
}

    try {
  orderRequestRef.current = true;
  setSubmitting(true);
      setError(null);

      const { order } = await api.post('/orders', {
        campusId: selectedCampus.campusId,
        items: cartItems.map(({ campusId: _campusId, ...item }) => item),
        totalPrice: totalAmount,
        canteenId: currentCanteen?.id || cartItems[0]?.canteen_id,
        orderType:
  scheduleType === 'scheduled' ? 'SCHEDULED' : 'IMMEDIATE',
scheduledTime,
        fulfillmentType: orderType,
        paymentMethod: {
  cash: 'CASH',
  gocan_pay: 'QRIS',
  debit: 'DEBIT',
}[paymentMethod],
        promoCode: promoMatchesCart ? appliedPromo.code : undefined,
        buildingName: orderType === 'delivery' ? building.trim() : null,
        destinationFloor: orderType === 'delivery' ? destinationFloor : null,
        meetingPoint: orderType === 'delivery' ? meetingPoint.trim() : null,
        classInfo: orderType === 'delivery' ? classInfo.trim() : null,
        deliveryNote: orderType === 'delivery' ? additionalNote.trim() : pickupNote.trim(),
      });

    const confirmedOrderId = Number(order?.id);

if (
  !Number.isSafeInteger(confirmedOrderId) ||
  confirmedOrderId <= 0
) {
  setError(
    'Server belum mengembalikan nomor pesanan yang valid. Keranjang belum dikosongkan. Periksa Pesanan Saya sebelum mencoba lagi untuk menghindari pesanan ganda.'
  );
  return;
}

setIsOrderSubmitted(true);
clearCart();

navigate(`/order-success/${confirmedOrderId}`, {
  replace: true,
});
    } catch (err) {
      console.error('Gagal memproses submit pesanan:', err);
      setError(
        err.message
          ? `Gagal membuat pesanan: ${err.message}`
          : 'Terjadi gangguan saat memproses pesanan. Keranjang Anda tetap tersimpan.'
      );
    } finally {
  orderRequestRef.current = false;
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
        {!campusMatchesCart && (
          <div role="alert" className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Kampus keranjang tidak sesuai dengan kampus aktif. Gunakan tombol Ganti Kampus di navbar untuk memilih kampus yang sesuai.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Options & Form */}
          <div className="lg:col-span-8 space-y-5">
            {/* 1. MODE PENGAMBILAN */}
            <div className="customer-card bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
              <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-4">
                MODE PENGAMBILAN
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setOrderType('delivery')}
                  className={`customer-card rounded-2xl p-4 text-center transition cursor-pointer ${
                    orderType === 'delivery'
                      ? 'bg-[#2152B7] text-white shadow-md'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-base">Delivery</p>
                  <p className={`text-xs mt-0.5 ${orderType === 'delivery' ? 'text-white/90' : 'text-slate-500'}`}>
                    Diantar ke titik temu
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderType('pickup')}
                  className={`customer-card rounded-2xl p-4 text-center transition cursor-pointer ${
                    orderType === 'pickup'
                      ? 'bg-[#2152B7] text-white shadow-md'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-base">Pickup</p>
                  <p className={`text-xs mt-0.5 ${orderType === 'pickup' ? 'text-white/90' : 'text-slate-500'}`}>
                    Ambil sendiri
                  </p>
                </button>
              </div>
            </div>

            {/* 2. JADWAL PESANAN */}
            <div className="customer-card bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                JADWAL PESANAN
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setScheduleType('now')}
                  className={`customer-card rounded-2xl p-4 text-center transition cursor-pointer ${
                    scheduleType === 'now'
                      ? 'bg-[#2152B7] text-white shadow-md'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-sm">Pesan Sekarang</p>
                  <p className={`text-xs mt-0.5 ${scheduleType === 'now' ? 'text-white/90' : 'text-slate-500'}`}>
                    Diproses langsung
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleType('scheduled')}
                  className={`customer-card rounded-2xl p-4 text-center transition cursor-pointer ${
                    scheduleType === 'scheduled'
                      ? 'bg-[#2152B7] text-white shadow-md'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <p className="font-bold text-sm">Pesan Terjadwal</p>
                  <p className={`text-xs mt-0.5 ${scheduleType === 'scheduled' ? 'text-white/90' : 'text-slate-500'}`}>
                    Pilih tanggal & waktu
                  </p>
                </button>
              </div>

              {scheduleType === 'scheduled' && (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <label
      htmlFor="scheduled-order-time"
      className="block text-sm font-bold text-slate-700"
    >
      Tanggal dan waktu mulai penyiapan (WIB)
    </label>

    <input
      id="scheduled-order-time"
      type="datetime-local"
      step={60}
      value={scheduledDateTime}
      onChange={(event) => {
        setScheduledDateTime(event.target.value);
        setError(null);
      }}
      disabled={submitting}
      className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#2152B7] focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
    />

    <p className="mt-2 text-xs leading-relaxed text-slate-500">
      Minimal 30 menit dari sekarang, antara pukul
      07.00–17.00 WIB. Waktu ini adalah jadwal mulai
      penyiapan, bukan jaminan waktu pesanan tiba.
    </p>
  </div>
)}

              <div className="customer-card bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-500">
                <span className="font-bold text-slate-700 uppercase tracking-wide block mb-1">
                  CATATAN SCHEDULED ORDER
                </span>
                Pilihan jadwal dikirim bersama pesanan. Kantin dan runner tetap perlu menyesuaikan proses penyiapan serta pengantaran dengan jadwal tersebut.
              </div>
            </div>

            {/* 3. INFORMASI PENGIRIMAN */}
            {orderType === 'delivery' ? (
              <div className="customer-card bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  INFORMASI PENGIRIMAN
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="customer-card bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <label className="text-xs text-slate-500 block mb-1">Gedung Tujuan</label>
                    <input
                      type="text"
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                      className="w-full bg-transparent font-bold text-sm text-slate-800 outline-none"
                    />
                  </div>

                  <div className="customer-card bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <label className="text-xs text-slate-500 block mb-1">Kelas / Ruangan</label>
                    <input
                      type="text"
                      value={classInfo}
                      onChange={(e) => setClassInfo(e.target.value)}
                      className="w-full bg-transparent font-bold text-sm text-slate-800 outline-none"
                    />
                  </div>

                  <div className="customer-card bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <label className="text-xs text-slate-500 block mb-1">Titik Temu</label>
                    <input
                      type="text"
                      value={meetingPoint}
                      onChange={(e) => setMeetingPoint(e.target.value)}
                      className="w-full bg-transparent font-bold text-sm text-slate-800 outline-none"
                    />
                  </div>

                  <div className="customer-card bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Status Jadwal</p>
                    <p className="mt-1 text-sm font-bold text-[#2152B7]">
  {scheduleType === 'scheduled'
    ? scheduledDateTime
      ? `${scheduledDateTime.slice(8, 10)}/${scheduledDateTime.slice(5, 7)}/${scheduledDateTime.slice(0, 4)} - ${scheduledDateTime.slice(11, 16)} WIB`
      : 'Tanggal dan waktu belum dipilih'
    : 'Pesan sekarang'}
</p>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-xs text-slate-500 block mb-1">Catatan Tambahan untuk Runner</label>
                  <input
                    type="text"
                    value={additionalNote}
                    onChange={(e) => setAdditionalNote(e.target.value)}
                    placeholder="Contoh: Titipkan di meja lobby depan satpam jika belum keluar kelas..."
                    className="w-full bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-medium border border-slate-200 outline-none focus:border-[#2152B7]"
                  />
                </div>
                <div className="space-y-2 border-t border-slate-100 pt-4">
  <button
    type="button"
    onClick={handleSaveDeliveryLocation}
    disabled={submitting}
    className="rounded-full border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-bold text-[#2152B7] hover:bg-blue-100 disabled:opacity-50"
  >
    Simpan lokasi pengantaran
  </button>

  <p
    role="status"
    className={`text-xs ${
      locationIsSaved ? 'text-emerald-700' : 'text-slate-500'
    }`}
  >
    {locationIsSaved
      ? 'Lokasi tersimpan di browser ini dan tersambung dengan navbar.'
      : 'Ada perubahan lokasi yang belum disimpan untuk kunjungan berikutnya.'}
  </p>
</div>
              </div>
            ) : (
              <div className="customer-card bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  INFORMASI PENGAMBILAN (PICKUP)
                </h2>
                <div className="customer-card bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-500">Kantin Tujuan</p>
                  <p className="text-base font-bold text-slate-800 mt-1">{currentCanteen?.name || 'Kantin sesuai keranjang'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{currentCanteen?.location || 'Lokasi dapat dilihat pada detail kantin.'}</p>
                </div>
                <div>
                  <label htmlFor="pickup-note" className="text-xs text-slate-500 block mb-1">Catatan Pesanan untuk Kantin</label>
                  <input
                    id="pickup-note"
                    type="text"
                    value={pickupNote}
                    onChange={(e) => setPickupNote(e.target.value)}
                    placeholder="Contoh: Sambal dipisah ya bu..."
                    className="w-full bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-medium border border-slate-200 outline-none focus:border-[#2152B7]"
                  />
                </div>
              </div>
            )}

            {/* 4. INFORMASI VERIFIKASI PICKUP */}
{orderType === 'pickup' && (
  <section className="customer-card space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
      PENGAMBILAN DENGAN E-TICKET
    </h2>

    <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
      <QrCode
        aria-hidden="true"
        className="mt-0.5 h-6 w-6 shrink-0 text-[#2152B7]"
      />

      <div>
        <p className="text-sm font-bold text-[#2152B7]">
          Tiket tersedia setelah pesanan berhasil dibuat
        </p>

        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          Buka E-ticket melalui halaman detail pesanan. QR
          pengambilan akan ditampilkan sesuai status pesanan
          dan pembayaran.
        </p>
      </div>
    </div>

    <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600">
      <li>Konfirmasi pesanan dan buka E-ticket.</li>
      <li>Tunggu sampai status pesanan siap diambil.</li>
      <li>
        Datang ke kantin dan lakukan pembayaran jika memilih tunai.
      </li>
      <li>
        Tunjukkan QR E-ticket kepada petugas untuk diverifikasi
        sebelum pesanan diserahkan.
      </li>
    </ol>

    <p className="text-xs leading-relaxed text-slate-500">
      QR pengambilan digunakan untuk verifikasi pesanan.
      QR tersebut berbeda dari QRIS untuk pembayaran.
    </p>
  </section>
)}

            {/* 5. METODE PEMBAYARAN */}
<div className="customer-card space-y-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
  <fieldset disabled={submitting} className="space-y-3">
    <legend className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
      METODE PEMBAYARAN
    </legend>

    {[
      {
        value: 'cash',
        title: 'Tunai',
        description:
          orderType === 'delivery'
            ? 'Bayar kepada Campus Runner saat pesanan diterima.'
            : 'Bayar di kasir kantin saat mengambil pesanan.',
        Icon: Banknote,
        available: true,
      },
      {
  value: 'gocan_pay',
  title: 'QRIS — Simulasi',
  description:
    'Menampilkan QR demo. Tidak dapat digunakan untuk pembayaran asli. Konfirmasi dilakukan admin.',
  Icon: QrCode,
  available: true,
},
     {
  value: 'debit',
  title: 'Kartu debit — Simulasi',
  description:
    'Demo pembayaran debit tanpa memasukkan data kartu dan tanpa pemotongan saldo. Konfirmasi dilakukan admin.',
  Icon: CreditCard,
  available: true,
},
    ].map(({ value, title, description, Icon, available }) => (
      <label
        key={value}
        className={`flex items-start gap-3 rounded-2xl border p-4 transition ${
          !available
            ? 'cursor-not-allowed border-slate-200 bg-slate-50'
            : paymentMethod === value
              ? 'cursor-pointer border-[#2152B7] bg-blue-50 ring-1 ring-[#2152B7]'
              : 'cursor-pointer border-slate-200 bg-white hover:bg-slate-50'
        }`}
      >
        <input
          type="radio"
          name="paymentMethod"
          value={value}
          checked={paymentMethod === value}
          disabled={!available}
          onChange={() => {
            setPaymentMethod(value);
            setError(null);
          }}
          className="mt-1 h-4 w-4 shrink-0 accent-[#2152B7]"
        />

        <Icon
          aria-hidden="true"
          className={`mt-0.5 h-5 w-5 shrink-0 ${
            available ? 'text-[#2152B7]' : 'text-slate-400'
          }`}
        />

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-slate-800">
              {title}
            </span>

            {!available && (
              <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600">
                Belum tersedia
              </span>
            )}
          </span>

          <span className="mt-1 block text-xs leading-relaxed text-slate-500">
            {description}
          </span>
        </span>
      </label>
    ))}
  </fieldset>

  <p className="rounded-xl bg-blue-50 p-3 text-xs leading-relaxed text-blue-800">
  {paymentMethod === 'cash'
    ? 'Pembayaran tunai dilakukan saat pesanan diterima atau diambil. Konfirmasi pesanan belum berarti pembayaran lunas.'
    : 'MODE SIMULASI: tidak ada pembayaran asli atau pemotongan saldo. Pesanan akan menunggu konfirmasi simulasi dari admin. Jangan memasukkan nomor kartu, PIN, atau CVV.'}
</p>
</div>
          </div>

          {/* Right Column (4 cols): Summary & CTA */}
          <div className="lg:col-span-4 space-y-5">
            {/* RINGKASAN PESANAN */}
            <div className="customer-card bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                RINGKASAN PESANAN
              </h2>

              <div className="space-y-3 text-sm text-slate-600">
                <div className="rounded-xl border border-[#2152B7]/15 bg-[#fbf7f1] p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#2152B7]">Kampus</p>
                  <p className="mt-1 font-bold text-slate-800">{selectedCampus?.name || 'Belum dipilih'}</p>
                  {selectedCampus?.city && <p className="mt-0.5 text-xs text-slate-500">{selectedCampus.city}</p>}
                </div>
                <PromoCodeForm subtotal={totalFoodPrice} campusId={cartCampusId} />
                <div className="flex justify-between items-center">
                  <span>Subtotal Makanan</span>
                  <span className="gocan-price font-semibold">
                    Rp {totalFoodPrice.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Biaya Pengantaran</span>
                  <span className="gocan-price font-semibold">
                    {deliveryFee === 0 ? 'Rp 0' : `Rp ${deliveryFee.toLocaleString('id-ID')}`}
                  </span>
                </div>
                {deliveryDiscount > 0 && (
  <div className="flex items-center justify-between gap-3 text-emerald-700">
    <span>Potongan Ongkir</span>

    <span className="gocan-price font-semibold">
      − Rp {deliveryDiscount.toLocaleString('id-ID')}
    </span>
  </div>
)}
                {promoDiscount > 0 && (
                  <div className="flex items-center justify-between gap-3 text-emerald-700">
                    <span>Diskon Promo{appliedPromo?.code ? ` (${appliedPromo.code})` : ''}</span>
                    <span className="gocan-price font-semibold">
                      − Rp {promoDiscount.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Biaya Layanan Aplikasi</span>
                  <span className="gocan-price font-semibold">
                    Rp {serviceFee.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800">Total Pembayaran</span>
                  <span className="gocan-price text-xl font-bold">
                    Rp {totalAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>


            {/* CTA BUTTON: BOLD RED */}
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={submitting || !user || !campusMatchesCart || promoNeedsRevalidation}
              className={`w-full py-4 px-6 rounded-full font-bold text-base text-white shadow-md transition text-center cursor-pointer ${
                submitting || !user || !campusMatchesCart || promoNeedsRevalidation
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-[#DC2626] hover:bg-[#B91C1C] active:scale-98'
              }`}
            >
              {submitting
                ? 'Memproses Pesanan...'
                : promoNeedsRevalidation
                  ? 'Memeriksa Promo...'
                  : 'Konfirmasi Pesanan'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
