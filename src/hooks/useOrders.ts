import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

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
  const [orders, setOrders] = useState<Order[]>([]);

  // Fetch all orders from Supabase on mount
  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Siparişler yüklenirken hata:', error.message);
        return;
      }

      if (data) {
        // Map Supabase rows to Order interface
        const mapped: Order[] = data.map((row: {
          id: string;
          timestamp: number;
          phone: string;
          customer_name: string;
          items: OrderItem[];
          subtotal: number;
          tax: number;
          total: number;
        }) => ({
          id: row.id,
          timestamp: row.timestamp,
          phone: row.phone,
          customerName: row.customer_name,
          items: row.items,
          subtotal: row.subtotal,
          tax: row.tax,
          total: row.total,
        }));
        setOrders(mapped);
      }
    };

    fetchOrders();
  }, []);

  const saveOrder = useCallback(async (order: Order) => {
    // Optimistic update
    setOrders(prev => [order, ...prev]);

    // Insert to Supabase
    const { error } = await supabase
      .from('orders')
      .insert({
        id: order.id,
        timestamp: order.timestamp,
        phone: order.phone,
        customer_name: order.customerName,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
      });

    if (error) {
      console.error('Sipariş kaydedilirken hata:', error.message);
    }
  }, []);

  return {
    orders,
    saveOrder
  };
};
