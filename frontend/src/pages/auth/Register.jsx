import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
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

    if (formData.password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    setLoading(true);

    try {
      const session = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });

      const destination =
        session.user.role === 'canteen'
          ? '/canteen-portal'
          : session.user.role === 'runner'
            ? '/runner-portal'
            : '/';

      navigate(destination, { replace: true });

    } catch (err) {
      setError(err.message || 'Gagal mendaftarkan akun.');
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
                { id: 'customer', label: 'Mahasiswa' },
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