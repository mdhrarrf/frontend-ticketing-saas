'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  QrCode, Calendar, MapPin, Ticket as TicketIcon,
  Search, ShieldCheck, Download, Sparkles, ChevronRight, RefreshCw
} from 'lucide-react';
import { apiService } from '../../../lib/api';
import DynamicTicketModal from '../../../components/tickets/DynamicTicketModal';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active:      { label: 'Siap Digunakan', color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  valid:       { label: 'Siap Digunakan', color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  used:        { label: 'Sudah Check-in', color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' },
  expired:     { label: 'Kadaluarsa',     color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
  transferred: { label: 'Dipindahkan',    color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
};

const FILTERS = [
  { value: 'all',    label: 'Semua Tiket' },
  { value: 'active', label: 'Tiket Aktif' },
  { value: 'used',   label: 'Sudah Dipakai' },
];

export default function UserTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'used'>('active');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await apiService.tickets.getTickets();
      const raw = (res as any)?.data ?? res;
      const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      setTickets(arr);
    } catch (e) {
      console.error('Failed to load tickets', e);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter(t => {
    const statusVal = t.status || 'active';
    const matchFilter =
      filter === 'all'    ? true :
      filter === 'active' ? (statusVal === 'active' || statusVal === 'valid') && !t.checked_in_at :
      filter === 'used'   ? statusVal === 'used' || !!t.checked_in_at :
      true;

    const eventTitle = t.event?.title || t.event_name || '';
    const matchSearch = !search || eventTitle.toLowerCase().includes(search.toLowerCase()) || (t.ticket_number || '').toLowerCase().includes(search.toLowerCase());

    return matchFilter && matchSearch;
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Tiket Saya (E-Ticket)
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 10px',
                borderRadius: 20,
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: 'var(--color-primary, #6366F1)',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}>
                <ShieldCheck size={13} /> Ghost-Shield™ 30s
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              QR Code tiket Anda berputar otomatis setiap 30 detik untuk mencegah penipuan & calo.
            </p>
          </div>

          <button
            onClick={fetchTickets}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </motion.div>

      {/* Filter & Search Bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Cari event atau nomor tiket..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36, height: 40, fontSize: '0.85rem' }}
          />
        </div>

        {/* Filter Chips */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--card)', padding: 4, borderRadius: 12, border: '1px solid var(--border)' }}>
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: filter === f.value ? 'var(--color-primary)' : 'transparent',
                color: filter === f.value ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Ticket Cards Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 260, borderRadius: 20, background: 'var(--card)', border: '1px solid var(--border)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            textAlign: 'center',
            padding: '60px 24px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 20,
          }}>
          <TicketIcon size={44} style={{ margin: '0 auto 16px', color: 'var(--text-muted)', opacity: 0.3 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
            Belum Ada Tiket
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>
            {search ? `Tidak ada tiket yang cocok dengan kata kunci "${search}".` : 'Anda belum memiliki tiket di kategori ini.'}
          </p>
          <Link href="/events" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} /> Jelajahi Event
          </Link>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {filteredTickets.map((ticket, i) => {
            const statusKey = ticket.status === 'used' || ticket.checked_in_at ? 'used' : (ticket.status || 'active');
            const st = STATUS_MAP[statusKey] ?? { label: ticket.status, color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' };
            const eventDate = ticket.event?.event_date || ticket.event_date;
            const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('id-ID', {
              weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
            }) : '-';
            const categoryName = ticket.ticket_category?.name || ticket.ticketCategory?.name || ticket.category_name || 'VIP Standing';
            const venueName = ticket.event?.venue?.name || ticket.venue_name || 'Stora Stadium, Jakarta';

            return (
              <motion.div
                key={ticket.id || ticket.ticket_number}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  transition: 'transform 0.2s, border-color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                {/* Event Banner Strip */}
                <div style={{
                  height: 90,
                  background: 'linear-gradient(135deg, #3730A3 0%, #6366F1 50%, #EC4899 100%)',
                  padding: '14px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      background: 'rgba(0,0,0,0.3)',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: 12,
                    }}>
                      {categoryName}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      background: st.bg,
                      color: st.color,
                      padding: '2px 8px',
                      borderRadius: 12,
                    }}>
                      {st.label}
                    </span>
                  </div>

                  <div style={{ color: 'white', fontWeight: 800, fontSize: '1rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {ticket.event?.title || ticket.event_name || 'Event TIXORA'}
                  </div>
                </div>

                {/* Ticket Details Body */}
                <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <Calendar size={13} style={{ color: 'var(--color-primary)' }} />
                      <span>{formattedDate}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <MapPin size={13} style={{ color: '#EC4899' }} />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {venueName}
                      </span>
                    </div>
                  </div>

                  {/* Holder & Seat info */}
                  <div style={{
                    background: 'var(--background-2)',
                    padding: '10px 14px',
                    borderRadius: 12,
                    fontSize: '0.75rem',
                    marginBottom: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Pemegang</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {ticket.holder_name || ticket.user?.name || 'Tamu'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Gate / Pintu</div>
                      <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {ticket.entry_gate || ticket.check_in_gate || 'Gate 1'}
                      </div>
                    </div>
                  </div>

                  {/* Action Button: Show Dynamic QR */}
                  <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '11px 16px',
                        borderRadius: 12,
                        background: statusKey === 'used'
                          ? 'var(--background-2)'
                          : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                        color: statusKey === 'used' ? 'var(--text-muted)' : 'white',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        border: 'none',
                        boxShadow: statusKey === 'used' ? 'none' : '0 4px 14px rgba(79, 70, 229, 0.3)',
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={e => { if (statusKey !== 'used') e.currentTarget.style.transform = 'scale(1.02)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
                    >
                      <QrCode size={16} />
                      <span>{statusKey === 'used' ? 'Lihat Tiket (Used)' : 'Buka Dynamic QR (30s)'}</span>
                    </button>
                  </div>

                  <div style={{ marginTop: 8, fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'monospace' }}>
                    #{ticket.ticket_number}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Dynamic QR Modal */}
      <DynamicTicketModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}
