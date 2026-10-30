import { createContext, useContext, useState, useEffect, useMemo } from 'react';

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
    notes: typeof item.notes === 'string' ? item.notes.trim() : '',
    canteen_id: item.canteenId || item.canteen_id || null,
  };
};

export const CartProvider = ({ children }) => {
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

  // 3. Sinkronisasi aman ke LocalStorage
  useEffect(() => {
    try {
      const validItems = cartItems.map(sanitizeCartItem).filter(Boolean);
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validItems));

      if (validItems.length === 0) {
        localStorage.removeItem(CANTEEN_STORAGE_KEY);
        setCurrentCanteen(null);
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
    const sanitizedQty = isNaN(parseInt(quantity, 10)) || parseInt(quantity, 10) <= 0 ? 1 : parseInt(quantity, 10);
    const sanitizedPrice = isNaN(Number(item.price)) || Number(item.price) < 0 ? 0 : Number(item.price);
    const trimmedNotes = (notes || '').trim();

    // Single-canteen rule: Jika memilih dari kantin yang berbeda dari pesanan saat ini
    if (currentCanteen && effectiveCanteenId && currentCanteen.id !== effectiveCanteenId) {
      const confirmSwitch = window.confirm(
        `Keranjang Anda saat ini berisi menu dari "${currentCanteen.name}".\n\nGoCan hanya mendukung pemesanan dari 1 kantin per transaksi. Apakah Anda ingin mengosongkan keranjang sebelumnya dan memilih menu dari kantin ini?`
      );
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
          quantity: sanitizedQty,
          notes: trimmedNotes,
        },
      ];

      setCartItems(newItems);
      if (canteen) {
        setCurrentCanteen(canteen);
      } else {
        setCurrentCanteen({ id: effectiveCanteenId, name: 'Kantin Terpilih' });
      }
      return true;
    }

    // Set info kantin jika belum ada
    if (canteen && !currentCanteen) {
      setCurrentCanteen(canteen);
    } else if (effectiveCanteenId && !currentCanteen) {
      setCurrentCanteen({ id: effectiveCanteenId, name: 'Kantin Terpilih' });
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
          quantity: sanitizedQty,
          notes: trimmedNotes,
        },
      ];
    });

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
      const target = prev.find((i) => i.cartItemId === cartItemId);
      if (!target) return prev;

      const trimmedNotes = (newNotes || '').trim();
      const newCartItemId = `${target.id}-${trimmedNotes}`;

      return prev.map((i) =>
        i.cartItemId === cartItemId
          ? { ...i, cartItemId: newCartItemId, notes: trimmedNotes }
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

  const value = {
    cartItems,
    currentCanteen,
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
