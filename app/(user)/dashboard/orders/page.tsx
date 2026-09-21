'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiService } from '../../../../lib/api';
import { ShoppingBag, Clock, CheckCircle, XCircle, ChevronRight, ArrowRight } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  waiting_payment: { label: 'Menunggu Bayar', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={12} /> },
  paid:            { label: 'Dibayar',         color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle size={12} /> },
  completed:       { label: 'Selesai',          color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle size={12} /> },
  cancelled:       { label: 'Dibatalkan',       color: '#EF4444', bg: 'rgba(239,68,68,0.1)',  icon: <XCircle size={12} /> },
  expired:         { label: 'Kadaluarsa',       color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', icon: <XCircle size={12} /> },
  pending:         { label: 'Pending',           color: '#6366F1', bg: 'rgba(99,102,241,0.1)', icon: <Clock size={12} /> },
};

const FILTERS = ['Semua', 'Menunggu Bayar', 'Dibayar', 'Selesai', 'Dibatalkan'];

function fmt(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

export default function OrdersPage() {
  const [orders,  setOrders]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('Semua');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await apiService.orders.getOrders();
        // handle both paginated {data: [...]} and plain array
        const raw = (res as any)?.data ?? res;
        const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        setOrders(arr);
      } catch (e) {
        console.error(e);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = orders.filter(o => {
    if (filter === 'Semua')         return true;
    if (filter === 'Menunggu Bayar') return o.status === 'waiting_payment';
    if (filter === 'Dibayar')        return o.status === 'paid';
    if (filter === 'Selesai')        return o.status === 'completed';
    if (filter === 'Dibatalkan')     return o.status === 'cancelled';
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Pesanan Saya
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
          Riwayat semua transaksi pembelian tiketmu
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '7px 14px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.15s', border: '1px solid var(--border)',
              background: filter === f ? 'var(--color-primary)' : 'var(--card)',
              color: filter === f ? 'white' : 'var(--text-secondary)',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 110, borderRadius: 12, background: 'var(--background-2)', opacity: 0.7 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 0', borderRadius: 14,
          background: 'var(--card)', border: '1px solid var(--border)',
        }}>
          <ShoppingBag size={32} style={{ margin: '0 auto 12px', color: 'var(--text-muted)', opacity: 0.4 }} />
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Tidak ada pesanan</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 16px' }}>
            Belum ada pesanan di kategori ini.
          </p>
          <Link href="/events" className="btn btn-primary btn-sm">Cari Event</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((order, i) => {
            const st = STATUS_MAP[order.status] ?? { label: order.status, color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', icon: null };
            const createdAt = order.created_at ? new Date(order.created_at) : null;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div style={{
                  borderRadius: 14, background: 'var(--card)', border: '1px solid var(--border)',
                  overflow: 'hidden', transition: 'border-color 0.15s',
                }}>
                  {/* Top row */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', borderBottom: '1px solid var(--border)',
                    background: 'var(--background)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        #{order.order_number}
                      </span>
                      {createdAt && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          · {createdAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem',
                      fontWeight: 600, color: st.color, background: st.bg,
                    }}>
                      {st.icon} {st.label}
                    </span>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: 'rgba(99,102,241,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <ShoppingBag size={16} style={{ color: 'var(--color-primary)' }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {order.event?.title ?? order.event_name ?? `Pesanan #${order.order_number}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {order.total_tickets ? `${order.total_tickets} tiket` : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total</div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {fmt(Number(order.total_amount))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {order.status === 'waiting_payment' && (
                          <Link
                            href={`/checkout/${order.order_number}`}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                          >
                            Bayar
                          </Link>
                        )}
                        <Link
                          href={`/dashboard/orders/${order.order_number}`}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            padding: '6px 12px', borderRadius: 8, fontSize: '0.78rem',
                            border: '1px solid var(--border)', color: 'var(--text-secondary)',
                            textDecoration: 'none', transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e: any) => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                          onMouseLeave={(e: any) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
                          Detail <ChevronRight size={13} />
                        </Link>
                      </div>
                    </div>
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
