'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiService } from '@/lib/api';
import { Ticket as TicketIcon, Calendar, MapPin, Search, QrCode } from 'lucide-react';
import DynamicTicketModal from '@/components/tickets/DynamicTicketModal';
import { Button, Card, Badge, Input, EmptyState, Skeleton } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { TicketStatusBadge } from '@/components/ticket/TicketStatusBadge';
import { formatDate } from '@/lib/utils';

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'valid', label: 'Valid / Aktif' },
  { key: 'used', label: 'Sudah Dipakai' },
  { key: 'expired', label: 'Kadaluarsa' },
];

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await apiService.tickets.getTickets();
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

  const filtered = tickets.filter((t) => {
    const statusVal = t.status || 'valid';
    const matchFilter =
      filter === 'all'
        ? true
        : filter === 'valid'
        ? statusVal === 'valid' || statusVal === 'active'
        : filter === 'used'
        ? statusVal === 'used' || !!t.checked_in_at
        : filter === 'expired'
        ? statusVal === 'expired'
        : true;

    const eventTitle = t.event?.title || t.event_name || '';
    const matchSearch =
      !search ||
      eventTitle.toLowerCase().includes(search.toLowerCase()) ||
      (t.ticket_number || '').toLowerCase().includes(search.toLowerCase());

    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Tiket Konser Saya"
        description="Daftar seluruh e-ticket resmi dengan perlindungan Dynamic QR Code anti-screenshot 30 detik"
      />

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Cari event atau nomor tiket..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map((f) => {
            const isActive = filter === f.key;
            return (
              <Button
                key={f.key}
                variant={isActive ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setFilter(f.key)}
                className="text-xs font-semibold whitespace-nowrap"
              >
                {f.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Tickets Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<TicketIcon className="w-8 h-8 text-text-muted" />}
          title="Tidak Ada Tiket"
          description={
            search
              ? `Tidak ditemukan tiket untuk "${search}"`
              : 'Anda belum memiliki tiket di kategori ini.'
          }
          action={
            <Link href="/events">
              <Button variant="primary" size="sm">
                Jelajahi Events
              </Button>
            </Link>
          }
          className="py-16"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ticket, i) => {
            const isUsed = ticket.status === 'used' || !!ticket.checked_in_at;
            const eventDate = ticket.event?.event_date || ticket.event_date;
            return (
              <motion.div
                key={ticket.id || ticket.ticket_number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card
                  variant="interactive"
                  onClick={() => setSelectedTicket(ticket)}
                  className="cursor-pointer overflow-hidden border-border/80 flex flex-col justify-between h-full group"
                >
                  {/* Decorative Top Accent Bar */}
                  <div className={`h-1.5 ${isUsed ? 'bg-text-muted' : 'bg-primary'}`} />

                  <div className="p-4 sm:p-5 flex-1 flex flex-col">
                    {/* Event & Category Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <Badge variant="secondary" size="sm" className="mb-1.5">
                          {ticket.ticket_category?.name || ticket.category_name || 'Regular'}
                        </Badge>
                        <h4 className="font-extrabold text-sm sm:text-base text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                          {ticket.event?.title || ticket.event_name || 'Event TIXORA'}
                        </h4>
                      </div>
                      <TicketStatusBadge status={isUsed ? 'used' : (ticket.status || 'valid')} />
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1.5 text-xs text-text-muted mb-4">
                      {eventDate && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span>{formatDate(eventDate)}</span>
                        </div>
                      )}
                      {(ticket.event?.venue?.name || ticket.venue_name) && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-accent" />
                          <span className="truncate">
                            {ticket.event?.venue?.name || ticket.venue_name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* QR CTA Bar */}
                    <div className="mt-auto pt-3 border-t border-border flex items-center justify-between text-xs">
                      <span className="font-mono text-[11px] text-text-muted">
                        #{ticket.ticket_number}
                      </span>
                      <div className="flex items-center gap-1.5 text-primary font-bold">
                        <QrCode className="w-4 h-4" />
                        <span>Buka QR (30s)</span>
                      </div>
                    </div>
                  </div>
                </Card>
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
