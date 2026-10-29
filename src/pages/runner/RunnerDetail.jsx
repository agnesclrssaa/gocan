import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Phone,
  CheckCircle,
  Clock,
  MapPin,
  ChevronLeft,
  KeyRound,
  X,
  ExternalLink
} from 'lucide-react';

export default function RunnerDetail() {
  const navigate = useNavigate();
  // Step: 1 = Kurir Menerima, 2 = Sampai di Kantin, 3 = Serah Terima (Input PIN), 4 = Selesai
  const [currentStep, setCurrentStep] = useState(1);
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);

  const correctPin = '4821';

  const handleNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePinChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const nextPin = [...pinDigits];
      nextPin[index] = value;
      setPinDigits(nextPin);
      setPinError(false);

      if (value && index < 3) {
        const nextInput = document.getElementById(`pin-${index + 1}`);
        if (nextInput) nextInput.focus();
      }

      // Check PIN
      if (nextPin.every((d) => d !== '')) {
        const enteredPin = nextPin.join('');
        if (enteredPin === correctPin) {
          setOrderCompleted(true);
          setCurrentStep(4);
        } else {
          setPinError(true);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP BANNER (Matching gocan-delivery-detail-desktop.png) */}
      <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/runner-portal/orders"
              className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition"
              title="Kembali"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A2E6E] tracking-tight">
              PENGANTARAN SEDANG BERLANGSUNG
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Pantau detail order, lokasi pengambilan, informasi customer, dan aksi status kurir dalam satu tampilan desktop.
          </p>
        </div>

        <div className="flex items-center gap-4 self-start md:self-auto">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200/80 tracking-wide">
            {currentStep === 1 && 'KURIR MENERIMA'}
            {currentStep === 2 && 'TIBA DI KANTIN'}
            {currentStep === 3 && 'MENUJU RUANG KELAS'}
            {currentStep === 4 && 'PENGANTARAN SELESAI'}
          </span>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-medium">Estimasi tiba</span>
            <strong className="text-base font-extrabold text-slate-900">12:15 WIB</strong>
          </div>
        </div>
      </div>

      {orderCompleted && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-bold flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Pengantaran #Gocan-82419 berhasil diselesaikan! Ongkir Rp 3.500 telah masuk ke saldo dompet Anda.</span>
          </div>
          <Link
            to="/runner-portal"
            className="px-4 py-1.5 rounded-full bg-[#0A2E6E] text-white text-xs font-bold shrink-0 hover:bg-[#082252] transition"
          >
            Kembali ke Dompet
          </Link>
        </div>
      )}

      {/* 2. 3-COLUMN DESKTOP GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* KOLOM 1: DETAIL ORDER & STEPPER */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-[#0A2E6E]">Detail Order</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ringkasan pesanan dan status pengantaran saat ini.
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Nomor Order</span>
              <strong className="text-slate-900 font-bold">#Gocan-82419</strong>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Status</span>
              <strong className="text-[#0A2E6E] font-bold">
                {currentStep === 1 ? 'Kurir menerima' : currentStep === 2 ? 'Sampai di kantin' : currentStep === 3 ? 'Menuju pemesan' : 'Selesai'}
              </strong>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Estimasi Tiba</span>
              <strong className="text-slate-900 font-bold">12:15 WIB</strong>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">Tipe Pesanan</span>
              <strong className="text-slate-900 font-bold">Ayam Geprek</strong>
            </div>
          </div>

          {/* Stepper Proses Pengantaran */}
          <div className="pt-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-4">
              PROSES PENGANTARAN
            </span>

            <div className="space-y-5">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    currentStep >= 1
                      ? 'bg-[#0A2E6E] text-white shadow-xs'
                      : 'border border-slate-300 text-slate-400'
                  }`}
                >
                  1
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                    Kurir menerima pesanan
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Status aktif saat ini
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    currentStep >= 2
                      ? 'bg-[#0A2E6E] text-white shadow-xs'
                      : 'border border-slate-300 text-slate-400'
                  }`}
                >
                  2
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                    Sampai di kantin
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tandai setelah tiba di lokasi pengambilan
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    currentStep >= 3
                      ? 'bg-[#0A2E6E] text-white shadow-xs'
                      : 'border border-slate-300 text-slate-400'
                  }`}
                >
                  3
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                    Serahkan ke customer
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gunakan titik temu yang sudah ditentukan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM 2: LOKASI */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-[#0A2E6E]">Lokasi</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Titik pengambilan dan tujuan pengantaran.
            </p>
          </div>

          {/* Box Ambil Di Kantin */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              AMBIL DI KANTIN
            </span>
            <h3 className="text-sm font-extrabold text-[#0A2E6E] mt-1">
              Kantin Pak Brazil
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Gedung Benedictus, Lt. 1 • Ayam Geprek
            </p>
          </div>

          {/* Box Antar Ke Customer */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              ANTAR KE CUSTOMER
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 mt-1">
              Anastasya Widjaja
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Gedung Benedictus, Lt. 3 • Ruang Kuliah 3.02
            </p>
            <p className="text-xs font-semibold text-[#DC2626] italic mt-1.5">
              Catatan Titik Temu: Lobby Depan Lift Lt. 3
            </p>
          </div>

          {/* Box Catatan Lokasi */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              CATATAN LOKASI
            </span>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Titik temu ditentukan di lobby depan lift lantai 3 untuk memudahkan proses serah terima.
            </p>
          </div>
        </div>

        {/* KOLOM 3: CUSTOMER & AKSI STATUS */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-extrabold text-[#0A2E6E]">Customer & Aksi Status</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Informasi penerima dan tombol aksi kurir.
            </p>
          </div>

          {/* Customer info card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              CUSTOMER
            </span>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">
              Anastasya Widjaja
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Gedung Benedictus, Lt. 3 • Ruang Kuliah 3.02
            </p>
            <p className="text-xs font-semibold text-[#DC2626] italic mt-1.5">
              Catatan Titik Temu: Lobby Depan Lift Lt. 3
            </p>
          </div>

          {/* Aksi Status */}
          <div className="space-y-3 pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              AKSI STATUS
            </span>

            {/* Hubungi Customer Button */}
            <button
              type="button"
              onClick={() => setShowCallModal(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition shadow-2xs"
            >
              <Phone className="w-4 h-4 text-[#0A2E6E]" />
              <span>Hubungi Customer</span>
            </button>

            {/* Action Box with Red Button */}
            <div className="pt-2">
              <p className="text-xs text-slate-500 text-center mb-3">
                {currentStep === 1 && 'Geser tombol jika Anda sudah sampai di kantin'}
                {currentStep === 2 && 'Klik setelah menerima makanan dari staf stan'}
                {currentStep === 3 && 'Minta 4-digit PIN dari mahasiswa penerima'}
                {currentStep === 4 && 'Pesanan selesai diserahkan!'}
              </p>

              {currentStep < 3 && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full py-3.5 px-6 rounded-full bg-[#DC2626] hover:bg-[#B91C1C] text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase transition shadow-md cursor-pointer text-center block"
                >
                  {currentStep === 1 ? 'SAYA SUDAH DI KANTIN' : 'AMBIL MAKANAN DARI STAN'}
                </button>
              )}

              {/* Step 3: PIN Input */}
              {currentStep === 3 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="text-center">
                    <span className="text-xs font-bold text-slate-800">
                      Masukkan PIN Pemesan (Hint: 4821)
                    </span>
                  </div>

                  <div className="flex justify-center gap-2">
                    {pinDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`pin-${idx}`}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handlePinChange(idx, e.target.value)}
                        className="w-11 h-12 text-center text-lg font-black bg-white border border-slate-300 rounded-xl focus:border-[#0A2E6E] focus:ring-1 focus:ring-[#0A2E6E] focus:outline-hidden"
                      />
                    ))}
                  </div>

                  {pinError && (
                    <p className="text-[11px] text-[#DC2626] font-bold text-center">
                      PIN salah! Mintalah 4-digit PIN kepada Anastasya.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CALL MODAL */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-200 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowCallModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-900">Hubungi Anastasya Widjaja</h3>
            <p className="text-xs text-slate-500 mt-1">Nomor WhatsApp & Telepon Terdaftar:</p>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <span className="font-mono font-bold text-[#0A2E6E] text-sm">+62 812-3456-7890</span>
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
              >
                Chat WA
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
