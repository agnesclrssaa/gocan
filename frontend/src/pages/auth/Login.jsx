import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Eye, EyeOff, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/common/BrandLogo';

const roleDestination = {
  customer: '/',
  canteen: '/canteen-dashboard',
  canteen_staff: '/canteen-dashboard',
  runner: '/runner-portal',
  courier: '/courier-dashboard',
  admin: '/admin-portal',
};

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const successMessage = location.state?.message;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { user: authenticatedUser } = await login({ email: email.trim(), password });

      // Prioritas redirect:
      // 1. Jika ada state.from dari protected route dan role sesuai
      // 2. Berdasarkan role profil yang telah diverifikasi dari database
      const previousLocation = location.state?.from?.pathname || location.state?.from;
      if (previousLocation && typeof previousLocation === 'string' && previousLocation !== '/' && previousLocation !== '/login') {
        navigate(previousLocation, { replace: true });
        return;
      }

      const destination = roleDestination[authenticatedUser?.role] || '/unauthorized';
      navigate(destination, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Email atau kata sandi tidak valid.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError('Login Google belum tersedia melalui backend GoCan. Silakan masuk menggunakan email dan kata sandi.');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F0F4F9]">
      {/* Left Column: Brand Hero (matching mockup gocan-customer-auth.png) */}
      <div className="md:w-5/12 bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0A2E6E] p-8 sm:p-12 flex flex-col items-center justify-center relative overflow-hidden text-white min-h-[340px] md:min-h-screen">
        {/* Subtle decorative geometry */}
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-3xl transform rotate-12 blur-xs pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-blue-400/15 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-96 h-96 bg-[#0A2E6E]/50 rounded-3xl transform -rotate-12 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
          {/* Logo Card */}
          <BrandLogo className="mb-6 h-20 w-20 rounded-3xl shadow-xl" />

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">
            Gocan
          </h1>
          <p className="text-sm text-blue-100/90 font-medium mb-8">
            Platform kantin digital terpercaya
          </p>

          {/* 3 Pills */}
          <div className="space-y-3 w-full">
            <div className="px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold text-white shadow-xs">
              Pesan makanan dengan mudah
            </div>
            <div className="px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold text-white shadow-xs">
              Transaksi aman dan terjamin
            </div>
            <div className="px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold text-white shadow-xs">
              Pengiriman cepat & terpercaya
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="flex-1 bg-white flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-3xl font-black text-[#0A2E6E] tracking-tight">
              Selamat Datang!
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Masuk ke akun Gocan Anda
            </p>
          </div>

          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-700">
              {successMessage}
            </div>
          )}

          {error && (
            <div role="alert" className="rounded-xl bg-red-50 p-3.5 text-xs text-[#DC2626] border border-red-200 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#DC2626] mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@student.kampus.ac.id"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-3.5 text-xs sm:text-sm font-medium focus:bg-white focus:border-[#0A2E6E] focus:ring-2 focus:ring-[#0A2E6E]/20 outline-hidden transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-bold text-slate-700">
                  Kata Sandi
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Silakan hubungi administrator kampus untuk reset kata sandi.');
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Lupa kata sandi?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kata Sandi Anda"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-10 pr-10 text-xs sm:text-sm font-medium focus:bg-white focus:border-[#0A2E6E] focus:ring-2 focus:ring-[#0A2E6E]/20 outline-hidden transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button in Navy */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#1D3D8F] hover:bg-[#0A2E6E] py-3 text-sm font-bold text-white shadow-md shadow-blue-900/15 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? 'Memproses Masuk...' : 'Masuk'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs text-slate-400 uppercase font-medium">
              atau
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Masuk dengan Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white py-3 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Masuk dengan Akun Kampus / Google</span>
          </button>

          {/* Footer Register Link */}
          <p className="text-center text-xs text-slate-500 pt-2">
            Belum punya akun?{' '}
            <Link to="/register" className="font-bold text-[#0A2E6E] hover:underline">
              Daftar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
