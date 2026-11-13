import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const MenuCard = ({ menu, canteen }) => {
  const { addToCart } = useCart();

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  const fallbackImage =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

  const isAvailable =
    menu.isAvailable !== false && menu.is_available !== false;

  const handleAddToCart = () => {
    const success = addToCart(menu, quantity, notes, canteen);

    if (success) {
      setShowNotesModal(false);
      setNotes('');
      setQuantity(1);
    }
  };

  return (
    <>
      <article className="
        customer-card menu-card-hover
        group flex flex-col overflow-hidden
        rounded-[26px] border border-slate-200
        bg-white
        shadow-[0_8px_25px_rgba(15,23,42,0.04)]
      ">
        {/* IMAGE */}
        <div className="relative aspect-[5/4] w-full overflow-hidden bg-slate-100">
          <img
            src={menu.imageUrl || menu.image_url || fallbackImage}
            alt={menu.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = fallbackImage;
            }}
            className={`
              h-full w-full object-cover
              transition-transform duration-500
              group-hover:scale-105
              ${!isAvailable ? 'grayscale' : ''}
            `}
          />

          {!isAvailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-red-600">
                MENU HABIS
              </span>
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="flex flex-1 flex-col justify-between p-4">

          <div>
            <p className="text-sm font-medium text-slate-500">
              {menu.canteen?.name || menu.canteenName || canteen?.name || 'Kantin GoCan'}
            </p>

            <h3 className="mt-2 text-sm sm:text-base font-extrabold leading-snug text-slate-800 transition-colors duration-200 group-hover:text-[#2152B7]">
              {menu.name}
            </h3>

            <p className="mt-3 min-h-[48px] text-sm leading-relaxed text-slate-500">
              {menu.description || `${menu.category || 'Menu'} pilihan dari ${menu.canteen?.name || menu.canteenName || canteen?.name || 'kantin kampus'}.`}
            </p>
          </div>

          {/* PRICE AND BUTTON */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5">

            <span className="text-[17px] font-extrabold text-[#ED2028]">
              Rp {Number(menu.price).toLocaleString('id-ID')}
            </span>

            {isAvailable ? (
              <button
                type="button"
                onClick={() => setShowNotesModal(true)}
                className="
                  flex items-center gap-2 rounded-2xl
                  px-4 py-2.5 text-sm sm:text-base font-extrabold text-black
                  transition-all duration-200
                  hover:scale-105 active:scale-95
                  bg-[#F7BD00] hover:bg-[#E5AE00]
                "
              >
                <Plus size={16} strokeWidth={3} />
                Tambah
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="rounded-2xl bg-slate-400 px-4 py-2.5 text-base font-bold text-white cursor-not-allowed"
              >
                Habis
              </button>
            )}
          </div>
        </div>
      </article>

      {/* ADD TO CART MODAL */}
      {showNotesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="customer-card w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900">
                Tambah ke Keranjang
              </h3>

              <button
                type="button"
                onClick={() => setShowNotesModal(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 flex gap-4">
              <img
                src={menu.imageUrl || fallbackImage}
                alt={menu.name}
                className="h-20 w-20 rounded-xl object-cover"
              />

              <div>
                <p className="font-bold text-slate-900">{menu.name}</p>
                <p className="mt-1 font-extrabold text-[#DC2626]">
                  Rp {Number(menu.price).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-sm font-bold text-slate-700">
                Jumlah
              </label>

              <div className="mt-2 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-10 w-10 rounded-xl border border-slate-200 font-bold hover:bg-slate-100"
                >
                  -
                </button>

                <span className="font-extrabold">{quantity}</span>

                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="h-10 w-10 rounded-xl border border-slate-200 font-bold hover:bg-slate-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-sm font-bold text-slate-700">
                Catatan untuk Penjual (Opsional)
              </label>

              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Sambal dipisah, tidak pedas..."
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#2152B7]"
              />
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-500">Subtotal</span>

              <span className="text-lg font-extrabold text-[#2152B7]">
                Rp {(Number(menu.price) * quantity).toLocaleString('id-ID')}
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="mt-5 w-full rounded-xl bg-[#2152B7] py-3.5 font-bold text-white transition hover:bg-[#2152B7]"
            >
              Masukkan ke Keranjang
            </button>

          </div>
        </div>
      )}
    </>
  );
};

export default MenuCard;