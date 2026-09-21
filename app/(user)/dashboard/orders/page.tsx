'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiService } from '@/lib/api';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { Button, Card, EmptyState, Skeleton } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { TicketStatusBadge } from '@/components/ticket/TicketStatusBadge';
import { formatRupiah } from '@/lib/utils';

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'waiting_payment', label: 'Menunggu Bayar' },
  { key: 'paid', label: 'Dibayar' },
  { key: 'completed', label: 'Selesai' },
  { key: 'cancelled', label: 'Dibatalkan' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await apiService.orders.getOrders();
        const raw = (res as any)?.data ?? res;
        const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        setOrders(arr);
      } catch (e) {
        console.error(e);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = orders.filter((o) => {
    if (activeFilter === 'all') return true;
    return o.status === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Pesanan Saya"
        description="Riwayat dan status seluruh transaksi pembelian tiket konser Anda"
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <Button
              key={f.key}
              variant={isActive ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(f.key)}
              className="text-xs font-semibold whitespace-nowrap"
            >
              {f.label}
            </Button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Tidak Ada Pesanan"
          description={
            activeFilter === 'all'
              ? 'Anda belum pernah melakukan pemesanan tiket konser.'
              : 'Belum ada transaksi di filter status ini.'
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
        <div className="space-y-3">
          {filtered.map((order, i) => {
            const createdAt = order.created_at ? new Date(order.created_at) : null;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card variant="interactive" className="overflow-hidden border-border/80">
                  {/* Card Header Bar */}
                  <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-surface/60 border-b border-border text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">
                        #{order.order_number}
                      </span>
                      {createdAt && (
                        <span className="text-text-muted">
                          ·{' '}
                          {createdAt.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    <TicketStatusBadge status={order.status} />
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm sm:text-base font-bold text-text-primary truncate">
                          {order.event?.title ?? order.event_name ?? `Pesanan #${order.order_number}`}
                        </h4>
                        <p className="text-xs text-text-muted mt-0.5">
                          {order.total_tickets ? `${order.total_tickets} tiket` : 'E-Ticket'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/50">
                      <div className="sm:text-right">
                        <div className="text-[10px] uppercase font-bold text-text-muted">Total Tagihan</div>
                        <div className="text-sm sm:text-base font-black text-text-primary">
                          {formatRupiah(Number(order.total_amount))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {order.status === 'waiting_payment' && (
                          <Link href={`/checkout/${order.order_number}`}>
                            <Button variant="primary" size="sm" className="font-bold text-xs">
                              Bayar
                            </Button>
                          </Link>
                        )}
                        <Link href={`/dashboard/orders/${order.order_number}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            rightIcon={<ChevronRight className="w-4 h-4" />}
                            className="text-xs text-text-secondary hover:text-text-primary"
                          >
                            Detail
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
