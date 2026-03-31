'use client';

import { useMemo, useState } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { useMenuItems } from '@/hooks/useMenuItems';
import type { MenuItem } from '@/hooks/useMenuItems';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { TrendingUp, Users, ShoppingBag, ArrowLeft, Plus, Trash2, Edit3, ToggleLeft, ToggleRight, X, Check } from 'lucide-react';
import Link from 'next/link';

export default function Admin() {
  const { orders } = useOrders();
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItem } = useMenuItems();

  // Menu Management State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newItem, setNewItem] = useState({ category: 'Dönerler', name: '', description: '', price: '' });
  const [editItem, setEditItem] = useState({ category: '', name: '', description: '', price: '' });

  const uniqueCategories = useMemo(() => {
    const cats = [...new Set(menuItems.map(m => m.category))];
    if (cats.length === 0) return ['Dönerler', 'İçecekler', 'Yan Ürünler', 'Tatlılar'];
    return cats;
  }, [menuItems]);

  const handleAdd = async () => {
    if (!newItem.name || !newItem.price) {
      alert('Ürün adı ve fiyatı zorunludur!');
      return;
    }
    await addMenuItem({
      category: newItem.category,
      name: newItem.name,
      description: newItem.description,
      price: parseFloat(newItem.price),
    });
    setNewItem({ category: 'Dönerler', name: '', description: '', price: '' });
    setShowAddForm(false);
  };

  const handleAddCategory = async () => {
    const newCat = prompt('Yeni kategori adını girin (Örn: Çorbalar):');
    if (!newCat?.trim()) return;
    
    // Veritabanına gizli bir ürün ekleyerek kategoriyi sisteme kaydediyoruz
    await addMenuItem({
      category: newCat.trim(),
      name: ' ', // Gizli tutmak için boş isim
      description: 'Sistem kaydı',
      price: 0,
    });
    
    // Formu o kategori seçili şekilde aç
    setNewItem({ ...newItem, category: newCat.trim() });
    setShowAddForm(true);
  };

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEditItem({
      category: item.category,
      name: item.name,
      description: item.description,
      price: item.price.toString(),
    });
  };

  const handleUpdate = async () => {
    if (editingId === null) return;
    await updateMenuItem(editingId, {
      category: editItem.category,
      name: editItem.name,
      description: editItem.description,
      price: parseFloat(editItem.price),
    });
    setEditingId(null);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" ürününü silmek istediğine emin misin?`)) return;
    await deleteMenuItem(id);
  };

  // --- Calculations ---
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const avgBasket = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

  // --- Chart Data Processing ---
  const { revenueByDay, topItems } = useMemo(() => {
    const dailyMap: Record<string, number> = {};
    const itemMap: Record<string, number> = {};

    orders.forEach(order => {
      const date = new Date(order.timestamp).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
      dailyMap[date] = (dailyMap[date] || 0) + order.total;

      order.items.forEach(item => {
        itemMap[item.name] = (itemMap[item.name] || 0) + item.quantity;
      });
    });

    const revArray = Object.keys(dailyMap).map(date => ({
      date,
      ciro: dailyMap[date]
    })).reverse();

    const itemArray = Object.keys(itemMap).map(name => ({
      name,
      adet: itemMap[name]
    })).sort((a, b) => b.adet - a.adet).slice(0, 5);

    return { revenueByDay: revArray, topItems: itemArray };
  }, [orders]);

  return (
    <div className="app-container" style={{ padding: '2rem', overflowY: 'auto', display: 'block' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="text-h2 title-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={32} color="var(--brand-primary)" />
            Yönetim Paneli
          </h1>
          <p className="text-muted">Güncel Satış Analizi ve Sipariş Geçmişi</p>
        </div>
        <Link href="/" className="btn btn-secondary">
          <ArrowLeft size={18} /> POS Ekranına Dön
        </Link>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(45, 211, 111, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <TrendingUp size={28} color="var(--success)" />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Toplam Ciro</p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{totalRevenue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(255, 94, 58, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <ShoppingBag size={28} color="var(--brand-primary)" />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Toplam Sipariş</p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{totalOrders} Adet</h2>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(255, 196, 9, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <Users size={28} color="var(--warning)" />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Ortalama Sepet</p>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{avgBasket.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</h2>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'revert', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>

          <div className="glass-panel" style={{ flex: '1 1 500px', padding: '1.5rem', minHeight: '350px' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Günlük Satış Trendi</h3>
            {revenueByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={revenueByDay} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-light)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--brand-primary)', fontWeight: 'bold' }}
                    formatter={(value) => [value + ' ₺', 'Ciro']}
                  />
                  <Line type="monotone" dataKey="ciro" stroke="var(--brand-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--brand-primary)', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>Yeterli veri yok</div>
            )}
          </div>

          <div className="glass-panel" style={{ flex: '1 1 350px', padding: '1.5rem', minHeight: '350px' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>En Çok Satan 5 Ürün</h3>
            {topItems.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topItems} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: 'var(--surface-hover)', borderColor: 'var(--border-light)', borderRadius: '8px' }}
                    formatter={(value) => [value + ' Adet', 'Satış']}
                  />
                  <Bar dataKey="adet" fill="var(--warning)" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>Yeterli veri yok</div>
            )}
          </div>
        </div>
      </div>

      {/* Menu Management Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ color: 'var(--text-muted)' }}>Menü Yönetimi ({menuItems.length} ürün)</h3>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={handleAddCategory}
            >
              <Plus size={16} /> Yeni Kategori
            </button>
            <button
              className="btn btn-primary"
              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? <X size={16} /> : <Plus size={16} />}
              {showAddForm ? 'Kapat' : 'Yeni Ürün'}
            </button>
          </div>
        </div>

        {/* Add New Item Form */}
        {showAddForm && (
          <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '0 0 150px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Kategori</label>
              <select
                className="form-input"
                value={newItem.category}
                onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                style={{ padding: '0.6rem' }}
              >
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Ürün Adı</label>
              <input
                className="form-input"
                placeholder="Ör: Et Döner Dürüm"
                value={newItem.name}
                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Açıklama</label>
              <input
                className="form-input"
                placeholder="Kısa açıklama"
                value={newItem.description}
                onChange={e => setNewItem({ ...newItem, description: e.target.value })}
              />
            </div>
            <div style={{ flex: '0 0 100px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Fiyat (₺)</label>
              <input
                className="form-input"
                type="number"
                placeholder="120"
                value={newItem.price}
                onChange={e => setNewItem({ ...newItem, price: e.target.value })}
              />
            </div>
            <button className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }} onClick={handleAdd}>
              <Check size={16} /> Ekle
            </button>
          </div>
        )}

        {/* Menu Items Table */}
        <div className="glass-panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Durum</th>
                <th style={{ padding: '0.75rem 1rem' }}>Kategori</th>
                <th style={{ padding: '0.75rem 1rem' }}>Ürün Adı</th>
                <th style={{ padding: '0.75rem 1rem' }}>Açıklama</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Fiyat</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Henüz ürün bulunmuyor.</td>
                </tr>
              ) : null}
              {menuItems.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: item.is_active ? 1 : 0.5, transition: 'all 0.2s' }}>
                  {editingId === item.id ? (
                    <>
                      <td style={{ padding: '0.5rem 1rem' }}>
                        <button onClick={() => toggleMenuItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.is_active ? 'var(--success)' : 'var(--text-muted)' }}>
                          {item.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        </button>
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <select className="form-input" value={editItem.category} onChange={e => setEditItem({ ...editItem, category: e.target.value })} style={{ padding: '0.4rem', fontSize: '0.85rem' }}>
                          {uniqueCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input className="form-input" value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input className="form-input" value={editItem.description} onChange={e => setEditItem({ ...editItem, description: e.target.value })} style={{ padding: '0.4rem', fontSize: '0.85rem' }} />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input className="form-input" type="number" value={editItem.price} onChange={e => setEditItem({ ...editItem, price: e.target.value })} style={{ padding: '0.4rem', fontSize: '0.85rem', textAlign: 'right', width: '80px' }} />
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={handleUpdate}>
                            <Check size={14} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setEditingId(null)}>
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <button onClick={() => toggleMenuItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.is_active ? 'var(--success)' : 'var(--text-muted)' }}>
                          {item.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        </button>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem' }}>{item.category}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '250px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{item.description}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--brand-primary)' }}>{item.price} ₺</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => startEdit(item)}
                            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', color: 'var(--warning)', transition: 'all 0.2s' }}
                            title="Düzenle"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            style={{ background: 'rgba(255, 58, 58, 0.1)', border: 'none', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', color: '#ff3a3a', transition: 'all 0.2s' }}
                            title="Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Orders Table */}
      <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Son Siparişler ({orders.length})</h3>
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem' }}>Tarih</th>
              <th style={{ padding: '1rem' }}>Müşteri (Tel)</th>
              <th style={{ padding: '1rem' }}>İçerik</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Toplam Tutar</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Henüz sipariş kaydı bulunmuyor.</td>
              </tr>
            ) : null}
            {orders.slice(0, 15).map(order => (
              <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="table-row-hover">
                <td style={{ padding: '1rem' }}>
                  {new Date(order.timestamp).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order.phone}</div>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '300px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--brand-primary)' }}>
                  {order.total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
