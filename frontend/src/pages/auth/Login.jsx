import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import './Auth.css';

const roleDestination = {
  customer: '/',
  canteen: '/canteen-dashboard',
  canteen_staff: '/canteen-dashboard',
  runner: '/runner-portal',
  courier: '/courier-dashboard',
  admin: '/admin-portal',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetNotice, setResetNotice] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const closeResetModal = () => {
    setResetOpen(false);
    setResetStep(1);
    setResetOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setResetNotice('');
    setDevOtp('');
  };

  const openResetModal = () => {
    setError('');
    setNotice('');
    setResetEmail(email);
    setResetError('');
    setResetNotice('');
    setDevOtp('');
    setResetStep(1);
    setResetOpen(true);
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetNotice('');
    setDevOtp('');

    try {
      const result = await api.post('/auth/forgot-password', {
        email: resetEmail.trim(),
      });
      setResetStep(2);
      setResetNotice(result.message || 'Kode OTP telah dikirim ke email Anda.');
      setDevOtp(result.devOtp || '');
    } catch (err) {
      setResetError(err.message || 'Gagal mengirim kode OTP.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setResetError('');
    if (newPassword !== confirmPassword) {
      setResetError('Konfirmasi password tidak sama.');
      return;
    }
    if (newPassword.length < 8) {
      setResetError('Password baru minimal 8 karakter.');
      return;
    }

    setResetLoading(true);
    try {
      const result = await api.post('/auth/reset-password', {
        email: resetEmail.trim(),
        otp: resetOtp,
        newPassword,
      });
      closeResetModal();
      setEmail(resetEmail.trim());
      setPassword('');
      setError('');
      setNotice(`${result.message}. Silakan login dengan password baru.`);
    } catch (err) {
      setResetError(err.message || 'Gagal memperbarui password.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { user } = await login({
        email: email.trim(),
        password,
      });

      const previous =
        location.state?.from?.pathname || location.state?.from;

      if (
        typeof previous === 'string' &&
        previous !== '/' &&
        previous !== '/login'
      ) {
        navigate(previous, { replace: true });
      } else {
        navigate(
          roleDestination[user?.role] || '/unauthorized',
          { replace: true }
        );
      }
    } catch (err) {
      setError(err.message || 'Email atau password tidak valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="gocan-auth-page">

      <section className="gocan-auth-visual">

        <Link to="/" className="gocan-auth-logo">
          <img
            src="/gocan-logo.png"
            alt="GoCan Logo"
            className="gocan-logo-image"
          />
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
            Pesan makanan<br />
            <span>tanpa antre.</span>
          </h2>

          <p>
            Temukan makanan favoritmu di kantin kampus
            dengan GoCan.
          </p>
        </div>

        <span className="visual-decoration visual-decoration-red" />
        <span className="visual-decoration visual-decoration-yellow" />
        <span className="visual-decoration visual-decoration-blue" />

      </section>

      <section className="gocan-auth-panel">

        <Link to="/" className="auth-back-link">
          ← Kembali ke Beranda
        </Link>

        <div className="gocan-auth-card">

          <div className="auth-heading">
            <div className="auth-wordmark">
              Go<span>Can</span>
            </div>

            <h1>Login</h1>
            <p>Masuk untuk lanjut pesan makanan.</p>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="auth-reset-notice" role="status">
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="gocan-auth-form">

            <label htmlFor="login-email">Email</label>

            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="Masukkan email kamu"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label htmlFor="login-password">Password</label>

            <div className="auth-password-field">

              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Masukkan password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>

            </div>

            <div className="auth-options">
              <label className="auth-checkbox">
                <input type="checkbox" />
                <span>Ingat saya</span>
              </label>

              <button
                type="button"
                className="auth-text-button"
                onClick={openResetModal}
              >
                Lupa password?
              </button>
            </div>

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Login'}
            </button>

          </form>

          <p className="auth-switch">
            Belum punya akun? <Link to="/register">Daftar sekarang</Link>
          </p>

          <p className="auth-footer">
            GoCan • Campus Food Platform
          </p>

        </div>
      </section>

      {resetOpen && (
        <div
          className="auth-reset-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !resetLoading) closeResetModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-password-title"
            className="auth-reset-modal"
          >
            <button
              type="button"
              className="auth-reset-close"
              onClick={closeResetModal}
              disabled={resetLoading}
              aria-label="Tutup"
            >
              ×
            </button>
            <div className="auth-heading">
              <h2 id="reset-password-title">Reset Password</h2>
              <p>
                {resetStep === 1
                  ? 'Verifikasi email untuk menerima kode OTP.'
                  : 'Masukkan kode OTP dan password baru Anda.'}
              </p>
            </div>

            {resetError && (
              <div className="auth-error" role="alert">{resetError}</div>
            )}
            {resetNotice && (
              <div className="auth-reset-notice" role="status">
                {resetNotice}
              </div>
            )}
            {devOtp && (
              <div className="auth-reset-dev-otp" role="status">
                Kode OTP untuk pengujian: <strong>{devOtp}</strong>
              </div>
            )}

            {resetStep === 1 ? (
              <form onSubmit={handleSendOtp} className="gocan-auth-form">
                <label htmlFor="reset-email">Email terdaftar</label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Masukkan email kamu"
                  required
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                />
                <button className="auth-submit" type="submit" disabled={resetLoading}>
                  {resetLoading ? 'Mengirim...' : 'Kirim Kode OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="gocan-auth-form">
                <label htmlFor="reset-otp">Kode OTP</label>
                <input
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="6 digit kode OTP"
                  required
                  value={resetOtp}
                  onChange={(event) => setResetOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                <label htmlFor="reset-new-password">Password baru</label>
                <input
                  id="reset-new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  placeholder="Minimal 8 karakter"
                  required
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
                <label htmlFor="reset-confirm-password">Konfirmasi password baru</label>
                <input
                  id="reset-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={128}
                  placeholder="Ulangi password baru"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                <button className="auth-submit" type="submit" disabled={resetLoading}>
                  {resetLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
                </button>
                <button
                  type="button"
                  className="auth-text-button"
                  onClick={() => {
                    setResetStep(1);
                    setResetError('');
                    setResetNotice('');
                    setDevOtp('');
                  }}
                  disabled={resetLoading}
                >
                  Kembali ke verifikasi email
                </button>
              </form>
            )}
          </section>
        </div>
      )}

    </main>
  );
}