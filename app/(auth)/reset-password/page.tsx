'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { apiService } from '../../../lib/api';
import { Button } from '@/components/ui';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !emailParam) {
      setError('Link reset password tidak valid atau sudah kadaluarsa.');
      return;
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiService.auth.resetPassword({
        token,
        email: emailParam,
        password,
        password_confirmation: passwordConfirm,
      });
      setSuccess(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Gagal mengubah password. Token mungkin sudah kadaluarsa.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '20px 0' }}>
        <CheckCircle size={56} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
        <h2 style={{ marginBottom: 12, fontSize: '1.4rem' }}>Password Berhasil Diubah!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem', lineHeight: 1.6 }}>
          Password kamu telah berhasil diperbarui. Silakan login menggunakan password baru kamu.
        </p>
        <Link href="/login" className="block w-full">
          <Button variant="primary" size="lg" className="w-full font-bold">
            Login Sekarang
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Buat Password Baru</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
          Masukkan password baru yang kuat dan mudah diingat.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label" htmlFor="password">Password Baru</label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              className="input"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ paddingLeft: 42, paddingRight: 42 }}
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 0 }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="passwordConfirm">Konfirmasi Password Baru</label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              id="passwordConfirm"
              type={showPw ? 'text' : 'password'}
              className="input"
              placeholder="Ulangi password"
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              style={{ paddingLeft: 42, paddingRight: 42 }}
              autoComplete="new-password"
            />
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontSize: '0.85rem' }}>
            <AlertTriangle size={14} />
            {error}
          </motion.div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2 font-bold text-base shadow-lg shadow-primary/25"
          loading={loading}
        >
          Simpan Password Baru
        </Button>
      </form>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Memuat...</div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
