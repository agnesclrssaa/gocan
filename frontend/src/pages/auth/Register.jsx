import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { CreditCard, ImageUp } from 'lucide-react';
import './Auth.css';

export default function Register() {
  const { register, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ktmPhoto, setKtmPhoto] = useState(null);
  const [ktmPreview, setKtmPreview] = useState('');

  useEffect(() => () => {
    if (ktmPreview) URL.revokeObjectURL(ktmPreview);
  }, [ktmPreview]);

  const update = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!['customer', 'runner', 'canteen'].includes(formData.role)) {
      setError('Role pendaftaran tidak valid.');
      return;
    }

    if (
      formData.role === 'runner' &&
      !formData.email.trim().toLowerCase().endsWith('@ukwms.ac.id')
    ) {
      setError('Pendaftaran Campus Runner wajib menggunakan email resmi mahasiswa UKWMS (@ukwms.ac.id).');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    if (
      formData.role === 'runner' &&
      (!formData.nrp?.trim() ||
        !formData.phoneNumber?.trim() ||
        !formData.bankName?.trim() ||
        !formData.accountNumber?.trim() ||
        !formData.accountHolderName?.trim() ||
        !ktmPhoto)
    ) {
      setError('Lengkapi identitas, data pencairan dana, dan foto KTM sebelum mendaftar sebagai Runner.');
      return;
    }

    setLoading(true);

    let registrationCompleted = false;
    try {
      const session = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        ...(formData.role === 'runner'
          ? {
              nrp: formData.nrp.trim(),
              phoneNumber: formData.phoneNumber.trim(),
              bankName: formData.bankName,
              accountNumber: formData.accountNumber.trim(),
              accountHolderName: formData.accountHolderName.trim(),
            }
          : {}),
      });

      registrationCompleted = true;
      if (formData.role === 'runner') {
        const uploadData = new FormData();
        uploadData.append('image', ktmPhoto);
        const uploadedPhoto = await api.post('/upload/ktm', uploadData);
        await api.patch('/auth/runner-profile', {
          nrp: formData.nrp.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          bankName: formData.bankName,
          accountNumber: formData.accountNumber.trim(),
          accountHolderName: formData.accountHolderName.trim(),
          ktmUrl: uploadedPhoto.url,
        });
        await refreshProfile();
      }

      const destination =
        session.user.role === 'canteen'
          ? '/canteen-portal'
          : session.user.role === 'runner'
            ? '/runner-portal'
            : '/';

      navigate(destination, { replace: true });

    } catch (err) {
      if (registrationCompleted && formData.role === 'runner') {
        navigate('/runner-portal/profile', { replace: true });
      } else {
        setError(err.message || 'Gagal mendaftarkan akun.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="gocan-auth-page">

      <section className="gocan-auth-visual">

        <Link to="/" className="gocan-auth-logo">
          <img src="/assets/gocan.png" alt="GoCan" />
        </Link>

        <div className="gocan-mascot-wrap">
          <span className="mascot-orbit" />
          <span className="mascot-spark spark-one" />
          <span className="mascot-spark spark-two" />
          <span className="mascot-spark spark-three" />

          <img
            src="/assets/mascot-gocan-transparent.png"
            alt="Maskot GoCan"
            className="gocan-mascot"
          />
        </div>

        <div className="gocan-visual-copy">
          <span className="gocan-eyebrow">
            CAMPUS FOOD PLATFORM
          </span>

          <h2>
            Gabung bersama<br />
            <span>GoCan!</span>
          </h2>

          <p>
            Buat akun dan nikmati pesan makanan
            kantin kampus dengan lebih mudah.
          </p>
        </div>

        <span className="visual-decoration visual-decoration-red" />
        <span className="visual-decoration visual-decoration-yellow" />

      </section>

      <section className="gocan-auth-panel auth-panel-register">

        <Link to="/" className="auth-back-link">
          ← Kembali ke Beranda
        </Link>

        <div className="gocan-auth-card">

          <div className="auth-heading">
            <div className="auth-wordmark">
              Go<span>Can</span>
            </div>

            <h1>Buat Akun</h1>
            <p>Daftar untuk mulai menggunakan GoCan.</p>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="gocan-auth-form">

            <label htmlFor="register-name">
              Nama lengkap
            </label>

            <input
              id="register-name"
              type="text"
              autoComplete="name"
              placeholder="Masukkan nama lengkap"
              required
              value={formData.name}
              onChange={(e) => update('name', e.target.value)}
            />

            <label htmlFor="register-email">
              Email
            </label>

            <input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="Masukkan email kamu"
              required
              value={formData.email}
              onChange={(e) => update('email', e.target.value)}
            />
            {formData.role === 'runner' && (
              <p className="auth-note">
                Wajib menggunakan email @ukwms.ac.id
              </p>
            )}

            <label htmlFor="register-password">
              Password
            </label>

            <div className="auth-password-field">

              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Minimal 8 karakter"
                minLength={8}
                required
                value={formData.password}
                onChange={(e) => update('password', e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>

            </div>

            <label>Daftar sebagai</label>

            <div className="auth-role-options">

              {[
                { id: 'customer', label: 'Customer' },
                { id: 'runner', label: 'Runner' },
                { id: 'canteen', label: 'Mitra Stan' },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={
                    formData.role === option.id ? 'selected' : ''
                  }
                  onClick={() => update('role', option.id)}
                >
                  {option.label}
                </button>
              ))}

            </div>

            {formData.role !== 'customer' && (
              <p className="auth-note">
                Pendaftaran Runner atau Mitra Stan memerlukan
                verifikasi dan persetujuan Admin Kampus
                sebelum dapat beroperasi.
              </p>
            )}

            {formData.role === 'runner' && (
              <section className="space-y-3 rounded-xl border border-slate-200 bg-white/70 p-4">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <CreditCard className="h-5 w-5 text-slate-400" />
                  Identitas Runner dan Pencairan Dana
                </h2>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="runner-nrp">
                  NRP
                  <input
                    id="runner-nrp"
                    type="text"
                    required
                    value={formData.nrp || ''}
                    onChange={(event) => update('nrp', event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2.5"
                    autoComplete="off"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="runner-phone">
                  Nomor telepon
                  <input
                    id="runner-phone"
                    type="tel"
                    required
                    value={formData.phoneNumber || ''}
                    onChange={(event) => update('phoneNumber', event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2.5"
                    autoComplete="tel"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="runner-ktm">
                  Foto KTM
                  <span className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 p-3 text-slate-600 hover:bg-slate-50">
                    <ImageUp className="h-4 w-4" />
                    {ktmPhoto?.name || 'Pilih foto KTM (JPEG, PNG, atau WebP; maks. 5 MB)'}
                    <input
                      id="runner-ktm"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      required={!ktmPhoto}
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        if (
                          file &&
                          (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
                            file.size > 5 * 1024 * 1024)
                        ) {
                          setError('Foto KTM harus berformat JPEG, PNG, atau WebP dan maksimal 5 MB.');
                          setKtmPhoto(null);
                          setKtmPreview('');
                          event.target.value = '';
                          return;
                        }
                        setError('');
                        setKtmPhoto(file);
                        setKtmPreview(file ? URL.createObjectURL(file) : '');
                      }}
                    />
                  </span>
                  {ktmPreview && (
                    <img
                      src={ktmPreview}
                      alt="Pratinjau foto KTM"
                      className="mt-2 h-28 w-full rounded-lg object-cover"
                    />
                  )}
                </label>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="runner-bank">
                  Bank / E-Wallet
                  <select
                    id="runner-bank"
                    required
                    value={formData.bankName || ''}
                    onChange={(event) => update('bankName', event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5"
                  >
                    <option value="">Pilih bank atau e-wallet</option>
                    {['BCA', 'Mandiri', 'BNI', 'BRI', 'CIMB Niaga', 'GoPay', 'DANA', 'OVO', 'ShopeePay'].map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="runner-account">
                  Nomor rekening / nomor e-wallet
                  <input
                    id="runner-account"
                    type="text"
                    inputMode="numeric"
                    required
                    value={formData.accountNumber || ''}
                    onChange={(event) => update('accountNumber', event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2.5"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-700" htmlFor="runner-holder">
                  Nama pemilik rekening
                  <input
                    id="runner-holder"
                    type="text"
                    required
                    value={formData.accountHolderName || ''}
                    onChange={(event) => update('accountHolderName', event.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2.5"
                  />
                  <span className="mt-1 block font-normal text-slate-500">
                    Nama pemilik rekening wajib sesuai dengan KTM
                  </span>
                </label>
              </section>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
            </button>

          </form>

          <p className="auth-switch">
            Sudah punya akun? <Link to="/login">Login</Link>
          </p>

          <p className="auth-footer">
            GoCan • Campus Food Platform
          </p>

        </div>
      </section>

    </main>
  );
}