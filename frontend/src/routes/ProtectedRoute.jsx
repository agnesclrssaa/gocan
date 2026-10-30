import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PendingApprovalScreen from '../components/common/PendingApprovalScreen';
import { AlertCircle, RefreshCw } from 'lucide-react';

const roleHome = {
  customer: '/',
  canteen: '/canteen-dashboard',
  canteen_staff: '/canteen-dashboard',
  runner: '/runner-portal',
  courier: '/courier-dashboard',
  admin: '/admin-portal',
};

export const ProtectedRoute = ({ allowedRoles = [], requireApproval = true }) => {
  const { user, profile, loading, authError, refreshProfile, signOut } = useAuth();
  const location = useLocation();

  // 1. Tampilkan state loading jika sesi atau profil sedang dimuat
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F4F9]">
        <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm max-w-sm text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#0A2E6E] border-t-transparent" />
          <p className="text-sm font-bold text-slate-800">Memverifikasi Sesi GoCan...</p>
          <p className="text-xs text-slate-500">Mohon tunggu sebentar selagi sistem memeriksa hak akses Anda.</p>
        </div>
      </div>
    );
  }

  // 2. Jika belum login sama sekali, redirect ke Login dengan menyimpan path awal
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 3. Jika user login tetapi profil belum tersedia atau gagal dimuat
  //    PENTING: Jangan pernah meloloskan pengguna ke Outlet jika profil tidak ada!
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0F4F9] p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Profil Akun Belum Siap</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {authError || 'Sistem sedang memuat data hak akses profil Anda dari server. Silakan klik Coba Lagi.'}
          </p>
          <div className="flex gap-2 pt-2">
            <button
              onClick={refreshProfile}
              className="flex-1 py-2.5 px-4 bg-[#0A2E6E] hover:bg-[#082457] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Coba Lagi</span>
            </button>
            <button
              onClick={signOut}
              className="py-2.5 px-4 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Pemeriksaan kecocokan Role (Role-Based Access Control)
  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    // Jika role tidak diizinkan, arahkan ke portal yang sesuai dengan rolenya
    const safeTarget = roleHome[profile.role] || '/unauthorized';
    if (safeTarget !== location.pathname) {
      return <Navigate to={safeTarget} replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  // 5. Pemeriksaan Status Persetujuan Admin (Canteen & Runner)
  //    PENTING: HANYA status 'approved' yang diizinkan mengakses operasi portal.
  //    Status 'pending', 'rejected', null, maupun nilai tak dikenal otomatis diblokir!
  if (requireApproval && (profile.role === 'canteen' || profile.role === 'runner')) {
    if (profile.approval_status !== 'approved') {
      return (
        <PendingApprovalScreen
          profile={profile}
          onRefresh={refreshProfile}
          onLogout={signOut}
        />
      );
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
