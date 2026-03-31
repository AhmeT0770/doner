import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface MenuItem {
  id: number;
  category: string;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
}

export const useMenuItems = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all menu items from Supabase
  const fetchMenuItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category')
      .order('name');

    if (error) {
      console.error('Menü yüklenirken hata:', error.message);
    } else if (data) {
      setMenuItems(data as MenuItem[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  // Add new menu item
  const addMenuItem = useCallback(async (item: Omit<MenuItem, 'id' | 'is_active'>) => {
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        category: item.category,
        name: item.name,
        description: item.description,
        price: item.price,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Ürün eklenirken hata:', error.message);
      return null;
    }

    if (data) {
      setMenuItems(prev => [...prev, data as MenuItem]);
    }
    return data;
  }, []);

  // Update existing menu item
  const updateMenuItem = useCallback(async (id: number, updates: Partial<Omit<MenuItem, 'id'>>) => {
    const { error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Ürün güncellenirken hata:', error.message);
      return false;
    }

    setMenuItems(prev =>
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    );
    return true;
  }, []);

  // Delete menu item
  const deleteMenuItem = useCallback(async (id: number) => {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Ürün silinirken hata:', error.message);
      return false;
    }

    setMenuItems(prev => prev.filter(item => item.id !== id));
    return true;
  }, []);

  // Toggle active/inactive
  const toggleMenuItem = useCallback(async (id: number) => {
    const item = menuItems.find(m => m.id === id);
    if (!item) return false;

    return updateMenuItem(id, { is_active: !item.is_active });
  }, [menuItems, updateMenuItem]);

  // Only active items (for POS screen)
  const activeMenuItems = menuItems.filter(m => m.is_active);

  return {
    menuItems,
    activeMenuItems,
    loading,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuItem,
    refreshMenu: fetchMenuItems,
  };
};
