import { useState } from 'react';
import {
  Download,
  Filter,
  CheckCircle2,
  Star,
  FileText,
  X,
  ChevronDown
} from 'lucide-react';

export default function AdminFinance() {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  // Chart data for 6 months (values in millions)
  const chartData = [
    { month: 'Jan', canteenH: '48%', courierH: '28%' },
    { month: 'Feb', canteenH: '60%', courierH: '35%' },
    { month: 'Mar', canteenH: '68%', courierH: '42%' },
    { month: 'Apr', canteenH: '76%', courierH: '48%' },
    { month: 'Mei', canteenH: '85%', courierH: '55%' },
    { month: 'Jun', canteenH: '90%', courierH: '62%' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Keuangan & Laporan
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Dashboard desktop untuk memantau ringkasan keuangan, grafik performa, promo aktif, moderasi review, dan laporan transaksi seluruh kampus.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition shadow-xs">
            <span>Filter</span>
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-[#0A2E6E] hover:bg-[#082457] text-white rounded-xl shadow-xs transition"
          >
            <span>Unduh Laporan</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Column & Right Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Ringkasan Keuangan */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Ringkasan Keuangan
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rangkuman keuangan kampus untuk periode bulan ini.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600">
                Update 09.41
              </span>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                <span className="text-xs font-medium text-slate-500 block mb-1">
                  Komisi Platform (5%)
                </span>
                <div className="text-xl font-black text-[#0A2E6E] tracking-tight">
                  Rp 1.450.000
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Potongan otomatis dari total transaksi aktif
                </p>
              </div>

              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                <span className="text-xs font-medium text-slate-500 block mb-1">
                  Pendapatan Kantin
                </span>
                <div className="text-xl font-black text-slate-900 tracking-tight">
                  Rp 27.550.000
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Realisasi penjualan dari seluruh outlet kantin
                </p>
              </div>

              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                <span className="text-xs font-medium text-slate-500 block mb-1">
                  Fee Kurir
                </span>
                <div className="text-xl font-black text-slate-900 tracking-tight">
                  Rp 4.200.000
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Total pencairan biaya pengiriman bulan ini
                </p>
              </div>
            </div>

            {/* Total Transaksi Banner in Deep Navy */}
            <div className="bg-[#0A2E6E] text-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div>
                <span className="text-sm font-bold block">Total Transaksi QRIS / Cash</span>
                <p className="text-xs text-blue-200 mt-0.5">
                  Agregat pembayaran yang berhasil diproses hari ini
                </p>
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Rp 33.200.000
              </div>
            </div>
          </div>

          {/* Card: Grafik Pendapatan 6 Bulan Terakhir */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Grafik Pendapatan 6 Bulan Terakhir
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Perbandingan pendapatan kantin dan fee kurir selama enam bulan terakhir.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0A2E6E]" />
                  <span className="text-slate-600">Pendapatan Kantin</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                  <span className="text-slate-600">Fee Kurir</span>
                </div>
              </div>
            </div>

            {/* Side-by-side Bar Chart */}
            <div className="relative pt-6 pb-2">
              <div className="flex items-end justify-between h-56 px-4 sm:px-8 border-b border-slate-100">
                {chartData.map((data, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 group flex-1 max-w-[80px]">
                    <div className="flex items-end gap-1.5 h-44 w-full justify-center">
                      {/* Navy Bar (Canteen) */}
                      <div
                        className="w-4 sm:w-6 bg-[#0A2E6E] rounded-t-md transition-all duration-300 group-hover:bg-[#1D4ED8]"
                        style={{ height: data.canteenH }}
                        title="Pendapatan Kantin"
                      />
                      {/* Red Bar (Courier) */}
                      <div
                        className="w-4 sm:w-6 bg-[#DC2626] rounded-t-md transition-all duration-300 group-hover:bg-[#EF4444]"
                        style={{ height: data.courierH }}
                        title="Fee Kurir"
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 mt-2">{data.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* Card: Promo Aktif */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Promo Aktif</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                1 Banner Aktif
              </span>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">PROMO UTS - Diskon 35%</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-600">
                  Nonaktif
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Kode: LAPERUTS • Berakhir: 5 Hari Lagi
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Banner promo ini masih tersedia untuk diaktifkan kembali ketika kampanye UTS dibuka.
              </p>
            </div>
          </div>

          {/* Card: Moderasi Review Terbaru */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Moderasi Review Terbaru</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0A2E6E] border border-blue-200">
                12 Perlu Ditinjau
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Anastasya W. @ Pak Brazil</span>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {'★'.repeat(5)}
                    <span className="text-[10px] text-slate-400 ml-1">(5/5)</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 italic">
                  "Makanannya sampai cepet banget sebelum jam kelas selesai. Makasih kurir!"
                </p>
              </div>

              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Dimas R. @ Warung Sari</span>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {'★'.repeat(4)}
                    <span className="text-[10px] text-slate-400 ml-1">(4/5)</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 italic">
                  "Porsinya pas, cuma sedikit telat karena hujan. Secara umum tetap puas."
                </p>
              </div>
            </div>
          </div>

          {/* Card: Laporan */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight">Laporan</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Ringkasan laporan terbaru untuk diunduh dan dipantau.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0A2E6E] border border-blue-200">
                12 Laporan
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Laporan Penjualan Harian</span>
                    <span className="text-[10px] text-slate-400">09.41</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Export transaksi harian untuk seluruh kantin dan pembayaran QRIS / cash.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-[#0A2E6E]">
                      Siap Unduh
                    </span>
                    <span className="text-[10px] text-slate-400">248 Transaksi</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Laporan Komisi Platform</span>
                    <span className="text-[10px] text-slate-400">08.30</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Rekap komisi 5% dan distribusi fee kurir untuk periode mingguan.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700">
                      Diproses
                    </span>
                    <span className="text-[10px] text-slate-400">48 Outlet</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Audit Review & Moderasi</span>
                    <span className="text-[10px] text-slate-400">Kemarin</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Ringkasan review yang perlu ditinjau ulang beserta rating terbaru dari mahasiswa.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-[#0A2E6E]">
                      12 Perlu Tinjau
                    </span>
                    <span className="text-[10px] text-slate-400">4.8 Rata-rata</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Unduh Laporan */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Unduh Laporan Keuangan</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Format Berkas:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportFormat('csv')}
                    className={`p-3 rounded-xl border text-center font-bold transition ${
                      exportFormat === 'csv'
                        ? 'border-[#0A2E6E] bg-blue-50 text-[#0A2E6E]'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    CSV / Excel (.xlsx)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat('pdf')}
                    className={`p-3 rounded-xl border text-center font-bold transition ${
                      exportFormat === 'pdf'
                        ? 'border-[#0A2E6E] bg-blue-50 text-[#0A2E6E]'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    PDF Document (.pdf)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  alert(`Laporan berhasil diunduh dalam format ${exportFormat.toUpperCase()}!`);
                  setShowExportModal(false);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0A2E6E] hover:bg-[#082457] text-white shadow-xs"
              >
                Unduh Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
