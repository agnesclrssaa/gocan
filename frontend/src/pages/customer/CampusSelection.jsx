import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, Image as ImageIcon, MapPin, Search } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { getCampusId, useCampus } from '../../context/CampusContext';
import CampusSwitchDialog from '../../components/customer/CampusSwitchDialog';
import Navbar from '../../components/common/Navbar';

const getReturnPath = (location) => {
  const from = location.state?.from;
  if (!from?.pathname || from.pathname === '/select-campus') return '/';
  return `${from.pathname}${from.search || ''}${from.hash || ''}`;
};

function CampusImage({ campus }) {
  const [failed, setFailed] = useState(false);
  const image = campus.image || campus.imageUrl || campus.image_url;

  if (!image || failed) {
    return (
      <div className="flex h-44 items-center justify-center bg-[#fbf7f1] text-[#2152B7]">
        <ImageIcon className="h-10 w-10" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={`Foto ${campus.name}`}
      onError={() => setFailed(true)}
      className="h-44 w-full object-cover"
    />
  );
}

export default function CampusSelection() {
  const {
    activeCampuses,
    error: campusError,
    loading: campusesLoading,
    refreshCampusData,
    selectCampus,
    selectedCampus,
  } = useCampus();
  const { cartItems, cartCampusId, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [pendingCampus, setPendingCampus] = useState(null);
  const [error, setError] = useState('');

  const filteredCampuses = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('id-ID');
    return activeCampuses.filter((campus) =>
      `${campus.name || ''} ${campus.city || ''}`.toLocaleLowerCase('id-ID').includes(normalizedQuery)
    );
  }, [activeCampuses, query]);

  const applySelection = async (campus, shouldClearCart = false) => {
    try {
      await selectCampus(campus);
      if (shouldClearCart) clearCart();
      navigate(getReturnPath(location), { replace: true });
    } catch (selectionError) {
      setError(selectionError.message || 'Kampus gagal dipilih. Silakan coba lagi.');
      setPendingCampus(null);
    }
  };

  const handleSelectCampus = (campus) => {
    setError('');
    if (
      cartItems.length > 0 &&
      cartCampusId &&
      cartCampusId !== getCampusId(campus)
    ) {
      setPendingCampus(campus);
      return;
    }
    applySelection(campus);
  };

  return (
    <div className="min-h-screen bg-[#fbf7f1] pb-16 text-slate-800">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mx-auto max-w-2xl text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2152B7] text-white shadow-sm">
            <Building2 className="h-7 w-7" aria-hidden="true" />
          </span>
          <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.16em] text-[#2152B7]">
            Selamat datang di GoCan
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Pilih Kampus
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Pilih kampus untuk melihat kantin dan menu yang tersedia di sekitar Anda.
          </p>
        </header>

        {error && (
          <p role="alert" className="mx-auto mt-6 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {campusError && (
          <div role="alert" className="mx-auto mt-6 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{campusError}</p>
            <button
              type="button"
              onClick={() => refreshCampusData().catch((requestError) => console.error('Gagal mencoba ulang daftar kampus:', requestError))}
              className="mt-2 font-bold underline"
            >
              Coba lagi
            </button>
          </div>
        )}

        <div className="mx-auto mt-7 max-w-xl">
          <label className="relative block">
            <span className="sr-only">Cari nama atau kota kampus</span>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama atau kota kampus..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#2152B7] focus:ring-2 focus:ring-[#2152B7]/20"
            />
          </label>
        </div>

        {campusesLoading ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center text-sm font-semibold text-slate-500 shadow-sm">
            Memuat kampus aktif...
          </div>
        ) : campusError ? null : activeCampuses.length === 0 ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <Building2 className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
            <h2 className="mt-3 font-bold text-slate-800">Belum ada kampus yang tersedia.</h2>
            <p className="mt-1 text-sm text-slate-500">Kampus aktif akan muncul di sini saat tersedia.</p>
          </div>
        ) : filteredCampuses.length === 0 ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
            <p className="font-bold text-slate-800">Kampus tidak ditemukan.</p>
            <p className="mt-1 text-sm text-slate-500">Coba kata pencarian nama atau kota yang lain.</p>
          </div>
        ) : (
          <section aria-label="Kampus aktif" className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCampuses.map((campus) => {
              const isSelected = selectedCampus?.campusId === getCampusId(campus);
              return (
                <article key={getCampusId(campus)} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                  <CampusImage campus={campus} />
                  <div className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-black leading-snug text-slate-900">{campus.name}</h2>
                      {isSelected && (
                        <span className="shrink-0 rounded-full bg-[#ffd612]/35 px-2.5 py-1 text-[10px] font-bold text-amber-900">
                          Dipilih
                        </span>
                      )}
                    </div>
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-[#2152B7]">
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {campus.city}
                    </p>
                    <p className="min-h-10 text-sm leading-relaxed text-slate-500">{campus.address}</p>
                    <button
                      type="button"
                      onClick={() => handleSelectCampus(campus)}
                      disabled={campusesLoading}
                      className="w-full rounded-xl bg-[#dc0413] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#b80310] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Pilih Kampus
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
      {pendingCampus && (
        <CampusSwitchDialog
          onCancel={() => setPendingCampus(null)}
          onConfirm={() => applySelection(pendingCampus, true)}
        />
      )}
    </div>
  );
}
