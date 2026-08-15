import React, { useState } from 'react';
import supabase from './supabase';

interface Props {
  onLogin: (user: any) => void;
}

function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    setLoading(true);
    setError('');
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError('Incorrect email or password');
      setLoading(false);
      return;
    }
    onLogin(data.user);
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#b5b5b7', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>

      {/* Logo */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', backgroundColor: '#9a9a9c', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <div style={{ fontWeight: '700', fontSize: '16px', color: '#3d3d3a' }}>National Safety Training Center</div>
        <div style={{ fontSize: '16px', color: '#888780', marginTop: '4px' }}>AED Inspection App</div>
      </div>

      {/* Login Card */}
      <div style={{ width: '100%', maxWidth: '360px', backgroundColor: '#dcdcdd', borderRadius: '8px', padding: '24px', border: '1px solid rgba(0,0,0,0.08)' }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: '#3d3d3a' }}>Sign in</h2>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#3d3d3a', marginBottom: '6px' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{ width: '100%', padding: '10px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '6px', fontSize: '16px', backgroundColor: 'white', color: '#3d3d3a', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#3d3d3a', marginBottom: '6px' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '10px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '6px', fontSize: '16px', backgroundColor: 'white', color: '#3d3d3a', boxSizing: 'border-box' }}
            />
          </div>

          {error && (
            <div style={{ backgroundColor: '#a63a2a18', border: '1px solid #a63a2a', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', color: '#a63a2a', fontWeight: '600', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '16px', backgroundColor: loading ? '#888780' : '#5d8b5f', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#888780', textAlign: 'center' }}>
        Contact your administrator to create an account
      </div>

    </div>
  );
}

export default Login;
