import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import Navbar from '../../components/common/Navbar';
import MenuCard from '../../components/customer/MenuCard';
import FloatingCart from '../../components/customer/FloatingCart';

export const CanteenDetail = () => {
  const { canteenId } = useParams();
  const [canteen, setCanteen] = useState(null);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Semua');

  useEffect(() => {
    const fetchCanteenAndMenus = async () => {
      try {
        setLoading(true);
        setError(null);
        setActiveCategory('Semua');

        const [canteens, menuData] = await Promise.all([
          api.get('/canteens'),
          api.get(`/canteens/${encodeURIComponent(canteenId)}/menus`),
        ]);
        const selectedCanteen = canteens.find((item) => item.id === canteenId);
        if (!selectedCanteen) {
          throw new Error('Kantin tidak ditemukan.');
        }
        setCanteen(selectedCanteen);
        setMenus(menuData);
      } catch (err) {
        console.error('Gagal memuat detail kantin & menu:', err);
        setCanteen(null);
        setMenus([]);
        setError(err.message || 'Gagal memuat detail kantin dan menu.');
      } finally {
        setLoading(false);
      }
    };

    fetchCanteenAndMenus();
  }, [canteenId]);

  const categories = useMemo(
    () => ['Semua', ...new Set(menus.map((menu) => menu.category?.trim()).filter(Boolean))],
    [menus]
  );

  const filteredMenus = useMemo(() => {
    if (activeCategory === 'Semua') return menus;
    return menus.filter((item) => item.category?.trim() === activeCategory);
  }, [menus, activeCategory]);

  return (
    <div className="min-h-screen bg-[#F0F4F9] text-slate-800 font-sans selection:bg-[#0A2E6E] selection:text-white pb-32">
      <Navbar />

      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6">
        {/* Back navigation & Title */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-2xs hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0A2E6E] tracking-tight">
            Detail Kantin
          </h1>
        </div>

        {loading && (
          <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-600">
            Memuat kantin dan menu...
          </p>
        )}
        {!loading && error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* CANTEEN HERO CARD (Matching gocan-canteen-detail.png) */}
        {canteen && (
          <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Image: Canteen Dining */}
            <div className="md:col-span-5 h-56 sm:h-64 rounded-2xl overflow-hidden bg-slate-100">
              <img
                src={canteen.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80'}
                alt={canteen.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right Information */}
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2E6E]">
                  {canteen.name}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                  canteen.isOpen
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {canteen.isOpen ? 'BUKA' : 'TUTUP'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                {canteen.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 pt-1">
                <div className="flex items-center gap-1 text-amber-600">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span>{canteen.rating || '4.9 (1.2k Rating)'}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <MapPin className="w-4 h-4 text-[#DC2626]" />
                  <span>{canteen.location || 'Area Kantin UKWMS'}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Jam Operasional: Senin - Sabtu (08:00 - 16:00)
              </p>

              {/* Category Pills matching mockup */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-[#DC2626] text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DAFTAR MENU SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-[#0A2E6E] tracking-tight">
              Daftar Menu
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Kategori aktif: <strong className="text-slate-900">{activeCategory}</strong>
            </span>
          </div>

          {/* 2-Column Menu Grid (Matching gocan-canteen-detail.png) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredMenus.map((menu) => (
              <MenuCard key={menu.id} menu={menu} canteen={canteen} />
            ))}
          </div>
          {filteredMenus.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center">
              <p className="font-bold text-slate-700">
                {menus.length === 0 ? 'Menu kantin belum tersedia.' : 'Tidak ada menu di kategori ini.'}
              </p>
              {menus.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveCategory('Semua')}
                  className="mt-2 text-sm font-bold text-[#0A2E6E] hover:underline"
                >
                  Tampilkan semua menu
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      <FloatingCart />
    </div>
  );
};

export default CanteenDetail;
