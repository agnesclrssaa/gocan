import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User, AlertCircle, Eye, EyeOff, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/common/BrandLogo';

export const Register = () => {
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
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validasi ketat role: tidak boleh mendaftar admin
    if (!['customer', 'runner', 'canteen'].includes(formData.role)) {
      setError('Role pendaftaran tidak valid.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Kata sandi minimal 8 karakter.');
      setLoading(false);
      return;
    }

    try {
      const session = await register({
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
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
      console.error('Register error:', err);
      setError(err.message || 'Gagal mendaftarkan akun.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F0F4F9]">
      {/* Left Column: Brand Hero */}
      <div className="md:w-5/12 bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#0A2E6E] p-8 sm:p-12 flex flex-col items-center justify-center relative overflow-hidden text-white min-h-[300px] md:min-h-screen">
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-3xl transform rotate-12 blur-xs pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-blue-400/15 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
          <BrandLogo className="mb-6 h-20 w-20 rounded-3xl shadow-xl" />

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">
            Gocan
          </h1>
          <p className="text-sm text-blue-100/90 font-medium mb-8">
            Platform kantin digital terpercaya
          </p>

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

      {/* Right Column: Register Form */}
      <div className="flex-1 bg-white flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-5">
          <div>
            <h2 className="text-3xl font-black text-[#0A2E6E] tracking-tight">
              Daftar Akun Baru
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Mulai pesan dan antar makanan di kampus UKWMS
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-3.5 text-xs text-[#DC2626] border border-red-200 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#DC2626] mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-medium focus:bg-white focus:border-[#0A2E6E] focus:ring-2 focus:ring-[#0A2E6E]/20 outline-hidden transition"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Kampus / Akun</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nama@student.kampus.ac.id"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-medium focus:bg-white focus:border-[#0A2E6E] focus:ring-2 focus:ring-[#0A2E6E]/20 outline-hidden transition"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimal 8 karakter"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-xs sm:text-sm font-medium focus:bg-white focus:border-[#0A2E6E] focus:ring-2 focus:ring-[#0A2E6E]/20 outline-hidden transition"
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

            <div>
              <label className="block font-bold text-slate-700 mb-1">Daftar Sebagai</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'customer', label: 'Mahasiswa' },
                  { id: 'runner', label: 'Runner' },
                  { id: 'canteen', label: 'Mitra Stan' },
                ].map((roleOpt) => (
                  <button
                    key={roleOpt.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: roleOpt.id })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                      formData.role === roleOpt.id
                        ? 'border-[#0A2E6E] bg-blue-50 text-[#0A2E6E]'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {roleOpt.label}
                  </button>
                ))}
              </div>

              {/* Explanatory callout for Canteen & Runner */}
              {formData.role !== 'customer' && (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start gap-2 text-[11px] leading-relaxed">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Pendaftaran <strong>{formData.role === 'canteen' ? 'Mitra Stan' : 'Runner'}</strong> memerlukan verifikasi dan persetujuan Admin Kampus sebelum Anda dapat beroperasi dan mengelola pesanan.
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#1D3D8F] hover:bg-[#0A2E6E] py-3 text-sm font-bold text-white shadow-md shadow-blue-900/15 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-3"
            >
              {loading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 pt-2">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-bold text-[#0A2E6E] hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
