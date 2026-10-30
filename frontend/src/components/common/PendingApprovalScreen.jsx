import { Clock, ShieldAlert, RefreshCw, LogOut, Store, Bike, AlertCircle } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function PendingApprovalScreen({ profile, onRefresh, onLogout }) {
  const isRejected = profile?.approval_status === 'rejected';
  const roleName = profile?.role === 'canteen' ? 'Mitra Stan Kantin' : 'Campus Runner';
  const roleIcon = profile?.role === 'canteen' ? (
    <Store className="w-6 h-6 text-[#0A2E6E]" />
  ) : (
    <Bike className="w-6 h-6 text-emerald-600" />
  );

  return (
    <div className="min-h-screen bg-[#F0F4F9] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/80 shadow-lg p-6 sm:p-8 text-center space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center">
          <BrandLogo className="h-16 w-16 rounded-2xl shadow-md mb-4" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            {roleIcon}
            <span>Pendaftaran {roleName}</span>
          </div>
        </div>

        {/* Status Illustration & Title */}
        <div className="space-y-2">
          {isRejected ? (
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
          )}

          <h1 className="text-2xl font-black text-[#0A2E6E] tracking-tight">
            {isRejected ? 'Pendaftaran Ditolak' : 'Menunggu Persetujuan Admin'}
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            {isRejected
              ? 'Mohon maaf, pengajuan akun Anda belum dapat disetujui oleh Administrator Kampus UKWMS. Silakan hubungi pihak kampus untuk informasi selengkapnya.'
              : 'Akun Anda telah berhasil terdaftar dan saat ini sedang dalam proses verifikasi identitas / stan oleh Admin GoCan Kampus UKWMS.'}
          </p>
        </div>

        {/* User Identity Card */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Nama Pemohon:</span>
            <span className="font-bold text-slate-800">{profile?.full_name || 'Pengguna GoCan'}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Email Terdaftar:</span>
            <span className="font-bold text-slate-800">{profile?.email || '-'}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500 font-medium">Role yang Diminta:</span>
            <span className="font-bold text-[#0A2E6E] capitalize">{roleName}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 font-medium">Status Akses:</span>
            <span
              className={`font-black uppercase tracking-wider px-2 py-0.5 rounded text-[10px] ${
                isRejected
                  ? 'bg-rose-100 text-rose-700 border border-rose-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {isRejected ? 'Ditolak' : 'Menunggu Review (Pending)'}
            </span>
          </div>
        </div>

        {/* Info Box */}
        <div className="rounded-2xl bg-blue-50/70 border border-blue-200 p-4 text-xs text-blue-900 text-left flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Keamanan & Kebijakan Kampus</p>
            <p className="text-blue-800/90 leading-relaxed">
              Untuk melindungi transaksi mahasiswa dan menjaga kualitas layanan, akses fitur operasional
              (manajemen menu, pesanan, dan pendapatan) hanya diberikan kepada mitra yang telah diverifikasi oleh tim kampus.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#0A2E6E] hover:bg-[#082457] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Segarkan Status</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full sm:w-auto py-3 px-5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

