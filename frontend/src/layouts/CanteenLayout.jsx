import { useCallback, useEffect, useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import BrandLogo from '../components/common/BrandLogo';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
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
  const [canteen, setCanteen] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [canteenLoading, setCanteenLoading] = useState(true);
  const [canteenError, setCanteenError] = useState(null);
  const [updatingStoreStatus, setUpdatingStoreStatus] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const refreshCanteen = useCallback(async () => {
    setCanteenLoading(true);
    setCanteenError(null);
    try {
      const currentCanteen = await api.get('/canteens/mine');
      setCanteen(currentCanteen);
      setIsOpen(currentCanteen.isOpen);
      return currentCanteen;
    } catch (error) {
      setCanteenError(`Gagal memuat data kantin: ${error.message}`);
      return null;
    } finally {
      setCanteenLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCanteen();
  }, [refreshCanteen]);

  const handleStoreStatusChange = async () => {
    if (updatingStoreStatus) return;
    setUpdatingStoreStatus(true);
    setCanteenError(null);
    try {
      const updatedCanteen = await api.patch('/canteens/mine', { isOpen: !isOpen });
      setCanteen((current) => ({ ...current, ...updatedCanteen }));
      setIsOpen(updatedCanteen.isOpen);
    } catch (error) {
      setCanteenError(`Gagal mengubah status stan: ${error.message}`);
    } finally {
      setUpdatingStoreStatus(false);
    }
  };

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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans selection:bg-blue-200 selection:text-blue-950">

      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#123B72] text-white px-4 py-3 flex items-center justify-between border-b border-[#0D2C55] sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <BrandLogo className="h-8 w-8 rounded-lg" />
          <div>
            <h1 className="text-sm font-bold leading-tight">GoCan Merchant</h1>
            <p className="text-[10px] text-blue-200">Stan Kantin UKWMS</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleStoreStatusChange}
            disabled={canteenLoading || updatingStoreStatus}
            className={`px-2 py-1 rounded-full text-[10px] font-bold border transition ${isOpen
                ? 'bg-blue-500/20 text-blue-100 border-blue-400/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              } disabled:cursor-wait disabled:opacity-60`}
          >
            {isOpen ? '🟢 BUKA' : '🔴 TUTUP'}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-blue-800 hover:bg-blue-700 text-blue-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Merchant Sidebar (Desktop + Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-full md:h-screen w-64 md:w-72 bg-[#123B72] text-white flex flex-col justify-between border-r border-[#0D2C55] transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        <div className="p-5 flex flex-col gap-6">
          {/* Logo & Stan Info */}
          <div>
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 group">
                <BrandLogo className="h-9 w-9 rounded-xl" />
                <div>
                  <span className="text-lg font-black tracking-tight text-white">
                    Go<span className="text-blue-300">Can</span>
                  </span>
                  <span className="ml-1.5 text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-blue-800 text-blue-100 border border-blue-700">
                    Merchant
                  </span>
                </div>
              </Link>
            </div>

            {/* Merchant Identity Card */}
            <div className="mt-4 p-3 rounded-xl bg-blue-900/50 border border-blue-800">
              <p className="text-xs text-blue-200 font-medium">Akun Mitra:</p>
              <h2 className="text-sm font-bold text-white truncate">{user?.name || 'Mitra Kantin'}</h2>
              <p className="text-[11px] text-blue-200 truncate">{user?.email}</p>

              {/* Status Toko Toggle */}
              <div className="mt-3 pt-3 border-t border-blue-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-blue-300' : 'bg-rose-500'
                      }`}
                  />
                  <span className="text-xs font-semibold">
                    {isOpen ? 'Stan Buka' : 'Stan Tutup'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleStoreStatusChange}
                  disabled={canteenLoading || updatingStoreStatus}
                  aria-label={isOpen ? 'Tutup stan' : 'Buka stan'}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:cursor-wait disabled:opacity-60 ${isOpen ? 'bg-blue-500' : 'bg-slate-700'
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
            <p className="text-[11px] font-bold text-blue-200 uppercase tracking-wider px-3 mb-1">
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
                      ? 'bg-blue-500 text-white font-bold'
                      : 'text-blue-100 hover:bg-blue-900 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-200 group-hover:text-white'
                            }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive
                              ? 'bg-blue-950 text-blue-100'
                              : 'bg-blue-800 text-blue-100'
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
        <div className="p-4 border-t border-blue-800 bg-[#102F5A] flex flex-col gap-2">
          <Link
            to="/"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-blue-200 hover:bg-blue-900 hover:text-white transition"
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
          <div className="pt-2 border-t border-blue-800 flex items-center justify-between text-[11px] text-blue-300 px-1">
            <span>GoCan v1.0 • UKWMS</span>
            <span className="text-blue-200 font-medium">Merchant Mode</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Desktop Topbar */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 px-6 items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Portal Mitra Stan Kantin</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Live Operasional
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-semibold">
              <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-blue-600' : 'bg-rose-500'}`} />
              {isOpen ? 'Stan Menerima Pesanan' : 'Stan Sedang Tutup'}
            </div>
            <Link
              to="/canteen-portal/orders"
              className="p-2 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 relative transition"
              title="Notifikasi Pesanan"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white"></span>
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
          {canteenError && (
            <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {canteenError}
              <button type="button" onClick={refreshCanteen} className="ml-3 font-bold underline">
                Coba lagi
              </button>
            </div>
          )}
          {canteenLoading && !canteen ? (
            <div role="status" className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Memuat data kantin...
            </div>
          ) : (
            <Outlet context={{
              canteen,
              refreshCanteen,
              isOpen,
              updateStoreStatus: handleStoreStatusChange,
              updatingStoreStatus,
            }} />
          )}
        </div>
      </main>
    </div>
  );
}
