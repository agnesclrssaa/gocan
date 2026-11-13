import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, LoaderCircle, Search, Store, Utensils } from 'lucide-react';
import { api } from '../../lib/api';

const fallbackImage =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=120&q=80';

export default function SearchInput({ value, onChange, className = '' }) {
  const [isFocused, setIsFocused] = useState(false);
  const [searchState, setSearchState] = useState({
    query: '',
    isLoading: false,
    error: '',
    results: { canteens: [], menus: [] },
  });
  const containerRef = useRef(null);
  const query = value.trim();

  useEffect(() => {
    if (!query) return undefined;

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      setSearchState({
        query,
        isLoading: true,
        error: '',
        results: { canteens: [], menus: [] },
      });
      try {
        const response = await api.get('/search', { params: { q: query } });
        if (active) {
          setSearchState({
            query,
            isLoading: false,
            error: '',
            results: {
              canteens: Array.isArray(response.data?.canteens) ? response.data.canteens : [],
              menus: Array.isArray(response.data?.menus) ? response.data.menus : [],
            },
          });
        }
      } catch (searchError) {
        if (active) {
          setSearchState({
            query,
            isLoading: false,
            error: searchError.message || 'Pencarian gagal dimuat.',
            results: { canteens: [], menus: [] },
          });
        }
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    if (!isFocused) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsFocused(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsFocused(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isFocused]);

  const showResults = isFocused && Boolean(query);
  const currentSearch = searchState.query === query ? searchState : null;
  const isLoading = !currentSearch || currentSearch.isLoading;
  const error = currentSearch?.error || '';
  const results = currentSearch?.results || { canteens: [], menus: [] };
  const hasResults = results.canteens.length > 0 || results.menus.length > 0;

  return (
    <div ref={containerRef} className={`relative min-w-0 flex-1 ${className}`}>
      <div className="flex items-center gap-3">
        <Search className="h-5 w-5 shrink-0 text-slate-400" />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Cari menu atau kantin..."
          aria-label="Cari menu atau kantin"
          aria-expanded={showResults}
          aria-controls="gocan-search-results"
          className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {showResults && (
        <div
          id="gocan-search-results"
          className="absolute left-0 right-0 top-full z-50 mt-3 max-h-[min(70vh,34rem)] overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-[0_24px_60px_rgba(15,23,42,0.2)] backdrop-blur-xl"
        >
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-4 text-sm text-slate-500" role="status">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Mencari...
            </div>
          )}
          {error && (
            <p role="alert" className="flex items-center gap-2 px-3 py-4 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}
          {!isLoading && !error && !hasResults && (
            <p className="px-3 py-4 text-sm text-slate-500">
              Tidak ada kantin atau menu yang cocok dengan “{query}”.
            </p>
          )}

          {!isLoading && !error && results.canteens.length > 0 && (
            <section aria-labelledby="search-canteens-heading">
              <h2
                id="search-canteens-heading"
                className="flex items-center gap-2 px-3 pb-2 pt-1 text-xs font-extrabold uppercase tracking-wide text-slate-500"
              >
                <Store className="h-4 w-4" />
                Kantin Ditemukan
              </h2>
              <div className="space-y-1">
                {results.canteens.map((canteen) => (
                  <Link
                    key={canteen.id}
                    to={`/canteen/${encodeURIComponent(canteen.id)}`}
                    onClick={() => setIsFocused(false)}
                    className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                  >
                    <img
                      src={canteen.imageUrl || fallbackImage}
                      alt=""
                      loading="lazy"
                      className="h-11 w-11 rounded-lg object-cover"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-slate-800">
                        {canteen.name}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {canteen.building || canteen.location || 'Kantin GoCan'}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {!isLoading && !error && results.menus.length > 0 && (
            <section
              aria-labelledby="search-menus-heading"
              className={results.canteens.length > 0 ? 'mt-3 border-t border-slate-100 pt-3' : ''}
            >
              <h2
                id="search-menus-heading"
                className="flex items-center gap-2 px-3 pb-2 pt-1 text-xs font-extrabold uppercase tracking-wide text-slate-500"
              >
                <Utensils className="h-4 w-4" />
                Menu Makanan Ditemukan
              </h2>
              <div className="space-y-1">
                {results.menus.map((menu) => (
                  <Link
                    key={menu.id}
                    to={`/canteen/${encodeURIComponent(menu.canteenId)}`}
                    onClick={() => setIsFocused(false)}
                    className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                  >
                    <img
                      src={menu.imageUrl || fallbackImage}
                      alt=""
                      loading="lazy"
                      className="h-11 w-11 rounded-lg object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-slate-800">
                        {menu.name}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {menu.canteen?.name || 'Kantin GoCan'}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-bold text-blue-800">
                      Rp {Number(menu.price).toLocaleString('id-ID')}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
