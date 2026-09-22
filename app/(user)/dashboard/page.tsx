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

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {STATS.map(({ label, value, icon: Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="p-5 rounded-2xl bg-card border border-border flex flex-col justify-between hover:border-border-bright transition-all"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Icon size={18} />
              </div>
              <span className="text-xs font-semibold text-text-muted">{label}</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
              {value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-8">
        <div className="flex justify-between items-center mb-3.5">
          <h2 className="text-base font-bold text-text-primary">Pesanan Terbaru</h2>
          <Link href="/dashboard/orders" className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
            Lihat Semua <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-card/60 border border-border animate-pulse" />
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {orders.map(order => (
              <Link key={order.id} href={`/dashboard/orders/${order.order_number}`} className="block group">
                <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-card border border-border group-hover:border-border-bright group-hover:bg-surface-elevated/40 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl shrink-0 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <ShoppingBag size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-text-primary truncate mb-0.5">
                        {order.event?.title ?? `Order #${order.order_number}`}
                      </div>
                      <div className="text-xs text-text-muted font-mono">#{order.order_number}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusBadge status={order.status} />
                    <div className="font-extrabold text-sm text-text-primary">
                      {fmt(Number(order.total_amount))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 rounded-2xl bg-card border border-border">
            <ShoppingBag size={28} className="mx-auto mb-2 text-text-muted opacity-50" />
            <p className="text-sm text-text-muted mb-3">Belum ada pesanan</p>
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
          <div className="text-center py-8 rounded-2xl bg-card border border-border">
            <Ticket size={28} className="mx-auto mb-2 text-text-muted opacity-50" />
            <p className="text-sm text-text-muted">Belum punya tiket aktif</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {tickets.map(ticket => (
              <Link key={ticket.id} href={`/dashboard/tickets/${ticket.ticket_number}`} className="block group">
                <div className="p-4 rounded-xl bg-card border border-border group-hover:border-border-bright group-hover:bg-surface-elevated/40 transition-all">
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <Ticket size={16} />
                    </div>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <div className="font-bold text-sm text-text-primary mb-1.5 leading-snug line-clamp-1">
                    {ticket.event_name}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted mb-2">
                    <Calendar size={13} className="text-accent" />
                    <span>
                      {ticket.event_date
                        ? new Date(ticket.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'TBA'}
                    </span>
                  </div>
                  <div className="text-[11px] text-text-muted font-mono pt-2 border-t border-border/60">
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
