import { useState } from 'react';
import { Plus, Check, MessageSquare, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const MenuCard = ({ menu, canteen }) => {
  const { addToCart } = useCart();
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const fallbackImage =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';

  const handleQuickAdd = () => {
    const success = addToCart(menu, 1, '', canteen);
    if (success) {
      triggerSuccessAnimation();
    }
  };

  const handleModalAdd = (e) => {
    e.preventDefault();
    const success = addToCart(menu, quantity, notes, canteen);
    if (success) {
      setShowNotesModal(false);
      setNotes('');
      setQuantity(1);
      triggerSuccessAnimation();
    }
  };

  const triggerSuccessAnimation = () => {
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 1200);
  };

  const isAvailable = menu.isAvailable !== false && menu.is_available !== false;

  return (
    <>
      <div className="flex flex-col justify-between overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200/80 bg-white shadow-xs transition hover:border-[#0A2E6E]/40 hover:shadow-md">
        {/* Top Image (Matching gocan-canteen-detail.png) */}
        <div className="relative h-44 w-full overflow-hidden bg-slate-100">
          <img
            src={menu.imageUrl || menu.image_url || fallbackImage}
            alt={menu.name}
            className={`h-full w-full object-cover transition duration-300 hover:scale-105 ${
              !isAvailable ? 'grayscale-[60%]' : ''
            }`}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = fallbackImage;
            }}
          />
          {menu.category && (
            <span className="absolute top-2 left-2 rounded-md bg-[#0A2E6E]/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
              {menu.category}
            </span>
          )}
        </div>

        {/* Menu Details & Action Bar */}
        <div className="p-4 flex flex-col justify-between flex-1">
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
              {menu.name}
            </h4>
            <div className="mt-1 text-sm sm:text-base font-extrabold text-[#DC2626]">
              Rp {Number(menu.price).toLocaleString('id-ID')}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide ${
                isAvailable
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {isAvailable ? 'TERSEDIA' : 'HABIS'}
            </span>

            <div className="flex items-center gap-1.5">
              {isAvailable && (
                <button
                  type="button"
                  onClick={() => setShowNotesModal(true)}
                  aria-label="Tambah catatan khusus"
                  className="p-1.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
                  title="Tambah catatan khusus"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </button>
              )}

              {isAvailable ? (
                <button
                  type="button"
                  onClick={handleQuickAdd}
                  disabled={addedSuccess}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1 ${
                    addedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#0A2E6E] hover:bg-[#082252] text-white'
                  }`}
                >
                  {addedSuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Ditambah</span>
                    </>
                  ) : (
                    <span>+ Tambah</span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="px-4 py-1.5 rounded-full text-xs font-bold bg-slate-500 text-white opacity-80 cursor-not-allowed"
                >
                  Habis
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tambah dengan Catatan Khusus */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <button
              onClick={() => setShowNotesModal(false)}
              className="absolute top-4 right-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-900 leading-snug">
              Tambah Catatan: {menu.name}
            </h3>
            <p className="mt-1 text-xs text-[#DC2626] font-bold">
              Rp {Number(menu.price).toLocaleString('id-ID')}
            </p>

            <form onSubmit={handleModalAdd} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jumlah Pesanan
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 font-black text-slate-700 hover:bg-slate-100"
                  >
                    -
                  </button>
                  <span className="font-extrabold text-slate-900 text-base">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 font-black text-slate-700 hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Khusus ke Stan
                </label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Sambal dipisah, kuah banyak, tanpa seledri..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium text-slate-900 focus:border-[#0A2E6E] focus:ring-1 focus:ring-[#0A2E6E] focus:outline-hidden"
                ></textarea>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-500">Subtotal</span>
                <span className="text-base font-extrabold text-[#DC2626]">
                  Rp {(Number(menu.price) * quantity).toLocaleString('id-ID')}
                </span>
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-[#0A2E6E] hover:bg-[#082252] py-3 text-xs font-bold text-white transition shadow-xs cursor-pointer"
              >
                Masukkan ke Keranjang
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuCard;
