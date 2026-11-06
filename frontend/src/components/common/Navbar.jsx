import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  LogOut,
  Store,
  Bike,
  ShieldCheck,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import BrandLogo from './BrandLogo';

const DELIVERY_LOCATION_KEY = 'gocan-delivery-location';
const DEFAULT_DELIVERY_LOCATION = 'Gedung Benedictus, Lt. 3';

export const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [deliveryLocation, setDeliveryLocation] = useState(() => {
    try {
      return localStorage.getItem(DELIVERY_LOCATION_KEY) || DEFAULT_DELIVERY_LOCATION;
    } catch (error) {
      console.error('Gagal membaca lokasi pengantaran dari localStorage:', error);
      return DEFAULT_DELIVERY_LOCATION;
    }
  });
  const [locationInput, setLocationInput] = useState(deliveryLocation);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [locationError, setLocationError] = useState('');
  const locationPickerRef = useRef(null);

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    if (!isLocationOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (!locationPickerRef.current?.contains(event.target)) {
        setIsLocationOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsLocationOpen(false);
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLocationOpen]);

  const handleSaveLocation = (event) => {
    event.preventDefault();
    const nextLocation = locationInput.trim();
    if (!nextLocation) {
      setLocationError('Masukkan lokasi pengantaran terlebih dahulu.');
      return;
    }

    try {
      localStorage.setItem(DELIVERY_LOCATION_KEY, nextLocation);
      setDeliveryLocation(nextLocation);
      setLocationError('');
      setIsLocationOpen(false);
    } catch (error) {
      console.error('Gagal menyimpan lokasi pengantaran ke localStorage:', error);
      setLocationError('Lokasi gagal disimpan. Silakan coba lagi.');
    }
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
            to={profile?.role === 'customer' ? '/canteens' : '/canteen/canteen-pak-brazil'}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
              profile?.role === 'customer' && location.pathname === '/canteens'
                ? 'bg-[#0A2E6E] text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            Kantin
          </Link>
        </nav>

        {/* Right Section: Delivery Location & Cart & User Menu */}
        <div className="flex items-center gap-2.5">
          <div className="relative" ref={locationPickerRef}>
            <button
              type="button"
              onClick={() => {
                setLocationInput(deliveryLocation);
                setLocationError('');
                setIsLocationOpen((isOpen) => !isOpen);
              }}
              className="flex max-w-[42vw] sm:max-w-64 items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs hover:bg-blue-50 hover:border-blue-200 transition"
              aria-expanded={isLocationOpen}
              aria-controls="delivery-location-popover"
              aria-label={`Ubah lokasi pengantaran. Lokasi saat ini: ${deliveryLocation}`}
            >
              <MapPin className="h-4 w-4 shrink-0 text-[#0A2E6E]" />
              <span className="hidden sm:inline text-slate-500 font-medium">Kirim ke:</span>
              <strong className="hidden sm:block truncate text-[#0A2E6E] font-bold">
                {deliveryLocation}
              </strong>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" />
            </button>

            {isLocationOpen && (
              <div
                id="delivery-location-popover"
                className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold text-[#0A2E6E]">
                    Pilih Lokasi Pengantaran
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsLocationOpen(false)}
                    className="rounded-full px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Tutup pilihan lokasi"
                  >
                    Tutup
                  </button>
                </div>
                <form onSubmit={handleSaveLocation}>
                  <label
                    htmlFor="delivery-location-input"
                    className="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    Lokasi pengantaran
                  </label>
                  <input
                    id="delivery-location-input"
                    type="text"
                    value={locationInput}
                    onChange={(event) => {
                      setLocationInput(event.target.value);
                      setLocationError('');
                    }}
                    placeholder="Masukkan lokasi"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0A2E6E] focus:ring-2 focus:ring-blue-100"
                  />
                  {locationError && (
                    <p className="mt-2 text-xs text-red-600" role="alert">
                      {locationError}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="mt-3 w-full rounded-xl bg-[#0A2E6E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900"
                  >
                    Simpan Lokasi
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Customer cart access is rendered as a fixed floating button outside the navbar. */}
          {profile?.role !== 'customer' && (
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
          )}

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
                  to="/canteen-dashboard"
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
              {profile?.role === 'courier' && (
                <Link
                  to="/courier-dashboard"
                  className="hidden xl:inline-flex items-center gap-1 text-xs text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-xl font-bold transition"
                  title="Dashboard Kurir"
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Kurir</span>
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
