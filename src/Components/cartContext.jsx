import React, { createContext, useEffect, useMemo, useState, useCallback } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'fk_cart';

export const CartProvider = ({ children }) => {
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
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + (item.quantity || 1) };
        return next;
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i)));
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const isNepal = useMemo(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const langs = navigator.languages || [navigator.language || ''];
      const langNepal = langs.some((l) => /-NP$/i.test(l));
      const tzNepal = /Asia\/Kathmandu/i.test(tz);
      return langNepal || tzNepal;
    } catch {
      return false;
    }
  }, []);

  const currency = isNepal ? 'NPR' : 'INR';

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
