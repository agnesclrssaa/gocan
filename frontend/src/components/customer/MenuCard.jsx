import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import AssetImage from '../common/AssetImage';

const MenuCard = ({ menu, canteen }) => {
  const { addToCart } = useCart();

  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const isAvailable =
    menu.isAvailable !== false && menu.is_available !== false;
  const canteenName =
    menu.canteen?.name || menu.canteenName || canteen?.name || 'Kantin GoCan';
  const canteenId = menu.canteenId || menu.canteen?.id || canteen?.id;
  const description =
    menu.description || `${menu.category || 'Menu'} pilihan dari ${canteenName}.`;

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
      <article className="customer-card customer-menu-card menu-card-hover group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="relative aspect-[5/4] w-full overflow-hidden bg-slate-100">
          <AssetImage
            src={menu.imageUrl || menu.image_url}
            alt={menu.name}
            loading="lazy"
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

        <div className="customer-menu-content flex min-w-0 flex-1 flex-col p-3 sm:p-4">
          <div className="customer-menu-details min-w-0">
            {canteenId ? (
              <Link
                to={`/canteen/${encodeURIComponent(canteenId)}`}
                title={`Dari ${canteenName}`}
                className="customer-menu-canteen block truncate text-xs font-semibold text-slate-500 hover:text-[#2152B7]"
              >
                Dari {canteenName}
              </Link>
            ) : (
              <p
                title={`Dari ${canteenName}`}
                className="customer-menu-canteen truncate text-xs font-semibold text-slate-500"
              >
                Dari {canteenName}
              </p>
            )}

            <h3 className="customer-menu-title mt-1.5 min-h-[2.5rem] line-clamp-2 text-sm font-extrabold leading-snug text-slate-800 transition-colors duration-200 group-hover:text-[#2152B7] sm:text-base">
              {menu.name}
            </h3>

            <p
              title={description}
              className={`customer-menu-description mt-2 min-h-[3rem] text-xs leading-relaxed text-slate-500 sm:text-sm ${
                descriptionExpanded ? '' : 'line-clamp-3'
              }`}
            >
              {description}
            </p>
            {description.length > 72 && (
              <button
                type="button"
                aria-expanded={descriptionExpanded}
                onClick={() => setDescriptionExpanded((expanded) => !expanded)}
                className="mt-1 min-h-8 text-left text-xs font-bold text-[#2152B7] hover:underline"
              >
                {descriptionExpanded ? 'Lebih sedikit' : 'Baca deskripsi'}
              </button>
            )}
          </div>

          <div className="customer-menu-footer mt-auto flex min-w-0 items-center justify-between gap-1.5 pt-3">
            <span className="customer-menu-price gocan-price min-w-0 flex-1 whitespace-nowrap text-xs font-extrabold sm:text-[17px]">
              Rp {Number(menu.price).toLocaleString('id-ID')}
            </span>

            {isAvailable ? (
              <button
                type="button"
                onClick={() => setShowNotesModal(true)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-xl bg-[#ffd612] px-2 text-[11px] font-extrabold text-slate-900 transition-colors hover:bg-[#f2c900] active:scale-95 sm:gap-2 sm:px-4 sm:text-sm"
              >
                <Plus size={15} strokeWidth={3} aria-hidden="true" />
                Tambah
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex h-10 shrink-0 cursor-not-allowed items-center justify-center rounded-xl bg-slate-400 px-3 text-xs font-bold text-white sm:px-4 sm:text-sm"
              >
                Habis
              </button>
            )}
          </div>
        </div>
      </article>

      {/* ADD TO CART MODAL */}
      {showNotesModal && createPortal(
        <div className="customer-add-menu-overlay fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="customer-add-menu-dialog customer-card w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">

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
              <AssetImage
                src={menu.imageUrl || menu.image_url}
                alt={menu.name}
                className="h-20 w-20 rounded-xl object-cover"
              />

              <div>
                <p className="font-bold text-slate-900">{menu.name}</p>
                <p className="gocan-price mt-1 font-extrabold">
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
                maxLength={1000}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Sambal dipisah, tidak pedas..."
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#2152B7]"
              />
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-500">Subtotal</span>

              <span className="gocan-price text-lg font-extrabold">
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
        </div>,
        document.body
      )}
    </>
  );
};

export default MenuCard;