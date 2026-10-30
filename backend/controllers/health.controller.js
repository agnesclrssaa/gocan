const prisma = require('../src/lib/prisma');

const getHealth = async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHealth };
