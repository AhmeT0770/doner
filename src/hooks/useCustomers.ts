import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Customer {
  phone: string;
  name: string;
  address: string;
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Record<string, Customer>>({});

  // Fetch all customers from Supabase on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*');

      if (error) {
        console.error('Müşteriler yüklenirken hata:', error.message);
        return;
      }

      if (data) {
        const map: Record<string, Customer> = {};
        data.forEach((c: Customer) => {
          map[c.phone] = c;
        });
        setCustomers(map);
      }
    };

    fetchCustomers();
  }, []);

  const saveCustomer = useCallback(async (customer: Customer) => {
    // Optimistic update
    setCustomers(prev => ({
      ...prev,
      [customer.phone]: customer
    }));

    // Upsert to Supabase (insert or update based on phone)
    const { error } = await supabase
      .from('customers')
      .upsert(
        {
          phone: customer.phone,
          name: customer.name,
          address: customer.address,
        },
        { onConflict: 'phone' }
      );

    if (error) {
      console.error('Müşteri kaydedilirken hata:', error.message);
    }
  }, []);

  const getCustomer = useCallback((phone: string): Customer | undefined => {
    return customers[phone];
  }, [customers]);

  return {
    customers,
    saveCustomer,
    getCustomer
  };
};
