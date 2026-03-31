'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { useOrders } from '@/hooks/useOrders';
import { useMenuItems } from '@/hooks/useMenuItems';
import Link from 'next/link';

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export default function POS() {
  const [activeCategory, setActiveCategory] = useState('Hepsi');

  // Menu from Supabase
  const { activeMenuItems, loading: menuLoading } = useMenuItems();
  const categories = useMemo(() => {
    const cats = [...new Set(activeMenuItems.map(m => m.category))];
    return ['Hepsi', ...cats];
  }, [activeMenuItems]);

  // Customer & Caller ID State
  const { saveCustomer, getCustomer } = useCustomers();
  const { saveOrder } = useOrders();

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Simulation of incoming call
  const simulateCall = () => {
    if (!phone) {
      alert("Lütfen önce bir telefon numarası girin (Örn: 0555 123 4567)");
      return;
    }
    const existing = getCustomer(phone);
    if (existing) {
      setName(existing.name);
      setAddress(existing.address);
      console.log("Müşteri bulundu: ", existing.name);
    } else {
      setName('');
      setAddress('');
      console.log("Yeni müşteri");
    }
  };

  // Auto lookup when user finishes typing a 10+ digit number
  useEffect(() => {
    const numericPhone = phone.replace(/\D/g, '');
    if (numericPhone.length >= 10) {
      const existing = getCustomer(phone);
      if (existing) {
        setName(existing.name);
        setAddress(existing.address);
      }
    }
  }, [phone, getCustomer]);

  // Real-time Caller ID WebSockets Listener
  useEffect(() => {
    import('socket.io-client').then(({ io }) => {
      const socket = io('http://localhost:3001');
      console.log('🔗 WebSocket Bağlanıyor...');

      socket.on('ring', (data) => {
        console.log('🚨 Gelen Arama Sinyali:', data);
        if (data.phone) {
          setPhone(data.phone);
          const existing = getCustomer(data.phone);
          if (existing) {
            setName(existing.name);
            setAddress(existing.address);
            console.log('Müşteri bulundu:', existing.name);
          } else {
            setName('');
            setAddress('');
            console.log('Yeni müşteri aranıyor!');
          }
          alert(`Yeni Arama Geliyor!\nTelefon: ${data.phone}`);
        }
      });

      return () => {
        socket.disconnect();
      };
    }).catch(err => {
      console.error("Socket.io client yüklenemedi:", err);
    });
  }, [getCustomer]);

  // Cart Functions
  const addToCart = (item: { id: number; name: string; price: number }) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.id === id) {
        const newQ = c.quantity + delta;
        return newQ > 0 ? { ...c, quantity: newQ } : c;
      }
      return c;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(c => c.id !== id));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.10;
  const total = subtotal + tax;

  // Checkout & Auto Print
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Adisyon boş!");
      return;
    }
    if (!phone) {
      alert("Siparişi onaylamadan önce lütfen müşteri telefon numarasını girin.");
      return;
    }

    saveCustomer({ phone, name, address });

    saveOrder({
      id: Date.now().toString(),
      timestamp: Date.now(),
      phone,
      customerName: name || 'Belirtilmedi',
      items: cart,
      subtotal,
      tax,
      total
    });

    window.print();

    setCart([]);
    setPhone('');
    setName('');
    setAddress('');
  };

  const filteredMenu = activeCategory === 'Hepsi'
    ? activeMenuItems
    : activeMenuItems.filter(m => m.category === activeCategory);

  return (
    <>
      {/* --- RECEIPT PRINT VIEW (Visible only on print) --- */}
      <div className="receipt-print-wrapper">
        <div className="receipt-header">
          <h2>BİZİM DÖNERCİ</h2>
          <p>Lezzetin Adresi</p>
          <p>Tel: 0212 555 44 33</p>
          <hr />
        </div>
        <div className="receipt-customer">
          <p><strong>Tel:</strong> {phone}</p>
          <p><strong>Müşteri:</strong> {name || 'Belirtilmedi'}</p>
          <p><strong>Adres:</strong> {address || 'Belirtilmedi'}</p>
          <hr />
        </div>
        <div className="receipt-items">
          <table style={{ width: '100%', textAlign: 'left' }}>
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Adet</th>
                <th style={{ textAlign: 'right' }}>Tutar</th>
              </tr>
            </thead>
            <tbody>
              {cart.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{c.price * c.quantity} ₺</td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr />
        </div>
        <div className="receipt-totals">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Ara Toplam:</span>
            <span>{subtotal.toFixed(2)} ₺</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>KDV (%10):</span>
            <span>{tax.toFixed(2)} ₺</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', marginTop: '10px' }}>
            <span>Genel Toplam:</span>
            <span>{total.toFixed(2)} ₺</span>
          </div>
          <hr />
          <p style={{ textAlign: 'center', marginTop: '10px' }}>Afiyet Olsun!</p>
          <p style={{ textAlign: 'center', fontSize: '0.8rem' }}>{new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* --- MAIN APP UI (Hidden on print) --- */}
      <div className="app-container no-print">
        {/* Sidebar: Caller ID & Customer Information */}
        <aside className="sidebar">
          <h2 className="title-gradient mb-4">Arayan Müşteri</h2>
          <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Telefon No</label>
              <input
                type="text"
                className="form-input"
                placeholder="Örn: 05xx xxx xx xx"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Ad Soyad</label>
            <input
              type="text"
              className="form-input"
              placeholder="Müşteri Adı"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Açık Adres</label>
            <textarea
              className="form-input"
              placeholder="Mahalle, Sokak, No, Daire..."
              style={{ height: '100px', resize: 'none' }}
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>
        </aside>

        {/* Main Content: Menu */}
        <main className="main-content">
          <div className="page-header">
            <div>
              <h1 className="text-h2 title-gradient">Menü</h1>
              <p className="text-muted">Döner çeşitleri, içecekler ve tatlılar</p>
            </div>
            <Link href="/admin" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Yönetim
            </Link>
          </div>

          <div className="category-filters">
            {categories.map(cat => (
              <button
                key={cat}
                className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>

          <div className="menu-grid">
            {menuLoading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Menü yükleniyor...</div>
            ) : filteredMenu.map(item => (
              <div className="menu-card" key={item.id} onClick={() => addToCart(item)}>
                <h3 className="menu-card-title">{item.name}</h3>
                <p className="menu-card-desc">{item.description}</p>
                <div className="menu-card-footer">
                  <span className="menu-card-price">{item.price} ₺</span>
                  <button className="menu-card-add">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Cart Sidebar: Adisyon */}
        <aside className="cart-sidebar">
          <h2 className="title-gradient mb-4">Adisyon</h2>
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', paddingRight: '5px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <p>Henüz sipariş eklenmedi.</p>
              </div>
            ) : null}

            {cart.map(c => (
              <div key={c.id} className="glass-panel" style={{ padding: '1rem', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                  <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>{c.price * c.quantity} ₺</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-color)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                    <button className="btn-secondary" style={{ padding: '0.25rem 0.6rem' }} onClick={() => updateQuantity(c.id, -1)}>-</button>
                    <span style={{ fontWeight: 600, width: '20px', textAlign: 'center' }}>{c.quantity}</span>
                    <button className="btn-secondary" style={{ padding: '0.25rem 0.6rem' }} onClick={() => updateQuantity(c.id, 1)}>+</button>
                  </div>
                  <button className="btn-danger" style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)' }} onClick={() => removeFromCart(c.id)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Ara Toplam</span>
              <span>{subtotal.toFixed(2)} ₺</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>KDV (%10)</span>
              <span>{tax.toFixed(2)} ₺</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem', marginBottom: '1rem' }}>
              <span>Genel Toplam</span>
              <span className="title-gradient">{total.toFixed(2)} ₺</span>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} onClick={handleCheckout}>
              Siparişi Onayla & Fiş Yazdır
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
