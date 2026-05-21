import React, { createContext, useEffect, useMemo, useState, useCallback } from 'react';
import useCurrency from './currencyContext.jsx';

const CartContext = createContext(null);

const STORAGE_KEY = 'fk_cart';

export const CartProvider = ({ children }) => {
  const { currency } = useCurrency();
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      void e;
    }
  }, [items]);

  const addItem = useCallback((item) => {
    // Normalize incoming prices and warn on suspicious values to aid debugging
    const normalizePrice = (v) => {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
      const parsed = Number(String(v || '').replace(/[^\\d.]/g, ''));
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const safeItem = {
      ...item,
      priceINR: normalizePrice(item.priceINR),
      priceNPR: normalizePrice(item.priceNPR),
    };

    if (typeof window !== 'undefined' && (safeItem.priceINR > 0 && safeItem.priceINR < 1)) {
      // log small price value to help debug cases like 0.2 instead of 2000
      // eslint-disable-next-line no-console
      console.warn('[cart] suspicious priceINR value', safeItem.priceINR, 'for item', safeItem.id || safeItem.title);
    }

    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          ...safeItem,
          quantity: next[idx].quantity + (item.quantity || 1),
        };
        return next;
      }
      return [...prev, { ...safeItem, quantity: item.quantity || 1 }];
    });
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i)));
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const total = useMemo(() => {
    return items.reduce((sum, i) => {
      const price = currency === 'NPR' ? Number(i.priceNPR || 0) : Number(i.priceINR || 0);
      return sum + price * i.quantity;
    }, 0);
  }, [items, currency]);

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      currency,
      total,
    }),
    [items, addItem, updateQuantity, removeItem, clear, currency, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export { CartContext };
