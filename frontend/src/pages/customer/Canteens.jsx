import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, MapPin, Search, Star, Store } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import { api } from '../../lib/api';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';

const getCanteenCategory = (canteen) => {
  const category = [
    canteen.category?.name,
    canteen.categoryName,
    canteen.category_name,
    canteen.type,
  ].find((value) => typeof value === 'string' && value.trim());
  return category?.trim() || 'Lainnya';
};

export const Canteens = () => {
  const [canteens, setCanteens] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCanteens = async () => {
    try {
      const data = await api.get('/canteens');
      setCanteens(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Gagal mengambil daftar kantin:', err);
      setCanteens([]);
      setError(err.message || 'Gagal memuat daftar kantin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCanteens();
  }, []);

  const refreshCanteens = () => {
    setLoading(true);
    setError(null);
    fetchCanteens();
  };

  const categories = useMemo(
    () => ['Semua', ...new Set(canteens.map(getCanteenCategory))],
    [canteens]
  );

  const filteredCanteens = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('id-ID');
    const seenIds = new Set();

    return canteens.filter((canteen) => {
      if (!canteen?.id || seenIds.has(canteen.id)) return false;
      seenIds.add(canteen.id);

      const matchesName = (canteen.name || '').toLocaleLowerCase('id-ID').includes(query);
      const matchesCategory =
        selectedCategory === 'Semua' || getCanteenCategory(canteen) === selectedCategory;
      return matchesName && matchesCategory;
    });
  }, [canteens, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#F0F4F9] pb-16 font-sans text-slate-800">
      <Navbar />

      <main className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
        <section className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-2xl bg-[#0A2E6E] p-6 text-white shadow-sm sm:flex-row sm:rounded-3xl sm:p-8">
          <div className="z-10 max-w-lg space-y-3 text-center sm:text-left">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-100">
              GOCAN
            </p>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
              Jelajahi Kantin
            </h1>
            <p className="text-xs font-medium text-blue-100 sm:text-sm">
              Temukan berbagai pilihan kantin yang tersedia di GoCan.
            </p>
          </div>
          <img
            src="/GC-logo.png"
            alt="GoCan"
            className="h-[150px] w-[150px] max-h-none max-w-none shrink-0 rounded-2xl object-contain"
          />
        </section>

        <section className="space-y-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-[#0A2E6E] focus-within:ring-2 focus-within:ring-blue-100">
            <Search className="h-5 w-5 shrink-0 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari nama kantin..."
              aria-label="Cari nama kantin"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold text-slate-500">Kategori:</span>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                aria-pressed={selectedCategory === category}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  selectedCategory === category
                    ? 'border-[#0A2E6E] bg-[#0A2E6E] text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-[#0A2E6E]'
                }`}
              >
                {category === 'Semua' ? 'Semua Kantin' : category}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-[#0A2E6E]">Daftar Kantin</h2>
              {!loading && !error && (
                <p className="mt-1 text-xs text-slate-500">
                  {filteredCanteens.length} kantin ditemukan
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={refreshCanteens}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-[#0A2E6E] disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? 'Memuat...' : 'Segarkan'}
            </button>
          </div>

          {loading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white"
                >
                  <div className="h-44 animate-pulse bg-slate-200" />
                  <div className="space-y-3 p-5">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div
              role="alert"
              className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <span className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                {error}
              </span>
              <button
                type="button"
                onClick={refreshCanteens}
                className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-bold text-red-700"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {!loading && !error && filteredCanteens.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0A2E6E]">
                <Store className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-800">
                {canteens.length === 0 ? 'Belum ada kantin tersedia' : 'Kantin tidak ditemukan'}
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                {canteens.length === 0
                  ? 'Kantin yang tersedia akan muncul di halaman ini.'
                  : 'Coba ubah kata pencarian atau pilih kategori lain.'}
              </p>
            </div>
          )}

          {!loading && !error && filteredCanteens.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCanteens.map((canteen) => {
                const isOpen = canteen.isOpen ?? canteen.is_open;
                const image = canteen.imageUrl || canteen.image_url || FALLBACK_IMAGE;

                return (
                  <article
                    key={canteen.id}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                  >
                    <Link
                      to={`/canteen/${encodeURIComponent(canteen.id)}`}
                      aria-label={`Lihat kantin ${canteen.name}`}
                      className="relative block h-48 overflow-hidden bg-slate-100"
                    >
                      <img
                        src={image}
                        alt={canteen.name || 'Foto kantin'}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.src = FALLBACK_IMAGE;
                        }}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <span
                        className={`absolute bottom-3 left-3 rounded-full px-3 py-1 text-xs font-bold text-white ${
                          isOpen ? 'bg-emerald-600' : 'bg-slate-700'
                        }`}
                      >
                        {isOpen ? 'Buka' : 'Tutup'}
                      </span>
                    </Link>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="min-w-0 text-lg font-extrabold text-slate-900">
                          {canteen.name}
                        </h3>
                        {canteen.rating != null && canteen.rating !== '' && (
                          <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                            {canteen.rating}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-relaxed text-slate-500">
                        {canteen.description || 'Informasi deskripsi belum tersedia.'}
                      </p>
                      <div className="mt-4 flex min-h-5 items-center gap-1.5 text-xs text-slate-500">
                        {canteen.location && (
                          <>
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#0A2E6E]" />
                            <span className="truncate">{canteen.location}</span>
                          </>
                        )}
                      </div>
                      <Link
                        to={`/canteen/${encodeURIComponent(canteen.id)}`}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[#0A2E6E] px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-900"
                      >
                        Lihat Kantin
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Canteens;
