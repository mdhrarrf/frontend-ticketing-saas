'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Phone, CreditCard, Calendar, User as UserIcon, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { apiService } from '../../../lib/api';
import Link from 'next/link';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, token, setAuth } = useAuthStore();
  
  const [formData, setFormData] = useState({
    phone: '',
    id_number: '',
    birth_date: '',
    gender: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not logged in or if profile is already complete
  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
    } else if (user.phone && user.id_number) {
      router.push('/dashboard');
    } else {
      // Pre-fill if any partial data exists
      setFormData(prev => ({
        ...prev,
        phone: user.phone || '',
        id_number: user.id_number || '',
        birth_date: user.birth_date || '',
        gender: user.gender || ''
      }));
    }
  }, [user, token, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone || !formData.id_number) {
      setError('Nomor HP dan Nomor KTP wajib diisi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create endpoint for updating profile
      const res = await apiService.user.updateProfile(formData);
      const updatedUser = (res as any)?.data ?? res;
      setAuth(updatedUser, token!);
      router.push('/dashboard');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Satu Langkah Lagi!</h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
          Halo {user.name.split(' ')[0]}, silakan lengkapi data diri Anda untuk keperluan pembelian tiket (Sesuai KTP).
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label" htmlFor="phone">Nomor HP/WhatsApp</label>
          <div style={{ position: 'relative' }}>
            <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              id="phone"
              type="tel"
              className="input"
              placeholder="08123456789"
              value={formData.phone}
              onChange={handleChange}
              style={{ paddingLeft: 42 }}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="label" htmlFor="id_number">Nomor Identitas (KTP/Paspor)</label>
          <div style={{ position: 'relative' }}>
            <CreditCard size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              id="id_number"
              type="text"
              className="input"
              placeholder="Sesuai kartu identitas resmi"
              value={formData.id_number}
              onChange={handleChange}
              style={{ paddingLeft: 42 }}
              required
            />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Dibutuhkan untuk penukaran tiket di lokasi venue.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="label" htmlFor="birth_date">Tanggal Lahir (Opsional)</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                id="birth_date"
                type="date"
                className="input"
                value={formData.birth_date}
                onChange={handleChange}
                style={{ paddingLeft: 42 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label" htmlFor="gender">Jenis Kelamin (Opsional)</label>
            <div style={{ position: 'relative' }}>
              <UserIcon size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <select
                id="gender"
                className="input"
                value={formData.gender}
                onChange={handleChange}
                style={{ paddingLeft: 42, appearance: 'none' }}
              >
                <option value="">Pilih</option>
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontSize: '0.85rem' }}>
            <AlertTriangle size={14} />
            {error}
          </motion.div>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: 8, fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          {loading ? <Loader2 size={18} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> : 'Simpan & Lanjutkan'} 
          {!loading && <ArrowRight size={18} />}
        </button>
        
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button type="button" onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.875rem', cursor: 'pointer' }}>
            Lewati untuk sekarang
          </button>
        </div>
      </form>
    </motion.div>
  );
}
