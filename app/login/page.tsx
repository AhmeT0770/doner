'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Uygulama şifresi!
    // Gerçek bir projede bunu .env dosyasından çekebilirsin.
    if (username === 'admin' && password === '123456') {
      // Başarılı giriş: 30 gün geçerli cookie oluştur
      document.cookie = "donerci_auth=true; path=/; max-age=" + 60 * 60 * 24 * 30; // 30 Gün
      
      // Ana sayfaya yönlendir ve yenile
      router.push('/');
      router.refresh();
    } else {
      setError('Hatalı kullanıcı adı veya şifre!');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="title-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>BİZİM DÖNERCİ</h1>
          <p className="text-muted">Lütfen sisteme giriş yapın</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
          <div>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Kullanıcı Adı</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%' }}
              required
            />
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Şifre</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%' }}
              required
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(235, 68, 90, 0.15)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '0.5rem', fontSize: '1.1rem' }}>
            Giriş Yap
          </button>
        </form>

        <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)' }}>
          Varsayılan Giriş: admin / 123456
        </div>
      </div>
    </div>
  );
}
