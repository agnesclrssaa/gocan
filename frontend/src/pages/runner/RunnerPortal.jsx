import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  LogOut,
  UserRoundPen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import RunnerLayout from '../../layouts/RunnerLayout';
import RunnerProfile from './RunnerProfile';

export default function RunnerPortal() {
  const { profile, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [portalProfile, setPortalProfile] = useState(profile);
  const [profileError, setProfileError] = useState('');
  const isProfilePage = location.pathname.endsWith('/profile');
  const status = String(portalProfile?.approval_status || portalProfile?.approvalStatus || 'pending').toLowerCase();

  useEffect(() => {
    let active = true;
    api.get('/auth/me')
      .then(({ user }) => {
        if (active) setPortalProfile(user);
      })
      .catch((error) => {
        if (active) setProfileError(error.message || 'Status pendaftaran tidak dapat diperbarui.');
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <p role="status" className="text-sm font-semibold">Memuat status pendaftaran Runner...</p>
      </div>
    );
  }

  if (isProfilePage) return <RunnerProfile />;

  if (status !== 'approved') {
    const rejected = status === 'rejected';
    const handleLogout = async () => {
      await signOut();
      navigate('/login', { replace: true });
    };

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
        <section className={`w-full max-w-xl rounded-3xl border p-7 text-center shadow-2xl ${rejected ? 'border-rose-500/30 bg-rose-950/30' : 'border-amber-500/30 bg-slate-900/80'}`}>
          {profileError && <p role="alert" className="mb-4 rounded-lg bg-rose-950/50 p-3 text-sm text-rose-200">{profileError}</p>}
          {rejected ? (
            <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
          ) : (
            <Clock className="mx-auto h-12 w-12 text-amber-500" />
          )}
          <h1 className="mt-4 text-2xl font-black">
            {rejected ? 'Pendaftaran Ditolak' : 'Verifikasi Campus Runner'}
          </h1>
          {rejected ? (
            <>
              <p className="mt-2 text-sm text-slate-300">
                Admin meminta perbaikan data sebelum pendaftaran dapat disetujui.
              </p>
              <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-950/40 p-4 text-left text-sm text-rose-100">
                {portalProfile?.rejectionReason || 'Alasan penolakan belum dicantumkan. Silakan perbarui profil dan hubungi Admin.'}
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Akun Anda sedang dalam proses verifikasi oleh tim Admin GoCan.
              Fitur penerimaan pesanan akan tersedia setelah akun disetujui.
            </p>
          )}
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/runner-portal/profile" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400">
              <UserRoundPen className="h-4 w-4" />
              {rejected ? 'Ajukan Verifikasi Ulang' : 'Lengkapi Profil Runner'}
            </Link>
            <button type="button" onClick={handleLogout} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-white/5">
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <>
      <div role="status" className="flex items-center justify-center gap-2 bg-emerald-950 px-4 py-3 text-center text-sm font-bold text-emerald-200">
        <CheckCircle className="h-5 w-5 text-emerald-500" />
        Pendaftaran Disetujui! Anda siap menerima pesanan.
      </div>
      <RunnerLayout />
    </>
  );
}
