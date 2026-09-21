'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { apiService } from '../../../lib/api';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrendingUp, Ticket, Calendar, DollarSign, ArrowRight,
  Plus, Eye, Users, BarChart3, Clock, CheckCircle,
  XCircle, AlertCircle, Package
} from 'lucide-react';

function fmt(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000)     return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toLocaleString('id-ID')}`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    paid:            { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  label: 'Lunas' },
    waiting_payment: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', label: 'Menunggu Bayar' },
    pending:         { color: '#6366F1', bg: 'rgba(99,102,241,0.1)', label: 'Pending' },
    cancelled:       { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',  label: 'Dibatalkan' },
    expired:         { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', label: 'Kadaluarsa' },
  };
  const c = map[status] ?? { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', label: status };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, color: c.color, background: c.bg }}>
      {c.label}
    </span>
  );
}

function EventStatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    published: { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  label: 'Published' },
    draft:     { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', label: 'Draft' },
    cancelled: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   label: 'Dibatalkan' },
    ended:     { color: '#6366F1', bg: 'rgba(99,102,241,0.1)',  label: 'Selesai' },
  };
  const c = map[status] ?? { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', label: status };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, color: c.color, background: c.bg }}>
      {c.label}
    </span>
  );
}

export default function OrganizerDashboard() {
  const { user }    = useAuthStore();
  const [overview,  setOverview]  = useState<any>(null);
  const [events,    setEvents]    = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ovRes, evRes] = await Promise.allSettled([
          apiService.organizer.getOverview(),
          apiService.organizer.getEvents({ per_page: 5, sort: '-created_at' }),
        ]);
        if (ovRes.status === 'fulfilled') {
          const d = (ovRes.value as any)?.data ?? ovRes.value;
          setOverview(d);
        }
        if (evRes.status === 'fulfilled') {
          const d = (evRes.value as any)?.data ?? evRes.value;
          setEvents(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const STATS = [
    {
      label: 'Total Pendapatan',
      value: fmt(Number(overview?.total_revenue ?? 0)),
      icon: TrendingUp,
      color: '#6366F1',
      sub: 'Semua waktu',
    },
    {
      label: 'Tiket Terjual',
      value: (overview?.total_tickets_sold ?? 0).toLocaleString('id-ID'),
      icon: Ticket,
      color: '#EC4899',
      sub: 'Total tiket',
    },
    {
      label: 'Event Aktif',
      value: overview?.upcoming_events_count ?? 0,
      icon: Calendar,
      color: '#10B981',
      sub: 'Akan datang',
    },
    {
      label: 'Total Event',
      value: overview?.total_events ?? 0,
      icon: Package,
      color: '#F59E0B',
      sub: 'Semua status',
    },
  ];

  return (
    <div>
      {/* Welcome header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, marginBottom: 4 }}>
              Selamat datang, {user?.name?.split(' ')[0] ?? 'Organizer'}!
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Link href="/organizer/events/create"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'var(--color-primary)', color: 'white', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none', boxShadow: 'var(--glow-sm)', transition: 'all 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-primary)')}>
            <Plus size={16} /> Buat Event Baru
          </Link>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 32 }}>
        {STATS.map(({ label, value, icon: Icon, color, sub }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ padding: '20px', borderRadius: 14, background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.7 }}>{sub}</div>
              </div>
            </div>
            {loading
              ? <div style={{ height: 32, width: 80, borderRadius: 6, background: 'var(--background-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              : <div style={{ fontSize: '1.7rem', fontWeight: 900, lineHeight: 1, color: 'var(--text-primary)' }}>{value}</div>
            }
          </motion.div>
        ))}
      </div>

      {/* Events Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={15} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Event Terbaru</span>
          </div>
          <Link href="/organizer/events" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
            Kelola Semua <ArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: 54, borderRadius: 8, background: 'var(--background-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : events.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--background)' }}>
                  {['Nama Event', 'Tanggal', 'Tiket Terjual', 'Pendapatan', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((event: any) => (
                  <tr key={event.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--background)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 2 }}>{event.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{event.venue_name} · {event.venue_city}</div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {event.event_date ? new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {(event.tickets_sold ?? 0).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {fmt(Number(event.revenue ?? 0))}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <EventStatusBadge status={event.status} />
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <Link href={`/organizer/events`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.78rem', textDecoration: 'none', fontWeight: 600 }}>
                        <Eye size={12} /> Kelola
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Calendar size={32} style={{ margin: '0 auto 12px', color: 'var(--text-muted)', opacity: 0.4 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 16 }}>Belum ada event yang dibuat</p>
            <Link href="/organizer/events/create" className="btn btn-primary btn-sm">
              + Buat Event Pertama
            </Link>
          </div>
        )}
      </motion.div>

      {/* Recent Orders */}
      {overview?.recent_orders?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={15} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Pesanan Terbaru</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--background)' }}>
                  {['Order #', 'Pembeli', 'Event', 'Total', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overview.recent_orders.map((order: any) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600, fontFamily: 'monospace' }}>
                      #{order.order_number ?? order.id}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-primary)' }}>{order.user?.name ?? 'N/A'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{order.event?.title ?? 'N/A'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {fmt(Number(order.total_amount ?? 0))}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
