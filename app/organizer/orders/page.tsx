'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Search } from 'lucide-react';
import { apiService } from '../../../lib/api';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  waiting_payment: { label: 'Menunggu Bayar', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  paid:            { label: 'Dibayar',         color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  completed:       { label: 'Selesai',          color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  cancelled:       { label: 'Dibatalkan',       color: '#EF4444', bg: 'rgba(239,68,68,0.1)'  },
  pending:         { label: 'Pending',           color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
};

const FILTERS = ['Semua', 'Menunggu Bayar', 'Dibayar', 'Dibatalkan'];

function fmt(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

export default function OrganizerOrdersPage() {
  const [orders,  setOrders]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('Semua');
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await (apiService as any).organizer.getOrders?.() 
          ?? await fetch('/api/organizer/orders').then(r => r.json());
        const raw = (res as any)?.data ?? res;
        const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        setOrders(arr);
      } catch { setOrders([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = orders.filter(o => {
    const matchFilter =
      filter === 'Semua' ? true :
      filter === 'Menunggu Bayar' ? o.status === 'waiting_payment' :
      filter === 'Dibayar' ? (o.status === 'paid' || o.status === 'completed') :
      filter === 'Dibatalkan' ? o.status === 'cancelled' : true;
    const matchSearch = !search || (o.event?.title ?? '').toLowerCase().includes(search.toLowerCase()) || (o.order_number ?? '').includes(search);
    return matchFilter && matchSearch;
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShoppingBag size={20} style={{ color: 'var(--color-primary)' }} /> Pesanan Event
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Semua transaksi dari event yang kamu kelola</p>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari event atau nomor order..." style={{ paddingLeft: 36, height: 38, fontSize: '0.85rem' }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', border: '1px solid var(--border)', background: filter === f ? 'var(--color-primary)' : 'var(--card)', color: filter === f ? 'white' : 'var(--text-secondary)', transition: 'all 0.15s' }}>{f}</button>
          ))}
        </div>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(4)].map((_, i) => <div key={i} style={{ height: 72, borderRadius: 12, background: 'var(--background-2)', opacity: 0.7 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14 }}>
          <ShoppingBag size={32} style={{ margin: '0 auto 12px', color: 'var(--text-muted)', opacity: 0.4 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Belum ada pesanan</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((order, i) => {
            const st = STATUS_MAP[order.status] ?? { label: order.status, color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' };
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--background)', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>#{order.order_number}</span>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, color: st.color, background: st.bg }}>{st.label}</span>
                  </div>
                  <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{order.event?.title ?? 'Event'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{order.user?.name ?? 'Pembeli'} · {order.total_tickets ?? 1} tiket</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{fmt(Number(order.total_amount))}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

