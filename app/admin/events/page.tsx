'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Search, CheckCircle, XCircle, Clock, Eye,
  MapPin, Ticket, TrendingUp, AlertCircle, Loader2, Filter
} from 'lucide-react';
import { apiService } from '../../../lib/api';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending_review: { label: 'Menunggu Review', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  published:      { label: 'Published',       color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  draft:          { label: 'Draft',           color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' },
  cancelled:      { label: 'Dibatalkan',      color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  ended:          { label: 'Selesai',         color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
};

export default function AdminEventsPage() {
  const [events,      setEvents]      = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [statusFilter,setStatusFilter]= useState('pending_review');
  const [actionId,    setActionId]    = useState<string | null>(null);
  const [rejectId,    setRejectId]    = useState<string | null>(null);
  const [rejectReason,setRejectReason]= useState('');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.admin.getEvents({ status: statusFilter || undefined, search: search || undefined, per_page: 20 });
      const d = (res as any)?.data ?? res;
      setEvents(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleApprove = async (id: string, title: string) => {
    if (!confirm(`Setujui dan publish event "${title}"?`)) return;
    setActionId(id + ':approve');
    try {
      await apiService.admin.approveEvent(id);
      setEvents(prev => prev.map(e => e.id == id ? { ...e, status: 'published' } : e));
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Gagal menyetujui event');
    } finally { setActionId(null); }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    setActionId(rejectId + ':reject');
    try {
      await apiService.admin.rejectEvent(rejectId, rejectReason);
      setEvents(prev => prev.map(e => e.id == rejectId ? { ...e, status: 'draft' } : e));
      setRejectId(null);
      setRejectReason('');
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Gagal menolak event');
    } finally { setActionId(null); }
  };

  const pendingCount = events.filter(e => e.status === 'pending_review').length;

  return (
    <div>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, marginBottom: 4 }}>Manajemen Event</h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Review dan kelola semua event dari seluruh organizer
            </p>
          </div>
          {pendingCount > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B', fontWeight: 700, fontSize: '0.875rem' }}>
              <AlertCircle size={16} /> {pendingCount} event menunggu review
            </div>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari event..." className="input" style={{ paddingLeft: 36 }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { value: 'pending_review', label: '⏳ Perlu Review' },
            { value: '',              label: 'Semua' },
            { value: 'published',     label: 'Published' },
            { value: 'draft',         label: 'Draft' },
          ].map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              style={{
                padding: '7px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                background: statusFilter === f.value ? 'var(--color-primary)' : 'var(--card)',
                color: statusFilter === f.value ? 'white' : 'var(--text-secondary)',
                border: `1px solid ${statusFilter === f.value ? 'var(--color-primary)' : 'var(--border)'}`,
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Events List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(4)].map((_, i) => <div key={i} style={{ height: 90, borderRadius: 14, background: 'var(--card)', animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)' }}>
          <CheckCircle size={40} style={{ margin: '0 auto 16px', color: 'var(--text-muted)', opacity: 0.4 }} />
          <p style={{ color: 'var(--text-muted)' }}>Tidak ada event yang perlu di-review saat ini. 🎉</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {events.map((event: any, i: number) => {
            const sc = STATUS_MAP[event.status] ?? STATUS_MAP.draft;
            return (
              <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                style={{ background: 'var(--card)', border: event.status === 'pending_review' ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  {/* Accent bar */}
                  <div style={{ width: 4, flexShrink: 0, background: sc.color }} />

                  {/* Main info */}
                  <div style={{ flex: 1, padding: '14px 18px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{event.title}</span>
                      <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, color: sc.color, background: sc.bg }}>
                        {sc.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} /> {event.event_date ? new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} /> {event.venue?.name ?? event.venue_name ?? '-'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <TrendingUp size={12} /> Organizer: <b style={{ color: 'var(--text-secondary)' }}>{event.organizer?.name ?? '-'}</b>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {event.status === 'pending_review' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderLeft: '1px solid var(--border)', flexShrink: 0 }}>
                      <button
                        onClick={() => handleApprove(String(event.id), event.title)}
                        disabled={!!actionId}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                        {actionId === event.id + ':approve' ? <Loader2 size={14} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> : <CheckCircle size={14} />}
                        Setujui & Publish
                      </button>
                      <button
                        onClick={() => { setRejectId(String(event.id)); setRejectReason(''); }}
                        disabled={!!actionId}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                        <XCircle size={14} /> Tolak
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderLeft: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {sc.label}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={e => { if (e.target === e.currentTarget) { setRejectId(null); } }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 460 }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 800 }}>Tolak Event</h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Berikan alasan penolakan. Organizer akan menerima feedback ini dan bisa memperbaiki event-nya.
              </p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Contoh: Informasi venue kurang lengkap, deskripsi event terlalu singkat, belum ada kategori tiket..."
                rows={4}
                className="input"
                style={{ width: '100%', resize: 'vertical', marginBottom: 16, boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => setRejectId(null)}
                  style={{ padding: '9px 20px', borderRadius: 10, background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>
                  Batal
                </button>
                <button onClick={handleReject} disabled={!rejectReason.trim() || !!actionId}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 10, background: '#EF4444', color: 'white', fontWeight: 700, cursor: 'pointer', border: 'none', opacity: !rejectReason.trim() ? 0.5 : 1 }}>
                  {actionId?.includes(':reject') ? <Loader2 size={14} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> : <XCircle size={14} />}
                  Tolak Event
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
