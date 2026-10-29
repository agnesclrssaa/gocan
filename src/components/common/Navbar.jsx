import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, LogOut, User, Store, Bike, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import BrandLogo from './BrandLogo';

export const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const isHomeActive = location.pathname === '/';
  const isHistoryActive = location.pathname === '/history';
  const isCartActive = location.pathname === '/cart';

  return (
    <header className="px-3 sm:px-6 pt-3 sm:pt-4 sticky top-0 z-40 bg-[#F0F4F9]/90 backdrop-blur-md font-sans">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-xs px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo GoCan */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <BrandLogo className="h-10 w-10 rounded-2xl transition group-hover:scale-105" />
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-extrabold tracking-tight text-[#0A2E6E]">
              Go<span className="text-[#DC2626]">Can</span>
            </span>
          </div>
        </Link>

        {/* Center Navigation Pills Matching Mockup */}
        <nav className="hidden md:flex items-center gap-2">
          <Link
            to="/"
            className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
              isHomeActive
                ? 'bg-[#0A2E6E] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            Beranda
          </Link>

          <Link
            to="/history"
            className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
              isHistoryActive
                ? 'bg-[#0A2E6E] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            Pesanan
          </Link>

          <Link
            to="/canteen/canteen-pak-brazil"
            className="px-6 py-2 rounded-full text-sm font-semibold bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50 transition"
          >
            Kantin
          </Link>
        </nav>

        {/* Right Section: Delivery Location & Cart & User Menu */}
        <div className="flex items-center gap-2.5">
          {/* Location Badge (Matching gocan-customer-home.png) */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
              alt="Avatar"
              className="w-5 h-5 rounded-full object-cover"
            />
            <span className="text-slate-500 font-medium">Kirim ke:</span>
            <strong className="text-[#0A2E6E] font-bold">Gedung Benedictus, Lt. 3</strong>
          </div>

          {/* Cart Button */}
          <Link
            to="/cart"
            className={`relative flex items-center justify-center h-10 w-10 rounded-full border transition ${
              isCartActive
                ? 'bg-[#0A2E6E] text-white border-[#0A2E6E]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            aria-label="Keranjang Belanja"
          >
            <ShoppingBag className="h-4.5 w-4.5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-extrabold text-white shadow-xs animate-in zoom-in-75">
                {totalItems}
              </span>
            )}
          </Link>

          {/* User Profile / Portal / Logout Section */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
              {/* Portal Links (sesuai role) */}
              {profile?.role === 'admin' && (
                <Link
                  to="/admin-portal"
                  className="hidden xl:inline-flex items-center gap-1 text-xs text-[#0A2E6E] bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-xl font-bold transition"
                  title="Pusat Kendali Admin"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </Link>
              )}
              {profile?.role === 'canteen' && (
                <Link
                  to="/canteen-portal"
                  className="hidden xl:inline-flex items-center gap-1 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl font-bold transition"
                  title="Portal Mitra Kantin"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Kantin</span>
                </Link>
              )}
              {profile?.role === 'runner' && (
                <Link
                  to="/runner-portal"
                  className="hidden xl:inline-flex items-center gap-1 text-xs text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-xl font-bold transition"
                  title="Portal Runner"
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Runner</span>
                </Link>
              )}

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#DC2626] hover:bg-red-50 px-2.5 py-1.5 rounded-xl font-medium transition cursor-pointer"
                title="Keluar dari akun GoCan"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-1.5 border-l border-slate-200">
              <Link
                to="/login"
                className="text-xs font-bold text-[#0A2E6E] hover:bg-blue-50 px-3 py-1.5 rounded-xl transition"
              >
                Masuk
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
