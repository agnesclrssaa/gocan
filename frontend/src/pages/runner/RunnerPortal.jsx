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
import RunnerBackgroundDecoration from '../../components/common/RunnerBackgroundDecoration';
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
      <div className="runner-theme flex min-h-screen items-center justify-center bg-white text-slate-700">
        <RunnerBackgroundDecoration />
        <p role="status" className="relative z-10 text-sm font-semibold">Memuat status pendaftaran Runner...</p>
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
      <main className="runner-theme flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-10 text-slate-800">
        <RunnerBackgroundDecoration />
        <section className={`relative z-10 w-full max-w-xl rounded-3xl border bg-white p-7 text-center shadow-lg ${rejected ? 'border-red-200' : 'border-[#D6E2F0]'}`}>
          {profileError && <p role="alert" className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{profileError}</p>}
          {rejected ? (
            <AlertCircle className="mx-auto h-12 w-12 text-[#ED2028]" />
          ) : (
            <Clock className="mx-auto h-12 w-12 text-[#F7BD00]" />
          )}
          <h1 className="mt-4 text-2xl font-black">
            {rejected ? 'Pendaftaran Ditolak' : 'Verifikasi Campus Runner'}
          </h1>
          {rejected ? (
            <>
              <p className="mt-2 text-sm text-slate-600">
                Admin meminta perbaikan data sebelum pendaftaran dapat disetujui.
              </p>
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-left text-sm text-red-800">
                {portalProfile?.rejectionReason || 'Alasan penolakan belum dicantumkan. Silakan perbarui profil dan hubungi Admin.'}
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Akun Anda sedang dalam proses verifikasi oleh tim Admin GoCan.
              Fitur penerimaan pesanan akan tersedia setelah akun disetujui.
            </p>
          )}
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/runner-portal/profile" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2152B7] px-5 py-3 text-sm font-bold text-white hover:bg-[#193F91]">
              <UserRoundPen className="h-4 w-4" />
              {rejected ? 'Ajukan Verifikasi Ulang' : 'Lengkapi Profil Runner'}
            </Link>
            <button type="button" onClick={handleLogout} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
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
      <div role="status" className="flex items-center justify-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-3 text-center text-sm font-bold text-[#2152B7]">
        <CheckCircle className="h-5 w-5 text-[#2152B7]" />
        Pendaftaran Disetujui! Anda siap menerima pesanan.
      </div>
      <RunnerLayout />
    </>
  );
}
