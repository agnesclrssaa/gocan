import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../lib/api';
import { Plus, CheckCircle, X, Search, Upload, Image as ImageIcon, LoaderCircle, Trash2 } from 'lucide-react';

const defaultImage = 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=600&q=80';
const menuCategories = ['Makanan Berat', 'Minuman', 'Cemilan', 'Healthy', 'Kopi'];
const formatPrice = (price) => `Rp ${Number(price || 0).toLocaleString('id-ID')}`;

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export default function CanteenMenuSales() {
  const { canteen, refreshCanteen, isOpen, updateStoreStatus, updatingStoreStatus } = useOutletContext();
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deletingMenuId, setDeletingMenuId] = useState(null);
  const [deletedMenuIds, setDeletedMenuIds] = useState(() => new Set());
  const [savingMenu, setSavingMenu] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [today] = useState(() => startOfDay(new Date()));
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    price: '',
    category: 'Makanan Berat',
    isAvailable: true,
    image: defaultImage,
  });

  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const menuItems = (canteen?.menus || []).filter((item) => !deletedMenuIds.has(item.id));
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      setOrders(await api.get('/orders/canteen'));
    } catch (error) {
      setOrdersError(`Gagal memuat data penjualan: ${error.message}`);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const triggerToast = (message) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3000);
  };

  const updateMenu = async (item, updates, successMessage) => {
    setActionError(null);
    try {
      await api.patch(`/canteens/mine/menus/${item.id}`, {
        name: updates.name ?? item.name,
        price: updates.price ?? item.price,
        category: updates.category ?? item.category,
        description: updates.description ?? item.description,
        imageUrl: updates.imageUrl ?? item.imageUrl,
        isAvailable: updates.isAvailable ?? item.isAvailable,
      });
      await refreshCanteen();
      triggerToast(successMessage);
    } catch (error) {
      setActionError(`Gagal menyimpan menu: ${error.message}`);
    }
  };

  const toggleAvailability = async (item) => {
    await updateMenu(
      item,
      { isAvailable: !item.isAvailable },
      `Stok "${item.name}" diubah menjadi: ${item.isAvailable ? 'Habis' : 'Tersedia'}`
    );
  };

  const handleDeleteMenu = async () => {
    if (!deletingItem || deletingMenuId) return;

    setDeletingMenuId(deletingItem.id);
    setActionError(null);
    try {
      const result = await api.delete(`/menu/${encodeURIComponent(deletingItem.id)}`);
      if (!result?.success) {
        throw new Error(result?.message || 'Server tidak mengonfirmasi penghapusan menu.');
      }

      setDeletedMenuIds((current) => new Set(current).add(deletingItem.id));
      triggerToast(`Menu "${deletingItem.name}" berhasil dihapus.`);
      setDeletingItem(null);
      await refreshCanteen();
    } catch (error) {
      setActionError(`Gagal menghapus menu: ${error.message}`);
    } finally {
      setDeletingMenuId(null);
    }
  };

  const handleToggleStoreStatus = async () => {
    setActionError(null);
    await updateStoreStatus();
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setActionError('Pilih foto berformat JPEG, PNG, atau WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setActionError('Ukuran foto maksimal 5 MB.');
      return;
    }

    setActionError(null);
    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const result = await api.post('/upload', formData);
      if (!result.success || !result.url) {
        throw new Error(result.message || 'Server tidak mengembalikan URL foto.');
      }

      setMenuForm((current) => ({ ...current, image: api.assetUrl(result.url) }));
      setImagePreview(null);
    } catch (error) {
      setImagePreview(null);
      setActionError(`Gagal mengunggah foto: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveMenu = async (event) => {
    event.preventDefault();
    if (uploadingImage) return;

    const numericPrice = Number(menuForm.price.replace(/[^\d]/g, ''));
    if (!Number.isSafeInteger(numericPrice) || numericPrice < 1) {
      setActionError('Harga menu harus berupa angka yang lebih besar dari nol.');
      return;
    }

    const menuData = {
      name: menuForm.name.trim(),
      price: numericPrice,
      category: menuForm.category,
      imageUrl: menuForm.image.trim() || defaultImage,
      isAvailable: menuForm.isAvailable,
    };

    setSavingMenu(true);
    setActionError(null);
    try {
      if (editingItem) {
        await api.patch(`/canteens/mine/menus/${editingItem.id}`, menuData);
        triggerToast(`Menu "${menuData.name}" berhasil diperbarui.`);
      } else {
        await api.post('/canteens/mine/menus', menuData);
        triggerToast(`Menu baru "${menuData.name}" berhasil ditambahkan.`);
      }
      await refreshCanteen();
      setShowAddModal(false);
      setEditingItem(null);
    } catch (error) {
      setActionError(`Gagal menyimpan menu: ${error.message}`);
    } finally {
      setSavingMenu(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setMenuForm({
      name: '',
      price: '',
      category: 'Makanan Berat',
      isAvailable: true,
      image: defaultImage,
    });
    setImagePreview(null);
    setActionError(null);
    setShowAddModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setMenuForm({
      name: item.name,
      price: String(item.price),
      category: item.category || 'Makanan Berat',
      isAvailable: item.isAvailable,
      image: item.imageUrl || defaultImage,
    });
    setImagePreview(null);
    setActionError(null);
    setShowAddModal(true);
  };

  const categories = ['Semua', ...new Set(menuItems.map((item) => item.category).filter(Boolean))];
  const filteredItems = menuItems.filter((item) => (
    (selectedCategory === 'Semua' || item.category === selectedCategory) &&
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ));

  const weeklySales = (() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return {
        date,
        label: date.toLocaleDateString('id-ID', { weekday: 'short' }),
        revenue: 0,
      };
    });

    orders.forEach((order) => {
      if (order.status === 'cancelled') return;
      const orderDate = startOfDay(new Date(order.createdAt));
      const day = days.find((entry) => entry.date.getTime() === orderDate.getTime());
      if (day) day.revenue += Number(order.totalPrice) || 0;
    });

    const maxRevenue = Math.max(...days.map((day) => day.revenue), 0);
    return days.map((day) => ({
      ...day,
      height: maxRevenue ? `${Math.max((day.revenue / maxRevenue) * 100, 2)}%` : '2%',
    }));
  })();

  const unavailableMenu = menuItems.find((item) => !item.isAvailable);

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div role="status" className="fixed right-6 top-20 z-50 flex items-center gap-3 rounded-xl bg-[#0A2E6E] px-5 py-3 text-white shadow-lg">
          <CheckCircle className="h-5 w-5 text-blue-300" />
          <span className="text-xs font-semibold sm:text-sm">{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} aria-label="Tutup notifikasi" className="ml-2 p-1 text-white/70 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="merchant-card-glow flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900">Perkembangan Penjualan Minggu Ini</h2>
            <p className="mt-1 text-xs text-slate-500">Total nilai pesanan harian berdasarkan transaksi kantin.</p>
          </div>
          {ordersError && <p role="alert" className="mt-4 text-sm text-rose-700">{ordersError}</p>}
          {ordersLoading ? (
            <p role="status" className="py-12 text-center text-sm text-slate-500">Memuat data penjualan...</p>
          ) : (
            <div className="py-8">
              <div className="flex h-48 items-end justify-around px-4">
                {weeklySales.map((day) => (
                  <div key={day.date.toISOString()} className="group flex h-full flex-col items-center justify-end gap-3">
                    <span className="text-[10px] font-semibold text-slate-600">{formatPrice(day.revenue)}</span>
                    <div className="flex h-40 w-8 items-end rounded-t bg-slate-100 p-1 sm:w-10">
                      <div
                        className="w-full rounded-t bg-blue-700 transition-colors group-hover:bg-blue-500"
                        style={{ height: day.height }}
                        title={`${day.label}: ${formatPrice(day.revenue)}`}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-600">{day.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-slate-500">
                {weeklySales.some((day) => day.revenue > 0) ? 'Penjualan 7 hari terakhir' : 'Belum ada data penjualan minggu ini.'}
              </p>
            </div>
          )}
        </section>

        <section className="merchant-card-glow flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-tight text-slate-900">Kontrol Stok & Status</h2>
            <p className="mt-1 text-xs text-slate-500">Atur penerimaan pesanan dan ketersediaan menu.</p>
            <div className="mt-5 space-y-2">
              <span className="block text-xs font-bold text-slate-800">Status Penerimaan Order</span>
              <button
                type="button"
                onClick={handleToggleStoreStatus}
                disabled={updatingStoreStatus}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition disabled:opacity-60 ${
                  isOpen
                    ? 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100'
                    : 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                {isOpen ? 'BUKA (Klik Tutup)' : 'TUTUP (Klik Buka)'}
              </button>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <span className="mb-3 block text-xs font-bold text-slate-800">Menu Perlu Tindakan</span>
              {unavailableMenu ? (
                <div className="merchant-card-glow flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3">
                  <img src={unavailableMenu.imageUrl || defaultImage} alt={unavailableMenu.name} className="h-12 w-12 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-xs font-bold text-slate-900">{unavailableMenu.name}</h3>
                      <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">HABIS</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">{formatPrice(unavailableMenu.price)}</span>
                  </div>
                </div>
              ) : (
                <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">Semua menu tersedia.</p>
              )}
              {unavailableMenu && (
                <div className="mt-3 flex items-center gap-3">
                  <button type="button" onClick={() => toggleAvailability(unavailableMenu)} className="rounded-lg bg-[#0A2E6E] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-[#082457]">
                    Ubah Stok
                  </button>
                  <button type="button" onClick={() => openEditModal(unavailableMenu)} className="text-xs font-semibold text-slate-500 hover:text-slate-800">
                    Edit Info
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="merchant-card-glow space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold uppercase tracking-tight text-slate-900">Daftar Menu ({menuItems.length})</h2>
            <p className="mt-0.5 text-xs text-slate-500">Kelola foto, harga, stok, dan informasi menu.</p>
          </div>
          <button type="button" onClick={openAddModal} className="flex items-center gap-1.5 self-start rounded-lg bg-[#0A2E6E] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#082457] sm:self-auto">
            <Plus className="h-4 w-4" />
            Tambah Menu
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari menu..." className="w-full text-sm outline-none" />
          </label>
          <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} aria-label="Filter kategori menu" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>

        {menuItems.length === 0 ? (
          <p className="merchant-card-glow rounded-xl border p-8 text-center text-sm text-slate-500">Belum ada menu. Tambahkan menu pertama kantin Anda.</p>
        ) : filteredItems.length === 0 ? (
          <p className="merchant-card-glow rounded-xl border p-8 text-center text-sm text-slate-500">Tidak ada menu yang cocok dengan pencarian.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <article key={item.id} className="merchant-card-glow overflow-hidden rounded-xl border border-slate-200">
                <div className="h-48 w-full bg-slate-100">
                  <img src={item.imageUrl || defaultImage} alt={item.name} className="h-full w-full object-cover" />
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${item.isAvailable ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
                      {item.isAvailable ? 'TERSEDIA' : 'HABIS'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{formatPrice(item.price)}</p>
                  <p className="text-xs text-slate-500">{item.category || 'Tanpa kategori'}</p>
                  <div className="flex w-full items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => toggleAvailability(item)}
                      className="text-xs font-medium text-[#2152B7] hover:text-[#163D8F]"
                    >
                      Ubah Stok
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="text-xs font-medium text-slate-500 hover:text-slate-800"
                    >
                      Edit Info
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActionError(null);
                        setDeletingItem(item);
                      }}
                      className="inline-flex items-center gap-1 font-semibold text-rose-700 hover:text-rose-800"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="merchant-card-glow w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">{editingItem ? 'Edit Informasi Menu' : 'Tambah Menu Baru'}</h2>
              <button type="button" onClick={() => setShowAddModal(false)} aria-label="Tutup form" className="rounded-lg p-1 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveMenu} className="space-y-3.5 text-xs">
              <label className="block font-bold text-slate-700">
                Nama Menu:
                <input type="text" required value={menuForm.name} onChange={(event) => setMenuForm({ ...menuForm, name: event.target.value })} placeholder="Contoh: Jus Mangga Brazil" className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 font-normal" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block font-bold text-slate-700">
                  Harga (Rp):
                  <input type="text" required value={menuForm.price} onChange={(event) => setMenuForm({ ...menuForm, price: event.target.value })} placeholder="Contoh: 10000" className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 font-normal" />
                </label>
                <label className="block font-bold text-slate-700">
                  Kategori:
                  <select value={menuForm.category} onChange={(event) => setMenuForm({ ...menuForm, category: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 font-normal">
                    {menuCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
              </div>
              <div className="space-y-2">
                <span className="block font-bold text-slate-700">Foto Menu:</span>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-700 transition hover:border-blue-500 hover:bg-blue-50">
                  {uploadingImage ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploadingImage ? 'Mengunggah foto...' : 'Pilih foto (JPEG, PNG, WebP; maks. 5 MB)'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    disabled={uploadingImage || savingMenu}
                    className="sr-only"
                  />
                </label>
                {(imagePreview || menuForm.image) && (
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-2">
                    <img
                      src={imagePreview || menuForm.image}
                      alt="Pratinjau foto menu"
                      className="h-16 w-16 rounded-md object-cover"
                    />
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <ImageIcon className="h-3.5 w-3.5" />
                      Pratinjau foto menu
                    </span>
                  </div>
                )}
                <label className="block font-normal text-slate-500">
                  Atau masukkan URL foto:
                  <input
                    type="url"
                    value={menuForm.image}
                    onChange={(event) => setMenuForm({ ...menuForm, image: event.target.value })}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700"
                  />
                </label>
              </div>
              {actionError && <p role="alert" className="text-xs text-rose-700">{actionError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Batal</button>
                <button type="submit" disabled={savingMenu || uploadingImage} className="rounded-lg bg-[#0A2E6E] px-4 py-2 text-xs font-bold text-white hover:bg-[#082457] disabled:opacity-60">
                  {savingMenu ? 'Menyimpan...' : 'Simpan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingItem && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingMenuId) setDeletingItem(null);
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-menu-title"
            aria-describedby="delete-menu-description"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-700">
                <Trash2 className="h-5 w-5" />
              </span>
              <div>
                <h2 id="delete-menu-title" className="text-base font-bold text-slate-900">
                  Hapus menu?
                </h2>
                <p id="delete-menu-description" className="mt-2 text-sm text-slate-600">
                  Menu <strong>{deletingItem.name}</strong> akan dihapus dari daftar menu kantin.
                </p>
              </div>
            </div>
            {actionError && (
              <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                {actionError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={Boolean(deletingMenuId)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteMenu}
                disabled={Boolean(deletingMenuId)}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold text-white hover:bg-rose-800 disabled:cursor-wait disabled:opacity-60"
              >
                {deletingMenuId && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {deletingMenuId ? 'Menghapus...' : 'Ya, hapus menu'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
