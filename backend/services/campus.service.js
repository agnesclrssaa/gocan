const prisma = require('../src/lib/prisma');

const DEFAULT_CAMPUSES = [
  {
    campusId: 'CAMPUS001',
    name: 'Universitas Katolik Widya Mandala Surabaya - Campus Dinoyo',
    city: 'Surabaya',
    address: 'Jl. Dinoyo No. 42-44, Surabaya',
  },
  {
    campusId: 'CAMPUS002',
    name: 'Universitas Katolik Widya Mandala Surabaya - Campus Kalijudan',
    city: 'Surabaya',
    address: 'Jl. Kalijudan No. 37, Surabaya',
  },
  {
    campusId: 'CAMPUS003',
    name: 'Universitas Katolik Widya Mandala Surabaya - Campus Pakuwon',
    city: 'Surabaya',
    address: 'Pakuwon City, Surabaya',
  },
];

const ensureDefaultCampuses = async (database = prisma) => {
  const count = await database.campus.count();
  if (count === 0) {
    await database.campus.createMany({
      data: DEFAULT_CAMPUSES.map((campus) => ({
        ...campus,
        updatedAt: new Date(),
      })),
      skipDuplicates: true,
    });
  }
};

module.exports = { DEFAULT_CAMPUSES, ensureDefaultCampuses };
