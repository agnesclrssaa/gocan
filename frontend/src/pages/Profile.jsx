import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle, ImageUp, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { findCanteenProfile, getCampusById, saveCanteenProfile } from '../lib/canteenCampus';
import { getRunnerCampusInfo } from '../lib/runnerCampus';

const emptyForm = {
  name: '',
  phoneNumber: '',
  email: '',
  defaultBuilding: '',
  defaultRoom: '',
  bankName: '',
  accountNumber: '',
  accountHolderName: '',
};

const canteenProfileFields = [
  { name: 'name', label: 'Nama Mitra', required: true, maxLength: 100 },
  { name: 'phoneNumber', label: 'Nomor Telepon', type: 'tel', maxLength: 14 },
  { name: 'email', label: 'Email', type: 'email', required: true, maxLength: 254 },
];

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
  const { user, profile, updateProfile } = useAuth();
  const isCanteen = user?.role === 'canteen';
  const canteenRecord = isCanteen
    ? findCanteenProfile(profile?.canteen, user) || profile?.canteen
    : null;
  const campusInfo = canteenRecord?.campusId
    ? getCampusById(canteenRecord.campusId)
    : null;
  const isRunner = [user?.role, profile?.role].some((role) => ['runner', 'courier'].includes(role));
  const runnerCampus = isRunner ? getRunnerCampusInfo(profile, user) : null;
  const [form, setForm] = useState(() => createForm(profile));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [canteenImageFile, setCanteenImageFile] = useState(null);
  const [canteenImagePreview, setCanteenImagePreview] = useState('');
  const avatarPreviewRef = useRef('');
  const canteenImagePreviewRef = useRef('');

  useEffect(() => () => {
    if (avatarPreviewRef.current) URL.revokeObjectURL(avatarPreviewRef.current);
    if (canteenImagePreviewRef.current) URL.revokeObjectURL(canteenImagePreviewRef.current);
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

  const handleCanteenImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Foto tempat harus berformat JPEG, PNG, atau WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran foto tempat maksimal 5 MB.');
      return;
    }

    if (canteenImagePreviewRef.current) URL.revokeObjectURL(canteenImagePreviewRef.current);
    const preview = URL.createObjectURL(file);
    canteenImagePreviewRef.current = preview;
    setCanteenImagePreview(preview);
    setCanteenImageFile(file);
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
      const fieldsToSubmit = isCanteen
        ? ['name', 'phoneNumber', 'email']
        : Object.keys(form).filter((field) => field !== 'email');
      fieldsToSubmit.forEach((field) => formData.append(field, form[field]));
      if (avatarFile) formData.append('avatar', avatarFile);
      if (isCanteen && canteenImageFile) formData.append('canteenImage', canteenImageFile);

      const updatedProfile = await updateProfile(formData);
      if (isCanteen) {
        saveCanteenProfile({
          ...canteenRecord,
          name: form.name.trim(),
          phoneNumber: form.phoneNumber.trim(),
          email: form.email.trim(),
          imageUrl: updatedProfile?.canteen?.imageUrl || canteenRecord?.imageUrl || '',
          campusId: canteenRecord?.campusId || '',
        }, user);
      }
      if (avatarPreviewRef.current) {
        URL.revokeObjectURL(avatarPreviewRef.current);
        avatarPreviewRef.current = '';
      }
      setAvatarPreview('');
      setAvatarFile(null);
      if (canteenImagePreviewRef.current) {
        URL.revokeObjectURL(canteenImagePreviewRef.current);
        canteenImagePreviewRef.current = '';
      }
      setCanteenImagePreview('');
      setCanteenImageFile(null);
      setNotice('Profil berhasil diperbarui.');
    } catch (saveError) {
      setError(saveError.message || 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  const avatarPicker = (
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
  );

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
          {!isCanteen && avatarPicker}
          <div>
            <h1 className="text-2xl font-black">Edit Profil</h1>
            <p className="mt-1 text-sm text-slate-500">
              {isCanteen ? 'Perbarui informasi akun Anda.' : 'Perbarui informasi akun dan data pengantaran Anda.'}
            </p>
            {!isCanteen && (
              <p className="mt-1 text-xs text-slate-500">
                Foto profil JPEG, PNG, atau WebP (maks. 5 MB)
                {avatarFile ? ` · ${avatarFile.name}` : ''}
              </p>
            )}
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
          {isCanteen && (
            <section className="rounded-xl border border-[#116aa5]/20 bg-[#fbf7f1] p-4">
              <h2 className="text-sm font-bold text-slate-800">Kampus Mitra</h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Nama Kampus</dt>
                  <dd className="mt-1 font-bold text-[#116aa5]">{campusInfo?.name || canteenRecord?.campusName || 'Belum ditetapkan'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Kota Kampus</dt>
                  <dd className="mt-1 font-bold text-slate-800">{campusInfo?.city || canteenRecord?.campusCity || '—'}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-slate-500">Kampus tidak dapat diubah dari halaman edit profil.</p>
            </section>
          )}

          {isCanteen && (
            <>
              <div className="flex items-center gap-4">
                {avatarPicker}
                <div className="text-sm">
                  <p className="font-semibold">Foto Profil</p>
                  <p className="mt-1 text-xs text-slate-500">
                    JPEG, PNG, atau WebP (maks. 5 MB)
                    {avatarFile ? ` · ${avatarFile.name}` : ''}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold">Foto Tempat / Banner Kantin</p>
                <label
                  htmlFor="canteen-banner"
                  className="mt-1 block cursor-pointer overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 transition hover:border-blue-500"
                >
                  {canteenImagePreview || profile?.canteen?.imageUrl ? (
                    <img
                      src={
                        canteenImagePreview ||
                        api.assetUrl(profile.canteen.imageUrl)
                      }
                      alt="Pratinjau banner kantin"
                      className="aspect-[16/7] w-full object-cover"
                    />
                  ) : (
                    <span className="flex aspect-[16/7] flex-col items-center justify-center gap-2 text-sm text-slate-500">
                      <ImageUp className="h-6 w-6" />
                      Pilih foto banner kantin
                    </span>
                  )}
                  <input
                    id="canteen-banner"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCanteenImageChange}
                    disabled={saving}
                    className="sr-only"
                  />
                </label>
                <p className="mt-1 text-xs text-slate-500">
                  JPEG, PNG, atau WebP (maks. 5 MB)
                  {canteenImageFile ? ` · ${canteenImageFile.name}` : ''}
                </p>
              </div>
            </>
          )}

          {isRunner && (
            <section className="rounded-xl border border-[#116aa5]/20 bg-[#fbf7f1] p-4">
              <h2 className="text-sm font-bold text-slate-800">Kampus Runner</h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Nama Kampus</dt>
                  <dd className="mt-1 font-bold text-[#116aa5]">{runnerCampus.name || 'Belum ditetapkan'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-slate-500">Kota Kampus</dt>
                  <dd className="mt-1 font-bold text-slate-800">{runnerCampus.city || '—'}</dd>
                </div>
              </dl>
              {!runnerCampus.isActive && (
                <p role="status" className="mt-3 text-xs font-semibold text-[#dc0413]">
                  Kampus belum tersedia atau nonaktif. Hubungi Admin untuk memperbarui penugasan kampus.
                </p>
              )}
              <p className="mt-2 text-xs text-slate-500">Kampus tidak dapat diubah dari halaman edit profil.</p>
            </section>
          )}

          {(isCanteen ? canteenProfileFields : profileFields).map(({ name, label, type = 'text', required, maxLength }) => (
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
                autoComplete={
                  name === 'name'
                    ? 'name'
                    : name === 'phoneNumber'
                      ? 'tel'
                      : name === 'email'
                        ? 'email'
                        : undefined
                }
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
