export const CAMPUSES_STORAGE_KEY = 'gocan_campuses';
export const CANTEENS_STORAGE_KEY = 'gocan_canteens';

export const getCampusId = (record) =>
  String(
    record?.campusId ||
    record?.campus_id ||
    record?.campus?.campusId ||
    record?.campus?.campus_id ||
    ''
  );

export const getCanteenId = (record) =>
  String(
    record?.canteenId ||
    record?.canteen_id ||
    record?.canteen?.id ||
    record?.id ||
    ''
  );

const getOwnerId = (record) =>
  String(record?.ownerId || record?.owner_id || record?.userId || record?.user_id || record?.user?.id || '');

export const readCampuses = () => {
  try {
    const stored = window.localStorage.getItem(CAMPUSES_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      console.error('Daftar kampus lokal memiliki format yang tidak valid.');
      return [];
    }
    return parsed.filter((campus) => campus && typeof campus === 'object' && !Array.isArray(campus));
  } catch (error) {
    console.error('Gagal membaca daftar kampus lokal:', error);
    return [];
  }
};

export const getActiveCampuses = () =>
  readCampuses().filter((campus) => String(campus.status || '').toLowerCase() === 'active');

export const getCampusById = (campusId) =>
  readCampuses().find((campus) => getCampusId(campus) === String(campusId || '')) || null;

export const readCanteenProfiles = () => {
  try {
    const stored = window.localStorage.getItem(CANTEENS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      throw new Error('Daftar profil kantin lokal memiliki format yang tidak valid.');
    }
    return parsed.filter((canteen) => canteen && typeof canteen === 'object' && !Array.isArray(canteen));
  } catch (error) {
    console.error('Gagal membaca profil kantin lokal:', error);
    throw new Error('Profil kantin lokal tidak dapat dibaca.');
  }
};

const matchesCanteen = (record, canteen, user) => {
  const recordId = getCanteenId(record);
  const canteenId = getCanteenId(canteen);
  const recordOwnerId = getOwnerId(record);
  const ownerId = getOwnerId(canteen) || String(user?.id || '');
  const userEmail = String(user?.email || '').toLowerCase();

  return Boolean(
    (recordId && canteenId && recordId === canteenId) ||
    (recordOwnerId && ownerId && recordOwnerId === ownerId) ||
    (userEmail && String(record.email || '').toLowerCase() === userEmail)
  );
};

export const findCanteenProfile = (canteen, user) => {
  try {
    return readCanteenProfiles().find((record) => matchesCanteen(record, canteen, user)) || null;
  } catch (error) {
    console.error('Gagal mencari profil kantin lokal:', error);
    return null;
  }
};

export const saveCanteenProfile = (canteen, user) => {
  const profiles = readCanteenProfiles();
  const existingIndex = profiles.findIndex((record) => matchesCanteen(record, canteen, user));
  const existing = existingIndex >= 0 ? profiles[existingIndex] : {};
  const canteenId = getCanteenId(canteen) || getCanteenId(existing) || String(user?.id || '');
  const campusId = getCampusId(existing) || getCampusId(canteen);
  const ownerId = getOwnerId(canteen) || String(user?.id || '');
  const campus = getCampusById(campusId);
  const menus = Array.isArray(canteen?.menus)
    ? canteen.menus
      .filter((menu) => {
        const menuCanteenId = String(menu?.canteenId || menu?.canteen_id || menu?.canteen?.id || '');
        const menuCampusId = getCampusId(menu);
        return (!menuCanteenId || menuCanteenId === canteenId) &&
          (!menuCampusId || !campusId || menuCampusId === campusId);
      })
      .map((menu) => ({
        ...menu,
        canteenId: menu.canteenId || menu.canteen_id || canteenId,
        campusId: getCampusId(menu) || campusId,
      }))
    : existing.menus || [];
  const savedProfile = {
    ...existing,
    ...canteen,
    id: canteen?.id || existing.id || canteenId,
    canteenId,
    ownerId,
    campusId,
    campusName: campus?.name || canteen?.campusName || existing.campusName || '',
    campusCity: campus?.city || canteen?.campusCity || existing.campusCity || '',
    campusStatus: campus?.status || canteen?.campusStatus || existing.campusStatus || '',
    menus,
  };

  if (existingIndex >= 0) profiles[existingIndex] = savedProfile;
  else profiles.push(savedProfile);

  try {
    window.localStorage.setItem(CANTEENS_STORAGE_KEY, JSON.stringify(profiles));
    window.dispatchEvent(new Event('gocan_canteens_updated'));
  } catch (error) {
    console.error('Gagal menyimpan profil kantin lokal:', error);
    throw new Error('Profil kantin gagal disimpan ke penyimpanan lokal.');
  }

  return savedProfile;
};

export const withCanteenOwnership = (record, canteen) => {
  const canteenId = getCanteenId(canteen);
  const campusId = getCampusId(canteen);
  return {
    ...record,
    canteenId: record?.canteenId || record?.canteen_id || canteenId,
    campusId: getCampusId(record) || campusId,
  };
};

export const belongsToCanteen = (record, canteen) => {
  const recordCanteenId = String(
    record?.canteenId || record?.canteen_id || record?.canteen?.id || ''
  );
  const canteenId = getCanteenId(canteen);
  const recordCampusId = getCampusId(record);
  const campusId = getCampusId(canteen);

  return Boolean(canteenId) &&
    (!recordCanteenId || recordCanteenId === canteenId) &&
    (!recordCampusId || !campusId || recordCampusId === campusId);
};

export const filterCanteenOrders = (orders, canteen) =>
  (Array.isArray(orders) ? orders : [])
    .filter((order) => belongsToCanteen(order, canteen))
    .map((order) => {
      const ownedOrder = withCanteenOwnership(order, canteen);
      const campus = getCampusById(ownedOrder.campusId);
      return {
        ...ownedOrder,
        campusName: campus?.name || order?.campusName || canteen?.campusName || '',
        campusCity: campus?.city || order?.campusCity || canteen?.campusCity || '',
      };
    });
