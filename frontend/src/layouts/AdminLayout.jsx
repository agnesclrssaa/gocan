import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import BrandLogo from '../components/common/BrandLogo';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  BarChart3,
  Building2,
  Receipt,
  Database,
  Users,
  ExternalLink,
  Bell,
  Menu,
  X,
  LogOut
} from 'lucide-react';

export default function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

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
      badge: '2 Pending',
      desc: 'User, stan, kurir, gedung'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800 font-sans">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <BrandLogo className="h-8 w-8 rounded-lg" />
          <div>
            <h1 className="text-sm font-bold leading-tight">GoCan Admin</h1>
            <p className="text-[10px] text-slate-400">Pusat Kendali Kampus</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Admin Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-full md:h-screen w-64 md:w-72 bg-slate-900 text-white flex flex-col justify-between border-r border-slate-800 shadow-xl transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        <div className="p-5 flex flex-col gap-6">
          {/* Logo & Platform Info */}
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <BrandLogo className="h-10 w-10 rounded-xl shadow-md shadow-indigo-500/25" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-tight text-white">GoCan</span>
                  <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Super Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Universitas Katolik Widya Mandala</p>
              </div>
            </Link>

            {/* Quick SLA Badge */}
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-amber-300">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400 animate-bounce" />
              <div className="text-xs">
                <p className="font-bold">SLA Alert Aktif</p>
                <p className="text-[10px] text-amber-200/80">Pantau 5 orderan mengambang</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
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
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition group ${isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                            }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive
                              ? 'bg-white text-indigo-700'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
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
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-col gap-2">
          <Link
            to="/"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Kembali ke Web Pemesan
            </span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition text-left cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar dari Admin</span>
          </button>
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>Admin Console v1.0</span>
            <span className="text-emerald-400 font-semibold">System Normal</span>
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
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Database Realtime Terhubung
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
