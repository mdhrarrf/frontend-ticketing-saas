'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff, Mail, Lock, AlertTriangle, Shield, Zap, Ticket } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { apiService } from '../../../lib/api';
import { Suspense } from 'react';

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { setAuth }  = useAuthStore();

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const redirect = searchParams.get('redirect') ?? '/dashboard';
  const urlError = searchParams.get('error');

  useEffect(() => {
    if (urlError === 'oauth_failed') {
      setError('Gagal masuk dengan Google. Silakan coba lagi.');
    }
  }, [urlError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Email dan password wajib diisi'); return; }
    setLoading(true); setError('');
    try {
      const res = await apiService.auth.login({ email, password });
      const d = (res as any)?.data ?? res;
      const user  = d.user;
      const token = d.access_token ?? d.token;
      setAuth(user, token);
      router.push(redirect);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 8 }}>Selamat Datang Kembali</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Masuk ke akun TIXORA kamu</p>
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={async () => {
          try {
            const res = await apiService.auth.getOAuthUrl('google');
            const targetUrl = res?.url || (res as any)?.data?.url;
            if (targetUrl) {
              window.location.href = targetUrl;
            } else {
              setError('Respon tidak valid dari server');
            }
          } catch (e) {
            setError('Gagal menghubungkan ke Google');
          }
        }}
        style={{
          width: '100%', padding: '12px', borderRadius: 12, marginBottom: 24,
          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-bright)',
          color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        Lanjutkan dengan Google
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>atau dengan email</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div className="form-group">
          <label className="label" htmlFor="email">Email</label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              id="email"
              type="email"
              className="input"
              placeholder="email@kamu.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ paddingLeft: 42 }}
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label className="label" htmlFor="password" style={{ margin: 0 }}>Password</label>
            <Link href="/forgot-password" style={{ fontSize: '0.78rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
              Lupa password?
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ paddingLeft: 42, paddingRight: 42 }}
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 0 }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontSize: '0.85rem' }}>
            <AlertTriangle size={14} />
            {error}
          </motion.div>
        )}

        {/* Submit */}
        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: 8, fontSize: '1rem' }}>
          {loading ? <><Loader2 size={18} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> Masuk...</> : 'Masuk'}
        </button>
      </form>

      {/* Register link */}
      <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Belum punya akun?{' '}
        <Link href="/register" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
          Daftar gratis
        </Link>
      </p>

      {/* Features */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 32, fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Shield size={14} /> SSL Terenkripsi</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={14} className="text-yellow-500" /> War Ticket</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Ticket size={14} /> E-Ticket Resmi</div>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Memuat...</div>}>
      <LoginForm />
    </Suspense>
  );
}
