require('dotenv').config();

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const canteen = {
  id: 'canteen-pak-brazil',
  name: 'Kantin Pak Brazil',
  description: 'Aneka olahan ayam krispi, mie, dan minuman dingin segar.',
  location: 'Gedung Benedictus, Lt. 1',
  imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
  isOpen: true,
};

const menus = [
  {
    id: 'menu-nasi-ayam-geprek-sambal-korek',
    name: 'Nasi Ayam Geprek Sambal Korek',
    price: 15000,
    category: 'Ayam Geprek',
    description: 'Ayam geprek krispi renyah dengan ulekan cabai rawit.',
    imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
  {
    id: 'menu-jus-mangga-brazil',
    name: 'Jus Mangga Brazil',
    price: 10000,
    category: 'Minuman',
    description: 'Jus mangga kental manis dengan es batu segar.',
    imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80',
    isAvailable: false,
  },
  {
    id: 'menu-indomie-goreng-double-telur',
    name: 'Indomie Goreng Double Telur',
    price: 13000,
    category: 'Indomie',
    description: 'Indomie goreng lezat disajikan dengan dua butir telur.',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
  {
    id: 'menu-kulit-ayam-geprek',
    name: 'Kulit Ayam Geprek Pak Brazil',
    price: 15000,
    category: 'Ayam Geprek',
    description: 'Kulit ayam ekstra renyah berbumbu rempah gurih.',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
];

const testAccounts = [
  {
    name: 'GoCan Admin',
    email: process.env.ADMIN_EMAIL || 'admin@gocan.test',
    password: process.env.ADMIN_PASSWORD || 'AdminGoCan123!',
    role: 'admin',
    canteenId: null,
  },
  {
    name: 'Kantin Pak Brazil',
    email: 'kantin.pakbrazil@test.com',
    password: process.env.SEED_CANTEEN_PASSWORD || 'KantinTest123!',
    role: 'canteen',
    canteenId: canteen.id,
  },
  {
    name: 'Kurir Budi',
    email: 'kurir.budi@test.com',
    password: process.env.SEED_COURIER_PASSWORD || 'KurirTest123!',
    role: 'courier',
    canteenId: null,
  },
];

async function main() {
  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)
  ) {
    throw new Error('ADMIN_EMAIL dan ADMIN_PASSWORD wajib diatur sebelum menjalankan seed di production.');
  }

  await prisma.canteen.upsert({
    where: { id: canteen.id },
    update: canteen,
    create: canteen,
  });

  for (const menu of menus) {
    await prisma.menu.upsert({
      where: { id: menu.id },
      update: { ...menu, canteenId: canteen.id },
      create: { ...menu, canteenId: canteen.id },
    });
  }

  for (const account of testAccounts) {
    const hashedPassword = await bcrypt.hash(account.password, 12);
    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        password: hashedPassword,
        role: account.role,
        canteenId: account.canteenId,
        approvalStatus: 'approved',
      },
      create: {
        name: account.name,
        email: account.email,
        password: hashedPassword,
        role: account.role,
        canteenId: account.canteenId,
        approvalStatus: 'approved',
      },
    });
  }

  console.log(`Seeded ${menus.length} menus and ${testAccounts.length} test accounts.`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Development admin account: ${process.env.ADMIN_EMAIL || 'admin@gocan.test'}`);
  }
}

main()
  .catch((error) => {
    console.error('Gagal mengisi data kantin dan menu:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
