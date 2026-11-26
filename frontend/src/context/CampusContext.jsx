import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import LoadingScreen from '../components/LoadingScreen';

export const SELECTED_CAMPUS_STORAGE_KEY = 'gocan_selected_campus';

const CampusContext = createContext(null);

export const getCampusId = (record) =>
  String(
    record?.campusId ||
    record?.campus_id ||
    record?.campus?.campusId ||
    record?.campus?.campus_id ||
    ''
  );

export const isActiveCampus = (campus) =>
  String(campus?.status || '').toLowerCase() === 'active';

const readSelectedCampusId = () => {
  try {
    const stored = window.localStorage.getItem(SELECTED_CAMPUS_STORAGE_KEY);
    if (!stored) return '';
    const parsed = JSON.parse(stored);
    return typeof parsed?.campusId === 'string' ? parsed.campusId : '';
  } catch (error) {
    console.error('Gagal membaca kampus terpilih:', error);
    return '';
  }
};

const persistSelection = (campus) => {
  const selection = {
    campusId: getCampusId(campus),
    name: String(campus.name || ''),
    city: String(campus.city || ''),
  };
  window.localStorage.setItem(SELECTED_CAMPUS_STORAGE_KEY, JSON.stringify(selection));
  return selection;
};

export function CampusProvider({ children }) {
  const [campuses, setCampuses] = useState([]);
  const [storedCampusId, setStoredCampusId] = useState(readSelectedCampusId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshCampusData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/campuses?status=active');
      if (!Array.isArray(response)) {
        throw new Error('Format daftar kampus dari server tidak valid.');
      }

      const activeCampuses = response
        .filter((campus) => campus && typeof campus === 'object' && isActiveCampus(campus))
        .map((campus) => ({ ...campus, campusId: getCampusId(campus) }));
      setCampuses(activeCampuses);

      const currentCampusId = readSelectedCampusId();
      const currentCampus = activeCampuses.find(
        (campus) => campus.campusId === currentCampusId
      );
      if (currentCampus) {
        persistSelection(currentCampus);
        setStoredCampusId(currentCampus.campusId);
      } else {
        if (currentCampusId) {
          window.localStorage.removeItem(SELECTED_CAMPUS_STORAGE_KEY);
        }
        setStoredCampusId('');
      }
      return activeCampuses;
    } catch (requestError) {
      setError(requestError.message || 'Gagal memuat daftar kampus.');
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCampusData().catch((requestError) => {
      console.error('Gagal menyinkronkan daftar kampus:', requestError);
    });

    const refresh = () => {
      setStoredCampusId(readSelectedCampusId());
      refreshCampusData().catch((requestError) => {
        console.error('Gagal memperbarui daftar kampus:', requestError);
      });
    };
    const handleStorage = (event) => {
      if (event.key && event.key !== SELECTED_CAMPUS_STORAGE_KEY) return;
      refresh();
    };
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('gocan_campuses_updated', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('gocan_campuses_updated', refresh);
    };
  }, [refreshCampusData]);

  const activeCampuses = useMemo(
    () => campuses.filter(isActiveCampus),
    [campuses]
  );
  const selectedCampus = useMemo(() => {
    const campus = activeCampuses.find((item) => getCampusId(item) === storedCampusId);
    return campus ? { ...campus, campusId: getCampusId(campus) } : null;
  }, [activeCampuses, storedCampusId]);

  const selectCampus = useCallback(async (campus) => {
    const campusId = getCampusId(campus);
    const latestCampuses = await refreshCampusData();
    const currentCampus = latestCampuses.find(
      (item) => getCampusId(item) === campusId && isActiveCampus(item)
    );
    if (!currentCampus) {
      throw new Error('Kampus tersebut tidak tersedia atau sudah nonaktif.');
    }

    const selection = persistSelection(currentCampus);
    setStoredCampusId(campusId);
    return selection;
  }, [refreshCampusData]);

  const value = useMemo(() => ({
    campuses,
    activeCampuses,
    selectedCampus,
    selectedCampusId: selectedCampus?.campusId || '',
    storedCampusId,
    loading,
    error,
    selectCampus,
    refreshCampusData,
  }), [
    campuses,
    activeCampuses,
    selectedCampus,
    storedCampusId,
    loading,
    error,
    selectCampus,
    refreshCampusData,
  ]);

  return <CampusContext.Provider value={value}>{children}</CampusContext.Provider>;
}

export function useCampus() {
  const context = useContext(CampusContext);
  if (!context) {
    throw new Error('useCampus must be used within a CampusProvider');
  }
  return context;
}

export function RequireSelectedCampus() {
  const { selectedCampus, loading, error, refreshCampusData } = useCampus();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Memuat kampus aktif..." />;
  }

  if (error) {
    return (
      <div role="alert" className="mx-auto my-12 max-w-lg rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-800">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => refreshCampusData().catch((requestError) => console.error('Gagal mencoba ulang daftar kampus:', requestError))}
          className="mt-4 rounded-lg bg-[#dc0413] px-4 py-2 font-bold text-white"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  if (!selectedCampus) {
    return (
      <Navigate
        to="/select-campus"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
}
