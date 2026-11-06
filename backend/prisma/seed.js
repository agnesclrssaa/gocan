require('dotenv').config();

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const legacyCanteenId = 'canteen-pak-brazil';
const legacyMenuIds = [
  'menu-nasi-ayam-geprek-sambal-korek',
  'menu-jus-mangga-brazil',
  'menu-indomie-goreng-double-telur',
  'menu-kulit-ayam-geprek',
];
async function removeLegacyDemoData() {
  return prisma.$transaction(async (transaction) => {
    const deletedMenus = await transaction.menu.deleteMany({
      where: { id: { in: legacyMenuIds } },
    });

    const canteen = await transaction.canteen.findUnique({
      where: { id: legacyCanteenId },
      select: { _count: { select: { orders: true, menus: true } } },
    });
    let deletedCanteens = 0;
    let archivedCanteens = 0;
    if (canteen && canteen._count.orders === 0 && canteen._count.menus === 0) {
      const deleted = await transaction.canteen.deleteMany({
        where: { id: legacyCanteenId },
      });
      deletedCanteens = deleted.count;
    } else if (canteen && canteen._count.orders > 0 && canteen._count.menus === 0) {
      const archived = await transaction.canteen.updateMany({
        where: { id: legacyCanteenId },
        data: { isOpen: false },
      });
      archivedCanteens = archived.count;
    }

    const deletedUnusedAccounts = await transaction.user.deleteMany({
      where: {
        email: { in: ['admin@gocan.test', 'kurir.budi@test.com'] },
        orders: { none: {} },
        courierOrders: { none: {} },
      },
    });
    let deletedCanteenAccounts = 0;
    if (deletedCanteens > 0 || (canteen && canteen._count.menus === 0)) {
      const deleted = await transaction.user.deleteMany({
        where: {
          email: 'kantin.pakbrazil@test.com',
          orders: { none: {} },
          courierOrders: { none: {} },
        },
      });
      deletedCanteenAccounts = deleted.count;
    }

    return {
      menus: deletedMenus.count,
      canteens: deletedCanteens,
      archivedCanteens,
      accounts: deletedUnusedAccounts.count + deletedCanteenAccounts,
    };
  });
}

async function seedAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL && !ADMIN_PASSWORD) return false;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('ADMIN_EMAIL dan ADMIN_PASSWORD harus diatur bersama-sama.');
  }

  const password = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: 'GoCan Admin',
      password,
      role: 'admin',
      canteenId: null,
      approvalStatus: 'APPROVED',
    },
    create: {
      name: 'GoCan Admin',
      email: ADMIN_EMAIL,
      password,
      role: 'admin',
      approvalStatus: 'APPROVED',
    },
  });
  return true;
}

async function main() {
  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)
  ) {
    throw new Error('ADMIN_EMAIL dan ADMIN_PASSWORD wajib diatur sebelum menjalankan seed di production.');
  }

  const cleanup = await removeLegacyDemoData();
  const seededAdmin = await seedAdmin();

  console.log(
    `Removed legacy demo data: ${cleanup.menus} menus, ${cleanup.canteens} canteens, ${cleanup.archivedCanteens} archived canteens, ${cleanup.accounts} accounts.`
  );
  if (seededAdmin) {
    console.log(`Seeded admin account: ${process.env.ADMIN_EMAIL}`);
  } else {
    console.log('No admin account seeded; set ADMIN_EMAIL and ADMIN_PASSWORD to create one.');
  }
}

main()
  .catch((error) => {
    console.error('Gagal menyesuaikan data seed GoCan:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
