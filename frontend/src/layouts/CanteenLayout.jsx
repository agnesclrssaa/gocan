import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import BrandLogo from '../components/common/BrandLogo';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  Utensils,
  Bell,
  ChevronRight,
  ExternalLink,
  Menu,
  X,
  LogOut
} from 'lucide-react';

export default function CanteenLayout() {
  const [isOpen, setIsOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const navItems = [
    {
      to: '/canteen-portal',
      end: true,
      label: 'Dashboard',
      icon: LayoutDashboard,
      desc: 'Ringkasan penjualan harian'
    },
    {
      to: '/canteen-portal/orders',
      end: false,
      label: 'Pesanan & QR',
      icon: ClipboardList,
      desc: 'Verifikasi tiket & antrean'
    },
    {
      to: '/canteen-portal/menu',
      end: false,
      label: 'Kelola Menu',
      icon: Utensils,
      desc: 'Katalog stok & harga'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 flex flex-col md:flex-row text-slate-800 font-sans relative selection:bg-emerald-500 selection:text-white">
      {/* Ambient background glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-slate-400/10 rounded-full blur-3xl" />
      </div>

      {/* Mobile Top Header */}
      <div className="md:hidden glass-card-dark text-white px-4 py-3 flex items-center justify-between border-b border-emerald-900/60 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <BrandLogo className="h-8 w-8 rounded-lg" />
          <div>
            <h1 className="text-sm font-bold leading-tight">GoCan Merchant</h1>
            <p className="text-[10px] text-emerald-300">Stan Kantin UKWMS</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`px-2 py-1 rounded-full text-[10px] font-bold border transition ${isOpen
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
          >
            {isOpen ? '🟢 BUKA' : '🔴 TUTUP'}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-200"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Merchant Sidebar (Desktop + Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-full md:h-screen w-64 md:w-72 bg-emerald-950 text-white flex flex-col justify-between border-r border-emerald-900/60 shadow-xl transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        <div className="p-5 flex flex-col gap-6">
          {/* Logo & Stan Info */}
          <div>
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 group">
                <BrandLogo className="h-9 w-9 rounded-xl shadow-md shadow-emerald-500/20" />
                <div>
                  <span className="text-lg font-black tracking-tight text-white">
                    Go<span className="text-emerald-400">Can</span>
                  </span>
                  <span className="ml-1.5 text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-emerald-800/80 text-emerald-200 border border-emerald-700">
                    Merchant
                  </span>
                </div>
              </Link>
            </div>

            {/* Merchant Identity Card */}
            <div className="mt-4 p-3 rounded-xl bg-emerald-900/60 border border-emerald-800/60">
              <p className="text-xs text-emerald-300 font-medium">Stan Aktif:</p>
              <h2 className="text-sm font-bold text-white truncate">Stan 04 - Dapur Bu Siti</h2>
              <p className="text-[11px] text-emerald-400/80">Kantin Utama UKWMS Dinoyo</p>

              {/* Status Toko Toggle */}
              <div className="mt-3 pt-3 border-t border-emerald-800/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                      }`}
                  />
                  <span className="text-xs font-semibold">
                    {isOpen ? 'Stan Buka' : 'Stan Tutup'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isOpen ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOpen ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex flex-col gap-1.5">
            <p className="text-[11px] font-bold text-emerald-400/70 uppercase tracking-wider px-3 mb-1">
              Menu Utama
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition group ${isActive
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'text-emerald-100/90 hover:bg-emerald-900 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-emerald-400 group-hover:text-emerald-200'
                            }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive
                              ? 'bg-slate-950 text-emerald-300'
                              : 'bg-emerald-700 text-emerald-200'
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

        {/* Footer Actions */}
        <div className="p-4 border-t border-emerald-900/80 bg-emerald-950/60 flex flex-col gap-2">
          <Link
            to="/"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-emerald-300 hover:bg-emerald-900/60 hover:text-white transition"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5" />
              Lihat Tampilan Mahasiswa
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-300 hover:bg-rose-950/50 hover:text-rose-200 transition text-left cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar dari Akun Kantin</span>
          </button>
          <div className="pt-2 border-t border-emerald-900/40 flex items-center justify-between text-[11px] text-emerald-400/60 px-1">
            <span>GoCan v1.0 • UKWMS</span>
            <span className="text-emerald-300 font-medium">Merchant Mode</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Desktop Topbar */}
        <header className="hidden md:flex h-16 bg-white/70 backdrop-blur-md border-b border-white/60 px-6 items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Portal Mitra Stan Kantin</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 font-bold flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live Operasional
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200/80 text-xs text-slate-700 font-semibold shadow-2xs">
              <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {isOpen ? 'Stan Menerima Pesanan' : 'Stan Sedang Tutup'}
            </div>
            <Link
              to="/canteen-portal/orders"
              className="p-2 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-white/80 border border-transparent hover:border-emerald-200 relative transition shadow-2xs"
              title="Notifikasi Pesanan"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-bounce"></span>
            </Link>
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
        <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
