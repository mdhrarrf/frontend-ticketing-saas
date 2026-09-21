'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Banknote, Wallet, CheckCircle, AlertCircle, Loader2, ArrowDownToLine } from 'lucide-react';
import { apiService } from '../../../lib/api';

function fmt(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

const PAYOUT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Diproses', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  approved:  { label: 'Disetujui', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  completed: { label: 'Selesai',   color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  rejected:  { label: 'Ditolak',  color: '#EF4444', bg: 'rgba(239,68,68,0.1)'  },
};

export default function OrganizerPayoutsPage() {
  const [balance, setBalance]   = useState<any>(null);
  const [payouts, setPayouts]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast,   setToast]     = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({ amount: '', bank_name: '', bank_account_number: '', bank_account_name: '' });

  const notify = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    (async () => {
      try {
        const [balRes, payRes] = await Promise.allSettled([
          apiService.organizer.getBalance(),
          apiService.organizer.getPayouts(),
        ]);
        if (balRes.status === 'fulfilled') setBalance((balRes.value as any)?.data ?? balRes.value);
        if (payRes.status === 'fulfilled') {
          const raw = (payRes.value as any)?.data ?? payRes.value;
          setPayouts(Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : []);
        }
      } catch { } finally { setLoading(false); }
    })();
  }, []);

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.bank_name || !form.bank_account_number || !form.bank_account_name) {
      notify('Semua field wajib diisi', 'error'); return;
    }
    setSaving(true);
    try {
      await apiService.organizer.requestPayout({ ...form, amount: Number(form.amount) });
      notify('Permintaan payout berhasil dikirim!', 'success');
      setShowForm(false);
      setForm({ amount: '', bank_name: '', bank_account_number: '', bank_account_name: '' });
    } catch (err: any) {
      notify(err?.response?.data?.message || 'Gagal mengajukan payout', 'error');
    } finally { setSaving(false); }
  };

  const available = Number(balance?.available_balance ?? balance?.balance ?? 0);

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

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Banknote size={20} style={{ color: 'var(--color-primary)' }} /> Payout & Saldo
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Kelola pencairan dana dari penjualan tiket</p>
      </div>

      {/* Balance card */}
      <div style={{ background: 'var(--color-primary)', borderRadius: 16, padding: '28px 32px', marginBottom: 24, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: '0.82rem', opacity: 0.8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Wallet size={14} /> Saldo Tersedia</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {loading ? '...' : fmt(available)}
          </div>
          {balance?.pending_balance > 0 && (
            <div style={{ fontSize: '0.78rem', opacity: 0.7, marginTop: 6 }}>+ {fmt(Number(balance.pending_balance))} sedang diproses</div>
          )}
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, background: 'white', color: 'var(--color-primary)', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
          <ArrowDownToLine size={16} /> Tarik Dana
        </button>
      </div>

      {/* Payout form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px', marginBottom: 20, overflow: 'hidden' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 18, color: 'var(--text-primary)' }}>Pengajuan Pencairan Dana</h3>
            <form onSubmit={handlePayout}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                  <label className="label">Jumlah Penarikan (Rp) *</label>
                  <input className="input" type="number" min="10000" max={available} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Minimal Rp 10.000" required />
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Saldo tersedia: {fmt(available)}</p>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label">Nama Bank *</label>
                  <select className="input" value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} style={{ cursor: 'pointer' }} required>
                    <option value="">Pilih Bank</option>
                    {['BCA','BNI','BRI','Mandiri','CIMB Niaga','Danamon','BSI'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}><label className="label">Nomor Rekening *</label><input className="input" type="text" value={form.bank_account_number} onChange={e => setForm(f => ({ ...f, bank_account_number: e.target.value }))} placeholder="Nomor rekening" required /></div>
                <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}><label className="label">Atas Nama *</label><input className="input" type="text" value={form.bank_account_name} onChange={e => setForm(f => ({ ...f, bank_account_name: e.target.value }))} placeholder="Nama pemilik rekening" required /></div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 500 }}>Batal</button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowDownToLine size={15} />}
                  {saving ? 'Memproses...' : 'Ajukan Penarikan'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payout history */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Riwayat Payout</div>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto', color: 'var(--text-muted)' }} /></div>
        ) : payouts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Banknote size={28} style={{ margin: '0 auto 10px', color: 'var(--text-muted)', opacity: 0.4 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Belum ada riwayat payout</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                {['No. Payout', 'Jumlah', 'Bank', 'Tanggal', 'Status'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payouts.map((p, i) => {
                const st = PAYOUT_STATUS[p.status] ?? { label: p.status, color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' };
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>#{p.payout_number ?? p.id}</td>
                    <td style={{ padding: '13px 16px', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{fmt(Number(p.amount))}</td>
                    <td style={{ padding: '13px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{p.bank_name} · {p.bank_account_number}</td>
                    <td style={{ padding: '13px 16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td style={{ padding: '13px 16px' }}><span style={{ padding: '3px 9px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, color: st.color, background: st.bg }}>{st.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

