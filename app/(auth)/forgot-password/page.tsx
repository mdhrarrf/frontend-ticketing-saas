'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, Mail, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { apiService } from '../../../lib/api';
import { Button } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Masukkan alamat email kamu');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      await apiService.auth.forgotPassword({ email });
      setSuccess(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '20px 0' }}>
        <CheckCircle size={56} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
        <h2 style={{ marginBottom: 12, fontSize: '1.4rem' }}>Cek Email Kamu</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem', lineHeight: 1.6 }}>
          Kami telah mengirimkan instruksi untuk mengatur ulang password ke <strong>{email}</strong>. Silakan periksa kotak masuk atau folder spam kamu.
        </p>
        <Link href="/login" className="block w-full">
          <Button variant="primary" size="lg" className="w-full font-bold">
            Kembali ke Login
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Kembali
        </Link>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Lupa Password?</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
          Jangan panik. Masukkan email yang terdaftar dan kami akan mengirimkan link untuk mengatur ulang passwordmu.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
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
          Kirim Link Reset
        </Button>
      </form>
    </motion.div>
  );
}
