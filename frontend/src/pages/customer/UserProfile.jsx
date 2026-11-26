import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { api } from '../../lib/api';
import LoadingScreen from '../../components/LoadingScreen';

const toForm = (profile) => ({
  name: profile.name || '',
  phoneNumber: profile.phoneNumber || '',
  defaultBuilding: profile.defaultBuilding || '',
  defaultRoom: profile.defaultRoom || '',
});

export default function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);

  const submitting = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      setLoading(true);
      setError('');

      try {
        const response = await api.get('/user/profile', {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (!response.success || !response.data?.id) {
          throw new Error('Data profil belum tersedia.');
        }

        setProfile(response.data);
        setForm(toForm(response.data));
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError.message || 'Profil gagal dimuat.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => controller.abort();
  }, [attempt]);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError('');
    setMessage('');
  };

  const cancelEdit = () => {
    if (submitting.current) return;

    setForm(toForm(profile));
    setEditing(false);
    setError('');
    setMessage('');
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    if (!editing || submitting.current) return;

    const name = form.name.trim();
    const phoneNumber = form.phoneNumber.trim();
    const defaultBuilding = form.defaultBuilding.trim();
    const defaultRoom = form.defaultRoom.trim();

    if (name.length < 2 || name.length > 100) {
      setError('Nama harus terdiri dari 2 sampai 100 karakter.');
      return;
    }

    if (phoneNumber && !/^\d{10,14}$/.test(phoneNumber)) {
      setError(
        'Nomor telepon harus berisi 10–14 digit angka, tanpa spasi atau tanda +.'
      );
      return;
    }

    if (defaultBuilding.length > 120 || defaultRoom.length > 120) {
      setError('Gedung dan ruangan masing-masing maksimal 120 karakter.');
      return;
    }

    submitting.current = true;
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await api.put('/user/profile', {
        name,
        phoneNumber: phoneNumber || null,
        defaultBuilding: defaultBuilding || null,
        defaultRoom: defaultRoom || null,
      });

      if (!response.success || !response.data?.id) {
        throw new Error('Penyimpanan profil belum dikonfirmasi server.');
      }

      setProfile(response.data);
      setForm(toForm(response.data));
      setEditing(false);
      setMessage('Profil berhasil disimpan.');
    } catch (requestError) {
      setError(
        requestError.message ||
          'Profil gagal disimpan. Perubahan Anda masih tersedia di form.'
      );
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F9] pb-20 text-slate-800">
      <Navbar />

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6">
        <header className="customer-card rounded-3xl bg-[#2152B7] p-6 text-white">
          <h1 className="text-2xl font-extrabold">Profil Saya</h1>
          <p className="mt-2 text-sm text-white/90">
            Lihat dan perbarui informasi akun pelanggan Anda.
          </p>
        </header>

        {error && (
          <p
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {message}
          </p>
        )}

        {loading ? (
          <LoadingScreen message="Memuat profil..." />
        ) : !profile ? (
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="rounded-full bg-[#2152B7] px-5 py-3 text-sm font-bold text-white"
          >
            Coba muat profil lagi
          </button>
        ) : (
          <form
            onSubmit={saveProfile}
            className="customer-card space-y-5 rounded-3xl border border-slate-200 bg-white p-6"
          >
            <div>
              <label
                htmlFor="profile-email"
                className="block text-sm font-bold text-slate-700"
              >
                Email
              </label>

              <input
                id="profile-email"
                type="email"
                value={profile.email || ''}
                readOnly
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600"
              />

              <p className="mt-2 text-xs text-slate-500">
                Email akun tidak dapat diubah melalui halaman profil.
              </p>
            </div>

            <fieldset disabled={!editing || saving} className="space-y-5">
              {[
                {
                  name: 'name',
                  label: 'Nama lengkap',
                  maxLength: 100,
                  autoComplete: 'name',
                },
                {
                  name: 'phoneNumber',
                  label: 'Nomor telepon',
                  maxLength: 14,
                  autoComplete: 'tel',
                  type: 'tel',
                },
                {
                  name: 'defaultBuilding',
                  label: 'Gedung default (opsional)',
                  maxLength: 120,
                },
                {
                  name: 'defaultRoom',
                  label: 'Ruangan default (opsional)',
                  maxLength: 120,
                },
              ].map((field) => (
                <div key={field.name}>
                  <label
                    htmlFor={`profile-${field.name}`}
                    className="block text-sm font-bold text-slate-700"
                  >
                    {field.label}
                  </label>

                  <input
                    id={`profile-${field.name}`}
                    name={field.name}
                    type={field.type || 'text'}
                    value={form[field.name]}
                    onChange={updateField}
                    maxLength={field.maxLength}
                    autoComplete={field.autoComplete}
                    required={field.name === 'name'}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#2152B7] focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-600"
                  />
                </div>
              ))}
            </fieldset>

            <p className="text-xs leading-relaxed text-slate-500">
              Gedung dan ruangan default disimpan pada profil akun.
              Lokasi pesanan tetap perlu diperiksa pada halaman checkout.
            </p>

            {editing ? (
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[#2152B7] px-5 py-3 text-sm font-bold text-white hover:bg-[#193F91] disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan perubahan'}
                </button>

                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setMessage('');
                  setError('');
                }}
                className="rounded-full bg-[#2152B7] px-5 py-3 text-sm font-bold text-white hover:bg-[#193F91]"
              >
                Edit profil
              </button>
            )}
          </form>
        )}

        <Link
          to="/"
          className="inline-block text-sm font-bold text-[#2152B7] hover:underline"
        >
          Kembali ke Beranda
        </Link>
      </main>
    </div>
  );
}