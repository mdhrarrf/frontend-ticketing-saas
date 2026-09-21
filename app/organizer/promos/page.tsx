'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Plus, X, Loader2, CheckCircle, AlertCircle, Tag } from 'lucide-react';
import { apiService } from '../../../lib/api';

type ToastState = { msg: string; type: 'success' | 'error' } | null;

function fmt(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

export default function OrganizerPromosPage() {
  const [promos,  setPromos]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast,   setToast]   = useState<ToastState>(null);

  const [form, setForm] = useState({
    code: '', type: 'percentage', value: '', min_purchase: '', max_discount: '', max_usage: '', expires_at: '',
  });

  const notify = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiService.organizer.getPromoCodes();
      const raw = (res as any)?.data ?? res;
      const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      setPromos(arr);
    } catch { setPromos([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.organizer.createPromoCode({ ...form, value: Number(form.value), min_purchase: Number(form.min_purchase), max_discount: form.max_discount ? Number(form.max_discount) : undefined, max_usage: form.max_usage ? Number(form.max_usage) : undefined });
      notify('Promo code berhasil dibuat!', 'success');
      setShowForm(false);
      setForm({ code: '', type: 'percentage', value: '', min_purchase: '', max_discount: '', max_usage: '', expires_at: '' });
      load();
    } catch (err: any) {
      notify(err?.response?.data?.message || 'Gagal membuat promo code', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 10, background: toast.type === 'success' ? '#10B981' : '#EF4444', color: 'white', fontSize: '0.85rem', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
            {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Gift size={20} style={{ color: 'var(--color-primary)' }} /> Promo Code
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Kelola kode promo untuk event kamu</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? 'Tutup' : 'Buat Promo'}
        </button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px', marginBottom: 20, overflow: 'hidden' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 18, color: 'var(--text-primary)' }}>Buat Promo Code Baru</h3>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-group" style={{ margin: 0 }}><label className="label">Kode Promo *</label><input className="input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="DISKON20" required /></div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label">Tipe Diskon *</label>
                  <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ cursor: 'pointer' }}>
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}><label className="label">Nilai Diskon * {form.type === 'percentage' ? '(%)' : '(Rp)'}</label><input className="input" type="number" min="0" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.type === 'percentage' ? '20' : '50000'} required /></div>
                <div className="form-group" style={{ margin: 0 }}><label className="label">Minimum Pembelian (Rp)</label><input className="input" type="number" min="0" value={form.min_purchase} onChange={e => setForm(f => ({ ...f, min_purchase: e.target.value }))} placeholder="100000" /></div>
                {form.type === 'percentage' && (
                  <div className="form-group" style={{ margin: 0 }}><label className="label">Maks. Diskon (Rp)</label><input className="input" type="number" min="0" value={form.max_discount} onChange={e => setForm(f => ({ ...f, max_discount: e.target.value }))} placeholder="100000" /></div>
                )}
                <div className="form-group" style={{ margin: 0 }}><label className="label">Maks. Penggunaan</label><input className="input" type="number" min="1" value={form.max_usage} onChange={e => setForm(f => ({ ...f, max_usage: e.target.value }))} placeholder="100" /></div>
                <div className="form-group" style={{ margin: 0 }}><label className="label">Berlaku Hingga</label><input className="input" type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} /></div>
              </div>
              <button type="submit" disabled={saving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={15} />}
                {saving ? 'Menyimpan...' : 'Simpan Promo Code'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} /></div>
        ) : promos.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <Tag size={32} style={{ margin: '0 auto 12px', color: 'var(--text-muted)', opacity: 0.4 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>Belum ada promo code. Buat promo pertamamu!</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                {['Kode', 'Tipe', 'Nilai', 'Min. Beli', 'Pemakaian', 'Berlaku', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {promos.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '13px 16px' }}><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.9rem' }}>{p.code}</span></td>
                  <td style={{ padding: '13px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{p.type === 'percentage' ? 'Persentase' : 'Nominal'}</td>
                  <td style={{ padding: '13px 16px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{p.type === 'percentage' ? `${p.value}%` : fmt(Number(p.value))}</td>
                  <td style={{ padding: '13px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{p.min_purchase ? fmt(Number(p.min_purchase)) : '—'}</td>
                  <td style={{ padding: '13px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{p.used_count ?? 0}/{p.max_usage ?? '∞'}</td>
                  <td style={{ padding: '13px 16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.expires_at ? new Date(p.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, background: p.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)', color: p.is_active ? '#10B981' : '#94A3B8' }}>{p.is_active ? 'Aktif' : 'Nonaktif'}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

