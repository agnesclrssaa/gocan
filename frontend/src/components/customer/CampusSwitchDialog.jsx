import { AlertTriangle, X } from 'lucide-react';

export default function CampusSwitchDialog({ onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="campus-switch-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffd612]/30 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h2 id="campus-switch-title" className="text-lg font-black text-slate-900">
                Ganti Kampus?
              </h2>
              <button
                type="button"
                onClick={onCancel}
                aria-label="Tutup konfirmasi"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Keranjang berisi pesanan dari kampus saat ini. Jika kampus diganti, keranjang lama akan dikosongkan.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-[#116AA5] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#116AA5] active:bg-[#116AA5]"
          >
            Ganti Kampus
          </button>
        </div>
      </section>
    </div>
  );
}
