import { useState, useEffect } from 'react';

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string; // unique string (timestamp based)
  timestamp: number;
  phone: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('donerci_orders');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('donerci_orders', JSON.stringify(orders));
  }, [orders]);

  const saveOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
  };

  return {
    orders,
    saveOrder
  };
};
