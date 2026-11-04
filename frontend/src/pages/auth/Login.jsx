import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
                onClick={() =>
                  setError(
                    'Silakan hubungi administrator kampus untuk reset password.'
                  )
                }
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

    </main>
  );
}