import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  ImageUp,
  LoaderCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import RunnerBackgroundDecoration from '../../components/common/RunnerBackgroundDecoration';

const bankOptions = [
  'BCA',
  'Mandiri',
  'BNI',
  'BRI',
  'CIMB Niaga',
  'GoPay',
  'DANA',
  'OVO',
  'ShopeePay',
];

export default function RunnerProfile() {
  const { profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    nrp: '',
    phoneNumber: '',
    ktmUrl: '',
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setForm({
      nrp: profile?.nrp || '',
      phoneNumber: profile?.phoneNumber || '',
      ktmUrl: profile?.ktmUrl || '',
      bankName: profile?.bankName || '',
      accountNumber: profile?.accountNumber || '',
      accountHolderName: profile?.accountHolderName || '',
    });
  }, [profile]);

  useEffect(() => () => {
    if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    let active = true;
    if (!profile?.id || !profile?.ktmUrl) {
      setPreviewUrl('');
      return () => {
        active = false;
      };
    }

    api.getBlob(`/runner/${profile.id}/ktm`)
      .then((blob) => {
        if (active) setPreviewUrl(URL.createObjectURL(blob));
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Foto KTM tidak dapat dimuat.');
      });
    return () => {
      active = false;
    };
  }, [profile?.id, profile?.ktmUrl]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const uploadKtm = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError('Foto KTM harus berformat JPEG, PNG, atau WebP dan maksimal 5 MB.');
      return;
    }

    setError('');
    setNotice('');
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('image', file);
      const result = await api.post('/upload/ktm', uploadData);
      setField('ktmUrl', result.url);
    } catch (uploadError) {
      setPreviewUrl('');
      setError(uploadError.message || 'Gagal mengunggah foto KTM.');
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await api.patch('/auth/runner-profile', form);
      await refreshProfile();
      setNotice('Profil tersimpan. Perubahan data mengajukan verifikasi ulang kepada Admin.');
    } catch (saveError) {
      setError(saveError.message || 'Gagal menyimpan profil Runner.');
    } finally {
      setSaving(false);
    }
  };

  const imageUrl = previewUrl;

  return (
    <main className="runner-theme relative min-h-screen overflow-hidden bg-white px-4 py-8 text-slate-800 sm:px-6">
      <RunnerBackgroundDecoration />
      <div className="relative z-10 mx-auto max-w-2xl space-y-5">
        <Link to="/runner-portal" className="text-sm font-bold text-blue-800 hover:underline">
          Kembali ke Portal Runner
        </Link>
        <header>
          <h1 className="text-2xl font-black">Profil Campus Runner</h1>
          <p className="mt-1 text-sm text-slate-500">
            Perbarui identitas, berkas KTM, dan rekening pencairan dana.
          </p>
        </header>

        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle className="h-5 w-5 shrink-0" />
            {notice}
          </div>
        )}

        <form onSubmit={saveProfile} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">Identitas dan Berkas</h2>
            <label className="block text-sm font-semibold">
              NRP
              <input required value={form.nrp} onChange={(event) => setField('nrp', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 font-normal" />
            </label>
            <label className="block text-sm font-semibold">
              Nomor telepon
              <input required type="tel" value={form.phoneNumber} onChange={(event) => setField('phoneNumber', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 font-normal" />
            </label>
            <div className="space-y-2">
              <span className="block text-sm font-semibold">Foto KTM</span>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />}
                {uploading ? 'Mengunggah foto...' : 'Pilih foto KTM (JPEG, PNG, WebP; maks. 5 MB)'}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadKtm} disabled={uploading || saving} className="sr-only" />
              </label>
              {imageUrl && (
                <img src={imageUrl} alt="Pratinjau foto KTM" className="max-h-64 w-full rounded-xl border border-slate-200 object-contain" />
              )}
            </div>
          </section>

          <section className="space-y-4 border-t border-slate-100 pt-5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-800">
              <CreditCard className="h-5 w-5 text-slate-400" />
              Pencairan Dana Komisi
            </h2>
            <label className="block text-sm font-semibold">
              Bank / E-Wallet
              <select required value={form.bankName} onChange={(event) => setField('bankName', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 font-normal">
                <option value="">Pilih bank atau e-wallet</option>
                {bankOptions.map((bank) => <option key={bank} value={bank}>{bank}</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Nomor rekening / nomor e-wallet
              <input required value={form.accountNumber} onChange={(event) => setField('accountNumber', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 font-normal" />
            </label>
            <label className="block text-sm font-semibold">
              Nama pemilik rekening
              <input required value={form.accountHolderName} onChange={(event) => setField('accountHolderName', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 font-normal" />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                Nama pemilik rekening wajib sesuai dengan KTM
              </span>
            </label>
          </section>

          <button type="submit" disabled={saving || uploading} className="w-full rounded-xl bg-[#2152B7] px-4 py-3 text-sm font-bold text-white hover:bg-[#193F91] disabled:opacity-60">
            {saving ? 'Menyimpan...' : 'Simpan dan Ajukan Verifikasi'}
          </button>
        </form>
      </div>
    </main>
  );
}
