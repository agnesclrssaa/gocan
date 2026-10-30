import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const FloatingCart = () => {
  const { totalItems, totalFoodPrice, currentCanteen } = useCart();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-3 sm:bottom-5 left-0 right-0 z-40 mx-auto w-full max-w-lg sm:max-w-2xl px-3 sm:px-4 pointer-events-none transition-all duration-300">
      <div className="pointer-events-auto flex items-center justify-between rounded-2xl bg-white/95 p-3 sm:p-4 text-gray-900 shadow-2xl shadow-gray-950/20 border border-gray-200 backdrop-blur-md">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600 shadow-xs shrink-0">
            <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[11px] font-black text-white shadow-sm">
              {totalItems}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 font-medium truncate max-w-[130px] sm:max-w-[240px]">
              {currentCanteen ? currentCanteen.name : `${totalItems} Menu Terpilih`}
            </div>
            <div className="text-sm sm:text-lg font-black text-orange-600 tracking-tight">
              Rp {totalFoodPrice.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* CTA Utama: UKWMS Orange bg-orange-500 */}
        <Link
          to="/cart"
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-black text-white shadow-md shadow-orange-500/25 transition hover:bg-orange-600 active:scale-95 cursor-pointer"
        >
          <span>Lihat Keranjang</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default FloatingCart;
