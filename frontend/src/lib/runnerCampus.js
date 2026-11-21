import {
  findCanteenProfile,
  getCampusById,
  getCampusId,
} from './canteenCampus';

export const COURIERS_STORAGE_KEY = 'gocan_couriers';
export const COURIER_LEGACY_CAMPUS_ID = 'CAMPUS001';

const readCourierProfiles = () => {
  try {
    const stored = window.localStorage.getItem(COURIERS_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      throw new Error('Daftar profil Runner lokal memiliki format yang tidak valid.');
    }
    return parsed.filter((record) => record && typeof record === 'object' && !Array.isArray(record));
  } catch (error) {
    console.error('Gagal membaca profil Runner lokal:', error);
    throw new Error('Profil Runner lokal tidak dapat dibaca.');
  }
};

const getUserId = (user) =>
  String(user?.id || user?.userId || user?.user_id || '');

const getRecordUserId = (record) =>
  String(
    record?.userId ||
    record?.user_id ||
    record?.runnerId ||
    record?.runner_id ||
    record?.courierId ||
    record?.courier_id ||
    ''
  );

const matchesRunner = (record, user) => {
  const userId = getUserId(user);
  const recordUserId = getRecordUserId(record);
  const email = String(user?.email || '').trim().toLowerCase();
  return Boolean(
    (userId && recordUserId && userId === recordUserId) ||
    (email && email === String(record?.email || '').trim().toLowerCase())
  );
};

const writeCourierProfiles = (profiles) => {
  try {
    window.localStorage.setItem(COURIERS_STORAGE_KEY, JSON.stringify(profiles));
    window.dispatchEvent(new Event('gocan_couriers_updated'));
  } catch (error) {
    console.error('Gagal menyimpan profil Runner lokal:', error);
    throw new Error('Profil Runner gagal disimpan ke penyimpanan lokal.');
  }
};

export const findRunnerProfile = (user) => {
  try {
    return readCourierProfiles().find((record) => matchesRunner(record, user)) || null;
  } catch (error) {
    console.error('Gagal mencari profil Runner lokal:', error);
    return null;
  }
};

export const getRunnerCampusInfo = (profile, user) => {
  const localProfile = findRunnerProfile(user || profile);
  const campusId =
    getCampusId(localProfile) ||
    getCampusId(profile) ||
    getCampusId(user);
  const campus = campusId ? getCampusById(campusId) : null;

  return {
    campusId,
    campus,
    name: campus?.name || localProfile?.campusName || '',
    city: campus?.city || localProfile?.campusCity || '',
    status: String(campus?.status || localProfile?.campusStatus || '').toLowerCase(),
    isActive: Boolean(campusId && campus && String(campus.status || '').toLowerCase() === 'active'),
  };
};

export const saveRunnerCampusProfile = (user, selectedCampusId) => {
  if (!user || typeof user !== 'object') {
    throw new Error('Data akun Runner tidak tersedia untuk menyimpan kampus.');
  }

  const profiles = readCourierProfiles();
  const existingIndex = profiles.findIndex((record) => matchesRunner(record, user));
  const existing = existingIndex >= 0 ? profiles[existingIndex] : {};
  const campusId = getCampusId(existing) || String(selectedCampusId || '');
  const campus = campusId ? getCampusById(campusId) : null;
  const userId = getUserId(user) || getRecordUserId(existing);
  const savedProfile = {
    ...existing,
    id: existing.id || userId,
    userId,
    runnerId: userId,
    email: user.email || existing.email || '',
    name: user.name || existing.name || '',
    campusId,
    campusName: campus?.name || existing.campusName || '',
    campusCity: campus?.city || existing.campusCity || '',
    campusStatus: campus?.status || existing.campusStatus || '',
    completedOrders: Array.isArray(existing.completedOrders) ? existing.completedOrders : [],
  };

  if (existingIndex >= 0) profiles[existingIndex] = savedProfile;
  else profiles.push(savedProfile);
  writeCourierProfiles(profiles);
  return savedProfile;
};

export const getRunnerCampusOrders = (orders, campusId) => {
  if (!campusId || !Array.isArray(orders)) return [];

  return orders
    .filter((order) => {
      const orderCampusId = getCampusId(order) || COURIER_LEGACY_CAMPUS_ID;
      return orderCampusId === String(campusId);
    })
    .map((order) => {
      const orderCampusId = getCampusId(order) || COURIER_LEGACY_CAMPUS_ID;
      const campus = getCampusById(orderCampusId);
      return {
        ...order,
        campusId: orderCampusId,
        campusName: campus?.name || order.campusName || '',
        campusCity: campus?.city || order.campusCity || '',
        canteen: order.canteen || findCanteenProfile(
          { id: order.canteenId || order.canteen_id },
          null
        ) || undefined,
      };
    });
};

export const isRunnerOrderAssignedTo = (order, user) => {
  const userId = getUserId(user);
  return Boolean(
    userId &&
    [order?.runnerId, order?.runner_id, order?.courierId, order?.courier_id]
      .some((assignedId) => String(assignedId || '') === userId)
  );
};

export const getRunnerOrderHistory = (user, campusId) => {
  if (!campusId) return [];
  const record = findRunnerProfile(user);
  return (Array.isArray(record?.completedOrders) ? record.completedOrders : [])
    .filter((order) => String(order.campusId || '') === String(campusId));
};

export const saveRunnerCompletedOrder = (order, user, campusId) => {
  if (!order || typeof order !== 'object' || !user) {
    throw new Error('Data pesanan atau akun Runner tidak valid untuk menyimpan riwayat.');
  }

  const profiles = readCourierProfiles();
  const existingIndex = profiles.findIndex((record) => matchesRunner(record, user));
  const existing = existingIndex >= 0 ? profiles[existingIndex] : {};
  const assignedCampusId = getCampusId(existing) || String(campusId || '');
  const completedOrders = Array.isArray(existing.completedOrders)
    ? existing.completedOrders
    : [];
  const completedOrder = {
    ...order,
    campusId: getCampusId(order) || assignedCampusId || COURIER_LEGACY_CAMPUS_ID,
    completedAt: order.completedAt || new Date().toISOString(),
  };
  const nextProfile = {
    ...existing,
    id: existing.id || getUserId(user),
    userId: getUserId(user) || getRecordUserId(existing),
    runnerId: getUserId(user) || getRecordUserId(existing),
    email: user.email || existing.email || '',
    name: user.name || existing.name || '',
    campusId: assignedCampusId,
    completedOrders: [
      completedOrder,
      ...completedOrders.filter((item) => String(item.id) !== String(order.id)),
    ].slice(0, 50),
  };

  if (existingIndex >= 0) profiles[existingIndex] = nextProfile;
  else profiles.push(nextProfile);
  writeCourierProfiles(profiles);
};
