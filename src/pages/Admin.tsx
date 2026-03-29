import { useMemo } from 'react';
import { useOrders } from '../hooks/useOrders';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { TrendingUp, Users, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

function Admin() {
  const { orders } = useOrders();

  // --- Calculations ---
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const avgBasket = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

  // --- Chart Data Processing ---
  const { revenueByDay, topItems } = useMemo(() => {
    const dailyMap: Record<string, number> = {};
    const itemMap: Record<string, number> = {};

    orders.forEach(order => {
      // Group by day (YYYY-MM-DD)
      const date = new Date(order.timestamp).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
      dailyMap[date] = (dailyMap[date] || 0) + order.total;

      // Group items
      order.items.forEach(item => {
        itemMap[item.name] = (itemMap[item.name] || 0) + item.quantity;
      });
    });

    // Format for Recharts
    const revArray = Object.keys(dailyMap).map(date => ({
      date,
      ciro: dailyMap[date]
    })).reverse(); // Oldest to newest usually if orders are prepended

    const itemArray = Object.keys(itemMap).map(name => ({
      name,
      adet: itemMap[name]
    })).sort((a, b) => b.adet - a.adet).slice(0, 5); // Top 5

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
        <Link to="/" className="btn btn-secondary">
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
        {/* Modern CSS Tricks for 2 columns on mostly desktop */}
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

export default Admin;
