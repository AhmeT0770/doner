import { useState, useEffect } from 'react';
import './index.css';
import { useCustomers } from './hooks/useCustomers';

// Mock Data for Menu
const MENU_ITEMS = [
  { id: 1, category: 'Dönerler', name: 'Et Döner Dürüm', desc: 'Özel lavaş arası 100gr yaprak et döner.', price: 120 },
  { id: 2, category: 'Dönerler', name: 'Tavuk Döner Dürüm', desc: 'Hatay usulü soslu tavuk döner dürüm.', price: 80 },
  { id: 3, category: 'Dönerler', name: 'Porsiyon Et Döner', desc: 'Pilav üstü iskender tarzı özel soslu.', price: 180 },
  { id: 4, category: 'Dönerler', name: 'Porsiyon Tavuk Döner', desc: 'Pilav, soğan, turşu ve patates ile.', price: 140 },
  { id: 5, category: 'İçecekler', name: 'Ayran (Büyük)', desc: 'Açık köpüklü naneli ev yapımı ayran.', price: 20 },
  { id: 6, category: 'İçecekler', name: 'Kola', desc: '330ml Kutu Kola', price: 30 },
  { id: 7, category: 'İçecekler', name: 'Şalgam', desc: 'Acılı/Acısız Adana Şalgamı.', price: 25 },
  { id: 8, category: 'Yan Ürünler', name: 'Patates Kızartması', desc: 'Büyük boy çıtır patates.', price: 40 },
  { id: 9, category: 'Yan Ürünler', name: 'Ekstra Savaş', desc: '1 Adet Lavaş', price: 10 },
];

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

function App() {
  const [activeCategory, setActiveCategory] = useState('Hepsi');
  
  // Customer & Caller ID State
  const { saveCustomer, getCustomer } = useCustomers();
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
      // Optional: highlight success
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
          // Set the phone immediately
          setPhone(data.phone);
          // Wait a tick for state to update, or just look it up manually here
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
          // Custom Alert / Notification
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
  const addToCart = (item: typeof MENU_ITEMS[0]) => {
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
  const tax = subtotal * 0.10; // 10% KDV
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

    // Save/Update Customer automatically
    saveCustomer({ phone, name, address });

    // Trigger Print
    window.print();
    
    // Clear cart after print
    setCart([]);
    setPhone('');
    setName('');
    setAddress('');
  };

  const filteredMenu = activeCategory === 'Hepsi' 
    ? MENU_ITEMS 
    : MENU_ITEMS.filter(m => m.category === activeCategory);

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
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={simulateCall}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sanal Çağrı
            </button>
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
            {/* Quick Stats or Mode Toggle could go here */}
          </div>

          <div className="category-filters">
            {['Hepsi', 'Dönerler', 'İçecekler', 'Yan Ürünler'].map(cat => (
              <button 
                key={cat}
                className={`category-pill ${activeCategory === cat ? 'active' : ''}`} 
                onClick={() => setActiveCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>

          <div className="menu-grid">
            {filteredMenu.map(item => (
              <div className="menu-card" key={item.id} onClick={() => addToCart(item)}>
                <h3 className="menu-card-title">{item.name}</h3>
                <p className="menu-card-desc">{item.desc}</p>
                <div className="menu-card-footer">
                  <span className="menu-card-price">{item.price} ₺</span>
                  <button className="menu-card-add">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

export default App;
