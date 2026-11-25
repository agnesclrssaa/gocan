import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useCampus } from './CampusContext';

const CartContext = createContext({});

const CART_STORAGE_KEY = 'gocan_cart';
const CANTEEN_STORAGE_KEY = 'gocan_canteen';

/**
 * Sanitasi data item agar terbebas dari nilai null / NaN / undefined
 */
const sanitizeCartItem = (item) => {
  if (!item || typeof item !== 'object') return null;
  const rawPrice = Number(item.price);
  const rawQty = parseInt(item.quantity, 10);

  return {
    ...item,
    id: item.id || '',
    cartItemId: item.cartItemId || `${item.id}-${(item.notes || '').trim()}`,
    name: item.name || 'Menu',
    price: isNaN(rawPrice) || rawPrice < 0 ? 0 : rawPrice,
    quantity: isNaN(rawQty) || rawQty <= 0 ? 1 : rawQty,
    notes: typeof item.notes === 'string' ? item.notes : '',
    canteen_id: item.canteenId || item.canteen_id || null,
    campusId: String(item.campusId || item.campus_id || ''),
  };
};

export const CartProvider = ({ children }) => {
  const { selectedCampus } = useCampus();
  // 1. Inisialisasi Cart Items dari LocalStorage dengan validasi aman dari null / NaN
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(sanitizeCartItem).filter(Boolean);
    } catch (err) {
      console.error('Gagal membaca data keranjang dari localStorage:', err);
      return [];
    }
  });
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);

  // 2. Simpan info Kantin aktif (agar 1 checkout = 1 kantin)
  const [currentCanteen, setCurrentCanteen] = useState(() => {
    try {
      const saved = localStorage.getItem(CANTEEN_STORAGE_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' && parsed.id ? parsed : null;
    } catch {
      return null;
    }
  });
  const [cartNotificationPhase, setCartNotificationPhase] = useState('hidden');
  const cartNotificationTimeout = useRef(null);
  const previousSelectedCampusId = useRef(selectedCampus?.campusId || '');

  useEffect(() => {
    const currentCampusId = selectedCampus?.campusId || '';
    if (previousSelectedCampusId.current && currentCampusId !== previousSelectedCampusId.current) {
      setPromoCode('');
      setAppliedPromo(null);
    }
    previousSelectedCampusId.current = currentCampusId;
  }, [selectedCampus?.campusId]);

  const showCartNotification = () => {
    window.clearTimeout(cartNotificationTimeout.current);
    setCartNotificationPhase('visible');
    cartNotificationTimeout.current = window.setTimeout(() => {
      setCartNotificationPhase('leaving');
      cartNotificationTimeout.current = window.setTimeout(() => {
        setCartNotificationPhase('hidden');
        cartNotificationTimeout.current = null;
      }, 300);
    }, 2200);
  };

  useEffect(() => () => window.clearTimeout(cartNotificationTimeout.current), []);

  // 3. Sinkronisasi aman ke LocalStorage
  useEffect(() => {
    try {
      const validItems = cartItems.map(sanitizeCartItem).filter(Boolean);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validItems));

      if (validItems.length === 0) {
        localStorage.removeItem(CANTEEN_STORAGE_KEY);
        setCurrentCanteen(null);
        setPromoCode('');
        setAppliedPromo(null);
      } else if (currentCanteen) {
        localStorage.setItem(CANTEEN_STORAGE_KEY, JSON.stringify(currentCanteen));
      }
    } catch (err) {
      console.error('Gagal menyimpan cart ke localStorage:', err);
    }
  }, [cartItems, currentCanteen]);

  /**
   * Tambah item ke keranjang dengan Single-Canteen Rule
   * @param {Object} item - Data item menu ({ id, name, price, image_url, canteen_id })
   * @param {number} quantity - Jumlah yang ditambah (default 1)
   * @param {string} notes - Catatan khusus (contoh: "pedas", "tanpa es")
   * @param {Object} canteen - Info kantin asal menu ({ id, name, location })
   */
  const addToCart = (item, quantity = 1, notes = '', canteen = null) => {
    if (!item || !item.id) return false;

    const effectiveCanteenId = item.canteenId || item.canteen_id || canteen?.id;
    const effectiveCampusId = String(
      item.campusId ||
      item.campus_id ||
      canteen?.campusId ||
      selectedCampus?.campusId ||
      ''
    );
    const sanitizedQty = isNaN(parseInt(quantity, 10)) || parseInt(quantity, 10) <= 0 ? 1 : parseInt(quantity, 10);
    const sanitizedPrice = isNaN(Number(item.price)) || Number(item.price) < 0 ? 0 : Number(item.price);
    const trimmedNotes = (notes || '').trim();

    // Single-canteen rule: Jika memilih dari kantin yang berbeda dari pesanan saat ini
    const campusChanged = cartItems.some((cartItem) => cartItem.campusId !== effectiveCampusId);
    const canteenChanged =
      currentCanteen &&
      effectiveCanteenId &&
      currentCanteen.id !== effectiveCanteenId;
    if (campusChanged || canteenChanged) {
      const confirmSwitch = window.confirm(campusChanged
        ? 'Keranjang Anda saat ini berisi menu dari kampus lain. Apakah Anda ingin mengosongkan keranjang sebelumnya dan memilih menu dari kampus ini?'
        : `Keranjang Anda saat ini berisi menu dari "${currentCanteen.name}".\n\nGoCan hanya mendukung pemesanan dari 1 kantin per transaksi. Apakah Anda ingin mengosongkan keranjang sebelumnya dan memilih menu dari kantin ini?`);
      if (!confirmSwitch) return false;

      // Reset keranjang untuk kantin baru
      const newItemId = `${item.id}-${trimmedNotes}`;
      const newItems = [
        {
          cartItemId: newItemId,
          id: item.id,
          name: item.name,
          price: sanitizedPrice,
          image_url: item.imageUrl || item.image_url,
          canteen_id: effectiveCanteenId,
          campusId: effectiveCampusId,
          quantity: sanitizedQty,
          notes: trimmedNotes,
        },
      ];

      setCartItems(newItems);
      if (canteen) {
        setCurrentCanteen({ ...canteen, campusId: effectiveCampusId });
      } else {
        setCurrentCanteen({ id: effectiveCanteenId, name: 'Kantin Terpilih', campusId: effectiveCampusId });
      }
      showCartNotification();
      return true;
    }

    // Set info kantin jika belum ada
    if (canteen && !currentCanteen) {
      setCurrentCanteen({ ...canteen, campusId: effectiveCampusId });
    } else if (effectiveCanteenId && !currentCanteen) {
      setCurrentCanteen({ id: effectiveCanteenId, name: 'Kantin Terpilih', campusId: effectiveCampusId });
    }

    setCartItems((prev) => {
      const cartItemId = `${item.id}-${trimmedNotes}`;
      const existingIndex = prev.findIndex((i) => i.cartItemId === cartItemId);

      if (existingIndex > -1) {
        const updated = [...prev];
        const currentItem = updated[existingIndex];
        updated[existingIndex] = {
          ...currentItem,
          quantity: (Number(currentItem.quantity) || 1) + sanitizedQty,
        };
        return updated;
      }

      return [
        ...prev,
        {
          cartItemId,
          id: item.id,
          name: item.name,
          price: sanitizedPrice,
          image_url: item.imageUrl || item.image_url,
          canteen_id: effectiveCanteenId,
          campusId: effectiveCampusId,
          quantity: sanitizedQty,
          notes: trimmedNotes,
        },
      ];
    });

    showCartNotification();
    return true;
  };

  /**
   * Kurangi kuantitas item atau hapus jika kuantitas <= 1
   */
  const decreaseQuantity = (cartItemId) => {
    setCartItems((prev) => {
      const item = prev.find((i) => i.cartItemId === cartItemId);
      if (!item) return prev;

      if ((Number(item.quantity) || 1) <= 1) {
        return prev.filter((i) => i.cartItemId !== cartItemId);
      }

      return prev.map((i) =>
        i.cartItemId === cartItemId ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i
      );
    });
  };

  /**
   * Ubah kuantitas item secara spesifik
   */
  const updateQuantity = (cartItemId, quantity) => {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) => (i.cartItemId === cartItemId ? { ...i, quantity: qty } : i))
    );
  };

  /**
   * Ubah catatan khusus (notes) per item
   */
  const updateNotes = (cartItemId, newNotes) => {
    setCartItems((prev) => {
      const notes = typeof newNotes === 'string' ? newNotes : '';

      return prev.map((i) =>
        i.cartItemId === cartItemId
          ? { ...i, notes }
          : i
      );
    });
  };

  /**
   * Hapus item dari keranjang
   */
  const removeFromCart = (cartItemId) => {
    setCartItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  /**
   * Kosongkan keranjang
   */
  const clearCart = () => {
    setCartItems([]);
    setCurrentCanteen(null);
    setPromoCode('');
    setAppliedPromo(null);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(CANTEEN_STORAGE_KEY);
  };

  // 4. Kalkulasi Total Harga Makanan Otomatis (Aman dari NaN)
  const totalFoodPrice = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = Number(item.price);
      const qty = Number(item.quantity);
      const safePrice = isNaN(price) || price < 0 ? 0 : price;
      const safeQty = isNaN(qty) || qty <= 0 ? 0 : qty;
      return total + safePrice * safeQty;
    }, 0);
  }, [cartItems]);

  // 5. Kalkulasi Total Jumlah Item (Aman dari NaN)
  const totalItems = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const qty = Number(item.quantity);
      return total + (isNaN(qty) || qty <= 0 ? 0 : qty);
    }, 0);
  }, [cartItems]);

  const cartCampusId = cartItems[0]?.campusId || '';
  const cartHasMixedCampuses = cartItems.some((item) => item.campusId !== cartCampusId);

  const value = {
    cartItems,
    currentCanteen,
    cartCampusId,
    cartHasMixedCampuses,
    setCurrentCanteen,
    addToCart,
    decreaseQuantity,
    updateQuantity,
    updateNotes,
    removeFromCart,
    clearCart,
    totalFoodPrice,
    totalAmount: totalFoodPrice, // Alias kompatibilitas
    totalItems,
    promoCode,
    setPromoCode,
    appliedPromo,
    setAppliedPromo,
    cartNotificationPhase,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
