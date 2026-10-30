import { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Utensils, CheckCircle } from 'lucide-react';

export default function CanteenMenu() {
  const [menus, setMenus] = useState([
    {
      id: 1,
      name: 'Ayam Geprek Sambal Bawang',
      category: 'Makanan Utama',
      price: 'Rp 18.000',
      isAvailable: true,
      soldCount: 42
    },
    {
      id: 2,
      name: 'Nasi Goreng Jawa Spesial',
      category: 'Makanan Utama',
      price: 'Rp 16.000',
      isAvailable: true,
      soldCount: 38
    },
    {
      id: 3,
      name: 'Tahu & Tempe Crispy',
      category: 'Snack / Camilan',
      price: 'Rp 8.000',
      isAvailable: false,
      soldCount: 15
    },
    {
      id: 4,
      name: 'Es Teh Manis Jumbo',
      category: 'Minuman',
      price: 'Rp 5.000',
      isAvailable: true,
      soldCount: 89
    }
  ]);

  const toggleAvailability = (id) => {
    setMenus(menus.map((m) => (m.id === id ? { ...m, isAvailable: !m.isAvailable } : m)));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Katalog Menu Stan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Ubah ketersediaan stok menu agar mahasiswa tahu menu yang sedang siap saji.
          </p>
        </div>
        <button className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" />
          Tambah Menu Baru
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Menu Makanan/Minuman</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Harga</th>
                <th className="py-3.5 px-4">Terjual</th>
                <th className="py-3.5 px-4">Status Stok</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {menus.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <span>{item.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-medium">{item.category}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{item.price}</td>
                  <td className="py-3 px-4 text-slate-600">{item.soldCount} porsi</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleAvailability(item.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                        item.isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {item.isAvailable ? '🟢 Tersedia' : '🔴 Habis'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
