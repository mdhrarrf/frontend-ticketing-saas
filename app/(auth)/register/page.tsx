'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff, Mail, Lock, User, Phone, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { apiService } from '../../../lib/api';

export default function RegisterPage() {
  const router      = useRouter();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' });
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [success,  setSuccess]  = useState(false);

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim())                          errs.name     = 'Nama wajib diisi';
    if (!form.email.includes('@'))                  errs.email    = 'Email tidak valid';
    if (form.password.length < 8)                   errs.password = 'Password minimal 8 karakter';
    if (form.password !== form.password_confirmation) errs.password_confirmation = 'Konfirmasi password tidak cocok';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true); setError('');
    try {
      const res = await apiService.auth.register(form);
      const d = (res as any)?.data ?? res;
      const user  = d.user;
      const token = d.access_token ?? d.token;
      setAuth(user, token);
      setSuccess(true);
      setTimeout(() => router.push('/complete-profile'), 1500);
    } catch (e: any) {
      const data = e?.response?.data;
      if (data?.errors) setErrors(data.errors);
      setError(data?.message ?? 'Pendaftaran gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '40px 0' }}>
        <CheckCircle size={64} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
        <h2 style={{ marginBottom: 8 }}>Akun berhasil dibuat!</h2>
        <p style={{ color: 'var(--text-muted)' }}>Mengarahkan ke dashboard...</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Buat Akun Gratis</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Mulai petualangan konsermu bersama TIXORA</p>
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
        Daftar dengan Google
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>atau dengan email</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div className="form-group">
          <label className="label" htmlFor="name">Nama Lengkap *</label>
          <div style={{ position: 'relative' }}>
            <User size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input id="name" className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Nama Lengkapmu"
              value={form.name} onChange={e => set('name', e.target.value)} style={{ paddingLeft: 40 }} autoComplete="name" />
          </div>
          {errors.name && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4 }}>{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="label" htmlFor="email">Email *</label>
          <div style={{ position: 'relative' }}>
            <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input id="email" type="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="email@kamu.com"
              value={form.email} onChange={e => set('email', e.target.value)} style={{ paddingLeft: 40 }} autoComplete="email" />
          </div>
          {errors.email && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4 }}>{errors.email}</p>}
        </div>

        {/* Phone */}
        <div className="form-group">
          <label className="label" htmlFor="phone">Nomor WhatsApp</label>
          <div style={{ position: 'relative' }}>
            <Phone size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input id="phone" type="tel" className="input" placeholder="08xxxxxxxxxx"
              value={form.phone} onChange={e => set('phone', e.target.value)} style={{ paddingLeft: 40 }} autoComplete="tel" />
          </div>
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="label" htmlFor="password">Password *</label>
          <div style={{ position: 'relative' }}>
            <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input id="password" type={showPw ? 'text' : 'password'} className={`input ${errors.password ? 'input-error' : ''}`}
              placeholder="Minimal 8 karakter" value={form.password} onChange={e => set('password', e.target.value)}
              style={{ paddingLeft: 40, paddingRight: 40 }} autoComplete="new-password" />
            <button type="button" onClick={() => setShowPw(!showPw)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 0 }}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4 }}>{errors.password}</p>}
        </div>

        {/* Confirm password */}
        <div className="form-group">
          <label className="label" htmlFor="confirm">Konfirmasi Password *</label>
          <div style={{ position: 'relative' }}>
            <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input id="confirm" type="password" className={`input ${errors.password_confirmation ? 'input-error' : ''}`}
              placeholder="Ulangi password" value={form.password_confirmation} onChange={e => set('password_confirmation', e.target.value)}
              style={{ paddingLeft: 40 }} autoComplete="new-password" />
          </div>
          {errors.password_confirmation && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4 }}>{errors.password_confirmation}</p>}
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontSize: '0.85rem' }}>
            <AlertTriangle size={14} /> {error}
          </motion.div>
        )}

        {/* Terms */}
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
          Dengan mendaftar, kamu menyetujui{' '}
          <Link href="/terms" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Syarat & Ketentuan</Link>{' '}
          dan{' '}
          <Link href="/privacy" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Kebijakan Privasi</Link>{' '}
          TIXORA.
        </p>

        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', fontSize: '1rem' }}>
          {loading ? <><Loader2 size={18} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> Mendaftar...</> : 'Daftar Sekarang'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Sudah punya akun?{' '}
        <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Masuk di sini</Link>
      </p>
    </motion.div>
  );
}
