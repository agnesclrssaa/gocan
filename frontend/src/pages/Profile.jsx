import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle, ImageUp, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const emptyForm = {
  name: '',
  phoneNumber: '',
  defaultBuilding: '',
  defaultRoom: '',
  bankName: '',
  accountNumber: '',
  accountHolderName: '',
};

const profileFields = [
  { name: 'name', label: 'Nama lengkap', required: true, maxLength: 100 },
  { name: 'phoneNumber', label: 'Nomor telepon', type: 'tel', maxLength: 14 },
  { name: 'defaultBuilding', label: 'Gedung default', maxLength: 120 },
  { name: 'defaultRoom', label: 'Ruangan default', maxLength: 120 },
  { name: 'bankName', label: 'Bank / e-wallet', maxLength: 120 },
  { name: 'accountNumber', label: 'Nomor rekening / e-wallet', maxLength: 120 },
  { name: 'accountHolderName', label: 'Nama pemilik rekening', maxLength: 120 },
];

const createForm = (profile) => Object.fromEntries(
  Object.keys(emptyForm).map((field) => [field, profile?.[field] || ''])
);

const roleHome = {
  customer: '/',
  canteen: '/canteen-dashboard',
  canteen_staff: '/canteen-dashboard',
  runner: '/runner-portal',
  courier: '/courier-dashboard',
  admin: '/admin-portal',
};

export default function Profile() {
  const { profile, updateProfile } = useAuth();
  const [form, setForm] = useState(() => createForm(profile));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const avatarPreviewRef = useRef('');

  useEffect(() => () => {
    if (avatarPreviewRef.current) URL.revokeObjectURL(avatarPreviewRef.current);
  }, []);

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Foto profil harus berformat JPEG, PNG, atau WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran foto profil maksimal 5 MB.');
      return;
    }

    if (avatarPreviewRef.current) URL.revokeObjectURL(avatarPreviewRef.current);
    const preview = URL.createObjectURL(file);
    avatarPreviewRef.current = preview;
    setAvatarPreview(preview);
    setAvatarFile(file);
    setError('');
    setNotice('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([field, value]) => formData.append(field, value));
      if (avatarFile) formData.append('avatar', avatarFile);

      await updateProfile(formData);
      if (avatarPreviewRef.current) {
        URL.revokeObjectURL(avatarPreviewRef.current);
        avatarPreviewRef.current = '';
      }
      setAvatarPreview('');
      setAvatarFile(null);
      setNotice('Profil berhasil diperbarui.');
    } catch (saveError) {
      setError(saveError.message || 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-800 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-5">
        <Link
          to={roleHome[profile?.role] || '/'}
          className="inline-flex items-center gap-2 text-sm font-bold text-blue-800 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        <header className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0">
            {avatarPreview || profile?.avatarUrl ? (
              <img
                src={avatarPreview || api.assetUrl(profile.avatarUrl)}
                alt="Foto profil"
                className="h-16 w-16 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-800">
                <UserRound className="h-8 w-8" />
              </div>
            )}
            <label
              htmlFor="profile-avatar"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#0A2E6E] text-white shadow-sm transition hover:bg-[#082457]"
              title="Pilih foto profil"
            >
              <ImageUp className="h-4 w-4" />
              <input
                id="profile-avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                disabled={saving}
                className="sr-only"
              />
            </label>
          </div>
          <div>
            <h1 className="text-2xl font-black">Edit Profil</h1>
            <p className="mt-1 text-sm text-slate-500">
              Perbarui informasi akun dan data pengantaran Anda.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Foto profil JPEG, PNG, atau WebP (maks. 5 MB)
              {avatarFile ? ` · ${avatarFile.name}` : ''}
            </p>
          </div>
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

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          {profileFields.map(({ name, label, type = 'text', required, maxLength }) => (
            <label key={name} className="block text-sm font-semibold">
              {label}
              <input
                type={type}
                value={form[name]}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  [name]: event.target.value,
                }))}
                required={required}
                maxLength={maxLength}
                autoComplete={name === 'name' ? 'name' : name === 'phoneNumber' ? 'tel' : undefined}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 font-normal outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          ))}

          {profile?.role === 'runner' && (
            <Link
              to="/runner-portal/profile"
              className="block text-sm font-semibold text-blue-800 hover:underline"
            >
              Kelola NRP dan dokumen verifikasi runner
            </Link>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-[#0A2E6E] px-4 py-3 text-sm font-bold text-white hover:bg-[#082457] disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Simpan perubahan'}
          </button>
        </form>
      </div>
    </main>
  );
}
