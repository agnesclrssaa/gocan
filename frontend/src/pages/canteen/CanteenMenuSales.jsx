import { useState } from 'react';
import {
  Plus,
  BarChart3,
  CheckCircle,
  X,
  Search,
  Sparkles
} from 'lucide-react';

export default function CanteenMenuSales() {
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [menuForm, setMenuForm] = useState({
    name: '',
    price: '',
    category: 'Makanan Utama',
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80'
  });

  const [menuItems, setMenuItems] = useState([
    {
      id: 1,
      name: 'Jus Mangga Brazil',
      price: 'Rp 10.000',
      category: 'Minuman Segar',
      isAvailable: false,
      image: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 2,
      name: 'Jus Mangga Brazil',
      price: 'Rp 10.000',
      category: 'Minuman Segar',
      isAvailable: false,
      image: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 3,
      name: 'Jus Mangga Brazil',
      price: 'Rp 10.000',
      category: 'Minuman Segar',
      isAvailable: false,
      image: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 4,
      name: 'Jus Mangga Brazil',
      price: 'Rp 10.000',
      category: 'Minuman Segar',
      isAvailable: false,
      image: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 5,
      name: 'Jus Mangga Brazil',
      price: 'Rp 10.000',
      category: 'Minuman Segar',
      isAvailable: false,
      image: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80'
    }
  ]);

  const toggleAvailability = (id) => {
    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = !item.isAvailable;
          triggerToast(
            `Stok "${item.name}" diubah menjadi: ${nextStatus ? 'Tersedia ✅' : 'Habis ❌'}`
          );
          return { ...item, isAvailable: nextStatus };
        }
        return item;
      })
    );
  };

  const handleToggleStoreStatus = () => {
    const nextStatus = !isStoreOpen;
    setIsStoreOpen(nextStatus);
    triggerToast(`Status Stan: ${nextStatus ? 'BUKA (Menerima Pesanan)' : 'TUTUP'}`);
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveMenu = (e) => {
    e.preventDefault();
    if (editingItem) {
      setMenuItems((prev) =>
        prev.map((item) => (item.id === editingItem.id ? { ...item, ...menuForm } : item))
      );
      triggerToast(`Menu "${menuForm.name}" berhasil diperbarui!`);
    } else {
      const newItem = {
        id: Date.now(),
        ...menuForm
      };
      setMenuItems((prev) => [newItem, ...prev]);
      triggerToast(`Menu baru "${menuForm.name}" berhasil ditambahkan!`);
    }
    setShowAddModal(false);
    setEditingItem(null);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setMenuForm({
      name: item.name,
      price: item.price,
      category: item.category,
      isAvailable: item.isAvailable,
      image: item.image
    });
    setShowAddModal(true);
  };

  const filteredItems = menuItems.filter((item) => {
    const matchCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Weekly sales bar chart heights
  const weeklySales = [
    { day: 'S', height: '40%' },
    { day: 'S', height: '55%' },
    { day: 'R', height: '30%' },
    { day: 'K', height: '70%' },
    { day: 'J', height: '75%' },
    { day: 'S', height: '80%' },
    { day: 'M', height: '25%' }
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0A2E6E] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-white/20 animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/60 hover:text-white ml-2 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top 2 Columns: Perkembangan Penjualan Minggu Ini & Kontrol Stok & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">
              Perkembangan Penjualan Minggu Ini
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Grafik penjualan mingguan untuk memantau performa menu
            </p>
          </div>

          {/* Bar Chart matching mockup gocan-canteen-menu-sales.png */}
          <div className="py-8">
            <div className="flex items-end justify-around h-48 px-4">
              {weeklySales.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-3 group">
                  <div className="w-8 sm:w-10 bg-slate-100 rounded-t-xl h-40 flex items-end justify-center p-1">
                    <div
                      className="w-full bg-[#0A2E6E] rounded-t-lg transition-all duration-500 group-hover:bg-[#1D4ED8]"
                      style={{ height: item.height }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-600">{item.day}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-slate-500 mt-4">
              Puncak penjualan terjadi pada hari Jumat
            </p>
          </div>
        </div>

        {/* Right 1 Col: Kontrol Stok & Status */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase">
              Kontrol Stok & Status
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Atur status toko dan pantau menu yang perlu tindakan
            </p>

            {/* Status Penerimaan Order */}
            <div className="mt-5 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Status Penerimaan Order</span>
              <button
                onClick={handleToggleStoreStatus}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition ${
                  isStoreOpen
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                    : 'border-red-500 text-red-600 bg-red-50 hover:bg-red-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isStoreOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {isStoreOpen ? 'BUKA (Klik Tutup)' : 'TUTUP (Klik Buka)'}
              </button>
              <p className="text-[11px] text-slate-400">Tutup otomatis jam 16:00 WIB</p>
            </div>

            {/* Menu Perlu Tindakan */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 block mb-3">Menu Perlu Tindakan</span>
              
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=200&q=80"
                  alt="Jus Mangga"
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 truncate">Jus Mangga Brazil</h4>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-500 border border-red-200">
                      HABIS
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#DC2626]">Rp 10.000</span>
                  <p className="text-[10px] text-slate-400">Stok 0 • terakhir diperbarui hari ini</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => toggleAvailability(1)}
                  className="px-4 py-1.5 bg-[#0A2E6E] hover:bg-[#082457] text-white text-xs font-bold rounded-lg shadow-xs transition"
                >
                  Ubah Stok
                </button>
                <button
                  onClick={() => openEditModal(menuItems[0])}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Edit Info
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: DAFTAR MENU (5) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">
              Daftar Menu ({menuItems.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola foto, harga, stok, dan info menu seller
            </p>
          </div>

          <button
            onClick={() => {
              setEditingItem(null);
              setMenuForm({
                name: '',
                price: '',
                category: 'Makanan Utama',
                isAvailable: true,
                image: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80'
              });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-[#0A2E6E] hover:bg-[#082457] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Tambah Menu</span>
          </button>
        </div>

        {/* Menu Grid - 3 Columns matching mockup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition"
            >
              {/* Image */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Body */}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">{item.name}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.isAvailable
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-red-50 text-red-500 border-red-200'
                    }`}
                  >
                    {item.isAvailable ? 'TERSEDIA' : 'HABIS'}
                  </span>
                </div>

                <div className="text-sm font-bold text-[#DC2626]">
                  {item.price}
                </div>

                <div className="flex items-center gap-2 text-xs pt-1">
                  <button
                    onClick={() => toggleAvailability(item.id)}
                    className="font-bold text-[#0A2E6E] hover:underline"
                  >
                    Ubah Stok
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={() => openEditModal(item)}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    Edit Info
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Tambah & Edit Menu */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-black text-slate-900 text-sm">
                {editingItem ? 'Edit Informasi Menu' : 'Tambah Menu Baru Stan 04'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenu} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Menu:</label>
                <input
                  type="text"
                  required
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  placeholder="Contoh: Jus Mangga Brazil"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0A2E6E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga (Rp):</label>
                  <input
                    type="text"
                    required
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                    placeholder="Contoh: Rp 10.000"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0A2E6E]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori:</label>
                  <select
                    value={menuForm.category}
                    onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Minuman Segar">Minuman Segar</option>
                    <option value="Makanan Utama">Makanan Utama</option>
                    <option value="Camilan">Camilan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Foto Menu:</label>
                <input
                  type="text"
                  value={menuForm.image}
                  onChange={(e) => setMenuForm({ ...menuForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0A2E6E]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0A2E6E] hover:bg-[#082457] text-white shadow-xs transition"
                >
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
