import { useContext } from 'react';
import { CartContext } from './cartContext.jsx';

const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

export default useCart;

