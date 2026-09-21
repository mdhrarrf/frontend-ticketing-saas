'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Ticket, ArrowRight, Calendar, MapPin } from 'lucide-react';
import Confetti from 'react-confetti';
import { apiService } from '@/lib/api';
import { Button, Card, Badge, LoadingState } from '@/components/ui';
import { PageContainer } from '@/components/layout';
import { formatRupiah, formatDate } from '@/lib/utils';
import type { Order } from '@/types';

export default function OrderSuccessPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = use(params);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await apiService.orders.getOrder(orderNumber);
        const data = (res as any)?.data ?? res;
        setOrder(data);
      } catch (err) {
        console.error('Failed to load order on success page:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderNumber]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">
      {windowSize.width > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={400}
          colors={['#7C3AED', '#22D3EE', '#10B981', '#F59E0B']}
        />
      )}

      {/* Success Badge Icon */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className="w-20 h-20 bg-success/20 border border-success/40 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-success/20 z-10 text-success"
      >
        <Check className="w-10 h-10" strokeWidth={3} />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-center z-10 max-w-lg w-full"
      >
        <h1 className="text-2xl sm:text-3xl font-black text-text-primary mb-2">
          Pembayaran Berhasil!
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mb-8">
          Order <span className="font-mono text-primary font-bold">#{orderNumber}</span> telah terkonfirmasi.
        </p>

        {loading ? (
          <Card variant="default" className="p-8 mb-6">
            <LoadingState message="Memuat ringkasan e-ticket..." />
          </Card>
        ) : (
          <Card variant="elevated" className="p-6 sm:p-7 mb-8 text-left border-border/80 shadow-2xl">
            {order?.event && (
              <div className="flex items-start gap-4 pb-4 mb-4 border-b border-border">
                {order.event.banner ? (
                  <img
                    src={order.event.banner}
                    alt={order.event.title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Ticket className="w-7 h-7" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-text-primary leading-snug">
                    {order.event.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted mt-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{formatDate(order.event.event_date)}</span>
                  </div>
                  {order.event.venue_name && (
                    <div className="flex items-center gap-1.5 text-xs text-text-muted mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-accent" />
                      <span>{order.event.venue_name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ticket items breakdown */}
            <div className="space-y-2 mb-6 text-xs sm:text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Tiket Dipesan</span>
                <span className="text-text-primary font-semibold">
                  {order?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) ?? 1} Tiket
                </span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Status Pembayaran</span>
                <Badge variant="success" size="sm">
                  LUNAS
                </Badge>
              </div>
              <div className="flex justify-between pt-2 border-t border-border/60 font-bold text-sm">
                <span className="text-text-primary">Total Dibayar</span>
                <span className="text-success font-black text-base">
                  {formatRupiah(Number(order?.total_amount ?? 0))}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/dashboard/tickets" className="w-full">
                <Button variant="primary" size="lg" fullWidth leftIcon={<Ticket className="w-4 h-4" />}>
                  Buka Tiket & Dynamic QR
                </Button>
              </Link>
              <Link href={`/dashboard/orders/${orderNumber}`} className="w-full">
                <Button variant="outline" size="md" fullWidth>
                  Lihat Rincian Faktur Order
                </Button>
              </Link>
            </div>
          </Card>
        )}

        <Link
          href="/events"
          className="inline-flex items-center gap-1 text-xs sm:text-sm text-text-secondary hover:text-primary transition-colors"
        >
          <span>Jelajahi konser dan event lainnya</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  );
}
