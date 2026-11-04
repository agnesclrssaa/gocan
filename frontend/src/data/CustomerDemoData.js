const makeMenu = (id, name, price, category, description, imageUrl) => ({
  id,
  name,
  price,
  category,
  description,
  imageUrl,
  isAvailable: true,
});

export const demoCanteens = [
  {
    id: 'demo-kantin-bu-rina',
    name: 'Kantin Bu Rina',
    location: 'Gedung A, UKWMS Dinoyo',
    description: 'Aneka makanan rumahan yang hangat dan mengenyangkan.',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    rating: '4.9',
    isOpen: true,
  },
  {
    id: 'demo-kantin-pak-budi',
    name: 'Kantin Pak Budi',
    location: 'Gedung B, UKWMS Dinoyo',
    description: 'Menu favorit mahasiswa dengan harga ramah di kantong.',
    imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
    rating: '4.8',
    isOpen: true,
  },
  {
    id: 'demo-kantin-bu-sari',
    name: 'Kantin Bu Sari',
    location: 'Student Lounge, UKWMS Dinoyo',
    description: 'Pilihan camilan, dessert, dan minuman segar.',
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    rating: '4.9',
    isOpen: true,
  },
];

export const demoMenusByCanteen = {
  'demo-kantin-bu-rina': [
    makeMenu(
      'rina-1',
      'Nasi Ayam Teriyaki',
      18000,
      'Makanan Berat',
      'Nasi hangat dengan ayam teriyaki dan sayuran.',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
    ),
    makeMenu(
      'rina-2',
      'Nasi Ayam Geprek',
      15000,
      'Makanan Berat',
      'Ayam crispy dengan sambal geprek pilihan.',
      'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80'
    ),
    makeMenu(
      'rina-3',
      'Es Teh Manis',
      5000,
      'Minuman',
      'Es teh segar dengan rasa manis yang pas.',
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80'
    ),
  ],

  'demo-kantin-pak-budi': [
    makeMenu(
      'budi-1',
      'Nasi Goreng Spesial',
      16000,
      'Makanan Berat',
      'Nasi goreng dengan telur dan topping pilihan.',
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80'
    ),
    makeMenu(
      'budi-2',
      'Mie Goreng Jawa',
      14000,
      'Makanan Berat',
      'Mie goreng dengan bumbu khas Jawa.',
      'https://images.unsplash.com/photo-1568008050635-8c6a1e6b1a5d?auto=format&fit=crop&w=600&q=80'
    ),
    makeMenu(
      'budi-3',
      'Chicken Katsu',
      20000,
      'Makanan Berat',
      'Ayam katsu crispy dengan saus spesial.',
      'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&q=80'
    ),
    makeMenu(
      'budi-4',
      'Thai Tea',
      9000,
      'Minuman',
      'Thai tea creamy dengan es yang menyegarkan.',
      'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=600&q=80'
    ),
  ],

  'demo-kantin-bu-sari': [
    makeMenu(
      'sari-1',
      'Dimsum Ayam',
      12000,
      'Cemilan',
      'Dimsum ayam lembut dengan saus cocolan.',
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80'
    ),
    makeMenu(
      'sari-2',
      'Roti Bakar Cokelat',
      10000,
      'Cemilan',
      'Roti bakar dengan isian cokelat melimpah.',
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80'
    ),
    makeMenu(
      'sari-3',
      'Salad Buah',
      15000,
      'Healthy',
      'Potongan buah segar dengan saus creamy.',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80'
    ),
  ],
};

export const demoMenus = demoCanteens.flatMap((canteen) =>
  (demoMenusByCanteen[canteen.id] || []).map((menu) => ({
    ...menu,
    canteenId: canteen.id,
    canteenName: canteen.name,
  }))
);