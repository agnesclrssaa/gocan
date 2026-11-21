import { getCampusId } from './canteenCampus';

const getUserId = (user) =>
  String(user?.id || user?.userId || user?.user_id || '');

export const getRunnerCampusInfo = (profile, user) => {
  const campus = profile?.campus || user?.campus || null;
  const campusId =
    getCampusId(profile) ||
    getCampusId(user) ||
    getCampusId(campus);
  const status = String(campus?.status || '').toLowerCase();

  return {
    campusId,
    campus,
    name: campus?.name || '',
    city: campus?.city || '',
    status,
    isActive: Boolean(campusId && status === 'active'),
  };
};

export const getRunnerCampusOrders = (orders, campusId) => {
  if (!campusId || !Array.isArray(orders)) return [];

  return orders
    .filter((order) => getCampusId(order) === String(campusId))
    .map((order) => ({
      ...order,
      campusId: getCampusId(order),
      campusName: order.campus?.name || order.campusName || '',
      campusCity: order.campus?.city || order.campusCity || '',
      canteenLocation:
        order.canteen?.location ||
        order.canteenLocation ||
        order.pickupLocation ||
        '',
    }));
};

export const isRunnerOrderAssignedTo = (order, user) => {
  const userId = getUserId(user);
  return Boolean(
    userId &&
    [order?.runnerId, order?.runner_id, order?.courierId, order?.courier_id]
      .some((assignedId) => String(assignedId || '') === userId)
  );
};
