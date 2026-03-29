import { useState, useEffect } from 'react';

export interface Customer {
  phone: string;
  name: string;
  address: string;
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Record<string, Customer>>(() => {
    const saved = localStorage.getItem('donerci_customers');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('donerci_customers', JSON.stringify(customers));
  }, [customers]);

  const saveCustomer = (customer: Customer) => {
    setCustomers(prev => ({
      ...prev,
      [customer.phone]: customer
    }));
  };

  const getCustomer = (phone: string): Customer | undefined => {
    return customers[phone];
  };

  return {
    customers,
    saveCustomer,
    getCustomer
  };
};
