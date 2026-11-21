const orderItemNotesInclude = {
  orderBy: { position: 'asc' },
  select: { position: true, notes: true },
};

const mergeOrderItemNotes = (order) => {
  const items = JSON.parse(order.items);
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => ({
    ...item,
    notes: order.orderItems?.[index]?.notes ?? item.notes ?? '',
  }));
};

module.exports = { mergeOrderItemNotes, orderItemNotesInclude };
