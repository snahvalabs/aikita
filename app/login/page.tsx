'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const d: any = await r.json();
      if (!r.ok) throw Error(d.error || 'Gagal masuk.');
      window.location.href = '/';
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <div className="brandmark">A</div>
      <h1>Masuk ke AIKITA.</h1>
      <p>Ruang pengetahuan internal Frayas Academy.</p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12, width: 'min(340px, 100%)' }}>
        <label style={{ textAlign: 'left', fontSize: 13, color: '#adbed0' }}>
          Nama pengguna
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            style={{
              display: 'block', width: '100%', marginTop: 6, padding: '11px 12px',
              borderRadius: 8, border: '1px solid #3c5a7a', background: '#0f263f',
              color: '#fff', fontSize: 14,
            }}
          />
        </label>
        <label style={{ textAlign: 'left', fontSize: 13, color: '#adbed0' }}>
          Kata sandi
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{
              display: 'block', width: '100%', marginTop: 6, padding: '11px 12px',
              borderRadius: 8, border: '1px solid #3c5a7a', background: '#0f263f',
              color: '#fff', fontSize: 14,
            }}
          />
        </label>
        {error && <p role="alert" style={{ color: '#ffb4b4', fontSize: 13 }}>{error}</p>}
        <button className="primary" type="submit" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Memeriksa…' : 'Masuk →'}
        </button>
      </form>
      <small>Aplikasi lokal • Data tersimpan di perangkat ini, tanpa layanan eksternal.</small>
    </main>
  );
}
