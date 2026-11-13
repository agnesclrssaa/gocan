import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export const FloatingCart = () => {
  const { profile } = useAuth();
  const { totalItems, totalFoodPrice, currentCanteen, cartNotificationPhase } = useCart();
  const [isToastVisible, setIsToastVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      setIsToastVisible(cartNotificationPhase === 'visible')
    );
    return () => window.cancelAnimationFrame(frame);
  }, [cartNotificationPhase]);

  if (profile?.role !== 'customer') return null;

  return (
    <div className="pointer-events-none fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-end gap-3 sm:right-6">
      {totalItems > 0 && cartNotificationPhase !== 'hidden' && (
        <div
          role="status"
          aria-live="polite"
          className={`customer-card w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-[#2152B7] bg-white/95 p-3 text-slate-900 shadow-xl shadow-slate-950/15 backdrop-blur-md transition-all duration-300 ease-out motion-reduce:transition-none ${
            isToastVisible && cartNotificationPhase === 'visible'
              ? 'translate-y-0 opacity-100'
              : 'translate-y-3 opacity-0'
          }`}
        >
          <div className="truncate text-xs font-bold text-[#2152B7]">
            Berhasil ditambahkan ke keranjang
          </div>
          <div className="mt-0.5 truncate text-[11px] text-slate-500">
            {currentCanteen?.name || `${totalItems} menu`} · Rp {totalFoodPrice.toLocaleString('id-ID')}
          </div>
        </div>
      )}

      <Link
        to="/cart"
        aria-label={`Keranjang Belanja, ${totalItems} item`}
        className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full bg-[#2152B7] text-white shadow-xl shadow-slate-950/25 transition hover:scale-105 hover:bg-[#2152B7] active:scale-95 sm:h-16 sm:w-16"
      >
        <ShoppingBag className="h-6 w-6 sm:h-7 sm:w-7" />
        {totalItems > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-[#DC2626] px-1 text-[11px] font-extrabold text-white">
            {totalItems}
          </span>
        )}
        <span className="sr-only">Lihat Keranjang</span>
      </Link>
    </div>
  );
};

export default FloatingCart;
