import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Bike,
  CheckCircle,
  Clock,
  CreditCard,
  Mail,
  Phone,
  RefreshCw,
  UserRound,
  X,
  XCircle,
} from 'lucide-react';
import { api } from '../../lib/api';

const filters = [
  { value: 'all', label: 'Semua' },
  { value: 'PENDING', label: 'Menunggu (Pending)' },
  { value: 'APPROVED', label: 'Disetujui' },
  { value: 'REJECTED', label: 'Ditolak' },
];

const statusStyles = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-800 border-rose-200',
};

const statusLabels = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

function RunnerKtmImage({ runnerId }) {
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl;
    api.getBlob(`/runner/${runnerId}/ktm`)
      .then((image) => {
        objectUrl = URL.createObjectURL(image);
        if (active) setImageUrl(objectUrl);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Foto KTM tidak dapat dimuat.');
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [runnerId]);

  if (error) return <p role="alert" className="text-sm text-rose-700">{error}</p>;
  if (!imageUrl) return <p role="status" className="text-sm text-slate-500">Memuat foto KTM...</p>;

  return (
    <a href={imageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:underline">
      <img src={imageUrl} alt="Foto KTM runner" className="h-14 w-20 rounded-lg border border-slate-200 object-cover" />
      Lihat Foto KTM
    </a>
  );
}

export default function AdminRunners() {
  const [filter, setFilter] = useState('all');
  const [runners, setRunners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [rejectingRunner, setRejectingRunner] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadRunners = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = filter === 'all' ? '' : `?status=${filter}`;
      setRunners(await api.get(`/admin/runners${query}`));
    } catch (loadError) {
      setError(loadError.message || 'Gagal memuat pendaftar Runner.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadRunners();
  }, [loadRunners]);

  const reviewRunner = async (runner, status, reason = '') => {
    setSavingId(runner.id);
    setError('');
    setNotice('');
    try {
      const result = await api.patch(`/admin/runners/${runner.id}/approval`, {
        status,
        ...(status === 'REJECTED' ? { reason } : {}),
      });
      setNotice(result.notification?.sent === false
        ? `${runner.name}: ${result.notification.message}`
        : `${runner.name} ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}; notifikasi email ${result.notification?.sent ? 'terkirim' : 'diproses'}.`);
      setRejectingRunner(null);
      setRejectionReason('');
      await loadRunners();
    } catch (reviewError) {
      setError(reviewError.message || 'Gagal memperbarui persetujuan Runner.');
    } finally {
      setSavingId(null);
    }
  };

  const submitRejection = (event) => {
    event.preventDefault();
    if (!rejectingRunner || !rejectionReason.trim()) {
      setError('Alasan penolakan wajib diisi.');
      return;
    }
    reviewRunner(rejectingRunner, 'REJECTED', rejectionReason.trim());
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-indigo-700">
            <Bike className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-widest">Super Admin</span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Pendaftaran Campus Runner</h1>
          <p className="mt-1 text-sm text-slate-500">Tinjau identitas, KTM, kontak, dan rekening pencairan sebelum mengambil keputusan.</p>
        </div>
        <button type="button" onClick={loadRunners} disabled={loading} className="inline-flex items-center gap-2 self-start rounded-xl bg-[#0A2E6E] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Muat ulang
        </button>
      </header>

      {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}
      {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle className="h-5 w-5 shrink-0" />{notice}</div>}

      <nav aria-label="Filter status pendaftar" className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            aria-pressed={filter === item.value}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${filter === item.value ? 'bg-[#0A2E6E] text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <div role="status" className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Memuat pendaftar Runner...</div>
      ) : runners.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Tidak ada pendaftar pada filter ini.</div>
      ) : (
        <section className="space-y-4">
          {runners.map((runner) => {
            const status = (runner.approvalStatus || 'pending').toLowerCase();
            const holderMismatch = runner.accountHolderName !== runner.name;
            return (
              <article key={runner.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><UserRound className="h-5 w-5" /></div>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-black text-slate-900">{runner.name}</h2>
                      <p className="text-xs text-slate-500">NRP {runner.nrp || 'Belum diisi'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[status] || statusStyles.pending}`}>
                    {status === 'approved' ? <CheckCircle className="h-4 w-4" /> : status === 'rejected' ? <XCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    {statusLabels[status] || status}
                  </span>
                </header>

                <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[1fr_1fr]">
                  <section className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">Identitas Pendaftar</h3>
                    <p className="flex items-center gap-2 break-all text-sm text-slate-700"><Mail className="h-4 w-4 shrink-0 text-slate-400" />{runner.email}</p>
                    <p className="flex items-center gap-2 text-sm text-slate-700"><Phone className="h-4 w-4 shrink-0 text-slate-400" />{runner.phoneNumber || 'Nomor telepon belum diisi'}</p>
                    {runner.ktmUrl ? (
                      <RunnerKtmImage runnerId={runner.id} />
                    ) : (
                      <p className="flex items-center gap-2 text-sm text-rose-700"><AlertCircle className="h-4 w-4" />Foto KTM belum diunggah</p>
                    )}
                    {runner.rejectionReason && status === 'rejected' && (
                      <p className="rounded-lg bg-rose-50 p-3 text-xs text-rose-800"><strong>Alasan penolakan:</strong> {runner.rejectionReason}</p>
                    )}
                  </section>

                  <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-600">
                      <CreditCard className="h-4 w-4" />Data Pencairan Dana
                    </h3>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between gap-3"><dt className="text-slate-500">Bank / E-Wallet</dt><dd className="text-right font-bold text-slate-900">{runner.bankName || '—'}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-slate-500">No. Rekening</dt><dd className="break-all text-right font-bold text-slate-900">{runner.accountNumber || '—'}</dd></div>
                      <div className="flex justify-between gap-3"><dt className="text-slate-500">Nama Pemilik</dt><dd className="text-right font-bold text-slate-900">{runner.accountHolderName || '—'}</dd></div>
                    </dl>
                    {holderMismatch && (
                      <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs font-semibold text-amber-900">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                        Nama rekening berbeda dengan nama akun. Periksa kesesuaiannya dengan KTM.
                      </p>
                    )}
                  </section>
                </div>

                {status !== 'approved' && (
                  <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-4 py-3 sm:px-6">
                    <button type="button" disabled={savingId === runner.id || !runner.nrp || !runner.phoneNumber || !runner.ktmUrl || !runner.bankName || !runner.accountNumber || !runner.accountHolderName} onClick={() => reviewRunner(runner, 'APPROVED')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />Setujui
                    </button>
                    <button type="button" disabled={savingId === runner.id} onClick={() => { setRejectingRunner(runner); setRejectionReason(''); setError(''); }} className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                      <XCircle className="h-5 w-5 text-rose-600" />Tolak
                    </button>
                  </footer>
                )}
              </article>
            );
          })}
        </section>
      )}

      {rejectingRunner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="runner-rejection-title" className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="runner-rejection-title" className="text-lg font-black text-slate-900">Tolak Pendaftaran Runner</h2>
                <p className="mt-1 text-sm text-slate-500">{rejectingRunner.name} akan menerima alasan ini melalui email.</p>
              </div>
              <button type="button" onClick={() => setRejectingRunner(null)} aria-label="Tutup dialog" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submitRejection} className="mt-5 space-y-4">
              <label htmlFor="runner-rejection-reason" className="block text-sm font-bold text-slate-700">
                Alasan penolakan
                <textarea id="runner-rejection-reason" required minLength={5} maxLength={1000} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} rows={4} className="mt-1 w-full resize-y rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-rose-400" placeholder="Jelaskan bagian data atau berkas yang perlu diperbaiki." />
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setRejectingRunner(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600">Batal</button>
                <button type="submit" disabled={!rejectionReason.trim() || savingId === rejectingRunner.id} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50">Kirim Penolakan</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
