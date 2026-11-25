const prisma = require('../src/lib/prisma');
const { ensureDefaultPromo, validatePromo } = require('../utils/promos');

const listPromos = async (_req, res, next) => {
  try {
    await ensureDefaultPromo();
    const now = new Date();
    const promos = await prisma.promo.findMany({
      where: {
        isActive: true,
        OR: [{ validUntil: null }, { validUntil: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(promos);
  } catch (error) {
    return next(error);
  }
};

const validatePromoCode = async (req, res, next) => {
  try {
    const result = await validatePromo(req.body || {});
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = { listPromos, validatePromoCode };
