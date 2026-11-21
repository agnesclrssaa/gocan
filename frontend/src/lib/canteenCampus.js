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

export const withCanteenOwnership = (record, canteen) => ({
  ...record,
  canteenId: record?.canteenId || record?.canteen_id || getCanteenId(canteen),
  campusId: getCampusId(record) || getCampusId(canteen),
});

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
      return {
        ...ownedOrder,
        campusName:
          order?.campus?.name ||
          order?.canteen?.campus?.name ||
          order?.campusName ||
          canteen?.campusName ||
          '',
        campusCity:
          order?.campus?.city ||
          order?.canteen?.campus?.city ||
          order?.campusCity ||
          canteen?.campusCity ||
          '',
      };
    });
