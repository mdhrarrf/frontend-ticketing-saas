'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  QrCode, Calendar, MapPin, Ticket as TicketIcon,
  ShieldCheck, Sparkles, RefreshCw
} from 'lucide-react';
import { apiService } from '@/lib/api';
import DynamicTicketModal from '@/components/tickets/DynamicTicketModal';
import { Button, Card, Badge, Input, EmptyState, Skeleton } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';
import { TicketStatusBadge } from '@/components/ticket/TicketStatusBadge';
import { formatDate } from '@/lib/utils';

const FILTERS = [
  { value: 'all', label: 'Semua Tiket' },
  { value: 'active', label: 'Tiket Aktif' },
  { value: 'used', label: 'Sudah Dipakai' },
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

  const filteredTickets = tickets.filter((t) => {
    const statusVal = t.status || 'active';
    const matchFilter =
      filter === 'all'
        ? true
        : filter === 'active'
        ? (statusVal === 'active' || statusVal === 'valid') && !t.checked_in_at
        : filter === 'used'
        ? statusVal === 'used' || !!t.checked_in_at
        : true;

    const eventTitle = t.event?.title || t.event_name || '';
    const matchSearch =
      !search ||
      eventTitle.toLowerCase().includes(search.toLowerCase()) ||
      (t.ticket_number || '').toLowerCase().includes(search.toLowerCase());

    return matchFilter && matchSearch;
  });

  return (
    <PageContainer size="lg" className="py-8 pb-20">
      {/* Header */}
      <PageHeader
        title="Tiket Konser Saya"
        badge={
          <Badge variant="accent" size="sm" className="font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> Ghost-Shield™ 30s
          </Badge>
        }
        description="QR Code tiket Anda berputar otomatis setiap 30 detik untuk mencegah penipuan & calo."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTickets}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            className="text-xs"
          >
            Refresh
          </Button>
        }
      />

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-8">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Cari event atau nomor tiket..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.value as any)}
              className="text-xs font-semibold whitespace-nowrap"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Ticket Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          icon={<TicketIcon className="w-10 h-10 text-text-muted" />}
          title="Belum Ada Tiket"
          description={
            search
              ? `Tidak ada tiket yang cocok dengan kata kunci "${search}".`
              : 'Anda belum memiliki tiket di kategori ini.'
          }
          action={
            <Link href="/events">
              <Button variant="primary" size="md" leftIcon={<Sparkles className="w-4 h-4" />}>
                Jelajahi Event
              </Button>
            </Link>
          }
          className="py-16"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map((ticket, i) => {
            const isUsed = ticket.status === 'used' || !!ticket.checked_in_at;
            const eventDate = ticket.event?.event_date || ticket.event_date;
            const categoryName =
              ticket.ticket_category?.name ||
              ticket.ticketCategory?.name ||
              ticket.category_name ||
              'Regular';
            const venueName =
              ticket.event?.venue?.name || ticket.venue_name || 'Venue TBA';

            return (
              <motion.div
                key={ticket.id || ticket.ticket_number}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  variant="interactive"
                  onClick={() => setSelectedTicket(ticket)}
                  className="overflow-hidden border-border/80 flex flex-col justify-between h-full group cursor-pointer"
                >
                  {/* Decorative Banner Strip */}
                  <div className="h-24 bg-gradient-to-r from-primary via-indigo-600 to-purple-800 p-4 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex justify-between items-center z-10">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-black/40 text-white px-2 py-0.5 rounded-full">
                        {categoryName}
                      </span>
                      <TicketStatusBadge status={isUsed ? 'used' : (ticket.status || 'valid')} />
                    </div>

                    <h3 className="text-white font-extrabold text-sm sm:text-base truncate z-10">
                      {ticket.event?.title || ticket.event_name || 'Event TIXORA'}
                    </h3>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2 text-xs text-text-muted mb-4">
                      {eventDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span>{formatDate(eventDate)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-accent" />
                        <span className="truncate">{venueName}</span>
                      </div>
                    </div>

                    {/* Holder Info Strip */}
                    <div className="p-3 rounded-xl bg-surface/70 border border-border/60 flex items-center justify-between text-xs mb-4">
                      <div>
                        <div className="text-[10px] text-text-muted">Pemegang Tiket</div>
                        <div className="font-bold text-text-primary">
                          {ticket.holder_name || ticket.user?.name || 'Tamu'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-text-muted">Gate / Pintu</div>
                        <div className="font-bold text-primary">
                          {ticket.entry_gate || ticket.check_in_gate || 'Gate 1'}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <Button
                      variant={isUsed ? 'outline' : 'primary'}
                      size="sm"
                      fullWidth
                      leftIcon={<QrCode className="w-4 h-4" />}
                      className="font-bold text-xs"
                    >
                      {isUsed ? 'Lihat Tiket (Used)' : 'Buka Dynamic QR (30s)'}
                    </Button>

                    <div className="mt-2.5 text-center font-mono text-[10px] text-text-muted">
                      #{ticket.ticket_number}
                    </div>
                  </div>
                </Card>
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
    </PageContainer>
  );
}
