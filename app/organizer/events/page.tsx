'use client';

import { useEffect, useState } from 'react';
import { apiService } from '../../../lib/api';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus, Calendar, MapPin, Ticket, TrendingUp,
  Edit3, Trash2, Eye, Zap, Search, Filter, Loader2,
  CheckCircle, Clock, XCircle, Archive
} from 'lucide-react';

function fmt(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000)     return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toLocaleString('id-ID')}`;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  published:      { label: 'Published',        color: '#10B981', bg: 'rgba(16,185,129,0.1)',  icon: CheckCircle },
  draft:          { label: 'Draft',            color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', icon: Clock },
  pending_review: { label: 'Menunggu Review',  color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', icon: Clock },
  cancelled:      { label: 'Dibatalkan',       color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   icon: XCircle },
  ended:          { label: 'Selesai',          color: '#6366F1', bg: 'rgba(99,102,241,0.1)',  icon: Archive },
};

const STATUS_FILTERS = [
  { value: '',               label: 'Semua' },
  { value: 'draft',          label: 'Draft' },
  { value: 'pending_review', label: 'Menunggu Review' },
  { value: 'published',      label: 'Published' },
  { value: 'ended',          label: 'Selesai' },
  { value: 'cancelled',      label: 'Dibatalkan' },
];

export default function OrganizerEventsPage() {
  const [events,       setEvents]       = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [actionLoading,setActionLoading]= useState<string | null>(null);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await apiService.organizer.getEvents({ search: search || undefined, status: statusFilter || undefined });
      const d = (res as any)?.data ?? res;
      setEvents(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, [search, statusFilter]);

  const handleSubmitForReview = async (id: string) => {
    setActionLoading(id + ':publish');
    try {
      await apiService.organizer.publishEvent(id); // backend sets status to pending_review for organizer role
      setEvents(prev => prev.map(e => e.id == id ? { ...e, status: 'pending_review' } : e));
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Gagal mengajukan event ke review');
    } finally { setActionLoading(null); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus event "${title}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setActionLoading(id + ':delete');
    try {
      await apiService.organizer.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id != id));
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Gagal menghapus event');
    } finally { setActionLoading(null); }
  };

  const filtered = events.filter(e =>
    (!search || e.title?.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || e.status === statusFilter)
  );

  return (
    <div>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, marginBottom: 4 }}>Event Saya</h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>{events.length} event ditemukan</p>
          </div>
          <Link href="/organizer/events/create"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'var(--color-primary)', color: 'white', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none', boxShadow: 'var(--glow-sm)' }}>
            <Plus size={16} /> Buat Event Baru
          </Link>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari event..."
            className="input"
            style={{ paddingLeft: 36 }}
          />
        </div>
        {/* Status Filter Chips */}
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUS_FILTERS.map(s => (
            <button key={s.value} onClick={() => setStatusFilter(s.value)}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                background: statusFilter === s.value ? 'var(--color-primary)' : 'var(--card)',
                color: statusFilter === s.value ? 'white' : 'var(--text-secondary)',
                border: `1px solid ${statusFilter === s.value ? 'var(--color-primary)' : 'var(--border)'}`,
                transition: 'all 0.2s',
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Event Cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 90, borderRadius: 14, background: 'var(--card)', border: '1px solid var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((event: any, i: number) => {
            const sc = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.draft;
            const StatusIcon = sc.icon;
            const soldPercent = event.total_quota ? Math.round((event.tickets_sold / event.total_quota) * 100) : 0;
            return (
              <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
                  {/* Left accent */}
                  <div style={{ width: 4, alignSelf: 'stretch', background: sc.color, flexShrink: 0 }} />

                  {/* Main info */}
                  <div style={{ flex: 1, padding: '16px 18px', minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{event.title}</span>
                      {event.is_war_ticket && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: '0.68rem', fontWeight: 700 }}>
                          <Zap size={10} /> WAR
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} />
                        {event.event_date ? new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} /> {event.venue_name ?? '-'}, {event.venue_city ?? '-'}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 0, borderLeft: '1px solid var(--border)' }}>
                    <div style={{ padding: '12px 18px', textAlign: 'center', borderRight: '1px solid var(--border)', minWidth: 90 }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Terjual</div>
                      <div style={{ fontWeight: 800, fontSize: '1rem' }}>{(event.tickets_sold ?? 0).toLocaleString()}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>/ {(event.total_quota ?? 0).toLocaleString()}</div>
                      <div style={{ marginTop: 5, height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 2, background: soldPercent >= 80 ? '#EF4444' : 'var(--color-primary)', width: `${Math.min(soldPercent, 100)}%` }} />
                      </div>
                    </div>
                    <div style={{ padding: '12px 18px', textAlign: 'center', borderRight: '1px solid var(--border)', minWidth: 110 }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Pendapatan</div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-primary)' }}>{fmt(Number(event.revenue ?? 0))}</div>
                    </div>
                    <div style={{ padding: '12px 18px', textAlign: 'center', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 100 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, color: sc.color, background: sc.bg }}>
                        <StatusIcon size={11} /> {sc.label}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 16px', borderLeft: '1px solid var(--border)' }}>
                    {event.status === 'draft' && (
                      <button onClick={() => handleSubmitForReview(String(event.id))} disabled={actionLoading === event.id + ':publish'}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#6366F1', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {actionLoading === event.id + ':publish' ? <Loader2 size={11} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> : <CheckCircle size={11} />}
                        Ajukan ke Admin
                      </button>
                    )}
                    {event.status === 'pending_review' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#F59E0B', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        <Clock size={11} /> Menunggu Review
                      </span>
                    )}
                    <button onClick={() => handleDelete(String(event.id), event.title)} disabled={!!actionLoading}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {actionLoading === event.id + ':delete' ? <Loader2 size={11} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> : <Trash2 size={11} />}
                      Hapus
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16 }}>
          <Calendar size={40} style={{ margin: '0 auto 16px', color: 'var(--text-muted)', opacity: 0.4 }} />
          <h3 style={{ marginBottom: 8 }}>Belum ada event</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>
            {search || statusFilter ? 'Tidak ada event yang cocok dengan filter.' : 'Mulai buat event pertama Anda sekarang!'}
          </p>
          {!search && !statusFilter && (
            <Link href="/organizer/events/create" className="btn btn-primary">
              + Buat Event Sekarang
            </Link>
          )}
        </motion.div>
      )}
    </div>
  );
}
