import { useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import BrandLogo from '../components/common/BrandLogo';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  BarChart3,
  Building2,
  MapPinned,
  Receipt,
  Database,
  Bike,
  ExternalLink,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { ADMIN_OVERVIEW_REFRESH_EVENT, api } from '../lib/api';
import './RoleMobile.css';
import './MerchantSidebarDecor.css';

function AdminSidebarDecor() {
  return (
    <div className="merchant-sidebar-decor absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="merchant-decor-red" />
      <div className="merchant-decor-yellow" />
      <div className="merchant-decor-blue" />
      <div className="merchant-decor-cream" />
      <div className="merchant-decor-arc merchant-arc-top" />
      <div className="merchant-decor-arc merchant-arc-bottom" />
      <span className="merchant-star star-yellow star-one" />
      <span className="merchant-star star-red star-two" />
      <span className="merchant-star star-blue star-three" />
      <span className="merchant-star star-yellow star-four" />
      <span className="merchant-star star-red star-five" />
      <span className="merchant-dot dot-yellow dot-one" />
      <span className="merchant-dot dot-red dot-two" />
      <span className="merchant-dot dot-blue dot-three" />
    </div>
  );
}

export default function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState('');
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const loadOverview = async () => {
      try {
        const data = await api.get('/admin/overview');
        if (active) {
          setOverview(data);
          setOverviewError('');
        }
      } catch (error) {
        if (active) setOverviewError(error.message || 'Gagal memuat status admin.');
      }
    };
    const handleOverviewRefresh = () => {
      void loadOverview();
    };

    handleOverviewRefresh();
    window.addEventListener(ADMIN_OVERVIEW_REFRESH_EVENT, handleOverviewRefresh);
    return () => {
      active = false;
      window.removeEventListener(ADMIN_OVERVIEW_REFRESH_EVENT, handleOverviewRefresh);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const adminNav = [
    {
      to: '/admin-portal',
      end: true,
      label: 'Dashboard & SLA',
      icon: BarChart3,
      desc: 'GMV & Monitoring Orderan'
    },
    {
      to: '/admin-portal/campus',
      end: false,
      label: 'Kampus & Kemitraan',
      icon: Building2,
      badge: 'UKWMS',
      desc: 'MoU & Stan Aktif'
    },
    {
      to: '/admin-portal/campus-management',
      end: false,
      label: 'Manajemen Kampus',
      icon: MapPinned,
      desc: 'Daftar & status kampus'
    },
    {
      to: '/admin-portal/finance',
      end: false,
      label: 'Laporan Finansial (5%)',
      icon: Receipt,
      desc: 'Bagi hasil fee & payout'
    },
    {
      to: '/admin-portal/management',
      end: false,
      label: 'Master Data & Approval',
      icon: Database,
      badge: overview?.metrics?.pendingApprovals ? `${overview.metrics.pendingApprovals} Pending` : null,
      desc: 'User, stan, kurir, gedung'
    },
    {
      to: '/admin-portal/runners',
      end: false,
      label: 'Pendaftaran Runner',
      icon: Bike,
      badge: overview?.metrics?.pendingApprovals ? `${overview.metrics.pendingApprovals} Pending` : null,
      desc: 'Identitas & pencairan dana'
    }
  ];

  return (
    <div className="admin-layout min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800 font-sans">
      {/* Mobile Top Header */}
      <div className="relative isolate sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between overflow-hidden border-b border-[#0D2C55] bg-[#123B72] px-4 text-white md:hidden">
        <AdminSidebarDecor />
        <div className="relative z-10 flex min-w-0 items-center gap-2.5">
          <BrandLogo className="h-9 w-9 shrink-0 rounded-xl" />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="text-base font-black tracking-tight">
                <span className="text-[#ED2028]">Go</span>
                <span className="text-[#ffd612]">Can</span>
              </span>
              <span className="truncate rounded-md border border-[#ffd612]/50 bg-[#ffd612] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-[#123B72]">
                Super Admin
              </span>
            </div>
            <p className="max-w-[58vw] truncate text-[10px] font-medium text-blue-100">
              Universitas Katolik Widya Mandala
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Tutup menu admin' : 'Buka menu admin'}
          aria-expanded={mobileMenuOpen}
          aria-controls="admin-mobile-navigation"
          className="role-mobile-menu-toggle relative z-10 shrink-0 border border-white/15 bg-blue-950/40 text-white transition hover:bg-blue-900"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Admin Sidebar */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Tutup menu admin"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-[35] bg-slate-950/45 md:hidden"
        />
      )}
      <aside
        id="admin-mobile-navigation"
        aria-label="Navigasi Admin"
        className={`role-mobile-drawer fixed md:sticky left-0 md:top-0 z-40 isolate overflow-x-hidden overflow-y-auto overscroll-contain w-64 md:w-72 bg-[#123B72] text-white flex flex-col justify-between border-r border-[#0D2C55] rounded-r-2xl md:rounded-r-none shadow-xl ${mobileMenuOpen ? 'role-mobile-drawer-open visible translate-x-0' : 'invisible -translate-x-full md:visible md:translate-x-0'
          }`}
      >
        <AdminSidebarDecor />
        <div className="relative z-10 p-5 flex flex-col gap-6">
          {/* Logo & Platform Info */}
          <div>
            <Link to="/" className="flex min-w-0 items-center gap-2.5">
              <BrandLogo className="relative z-10 h-10 w-10 shrink-0 rounded-xl object-contain shadow-md shadow-blue-950/25" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-tight">
                    <span className="text-[#ED2028]">Go</span>
                    <span className="text-[#ffd612]">Can</span>
                  </span>
                  <span className="rounded-md border border-[#ffd612]/50 bg-[#ffd612] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#123B72]">
                    Super Admin
                  </span>
                </div>
                <p className="break-words text-[11px] font-medium leading-tight text-blue-100 md:break-normal md:leading-normal">Universitas Katolik Widya Mandala</p>
              </div>
            </Link>

            {/* Quick SLA Badge */}
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/40 bg-[#ffd612] p-4 text-[#123B72] shadow-lg shadow-blue-950/15">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/75">
                <ShieldAlert className="h-6 w-6 text-[#dc0413]" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-extrabold">Pesanan siap antar</p>
                <p className="mt-0.5 text-2xl font-black leading-none">
                  {overview ? overview?.metrics?.unassignedOrderCount ?? 0 : '—'}
                </p>
                <p className="mt-1 text-[10px] font-semibold text-[#123B72]/80">
                  {overview
                    ? 'belum ditugaskan'
                    : overviewError || 'Memuat status pesanan'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav aria-label="Menu Pengawasan" className="flex flex-col gap-2">
            <p className="mb-1 px-3 text-[11px] font-extrabold uppercase tracking-wider text-[#ffd612]">
              Menu Pengawasan
            </p>
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `group flex min-w-0 items-center justify-between gap-2 rounded-xl border-l-4 px-3 py-3 text-sm font-semibold transition-colors ${isActive
                      ? 'border-[#ffd612] bg-[#116aa5] text-white font-extrabold shadow-md shadow-blue-950/20'
                      : 'border-transparent text-blue-100 hover:border-white/30 hover:bg-blue-900/70 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex min-w-0 items-center gap-3">
                        <Icon
                          className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-blue-200 group-hover:text-white'
                            }`}
                        />
                        <span className="min-w-0 leading-snug">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-extrabold ${item.badge === 'UKWMS'
                              ? 'border border-white/20 bg-blue-950/50 text-blue-100'
                              : 'bg-[#ffd612] text-[#123B72]'
                            }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex flex-col gap-2 border-t border-white/15 bg-[#0D315D]/90 p-4">
          <Link
            to="/"
            className="flex min-w-0 items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-blue-100 transition hover:bg-blue-900/70 hover:text-white"
          >
            <span className="flex min-w-0 items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Kembali ke Web Pemesan</span>
            </span>
          </Link>
          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-blue-100 transition hover:bg-blue-900/70 hover:text-white"
          >
            Edit Profil Akun
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-rose-200 transition hover:bg-rose-950/40 hover:text-white cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar dari Admin</span>
          </button>
          <div className="grid gap-1 border-t border-white/15 px-1 pt-3 text-[11px] text-blue-200">
            <span>Admin Console v1.0</span>
            <span className="font-semibold text-[#ffd612]">System Normal</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 px-6 items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">Pusat Kendali Super Admin</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
              Kemitraan UKWMS
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium">
            <span className={`w-2 h-2 rounded-full ${overview ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {overview ? 'API admin terhubung' : overviewError ? 'API admin tidak tersedia' : 'Memuat koneksi API'}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </header>

        {/* Page Outlet */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
