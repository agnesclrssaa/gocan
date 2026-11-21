import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export const CAMPUSES_STORAGE_KEY = 'gocan_campuses';
export const SELECTED_CAMPUS_STORAGE_KEY = 'gocan_selected_campus';
export const DEFAULT_CAMPUS_ID = 'CAMPUS001';

const CampusContext = createContext(null);

export const getCampusId = (record) =>
  String(
    record?.campusId ||
    record?.campus_id ||
    record?.campus?.campusId ||
    record?.campus?.campus_id ||
    DEFAULT_CAMPUS_ID
  );

export const isActiveCampus = (campus) =>
  String(campus?.status || '').toLowerCase() === 'active';

const readCampuses = () => {
  try {
    const stored = window.localStorage.getItem(CAMPUSES_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((campus) => campus && typeof campus === 'object' && !Array.isArray(campus))
      : [];
  } catch (error) {
    console.error('Gagal membaca daftar kampus:', error);
    return [];
  }
};

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

export function CampusProvider({ children }) {
  const [campuses, setCampuses] = useState(readCampuses);
  const [storedCampusId, setStoredCampusId] = useState(readSelectedCampusId);

  const refreshCampusData = useCallback(() => {
    setCampuses(readCampuses());
    setStoredCampusId(readSelectedCampusId());
  }, []);

  useEffect(() => {
    window.addEventListener('storage', refreshCampusData);
    window.addEventListener('focus', refreshCampusData);
    return () => {
      window.removeEventListener('storage', refreshCampusData);
      window.removeEventListener('focus', refreshCampusData);
    };
  }, [refreshCampusData]);

  const activeCampuses = useMemo(
    () => campuses.filter(isActiveCampus),
    [campuses]
  );
  const selectedCampus = useMemo(
    () => {
      const campus = activeCampuses.find(
        (item) => getCampusId(item) === storedCampusId
      );
      return campus ? { ...campus, campusId: getCampusId(campus) } : null;
    },
    [activeCampuses, storedCampusId]
  );

  const selectCampus = useCallback((campus) => {
    const campusId = getCampusId(campus);
    const currentCampus = readCampuses().find(
      (item) => getCampusId(item) === campusId && isActiveCampus(item)
    );
    if (!currentCampus) {
      throw new Error('Kampus tersebut tidak tersedia atau sudah nonaktif.');
    }

    const selection = {
      campusId,
      name: String(currentCampus.name || ''),
      city: String(currentCampus.city || ''),
    };
    window.localStorage.setItem(SELECTED_CAMPUS_STORAGE_KEY, JSON.stringify(selection));
    setCampuses(readCampuses());
    setStoredCampusId(campusId);
    return selection;
  }, []);

  const value = useMemo(() => ({
    campuses,
    activeCampuses,
    selectedCampus,
    selectedCampusId: selectedCampus?.campusId || '',
    storedCampusId,
    selectCampus,
    refreshCampusData,
  }), [
    campuses,
    activeCampuses,
    selectedCampus,
    storedCampusId,
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
  const { selectedCampus } = useCampus();
  const location = useLocation();

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
