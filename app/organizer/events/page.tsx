'use client';

import { useEffect, useState } from 'react';
import { apiService } from '@/lib/api';
import { formatRupiah, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus, Calendar, MapPin, Ticket, TrendingUp,
  Trash2, Eye, Zap, Search, Clock, CheckCircle2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { EventStatusBadge } from '@/components/event/EventStatusBadge';

const STATUS_FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Menunggu Review' },
  { value: 'published', label: 'Published' },
  { value: 'ended', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

export default function OrganizerEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await apiService.organizer.getEvents({
        search: search || undefined,
        status: statusFilter || undefined
      });
      const d = (res as any)?.data ?? res;
      setEvents(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [search, statusFilter]);

  const handleSubmitForReview = async (id: string) => {
    setActionLoading(id + ':publish');
    try {
      await apiService.organizer.publishEvent(id);
      setEvents((prev) =>
        prev.map((e) => (e.id == id ? { ...e, status: 'pending_review' } : e))
      );
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Gagal mengajukan event ke review');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus event "${title}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setActionLoading(id + ':delete');
    try {
      await apiService.organizer.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id != id));
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Gagal menghapus event');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = events.filter((e) =>
    (!search || e.title?.toLowerCase().includes(search.toLowerCase())) &&
    (!statusFilter || e.status === statusFilter)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Event Saya
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            {events.length} event terdaftar dalam akun organizer Anda
          </p>
        </div>
        <Link href="/organizer/events/create">
          <Button variant="primary" size="md">
            <Plus size={16} className="mr-1.5" /> Buat Event Baru
          </Button>
        </Link>
      </motion.div>

      {/* Filter Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama event..."
            className="w-full bg-card border border-border rounded-xl pl-9.5 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-hidden focus:border-primary transition-colors"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === s.value
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-card hover:bg-background-elevated text-text-secondary border border-border'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Event Cards List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="space-y-2 w-full md:w-1/2">
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
              </div>
              <div className="flex gap-6 w-full md:w-auto justify-between md:justify-end">
                <Skeleton className="h-10 w-24 rounded-lg" />
                <Skeleton className="h-10 w-28 rounded-lg" />
                <Skeleton className="h-10 w-20 rounded-lg" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((event: any, i: number) => {
            const soldPercent = event.total_quota
              ? Math.round((event.tickets_sold / event.total_quota) * 100)
              : 0;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card
                  variant="interactive"
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Main Event Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-text-primary truncate">
                        {event.title}
                      </h3>
                      {event.is_war_ticket && (
                        <Badge variant="warning" size="sm" className="flex items-center gap-1">
                          <Zap size={11} className="fill-warning" /> WAR TICKET
                        </Badge>
                      )}
                      <EventStatusBadge status={event.status} size="sm" />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-text-muted" />
                        {event.event_date ? formatDate(event.event_date) : '-'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-text-muted" />
                        {event.venue_name ?? '-'}
                        {event.venue_city ? `, ${event.venue_city}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Stats Columns */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 lg:gap-6 border-t lg:border-t-0 lg:border-l border-border pt-3 lg:pt-0 lg:pl-6 shrink-0">
                    <div>
                      <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-0.5">
                        Tiket Terjual
                      </div>
                      <div className="text-sm sm:text-base font-extrabold text-text-primary">
                        {(event.tickets_sold ?? 0).toLocaleString('id-ID')}{' '}
                        <span className="text-xs font-normal text-text-muted">
                          / {(event.total_quota ?? 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="w-28 sm:w-32 bg-background-elevated h-1.5 rounded-full overflow-hidden mt-1.5 border border-border/50">
                        <div
                          className="bg-primary h-full rounded-full transition-all"
                          style={{ width: `${Math.min(soldPercent, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-0.5">
                        Pendapatan
                      </div>
                      <div className="text-sm sm:text-base font-extrabold text-primary">
                        {formatRupiah(Number(event.revenue ?? 0))}
                      </div>
                      <div className="text-[11px] text-text-muted mt-1">
                        {soldPercent}% dari kuota
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 border-t lg:border-t-0 lg:border-l border-border pt-3 lg:pt-0 lg:pl-6 shrink-0 justify-end">
                    {event.status === 'draft' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSubmitForReview(String(event.id))}
                        loading={actionLoading === event.id + ':publish'}
                      >
                        <CheckCircle2 size={13} className="mr-1" />
                        Ajukan Review
                      </Button>
                    )}

                    {event.status === 'pending_review' && (
                      <Badge variant="warning" size="md" className="flex items-center gap-1 py-1.5 px-3">
                        <Clock size={13} />
                        Menunggu Review
                      </Badge>
                    )}

                    <Link href={`/events/${event.slug || event.id}`} target="_blank">
                      <Button variant="outline" size="sm" aria-label="Lihat event di web publik">
                        <Eye size={14} />
                      </Button>
                    </Link>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(String(event.id), event.title)}
                      loading={actionLoading === event.id + ':delete'}
                      disabled={!!actionLoading}
                      aria-label="Hapus event"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Ticket className="w-8 h-8 text-text-muted" />}
          title="Belum Ada Event"
          description={
            search || statusFilter
              ? 'Tidak ada event yang sesuai dengan kriteria pencarian dan filter.'
              : 'Anda belum membuat event. Mulai buat event konser atau festival pertama Anda sekarang!'
          }
          action={
            !search && !statusFilter ? (
              <Link href="/organizer/events/create">
                <Button variant="primary">
                  <Plus size={16} className="mr-1.5" /> Buat Event Sekarang
                </Button>
              </Link>
            ) : undefined
          }
          className="py-16 bg-card border border-border rounded-3xl"
        />
      )}
    </div>
  );
}
