import { Link } from 'react-router-dom';
import { Trash2, ArrowLeft, ArrowRight, ShoppingBag, Store, Plus, Minus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Navbar from '../../components/common/Navbar';

export const Cart = () => {
  const {
    cartItems,
    currentCanteen,
    updateQuantity,
    updateNotes,
    removeFromCart,
    clearCart,
    totalFoodPrice,
    totalItems,
  } = useCart();

  const fallbackImage =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';

  // Highlighted first item for detailed preview card matching mockup
  const previewItem = cartItems[0] || null;

  return (
    <div className="min-h-screen bg-[#F0F4F9] text-slate-800 pb-20">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header navigation bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to={currentCanteen ? `/canteen/${currentCanteen.id}` : '/'}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#0A2E6E] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Menu</span>
          </Link>

          {cartItems.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Kosongkan semua pesanan di keranjang?')) {
                  clearCart();
                }
              }}
              className="text-xs font-semibold text-red-500 hover:text-red-700 transition cursor-pointer"
            >
              Kosongkan Keranjang
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto mt-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#0A2E6E]">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">Keranjang Masih Kosong</h2>
            <p className="mt-1 text-sm text-slate-500">
              Yuk jelajahi berbagai menu kantin favoritmu di UKWMS!
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0A2E6E] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#071E4A] transition"
            >
              <span>Jelajahi Menu</span>
              <ArrowRight className="h-4 w-4 text-white" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (7 cols): Selected Menu Preview & Notes */}
            <div className="lg:col-span-7 space-y-5">
              {previewItem && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-6 items-center">
                  <img
                    src={previewItem.image_url || fallbackImage}
                    alt={previewItem.name}
                    className="w-full sm:w-56 h-48 rounded-2xl object-cover shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = fallbackImage;
                    }}
                  />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-[#0A2E6E]">{previewItem.name}</h2>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {previewItem.description || 'Pilihan lezat dan segar untuk menemani jam istirahat kuliahmu di UKWMS.'}
                    </p>
                    <p className="text-2xl font-bold text-[#DC2626] mt-4">
                      Rp {Number(previewItem.price).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              )}

              {/* Catatan untuk Penjual (Opsional) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Catatan untuk Penjual (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Es sedikit aja, manis sedang..."
                  value={previewItem?.notes || ''}
                  onChange={(e) => {
                    if (previewItem) {
                      updateNotes(previewItem.cartItemId, e.target.value);
                    }
                  }}
                  className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 border border-slate-200 outline-none focus:border-[#0A2E6E]"
                />
              </div>
            </div>

            {/* Right Column (5 cols): RINGKASAN KERANJANG */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                RINGKASAN KERANJANG
              </h2>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {cartItems.map((item) => (
                  <div key={item.cartItemId} className="py-4 first:pt-0 last:pb-0 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{item.name}</h3>
                        {item.notes && (
                          <p className="text-xs text-slate-500 mt-0.5">Catatan: {item.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="text-slate-400 hover:text-[#DC2626] transition p-1 cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4 text-[#DC2626]" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className="font-bold text-sm text-[#DC2626]">
                        Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}
                      </span>

                      {/* Quantity stepper with amber + button */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-200 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-[#F59E0B] text-white flex items-center justify-center font-bold text-xs hover:bg-amber-600 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider & Total */}
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">Total Pesanan</span>
                <span className="text-xl font-bold text-[#DC2626]">
                  Rp {totalFoodPrice.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Action Button: Deep Navy */}
              <Link
                to="/checkout"
                className="w-full bg-[#0A2E6E] hover:bg-[#071E4A] text-white font-bold py-3.5 px-6 rounded-full text-center block shadow-md transition active:scale-98"
              >
                Lanjut ke Pembayaran
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
