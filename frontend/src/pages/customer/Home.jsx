import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, AlertCircle, SlidersHorizontal, Star } from 'lucide-react';
import { api } from '../../lib/api';
import Navbar from '../../components/common/Navbar';
import FloatingCart from '../../components/customer/FloatingCart';

export const Home = () => {
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Makanan Berat');

  const fetchCanteens = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.get('/canteens');
      setCanteens(data);
    } catch (err) {
      console.error('Gagal mengambil daftar kantin:', err);
      setCanteens([]);
      setError(err.message || 'Gagal mengambil daftar kantin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCanteens();
  }, []);

  const filteredCanteens = canteens.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F0F4F9] text-slate-800 font-sans selection:bg-[#0A2E6E] selection:text-white pb-28">
      <Navbar />

      <main className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6">
        {/* 1. SEARCH BAR (Matching gocan-customer-home.png) */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-3 sm:p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Siomay, Kopi, Ayam Geprek..."
              className="w-full text-xs sm:text-sm font-medium text-slate-900 bg-transparent placeholder-slate-400 focus:outline-hidden"
            />
          </div>
          <button
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* 2. PROMO BANNER (Deep Navy #0A2E6E Matching Mockup) */}
        <div className="bg-[#0A2E6E] text-white rounded-2xl md:rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-lg z-10">
            <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-amber-400 text-slate-950">
              PROMO UTS
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              Diskon 35% Semua Kantin
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 font-medium">
              Pakai kode: <strong className="text-white underline">LAPERUTS</strong>
            </p>
          </div>

          <div className="w-48 sm:w-64 h-36 rounded-2xl overflow-hidden shrink-0 shadow-lg border-2 border-white/20">
            <img
              src="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80"
              alt="Promo Dish"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* 3. CATEGORY PILLS */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-3 sm:p-4 shadow-xs flex items-center gap-2 overflow-x-auto">
          {['Makanan Berat', 'Minuman', 'Cemilan', 'Healthy', 'Kopi'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-[#DC2626] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 4. BEST SELLER KAMPUS 🔥 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Best Seller Kampus</span>
              <span>🔥</span>
            </h2>
            <button type="button" className="text-xs font-bold text-[#0A2E6E] hover:underline">
              Lihat Semua
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Best Seller Card 1 */}
            <Link
              to="/canteen/canteen-pak-brazil"
              className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-[#0A2E6E]/40 transition group"
            >
              <div className="h-44 sm:h-52 w-full overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80"
                  alt="Kulit Ayam Geprek"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-[#0A2E6E] transition">
                  Kulit Ayam Geprek Pak Brazil
                </h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-extrabold text-[#DC2626]">
                    Rp 15.000
                  </span>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>4.9 (120+ order)</span>
                  </span>
                </div>
              </div>
            </Link>

            {/* Best Seller Card 2 */}
            <Link
              to="/canteen/canteen-pak-brazil"
              className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-[#0A2E6E]/40 transition group"
            >
              <div className="h-44 sm:h-52 w-full overflow-hidden bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80"
                  alt="Es Thai Tea"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-4">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-[#0A2E6E] transition">
                  Es Thai Tea Anak Kampung
                </h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-extrabold text-[#DC2626]">
                    Rp 8.000
                  </span>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>4.8 (300+ order)</span>
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* 5. KANTIN KAMPUS UKWMS */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Kantin Kampus UKWMS
            </h2>
            <button
              onClick={fetchCanteens}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#0A2E6E] transition cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin text-[#0A2E6E]' : ''}`} />
              <span>Segarkan</span>
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse flex gap-3">
                  <div className="w-20 h-20 bg-slate-200 rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1 pt-1">
                    <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Canteen List */}
          {!loading && filteredCanteens.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCanteens.map((canteen) => (
                <Link
                  key={canteen.id}
                  to={`/canteen/${canteen.id}`}
                  className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-4 shadow-xs hover:border-[#0A2E6E]/40 transition flex items-center gap-4 group"
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
                    <img
                      src={canteen.imageUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80'}
                      alt={canteen.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-[#0A2E6E] transition truncate">
                        {canteen.name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
                        canteen.isOpen
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {canteen.isOpen ? 'BUKA' : 'TUTUP'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{canteen.location}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{canteen.description}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-600 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{canteen.rating || '4.9'} • Minuman & Ayam Geprek</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <FloatingCart />
    </div>
  );
};

export default Home;
