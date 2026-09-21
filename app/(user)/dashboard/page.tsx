'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Calendar, ArrowRight, Clock,
  TrendingUp, Ticket, CheckCircle, AlertCircle
} from 'lucide-react';
import { apiService } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import type { Order, Ticket as TicketType } from '../../../types';

function fmt(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    paid:            { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  label: 'Dibayar' },
    waiting_payment: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', label: 'Menunggu Bayar' },
    pending:         { color: '#6366F1', bg: 'rgba(99,102,241,0.1)', label: 'Pending' },
    cancelled:       { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',  label: 'Dibatalkan' },
    expired:         { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)',label: 'Kadaluarsa' },
    valid:           { color: '#10B981', bg: 'rgba(16,185,129,0.1)', label: 'Valid' },
    used:            { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)',label: 'Sudah Dipakai' },
  };
  const c = map[status] ?? { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', label: status };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem',
      fontWeight: 600, color: c.color, background: c.bg,
    }}>
      {c.label}
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [oRes, tRes] = await Promise.allSettled([
          apiService.orders.getOrders({ per_page: 5 }),
          apiService.tickets.getTickets({ per_page: 5, status: 'valid' }),
        ]);
        if (oRes.status === 'fulfilled') {
          const d = (oRes.value as any)?.data ?? oRes.value;
          setOrders(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
        }
        if (tRes.status === 'fulfilled') {
          const d = (tRes.value as any)?.data ?? tRes.value;
          setTickets(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const totalSpent    = orders.filter(o => o.status === 'paid').reduce((s, o) => s + Number(o.total_amount), 0);
  const activeTickets = tickets.filter(t => t.status === 'valid').length;
  const pendingOrders = orders.filter(o => o.status === 'waiting_payment' || o.status === 'pending').length;
  const upcomingCount = tickets.filter(t => t.event_date && new Date(t.event_date) >= new Date() && t.status === 'valid').length;

  const STATS = [
    { label: 'Tiket Aktif',       value: activeTickets,  icon: Ticket,     },
    { label: 'Event Mendatang',   value: upcomingCount,  icon: Calendar,   },
    { label: 'Pesanan Pending',   value: pendingOrders,  icon: Clock,      },
    { label: 'Total Pengeluaran', value: fmt(totalSpent), icon: TrendingUp, },
  ];

  return (
    <div>
      {/* Welcome header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: 4, fontWeight: 700, color: 'var(--text-primary)' }}>
          Halo, {user?.name?.split(' ')[0] ?? 'Kamu'}!
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.88rem' }}>
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </motion.div>

      {/* Stat cards — no gradient, clean border-based cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 32 }}>
        {STATS.map(({ label, value, icon: Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{
              padding: '18px 20px', borderRadius: 14,
              background: 'var(--card)', border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(99,102,241,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={18} style={{ color: 'var(--color-primary)' }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Pesanan Terbaru</h2>
          <Link href="/dashboard/orders" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
            Lihat Semua <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: 66, borderRadius: 12, background: 'var(--background-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {orders.map(order => (
              <Link key={order.id} href={`/dashboard/orders/${order.order_number}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  padding: '13px 16px', borderRadius: 12,
                  background: 'var(--card)', border: '1px solid var(--border)',
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-bright)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      background: 'rgba(99,102,241,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <ShoppingBag size={16} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 2, color: 'var(--text-primary)' }}>
                        {order.event?.title ?? `Order #${order.order_number}`}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>#{order.order_number}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <StatusBadge status={order.status} />
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {fmt(Number(order.total_amount))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '28px 0', borderRadius: 12,
            background: 'var(--card)', border: '1px solid var(--border)',
          }}>
            <ShoppingBag size={28} style={{ margin: '0 auto 10px', color: 'var(--text-muted)', opacity: 0.5 }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 12px' }}>Belum ada pesanan</p>
            <Link href="/events" className="btn btn-primary btn-sm">Cari Event</Link>
          </div>
        )}
      </motion.div>

      {/* Active Tickets */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Tiket Aktif</h2>
          <Link href="/dashboard/tickets" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
            Lihat Semua <ArrowRight size={13} />
          </Link>
        </div>

        {!loading && tickets.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '28px 0', borderRadius: 12,
            background: 'var(--card)', border: '1px solid var(--border)',
          }}>
            <Ticket size={28} style={{ margin: '0 auto 10px', color: 'var(--text-muted)', opacity: 0.5 }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Belum punya tiket aktif</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {tickets.map(ticket => (
              <Link key={ticket.id} href={`/dashboard/tickets/${ticket.ticket_number}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  padding: '16px', borderRadius: 12,
                  background: 'var(--card)', border: '1px solid var(--border)',
                  transition: 'border-color 0.15s, transform 0.15s',
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border-bright)'; el.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.transform = 'none'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Ticket size={18} style={{ color: 'var(--color-primary)' }} />
                    <StatusBadge status={ticket.status} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 6, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {ticket.event_name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <Calendar size={12} />
                    {ticket.event_date
                      ? new Date(ticket.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'TBA'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 8, fontFamily: 'monospace' }}>
                    #{ticket.ticket_number}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
