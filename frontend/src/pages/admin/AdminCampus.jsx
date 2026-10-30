import { useState } from 'react';
import {
  Building2,
  FileText,
  CheckCircle2,
  Search,
  Download,
  Eye,
  CheckSquare,
  X,
  FileCheck,
  ChevronDown
} from 'lucide-react';

export default function AdminCampus() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Semua');
  const [selectedCampusId, setSelectedCampusId] = useState('WM-DINOYO');
  const [showMouModal, setShowMouModal] = useState(false);

  const campuses = [
    {
      id: 'WM-DINOYO',
      name: 'Widya Mandala Dinoyo',
      tag: '12 Kantin WM Dinoyo',
      status: 'Aktif',
      pic: 'Dr. Ir. Yohanes (WR II)',
      domain: '@widyamandala.ac.id',
      adminAccess: 'Admin Univ, Keuangan',
      mouFile: 'MoU_WM_Dinoyo_2025_signed.pdf',
      canteens: 12
    },
    {
      id: 'WM-KALIJUDAN',
      name: 'UKWMS Kampus Kalijudan',
      tag: '8 Kantin',
      status: 'Aktif',
      pic: 'Tim Operasional Kampus',
      domain: '@ukwms.ac.id',
      adminAccess: 'Admin Kampus',
      mouFile: 'MoU_WM_Kalijudan_2025_signed.pdf',
      canteens: 8
    },
    {
      id: 'WM-PAKUWON',
      name: 'UKWMS Kampus Pakuw...',
      tag: '6 Kantin',
      status: 'Aktif',
      pic: 'Tim Operasional Kampus',
      domain: '@ukwms.ac.id',
      adminAccess: 'Admin Kampus',
      mouFile: 'MoU_WM_Pakuwon_2025_signed.pdf',
      canteens: 6
    }
  ];

  const selectedCampus = campuses.find((c) => c.id === selectedCampusId) || campuses[0];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Manajemen Kampus WM Dinoyo
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Kelola kampus Widya Mandala Dinoyo dan kantin yang terdaftar dalam platform Gocan
        </p>
      </div>

      {/* Top 2 Metric Cards matching mockup */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <span className="text-xs font-bold text-[#0A2E6E] block mb-1">1 Kampus WM Dinoyo</span>
          <div className="text-3xl font-black text-slate-900 tracking-tight">1</div>
          <p className="text-[11px] text-slate-400 mt-2">
            Kampus Widya Mandala Dinoyo yang terdaftar dalam platform Gocan
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <span className="text-xs font-bold text-[#0A2E6E] block mb-1">12 Kantin WM Dinoyo</span>
          <div className="text-3xl font-black text-slate-900 tracking-tight">12</div>
          <p className="text-[11px] text-slate-400 mt-2">
            Kantin aktif yang terhubung pada kampus Widya Mandala Dinoyo
          </p>
        </div>
      </div>

      {/* Main Grid: Left Table & Right Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Table Panel (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Daftar Kampus WM Dinoyo
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              1 kampus WM Dinoyo terdaftar dan aktif
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari unit WM Dinoyo atau PIC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0A2E6E]"
              />
            </div>

            <button className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl bg-white hover:bg-slate-50">
              <span>Semua Status</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl bg-white hover:bg-slate-50">
              <span>Terbaru</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setSelectedFilter('Semua')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                selectedFilter === 'Semua'
                  ? 'bg-[#0A2E6E] text-white shadow-xs'
                  : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              Semua (1)
            </button>
            <button
              onClick={() => setSelectedFilter('Aktif')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                selectedFilter === 'Aktif'
                  ? 'bg-[#0A2E6E] text-white shadow-xs'
                  : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              Aktif (1)
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                  <th className="pb-3 font-bold">KAMPUS</th>
                  <th className="pb-3 font-bold">STATUS</th>
                  <th className="pb-3 font-bold">PIC KAMPUS</th>
                  <th className="pb-3 font-bold">DOMAIN</th>
                  <th className="pb-3 font-bold text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campuses.map((campus) => {
                  const isSelected = campus.id === selectedCampusId;
                  return (
                    <tr key={campus.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0A2E6E] font-black text-xs flex items-center justify-center shrink-0">
                            UKW
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{campus.name}</span>
                            <span className="text-[11px] text-slate-400">{campus.tag}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                          {campus.status}
                        </span>
                      </td>
                      <td className="py-4 text-slate-700 font-semibold">{campus.pic}</td>
                      <td className="py-4 text-slate-500 font-mono text-[11px]">{campus.domain}</td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => setSelectedCampusId(campus.id)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                            isSelected
                              ? 'bg-[#0A2E6E] text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Detail Panel (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase">Detail Kampus WM Dinoyo</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                {selectedCampus.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Kampus Widya Mandala Dinoyo yang sedang ditampilkan
            </p>
          </div>

          {/* Logo & Name */}
          <div className="flex items-center gap-3 pt-2">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0A2E6E] font-black text-base flex items-center justify-center shrink-0">
              UKW
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">{selectedCampus.name}</h3>
              <p className="text-[11px] text-slate-400">Domain resmi: {selectedCampus.domain}</p>
            </div>
          </div>

          {/* Informasi Kampus */}
          <div className="pt-2 space-y-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-900 block">Informasi Kampus</span>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-400">PIC Kampus</span>
                <span className="font-semibold text-slate-900 text-right">{selectedCampus.pic}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Cakupan Terdaftar</span>
                <span className="font-semibold text-slate-900 text-right">{selectedCampus.tag}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Hak Akses Admin</span>
                <span className="font-semibold text-slate-900 text-right">{selectedCampus.adminAccess}</span>
              </div>
            </div>
          </div>

          {/* Dokumen MoU */}
          <div className="pt-2 space-y-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-900 block">Dokumen MoU</span>
            <button
              onClick={() => setShowMouModal(true)}
              className="w-full flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-slate-300 text-left transition bg-slate-50/50"
            >
              <FileText className="w-4 h-4 text-[#0A2E6E] shrink-0" />
              <span className="text-xs font-bold text-[#0A2E6E] hover:underline truncate">
                {selectedCampus.mouFile}
              </span>
            </button>
          </div>

          {/* Checklist Verifikasi */}
          <div className="pt-2 space-y-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-900 block">Checklist Verifikasi</span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Domain kampus terverifikasi</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>PIC kampus terisi lengkap</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Dokumen MoU terunggah</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Kampus WM Dinoyo aktif dan siap beroperasi</span>
              </div>
            </div>
          </div>

          {/* Catatan Admin */}
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs">
            <span className="font-bold text-[#0A2E6E] block mb-1">Catatan Admin</span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Kampus Widya Mandala Dinoyo sudah aktif, 12 kantin terhubung, dan PIC dapat dihubungi untuk koordinasi operasional.
            </p>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button className="flex-1 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
              Arsip
            </button>
            <button className="flex-1 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
              Tinjau
            </button>
            <button className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#0A2E6E] hover:bg-[#082457] text-white shadow-xs transition">
              Kelola
            </button>
          </div>
        </div>
      </div>

      {/* Modal View MoU */}
      {showMouModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 rounded-2xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Pratinjau Dokumen Kerjasama</h3>
              <button
                onClick={() => setShowMouModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
              <FileCheck className="w-12 h-12 text-[#0A2E6E] mx-auto" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedCampus.mouFile}</h4>
                <p className="text-xs text-slate-500 mt-1">Dokumen MoU resmi bermaterai & telah ditandatangani.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowMouModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  alert('Mengunduh dokumen MoU...');
                  setShowMouModal(false);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0A2E6E] hover:bg-[#082457] text-white shadow-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
