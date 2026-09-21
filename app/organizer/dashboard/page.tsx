'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiService } from '@/lib/api';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrendingUp, Ticket, Calendar,
  Plus, Eye, BarChart3, Package, ArrowRight
} from 'lucide-react';
import { Button, Card, EmptyState, Skeleton } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { StatCard } from '@/components/organizer/StatCard';
import { EventStatusBadge } from '@/components/event/EventStatusBadge';
import { TicketStatusBadge } from '@/components/ticket/TicketStatusBadge';
import { formatRupiah } from '@/lib/utils';

export default function OrganizerDashboard() {
  const { user } = useAuthStore();
  const [overview, setOverview] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const STATS = [
    {
      label: 'Total Pendapatan',
      value: formatRupiah(Number(overview?.total_revenue ?? 0)),
      icon: TrendingUp,
      colorClass: 'text-primary',
      bgClass: 'bg-primary/10 border-primary/20',
      sub: 'Semua waktu',
    },
    {
      label: 'Tiket Terjual',
      value: (overview?.total_tickets_sold ?? 0).toLocaleString('id-ID'),
      icon: Ticket,
      colorClass: 'text-pink-500',
      bgClass: 'bg-pink-500/10 border-pink-500/20',
      sub: 'Total tiket',
    },
    {
      label: 'Event Aktif',
      value: overview?.upcoming_events_count ?? 0,
      icon: Calendar,
      colorClass: 'text-success',
      bgClass: 'bg-success/10 border-success/20',
      sub: 'Akan datang',
    },
    {
      label: 'Total Event',
      value: overview?.total_events ?? 0,
      icon: Package,
      colorClass: 'text-warning',
      bgClass: 'bg-warning/10 border-warning/20',
      sub: 'Semua status',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <PageHeader
        title={`Selamat datang, ${user?.name?.split(' ')[0] ?? 'Organizer'}!`}
        description={new Date().toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
        actions={
          <Link href="/organizer/events/create">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              className="shadow-md shadow-primary/20 font-semibold"
            >
              Buat Event Baru
            </Button>
          </Link>
        }
      />

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, colorClass, bgClass, sub }) => (
          <StatCard
            key={label}
            title={label}
            value={value}
            subtitle={sub}
            icon={Icon}
            iconColorClass={colorClass}
            iconBgClass={bgClass}
            loading={loading}
          />
        ))}
      </div>

      {/* Recent Events Table */}
      <Card variant="default" className="overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-text-primary">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Event Terbaru</span>
          </div>
          <Link
            href="/organizer/events"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Kelola Semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-surface/60 border-b border-border text-[11px] font-bold text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Nama Event</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Tiket Terjual</th>
                  <th className="py-3 px-4">Pendapatan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {events.map((event: any) => (
                  <tr key={event.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-semibold text-text-primary mb-0.5">{event.title}</div>
                      <div className="text-[11px] text-text-muted">
                        {event.venue_name} · {event.venue_city}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary whitespace-nowrap">
                      {event.event_date
                        ? new Date(event.event_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-text-primary">
                      {(event.tickets_sold ?? 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-primary">
                      {formatRupiah(Number(event.revenue ?? 0))}
                    </td>
                    <td className="py-3.5 px-4">
                      <EventStatusBadge status={event.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link href="/organizer/events">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          className="text-xs text-text-secondary hover:text-text-primary"
                        >
                          Kelola
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Belum Ada Event"
            description="Mulai publikasikan konser atau festival perdana Anda sekarang."
            action={
              <Link href="/organizer/events/create">
                <Button variant="primary" size="sm">
                  + Buat Event Pertama
                </Button>
              </Link>
            }
            className="py-12"
          />
        )}
      </Card>

      {/* Recent Orders Table */}
      {overview?.recent_orders?.length > 0 && (
        <Card variant="default" className="overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border flex items-center gap-2 font-bold text-sm sm:text-base text-text-primary">
            <BarChart3 className="w-4 h-4 text-accent" />
            <span>Pesanan Terbaru</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-surface/60 border-b border-border text-[11px] font-bold text-text-muted uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Order #</th>
                  <th className="py-3 px-4">Pembeli</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {overview.recent_orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-mono text-xs font-semibold text-primary">
                      #{order.order_number ?? order.id}
                    </td>
                    <td className="py-3.5 px-4 text-text-primary font-medium">
                      {order.user?.name ?? 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary">{order.event?.title ?? 'N/A'}</td>
                    <td className="py-3.5 px-4 font-bold text-text-primary">
                      {formatRupiah(Number(order.total_amount ?? 0))}
                    </td>
                    <td className="py-3.5 px-4">
                      <TicketStatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
