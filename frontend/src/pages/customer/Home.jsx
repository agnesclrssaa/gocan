import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  AlertCircle,
  SlidersHorizontal,
  Star,
  X,
  PackageX,
} from 'lucide-react';

import { api } from '../../lib/api';
import Navbar from '../../components/common/Navbar';
import MenuCard from '../../components/customer/MenuCard';
import './Home.css';
import SearchInput from '../../components/common/SearchInput';

const categoryAliases = {
  Snack: ['snack', 'cemilan', 'camilan'],
  Cemilan: ['cemilan', 'camilan', 'snack'],
  Minuman: ['minuman', 'drink'],
  Dessert: ['dessert', 'penutup'],
  'Makanan Berat': ['makanan berat', 'main course'],
  Healthy: ['healthy', 'sehat'],
  Kopi: ['kopi', 'coffee'],
};

const matchesMenuCategory = (menu, category) => {
  if (category === 'Semua') return true;

  const menuCategory = menu.category?.toLowerCase().trim();
  const aliases = categoryAliases[category] || [category.toLowerCase()];

  return aliases.includes(menuCategory);
};

export const Home = () => {
  const [canteens, setCanteens] = useState([]);
  const [canteenMenus, setCanteenMenus] = useState({});
  const [bestSellerItems, setBestSellerItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

  // PANEL FILTER
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // PILIHAN SEMENTARA
  const [sortBy, setSortBy] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedCanteen, setSelectedCanteen] = useState('Semua');
  const [selectedLocation, setSelectedLocation] = useState('Semua');

  // FILTER YANG SUDAH DITERAPKAN
  const [appliedSortBy, setAppliedSortBy] = useState('');
  const [appliedCategory, setAppliedCategory] = useState('Semua');
  const [appliedCanteen, setAppliedCanteen] = useState('Semua');
  const [appliedLocation, setAppliedLocation] = useState('Semua');

  // ==========================================
  // 1. AMBIL DATA KANTIN DAN MENU DARI API
  // ==========================================

  const fetchCanteens = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await api.get('/canteens');
      const safeCanteens = Array.isArray(data) ? data : [];

      setCanteens(safeCanteens);

      const menuResults = await Promise.all(
        safeCanteens.map(async (canteen) => {
          try {
            const response = await api.get(
              `/canteens/${canteen.id}/menus`
            );

            const menus = Array.isArray(response)
              ? response
              : [];

            return [canteen.id, menus];

          } catch (err) {
            console.error(
              `Gagal mengambil menu ${canteen.name}:`,
              err
            );

            return [canteen.id, []];
          }
        })
      );

      setCanteenMenus(Object.fromEntries(menuResults));

    } catch (err) {
      console.error('Gagal mengambil daftar kantin:', err);

      setCanteens([]);
      setCanteenMenus({});
      setError(err.message || 'Gagal mengambil daftar kantin.');

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCanteens();
  }, []);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const data = await api.get('/menu/bestsellers');
        setBestSellerItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Gagal mengambil daftar best seller:', err);
        setBestSellerItems([]);
      }
    };

    fetchBestSellers();
  }, []);

  // ==========================================
  // 3. RESET FILTER
  // ==========================================

  const resetFilters = () => {
    setSortBy('');
    setSelectedCategory('Semua');
    setSelectedCanteen('Semua');
    setSelectedLocation('Semua');

    setAppliedSortBy('');
    setAppliedCategory('Semua');
    setAppliedCanteen('Semua');
    setAppliedLocation('Semua');

    setActiveCategory('Semua');
  };

  const selectCategory = (category) => {
    const filterCategory = category === 'Cemilan' ? 'Snack' : category;

    setActiveCategory(category);
    setSelectedCategory(filterCategory);
    setAppliedCategory(filterCategory);
  };

  const showAllMenus = () => selectCategory('Semua');

  // ==========================================
  // 4. TERAPKAN FILTER
  // ==========================================

  const applyFilters = () => {
    setAppliedSortBy(sortBy);
    setAppliedCategory(selectedCategory);
    setAppliedCanteen(selectedCanteen);
    setAppliedLocation(selectedLocation);

    setActiveCategory(
      selectedCategory === 'Snack'
        ? 'Cemilan'
        : selectedCategory
    );

    setIsFilterOpen(false);
  };

  // ==========================================
  // 6. FILTER DAN URUTKAN KANTIN
  // ==========================================

  const filteredCanteens = useMemo(() => {
    return canteens
      .filter((canteen) => {
        const menus = canteenMenus[canteen.id] || [];
        const keyword = searchQuery.toLowerCase().trim();

        const matchesSearch =
          canteen.name?.toLowerCase().includes(keyword) ||
          canteen.location?.toLowerCase().includes(keyword) ||
          canteen.description?.toLowerCase().includes(keyword) ||
          menus.some((menu) =>
            menu.name?.toLowerCase().includes(keyword)
          );

        const matchesCanteen =
          appliedCanteen === 'Semua' ||
          canteen.name === appliedCanteen;

        const matchesLocation =
          appliedLocation === 'Semua' ||
          canteen.location?.toLowerCase().includes('dinoyo');

        const matchesAppliedCategory =
          appliedCategory === 'Semua' ||
          menus.some((menu) =>
            matchesMenuCategory(menu, appliedCategory)
          );

        return (
          matchesSearch &&
          matchesCanteen &&
          matchesLocation &&
          matchesAppliedCategory
        );
      })
      .sort((a, b) => {
        const getPrices = (canteen) => {
          return (canteenMenus[canteen.id] || [])
            .filter(
              (menu) =>
                menu.isAvailable !== false &&
                menu.is_available !== false
            )
            .map((menu) => Number(menu.price))
            .filter((price) => Number.isFinite(price));
        };

        if (appliedSortBy === 'lowest') {
          const pricesA = getPrices(a);
          const pricesB = getPrices(b);

          const minA = pricesA.length
            ? Math.min(...pricesA)
            : Infinity;

          const minB = pricesB.length
            ? Math.min(...pricesB)
            : Infinity;

          return minA - minB;
        }

        if (appliedSortBy === 'highest') {
          const pricesA = getPrices(a);
          const pricesB = getPrices(b);

          const maxA = pricesA.length
            ? Math.max(...pricesA)
            : -Infinity;

          const maxB = pricesB.length
            ? Math.max(...pricesB)
            : -Infinity;

          return maxB - maxA;
        }

        return 0;
      });
  }, [
    canteens,
    canteenMenus,
    searchQuery,
    appliedCanteen,
    appliedLocation,
    appliedCategory,
    appliedSortBy,
  ]);

  // ==========================================
  // 7. DAFTAR MENU BERDASARKAN FILTER
  // ==========================================

  const filteredMenus = useMemo(() => {
    const keyword = searchQuery.toLowerCase().trim();

    let menus = filteredCanteens.flatMap((canteen) => {
      const canteenMenuList = canteenMenus[canteen.id] || [];

      return canteenMenuList.map((menu) => ({
        ...menu,
        canteenId: canteen.id,
        canteen: menu.canteen || canteen,
        canteenName: menu.canteen?.name || menu.canteenName || canteen.name,
        imageUrl:
          menu.imageUrl ||
          menu.image_url ||
          '',
      }));
    });

    menus = menus.filter((menu) => {
      const matchesSearch =
        menu.name?.toLowerCase().includes(keyword) ||
        menu.canteenName?.toLowerCase().includes(keyword) ||
        menu.description?.toLowerCase().includes(keyword);

      const matchesCategory = matchesMenuCategory(
        menu,
        appliedCategory
      );

      return matchesSearch && matchesCategory;
    });

    if (appliedSortBy === 'lowest') {
      menus.sort(
        (a, b) => Number(a.price) - Number(b.price)
      );
    }

    if (appliedSortBy === 'highest') {
      menus.sort(
        (a, b) => Number(b.price) - Number(a.price)
      );
    }

    return menus;
  }, [
    filteredCanteens,
    canteenMenus,
    searchQuery,
    appliedCategory,
    appliedSortBy,
  ]);

  // ==========================================
  // 8. TOMBOL FILTER BIRU GOCAN
  // ==========================================

  const filterButton = (label, active, onClick) => {
    return (
      <button
        key={label}
        type="button"
        onClick={onClick}
        className={`px-3 py-2 rounded-lg border text-xs font-semibold transition whitespace-nowrap ${
          active
            ? 'bg-[#2152B7] text-white border-[#2152B7]'
            : 'bg-slate-100 text-slate-700 border-transparent hover:bg-[#2152B7] hover:text-white'
        }`}
      >
        {label}
      </button>
    );
  };

  // ==========================================
  // 9. TAMPILAN HOME
  // ==========================================

  return (
    <div className="customer-home-page relative isolate min-h-screen bg-[#F0F4F9] text-slate-800 font-sans selection:bg-[#2152B7] selection:text-white pb-28">
      <Navbar />

      <main className="relative z-[1] max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6">

        {/* ================================== */}
        {/* 1. SEARCH BAR */}
        {/* ================================== */}

        <div className="customer-card bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-3 sm:p-4 shadow-sm flex items-center justify-between gap-3">

          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
          />

          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`p-2.5 rounded-xl transition ${
              isFilterOpen
                ? 'bg-[#2152B7] text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {isFilterOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <SlidersHorizontal className="w-5 h-5" />
            )}
          </button>

        </div>


        {/* ================================== */}
        {/* 2. FILTER & URUTKAN */}
        {/* ================================== */}

        {isFilterOpen && (

          <div className="customer-card bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">

              <h2 className="text-sm font-extrabold text-slate-900">
                FILTER & URUTKAN
              </h2>

              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-bold text-red-600 hover:text-red-700"
              >
                Reset
              </button>

            </div>


            {/* URUTKAN */}

            <div className="space-y-2">

              <h3 className="text-xs font-bold text-slate-500">
                URUTKAN
              </h3>

              <div className="flex flex-wrap gap-2">

                {[
                  ['Harga Terendah', 'lowest'],
                  ['Harga Tertinggi', 'highest'],
                ].map(([label, value]) =>
                  filterButton(
                    label,
                    sortBy === value,
                    () =>
                      setSortBy(
                        sortBy === value ? '' : value
                      )
                  )
                )}

                <button
                  type="button"
                  disabled
                  title="Data jumlah penjualan belum tersedia"
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed"
                >
                  Terlaris
                </button>

              </div>

            </div>


            {/* KATEGORI */}

            <div className="space-y-2">

              <h3 className="text-xs font-bold text-slate-500">
                KATEGORI
              </h3>

              <div className="flex flex-wrap gap-2">

                {[
                  'Semua',
                  'Snack',
                  'Minuman',
                  'Dessert',
                  'Makanan Berat',
                  'Healthy',
                ].map((category) =>
                  filterButton(
                    category,
                    selectedCategory === category,
                    () => setSelectedCategory(category)
                  )
                )}

              </div>

            </div>


            {/* PILIHAN KANTIN */}

            <div className="space-y-2">

              <h3 className="text-xs font-bold text-slate-500">
                PILIHAN KANTIN
              </h3>

              <div className="flex flex-wrap gap-2">

                {[
                  'Semua',
                  ...canteens.map((canteen) => canteen.name),
                ]
                  .filter(
                    (name, index, arr) =>
                      arr.indexOf(name) === index
                  )
                  .map((name) =>
                    filterButton(
                      name,
                      selectedCanteen === name,
                      () => setSelectedCanteen(name)
                    )
                  )}

              </div>

            </div>


            {/* LOKASI */}

            <div className="space-y-2">

              <h3 className="text-xs font-bold text-slate-500">
                LOKASI
              </h3>

              <div className="flex flex-wrap gap-2">

                {[
                  'Semua',
                  'Widya Mandala Dinoyo',
                ].map((location) =>
                  filterButton(
                    location,
                    selectedLocation === location,
                    () => setSelectedLocation(location)
                  )
                )}

              </div>

            </div>


            {/* TOMBOL TERAPKAN */}

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">

              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={applyFilters}
                className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-[#2152B7] hover:bg-[#2152B7] transition"
              >
                Terapkan Filter
              </button>

            </div>

          </div>

        )}


        {/* ================================== */}
        {/* 3. PROMO BANNER */}
        {/* ================================== */}

        <div className="customer-card promo-banner text-white rounded-2xl md:rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">

          <div className="promo-banner-copy space-y-3 max-w-lg z-10">

            <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-amber-400 text-slate-950">
              PROMO UTS
            </span>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              Diskon 35% Semua Kantin
            </h1>

            <p className="text-xs sm:text-sm text-white/90 font-medium">
              Pakai kode:{' '}
              <strong className="text-white underline">
                LAPERUTS
              </strong>
            </p>

          </div>

          <div className="promo-banner-art">
            <img
              src="/assets/promo-food.png"
              alt="Makanan dan minuman promo"
              className="promo-food-image"
            />
          </div>

          <div className="promo-sparkles" aria-hidden="true">
            <span className="promo-sparkle promo-sparkle-star promo-sparkle-yellow promo-sparkle-float" style={{ '--sparkle-x': '6%', '--sparkle-y': '15%', '--sparkle-size': '15px', '--sparkle-delay': '0.2s', '--sparkle-duration': '2.7s' }} />
            <span className="promo-sparkle promo-sparkle-star promo-sparkle-white" style={{ '--sparkle-x': '17%', '--sparkle-y': '81%', '--sparkle-size': '20px', '--sparkle-delay': '1.6s', '--sparkle-duration': '3.1s' }} />
            <span className="promo-sparkle promo-sparkle-star promo-sparkle-red" style={{ '--sparkle-x': '29%', '--sparkle-y': '10%', '--sparkle-size': '40px', '--sparkle-delay': '0.9s', '--sparkle-duration': '2.5s' }} />
            <span className="promo-sparkle promo-sparkle-star promo-sparkle-yellow" style={{ '--sparkle-x': '39%', '--sparkle-y': '87%', '--sparkle-size': '12px', '--sparkle-delay': '1.1s', '--sparkle-duration': '3.2s' }} />
            <span className="promo-sparkle promo-sparkle-star promo-sparkle-white promo-sparkle-float" style={{ '--sparkle-x': '50%', '--sparkle-y': '13%', '--sparkle-size': '30px', '--sparkle-delay': '0.7s', '--sparkle-duration': '2.4s' }} />
            <span className="promo-sparkle promo-sparkle-star promo-sparkle-red" style={{ '--sparkle-x': '59%', '--sparkle-y': '82%', '--sparkle-size': '10px', '--sparkle-delay': '2.2s', '--sparkle-duration': '3.7s' }} />
            <span className="promo-sparkle promo-sparkle-star promo-sparkle-yellow" style={{ '--sparkle-x': '70%', '--sparkle-y': '12%', '--sparkle-size': '12px', '--sparkle-delay': '1.3s', '--sparkle-duration': '3s' }} />
            <span className="promo-sparkle promo-sparkle-star promo-sparkle-white" style={{ '--sparkle-x': '81%', '--sparkle-y': '86%', '--sparkle-size': '25px', '--sparkle-delay': '1.4s', '--sparkle-duration': '3.3s' }} />
            <span className="promo-sparkle promo-sparkle-star promo-sparkle-red promo-sparkle-float" style={{ '--sparkle-x': '92%', '--sparkle-y': '15%', '--sparkle-size': '13px', '--sparkle-delay': '1.8s', '--sparkle-duration': '3.6s' }} />
            <span className="promo-sparkle promo-sparkle-star promo-sparkle-yellow promo-sparkle-small" style={{ '--sparkle-x': '4%', '--sparkle-y': '54%', '--sparkle-size': '14px', '--sparkle-delay': '2.4s', '--sparkle-duration': '3.5s' }} />
            <span className="promo-sparkle promo-sparkle-star promo-sparkle-white promo-sparkle-small" style={{ '--sparkle-x': '22%', '--sparkle-y': '37%', '--sparkle-size': '11px', '--sparkle-delay': '1.9s', '--sparkle-duration': '2.8s' }} />
            <span className="promo-sparkle promo-sparkle-star promo-sparkle-red promo-sparkle-small" style={{ '--sparkle-x': '12%', '--sparkle-y': '64%', '--sparkle-size': '13px', '--sparkle-delay': '2.6s', '--sparkle-duration': '3.4s' }} />
            <span className="promo-sparkle promo-sparkle-star promo-sparkle-yellow promo-sparkle-small" style={{ '--sparkle-x': '34%', '--sparkle-y': '65%', '--sparkle-size': '11px', '--sparkle-delay': '0.5s', '--sparkle-duration': '2.9s' }} />
            <span className="promo-sparkle promo-sparkle-star promo-sparkle-white promo-sparkle-small" style={{ '--sparkle-x': '88%', '--sparkle-y': '45%', '--sparkle-size': '10px', '--sparkle-delay': '2.1s', '--sparkle-duration': '3.2s' }} />
            <span className="promo-sparkle promo-sparkle-star promo-sparkle-white promo-sparkle-small" style={{ '--sparkle-x': '97%', '--sparkle-y': '71%', '--sparkle-size': '25px', '--sparkle-delay': '1.2s', '--sparkle-duration': '2.6s' }} />
          </div>

        </div>


        {/* ================================== */}
        {/* 4. CATEGORY PILLS */}
        {/* ================================== */}

        <div className="customer-card bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-3 sm:p-4 shadow-sm flex items-center gap-2 overflow-x-auto">

          {[
            'Semua',
            'Makanan Berat',
            'Minuman',
            'Cemilan',
            'Healthy',
            'Kopi',
          ].map((cat) => (

            <button
              key={cat}
              type="button"
              onClick={() => selectCategory(cat)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap hover:-translate-y-0.5 ${
                activeCategory === cat
                  ? 'bg-[#DC2626] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>

          ))}

        </div>


        {/* ================================== */}
        {/* 5. BEST SELLER KAMPUS */}
        {/* ================================== */}

        <div className="space-y-3">

          <div className="flex items-center justify-between">

            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Best Seller Kampus</span>
            </h2>

            <button
              type="button"
              onClick={() => {
                document
                  .getElementById('daftar-menu')
                  ?.scrollIntoView({
                    behavior: 'smooth',
                  });
              }}
              className="text-xs font-bold text-[#2152B7] hover:underline"
            >
              Lihat Semua
            </button>

          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bestSellerItems
              .filter((item) =>
                matchesMenuCategory(item, activeCategory)
              )
              .map((item) => (
                <Link
                  key={item.id}
                  to={`/canteen/${item.canteenId}`}
                  className="customer-card menu-card-hover bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm group"
                >
                  <div className="aspect-[5/4] w-full overflow-hidden bg-slate-100">
                    <img
                      src={item.imageUrl || item.image_url}
                      alt={item.name}
                      onError={(event) => {
                        event.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                      }}
                      className="w-full h-full object-cover transition-transform duration-500"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-[#2152B7] transition">
                      {item.name}
                    </h3>

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-extrabold text-[#DC2626]">
                        Rp {Number(item.price).toLocaleString('id-ID')}
                      </span>

                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                        {item.totalSold > 0
                          ? `Terjual ${item.totalSold}+`
                          : 'Terjual 0'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

            {bestSellerItems.filter((item) =>
              matchesMenuCategory(item, activeCategory)
            ).length === 0 && (
              <div className="customer-card sm:col-span-2 lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <PackageX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 text-sm">
                  Belum ada best seller untuk kategori ini
                </h3>
                <button
                  type="button"
                  onClick={showAllMenus}
                  className="mt-4 rounded-full bg-[#DC2626] px-4 py-2 text-xs font-bold text-white transition hover:bg-red-600"
                >
                  Tampilkan Semua Menu
                </button>
              </div>
            )}
          </div>

        </div>


        {/* ================================== */}
        {/* 6. DAFTAR MENU */}
        {/* ================================== */}

        <section
          id="daftar-menu"
          className="space-y-4 pt-2"
        >

          <div className="flex items-end justify-between gap-3">

            <div>

              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Daftar Menu
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Pilihan makanan dan minuman dari kantin kampus.
              </p>

            </div>

            <span className="text-xs font-bold text-white bg-[#2152B7] px-3 py-1.5 rounded-full whitespace-nowrap">
              {filteredMenus.length} Menu
            </span>

          </div>


          {/* LOADING MENU */}

          {loading && (

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {[1, 2, 3].map((item) => (

                <div
                  key={item}
                  className="customer-card bg-white rounded-2xl overflow-hidden border border-slate-200 animate-pulse"
                >

                  <div className="h-44 bg-slate-200" />

                  <div className="p-4 space-y-3">

                    <div className="h-4 bg-slate-200 rounded w-3/4" />

                    <div className="h-3 bg-slate-200 rounded w-1/2" />

                    <div className="h-8 bg-slate-200 rounded-full w-full" />

                  </div>

                </div>

              ))}

            </div>

          )}


          {/* MENU LIST */}

          {!loading && !error && filteredMenus.length > 0 && (

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {filteredMenus.map((menu) => {

                const canteen = canteens.find(
                  (item) => item.id === menu.canteenId
                );

                return (

                  <div
                    key={menu.id}
                    className="space-y-2 transition-all duration-300 hover:-translate-y-1.5"
                  >

                    <MenuCard
                      menu={menu}
                      canteen={menu.canteen || canteen}
                    />

                    <Link
                      to={`/canteen/${menu.canteenId}`}
                      className="inline-flex items-center gap-1 px-1 text-xs font-semibold text-slate-500 hover:text-[#2152B7] transition"
                    >
                      Dari {menu.canteen?.name || menu.canteenName}
                    </Link>

                  </div>

                );

              })}

            </div>

          )}


          {/* EMPTY MENU */}

          {!loading && !error && filteredMenus.length === 0 && (

            <div className="customer-card rounded-2xl border border-slate-200 bg-white p-8 text-center">

              <PackageX className="w-12 h-12 text-slate-300 mx-auto mb-3" />

              <h3 className="font-bold text-slate-700 text-sm">
                {appliedCategory !== 'Semua'
                  ? 'Belum ada menu untuk kategori ini'
                  : 'Menu tidak ditemukan'}
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                {appliedCategory !== 'Semua'
                  ? 'Pilih kategori lain atau tampilkan semua menu.'
                  : 'Coba ubah kata pencarian atau filter kamu.'}
              </p>

              {appliedCategory !== 'Semua' && (
                <button
                  type="button"
                  onClick={showAllMenus}
                  className="mt-4 rounded-full bg-[#DC2626] px-4 py-2 text-xs font-bold text-white transition hover:bg-red-600"
                >
                  Tampilkan Semua Menu
                </button>
              )}

            </div>

          )}

        </section>


        {/* ================================== */}
        {/* 7. KANTIN KAMPUS UKWMS */}
        {/* ================================== */}

        <div className="space-y-3 pt-2">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Kantin Kampus UKWMS
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Temukan kantin favoritmu.
              </p>

            </div>

            <button
              type="button"
              onClick={fetchCanteens}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#2152B7] transition cursor-pointer"
            >

              <RefreshCw
                className={`h-3 w-3 ${
                  loading ? 'animate-spin text-[#2152B7]' : ''
                }`}
              />

              <span>Segarkan</span>

            </button>

          </div>


          {/* ERROR */}

          {!loading && error && (

            <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">

              <AlertCircle className="h-4 w-4 shrink-0" />

              <span>{error}</span>

            </div>

          )}


          {/* LOADING KANTIN */}

          {loading && (

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {[1, 2].map((n) => (

                <div
                  key={n}
                  className="customer-card bg-white rounded-2xl p-4 border border-slate-200 animate-pulse flex gap-3"
                >

                  <div className="w-20 h-20 bg-slate-200 rounded-xl shrink-0" />

                  <div className="space-y-2 flex-1 pt-1">

                    <div className="h-4 bg-slate-200 rounded-md w-3/4" />

                    <div className="h-3 bg-slate-200 rounded-md w-1/2" />

                  </div>

                </div>

              ))}

            </div>

          )}


          {/* EMPTY KANTIN */}

          {!loading && !error && filteredCanteens.length === 0 && (

            <div className="customer-card bg-white rounded-2xl border border-slate-200 p-8 text-center">

              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />

              <h3 className="font-bold text-slate-700 text-sm">
                Kantin tidak ditemukan
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                Coba ubah kata pencarian atau filter kamu.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  resetFilters();
                }}
                className="mt-3 text-xs font-bold text-[#2152B7] hover:underline"
              >
                Hapus semua filter
              </button>

            </div>

          )}


          {/* CANTEEN LIST */}

          {!loading && !error && filteredCanteens.length > 0 && (

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {filteredCanteens.map((canteen) => (

                <Link
                  key={canteen.id}
                  to={`/canteen/${canteen.id}`}
                  className="customer-card menu-card-hover bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-4 group"
                >

                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-slate-100">

                    <img
                      src={
                        canteen.imageUrl ||
                        canteen.image_url ||
                        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80'
                      }
                      alt={canteen.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500"
                    />

                  </div>


                  <div className="flex-1 min-w-0">

                    <div className="flex items-center justify-between gap-2">

                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-[#2152B7] transition truncate">
                        {canteen.name}
                      </h3>

                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
                          canteen.isOpen
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {canteen.isOpen ? 'BUKA' : 'TUTUP'}
                      </span>

                    </div>


                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {canteen.location}
                    </p>

                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {canteen.description}
                    </p>

                    <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-600 font-semibold">

                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />

                      <span>
                        {canteen.rating || '4.9'} • Kantin Kampus
                      </span>

                    </div>

                  </div>

                </Link>

              ))}

            </div>

          )}

        </div>

      </main>

    </div>
  );
};

export default Home;