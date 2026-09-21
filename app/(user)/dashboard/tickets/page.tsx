'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiService } from '../../../../lib/api';
import { Ticket, Calendar, MapPin, ChevronRight, Search, QrCode } from 'lucide-react';
import DynamicTicketModal from '../../../../components/tickets/DynamicTicketModal';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  valid:   { label: 'Valid',          color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  active:  { label: 'Valid',          color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  used:    { label: 'Sudah Dipakai',  color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' },
  expired: { label: 'Kadaluarsa',     color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
  transferred: { label: 'Dipindahkan', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
};

const FILTERS = ['Semua', 'Valid', 'Sudah Dipakai', 'Kadaluarsa'];

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('Semua');
  const [search,  setSearch]  = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await apiService.tickets.getTickets();
        // handle both paginated {data: [...]} and plain array responses
        const raw = (res as any)?.data ?? res;
        const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        setTickets(arr);
      } catch (e) {
        console.error(e);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = tickets.filter(t => {
    const matchFilter =
      filter === 'Semua'       ? true :
      filter === 'Valid'       ? t.status === 'valid' :
      filter === 'Sudah Dipakai' ? t.status === 'used' :
      filter === 'Kadaluarsa'  ? t.status === 'expired' :
      true;
    const matchSearch = !search || (t.event_name ?? '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Tiket Saya
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
          Semua tiket event yang sudah kamu beli
        </p>
      </div>

      {/* Search + Filter bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="input"
            placeholder="Cari nama event..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36, height: 38, fontSize: '0.85rem' }}
          />
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
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
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ height: 160, borderRadius: 12, background: 'var(--background-2)', opacity: 0.6 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 0', borderRadius: 14,
          background: 'var(--card)', border: '1px solid var(--border)',
        }}>
          <Ticket size={32} style={{ margin: '0 auto 12px', color: 'var(--text-muted)', opacity: 0.4 }} />
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Tidak ada tiket</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            {search ? `Tidak ada hasil untuk "${search}"` : 'Belum ada tiket di kategori ini.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map((ticket, i) => {
            const st = STATUS_MAP[ticket.status] ?? { label: ticket.status, color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' };
            const eventDate = ticket.event_date ? new Date(ticket.event_date) : null;
            return (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div
                  onClick={() => setSelectedTicket(ticket)}
                  style={{ cursor: 'pointer', display: 'block' }}
                >
                  <div
                    style={{
                      borderRadius: 14, overflow: 'hidden',
                      background: 'var(--card)', border: '1px solid var(--border)',
                      transition: 'border-color 0.15s, transform 0.15s',
                    }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(99, 102, 241, 0.4)'; el.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.transform = 'none'; }}
                  >
                    {/* Card header strip */}
                    <div style={{ height: 4, background: 'var(--color-primary)' }} />

                    <div style={{ padding: '16px' }}>
                      {/* Title + status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.3, flex: 1 }}>
                          {ticket.event_name ?? 'Event'}
                        </div>
                        <span style={{
                          padding: '3px 9px', borderRadius: 20, fontSize: '0.68rem',
                          fontWeight: 600, color: st.color, background: st.bg, flexShrink: 0,
                        }}>
                          {st.label}
                        </span>
                      </div>

                      {/* Meta info */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                        {eventDate && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            <Calendar size={13} />
                            {eventDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                        {ticket.venue_name && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            <MapPin size={13} />
                            {ticket.venue_name}
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div style={{
                        borderTop: '1px dashed var(--border)', paddingTop: 10,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <div>
                          {ticket.category_name && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 1 }}>Kategori</div>
                          )}
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {ticket.category_name ?? '—'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                          <QrCode size={14} /> Buka QR (30s)
                        </div>
                      </div>

                      {/* Ticket number */}
                      <div style={{ marginTop: 8, fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                        #{ticket.ticket_number}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Dynamic Ticket Modal */}
      <DynamicTicketModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}
