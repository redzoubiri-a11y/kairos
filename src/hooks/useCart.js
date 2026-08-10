import { useState, useCallback, useMemo } from 'react';

export default function useCart() {
  const [items, setItems] = useState([]);

  const addItem = useCallback((dish) => {
    setItems(prev => {
      const existing = prev.find(i => i.dish_id === dish.id);
      if (existing) return prev.map(i => i.dish_id === dish.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { dish_id: dish.id, name: dish.name, price: dish.price || 0, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((dishId) => {
    setItems(prev => {
      const existing = prev.find(i => i.dish_id === dishId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.dish_id === dishId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.dish_id !== dishId);
    });
  }, []);

  const qtyFor = useCallback((dishId) => items.find(i => i.dish_id === dishId)?.quantity || 0, [items]);

  const clear = useCallback(() => setItems([]), []);

  const totalCount  = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const totalAmount = useMemo(() => items.reduce((s, i) => s + i.quantity * i.price, 0), [items]);

  return { items, addItem, removeItem, qtyFor, clear, totalCount, totalAmount };
}
