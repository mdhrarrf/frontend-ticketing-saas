'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, MapPin, Clock, Ticket, Zap, Shield,
  Share2, Heart, ArrowRight, CheckCircle, Info, Building, Check
} from 'lucide-react';
import { CountdownTimer } from '../../../../components/events/CountdownTimer';
import { apiService } from '../../../../lib/api';
import type { Event, TicketCategory } from '../../../../types';
import { Button, Badge, Card, LoadingState, ErrorState } from '@/components/ui';
import { PageContainer } from '@/components/layout';
import { formatRupiah, formatDate } from '@/lib/utils';

// ─── Category Ticket Card ─────────────────────────────────────
function TicketCategoryCard({
  cat,
  eventSaleOpen,
  isWarTicket,
  onSelect,
}: {
  cat: TicketCategory;
  eventSaleOpen: boolean;
  isWarTicket: boolean;
  onSelect: (cat: TicketCategory) => void;
}) {
  const available = (cat.quota ?? 0) - (cat.sold ?? 0) - (cat.reserved ?? 0);
  const soldPercent = cat.quota > 0 ? ((cat.sold + cat.reserved) / cat.quota) * 100 : 0;
  const isSoldOut = eventSaleOpen && available <= 0;
  const isAlmostGone = eventSaleOpen && soldPercent >= 75 && !isSoldOut;
  const isNotOpenYet = !eventSaleOpen;

  return (
    <Card
      variant="default"
      className={`p-4 sm:p-5 relative overflow-hidden transition-all duration-200 ${
        isSoldOut ? 'opacity-55 border-danger/30' : 'hover:border-primary/40'
      }`}
    >
      {/* Color accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: isNotOpenYet ? 'var(--border)' : (cat.color ?? 'var(--color-primary)') }}
      />

      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className={`text-base font-bold ${isNotOpenYet ? 'text-text-muted' : 'text-text-primary'}`}>
              {cat.name}
            </h3>
            {isAlmostGone && (
              <Badge variant="warning" size="sm">
                HAMPIR HABIS
              </Badge>
            )}
            {isSoldOut && (
              <Badge variant="danger" size="sm">
                SOLD OUT
              </Badge>
            )}
          </div>
          <div
            className={`text-xl font-extrabold ${
              isNotOpenYet ? 'text-text-muted' : 'text-primary'
            }`}
          >
            {formatRupiah(Number(cat.price))}
          </div>
          {cat.service_fee && Number(cat.service_fee) > 0 && (
            <div className="text-xs text-text-muted mt-0.5">
              + biaya layanan {formatRupiah(Number(cat.service_fee))}
            </div>
          )}
        </div>

        {/* Action Button */}
        {!isNotOpenYet && !isSoldOut && (
          <Button
            variant={isWarTicket ? 'danger' : 'primary'}
            size="sm"
            onClick={() => onSelect(cat)}
            className="shrink-0 font-bold"
            leftIcon={isWarTicket ? <Zap className="w-3.5 h-3.5 fill-current" /> : undefined}
          >
            {isWarTicket ? 'War' : 'Pilih'}
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {eventSaleOpen && (
        <div className="mb-3">
          <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isAlmostGone ? 'bg-warning' : 'bg-primary'
              }`}
              style={{ width: `${soldPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-text-muted mt-1.5">
            <span>{Math.round(soldPercent)}% terjual</span>
            <span>{available > 0 ? `${available.toLocaleString('id-ID')} tersisa` : 'Habis'}</span>
          </div>
        </div>
      )}

      {/* Not Yet Open State */}
      {isNotOpenYet && (
        <div className="flex items-center gap-2 text-xs text-text-muted font-medium px-3 py-2 rounded-lg bg-surface border border-border mb-3">
          <Clock className="w-3.5 h-3.5" />
          Penjualan belum dibuka
        </div>
      )}

      {/* Benefits */}
      {cat.benefits && (
        <div className="flex gap-1.5 flex-wrap mb-2">
          {(Array.isArray(cat.benefits) ? cat.benefits : []).map((b: string, i: number) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-white/5 text-text-secondary border border-border/50"
            >
              <Check className="w-3 h-3 text-success" /> {b}
            </span>
          ))}
        </div>
      )}

      {/* Max per user */}
      <div className="text-[11px] text-text-muted">
        Maksimal {cat.max_per_user} tiket per orang
      </div>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function EventDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [cats, setCats] = useState<TicketCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saleOpen, setSaleOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [evRes, catRes] = await Promise.all([
          apiService.events.getEvent(slug),
          apiService.events.getEventCategories(slug),
        ]);
        const ev = (evRes as any)?.data ?? evRes;
        const cs = (catRes as any)?.data ?? catRes ?? [];
        setEvent(ev);
        setCats(Array.isArray(cs) ? cs : []);
        setSaleOpen(
          new Date(ev.sale_start_at) <= new Date() && new Date(ev.sale_end_at) >= new Date()
        );
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  useEffect(() => {
    const onScroll = () => setShowStickyBar(window.scrollY > 500);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSelect = (cat: TicketCategory) => {
    if (event?.is_war_ticket) {
      window.location.href = `/waiting-room/${event.id}`;
    } else {
      window.location.href = `/checkout?event=${event?.id}&cat=${cat.id}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <LoadingState message="Memuat detail event..." />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <ErrorState
          title="Event Tidak Ditemukan"
          description="Event yang Anda cari mungkin sudah dihapus atau tautan tidak valid."
          retryText="Kembali ke Daftar Events"
          onRetry={() => (window.location.href = '/events')}
        />
      </div>
    );
  }

  const minPrice =
    cats.length > 0
      ? Math.min(...cats.map((c) => Number(c.price)))
      : Number(event.min_price ?? 0);

  return (
    <div className="min-h-screen pb-28">
      {/* ─── HERO BANNER ─────────────────────────────────── */}
      <div className="relative min-h-[460px] flex flex-col justify-end overflow-hidden pb-10 pt-28">
        {event.banner ? (
          <img
            src={event.banner}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-[#0F172A] flex items-center justify-center">
            <Ticket className="w-44 h-44 text-white/5 -rotate-12" />
          </div>
        )}

        {/* Ambient Dark Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Hero Content */}
        <PageContainer size="lg" className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Badge variant="primary" size="md" className="uppercase font-bold tracking-wider">
                  {event.category}
                </Badge>
                {event.is_war_ticket && (
                  <Badge variant="warTicket" size="md" className="font-extrabold shadow-lg shadow-danger/25">
                    <Zap className="w-3.5 h-3.5 fill-current" /> WAR TICKET
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4 drop-shadow-md">
                {event.title}
              </h1>

              <div className="flex flex-wrap items-center gap-5 text-sm text-text-secondary font-medium">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span className="text-white">{formatDate(event.event_date)}</span>
                </div>
                {event.event_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent" />
                    <span className="text-white">{event.event_time.slice(0, 5)} WIB</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span className="text-white">
                    {event.venue_name ?? 'TBA'}{event.venue_city ? `, ${event.venue_city}` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 shrink-0 pb-1">
              <button
                onClick={() => setWishlisted(!wishlisted)}
                aria-label="Wishlist"
                className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-colors cursor-pointer"
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    wishlisted ? 'text-danger fill-danger' : 'text-white'
                  }`}
                />
              </button>
              <button
                onClick={() => navigator.share?.({ title: event.title, url: window.location.href })}
                aria-label="Bagikan"
                className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-colors cursor-pointer text-white"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </PageContainer>
      </div>

      {/* ─── MAIN CONTENT ─────────────────────────────────── */}
      <PageContainer size="lg" className="mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            {/* War Ticket Notice */}
            {event.is_war_ticket && (
              <div className="p-6 rounded-2xl bg-danger/10 border border-danger/30 relative overflow-hidden">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-danger flex items-center justify-center text-white shrink-0 shadow-lg shadow-danger/30">
                    <Zap className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-danger mb-2">
                      Ini adalah War Ticket Event!
                    </h3>
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-4">
                      Semua peserta yang mendaftar akan masuk ke Virtual Waiting Room secara bersamaan.
                      Sistem memproses antrean secara fair & transparan dengan perlindungan anti-bot.
                      Bersiaplah tepat waktu!
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['Anti-bot protection', 'Fair queue system', 'Secure checkout', '10 menit bayar'].map((t, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-card border border-border text-text-secondary"
                        >
                          <Check className="w-3 h-3 text-success" /> {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <section>
              <h2 className="text-xl font-bold text-text-primary mb-4">Tentang Event</h2>
              <div className="text-sm sm:text-base text-text-secondary leading-relaxed whitespace-pre-line bg-card/60 p-6 rounded-2xl border border-border">
                {event.description}
              </div>
            </section>

            {/* Organizer */}
            {event.organizer && (
              <section>
                <h2 className="text-xl font-bold text-text-primary mb-4">Penyelenggara</h2>
                <Card variant="default" className="p-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Building className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-text-primary mb-1">
                      {event.organizer.name}
                    </div>
                    <div className="text-xs text-text-muted flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-success" />
                      Organizer Terverifikasi TIXORA
                    </div>
                  </div>
                </Card>
              </section>
            )}

            {/* Terms */}
            {event.terms_conditions && (
              <section>
                <h2 className="text-xl font-bold text-text-primary mb-4">Syarat & Ketentuan</h2>
                <div className="p-5 rounded-2xl bg-surface border border-border text-xs sm:text-sm text-text-secondary leading-relaxed flex items-start gap-3">
                  <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>{event.terms_conditions}</div>
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN — STICKY */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <Card variant="elevated" className="overflow-hidden border-border/80 shadow-2xl">
              {/* Sale Countdown Header */}
              <div
                className={`p-5 text-center border-b border-border ${
                  saleOpen ? 'bg-success/10' : 'bg-primary/10'
                }`}
              >
                {saleOpen ? (
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-success animate-ping" />
                      <span className="text-xs font-extrabold text-success tracking-wider uppercase">
                        TIKET SEDANG DIJUAL
                      </span>
                    </div>
                    {event.sale_end_at && (
                      <>
                        <p className="text-xs text-text-muted mb-2">Penjualan berakhir dalam</p>
                        <CountdownTimer targetDate={event.sale_end_at} size="sm" />
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-text-muted mb-2 font-medium">
                      {event.is_war_ticket ? 'War ticket dibuka dalam' : 'Penjualan dibuka dalam'}
                    </p>
                    <CountdownTimer
                      targetDate={event.war_ticket_open_at ?? event.sale_start_at}
                      size="sm"
                      onComplete={() => setSaleOpen(true)}
                    />
                  </div>
                )}
              </div>

              {/* Ticket Categories Content */}
              <div className="p-5 space-y-4">
                {/* Interactive Seat Map Banner Button */}
                <Link
                  href={`/events/${slug}/seats`}
                  className="p-3.5 rounded-xl bg-gradient-to-r from-primary/20 via-accent/15 to-primary/10 border border-primary/40 flex items-center justify-between gap-3 hover:border-primary transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Pilih Kursi Interaktif</div>
                      <div className="text-[11px] text-text-secondary">Pilih nomor & zona tempat duduk</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-accent group-hover:translate-x-1 transition-transform" />
                </Link>

                {cats.length > 0 ? (
                  <>
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider pt-2">
                      Atau Pilih Kategori Tiket
                    </h3>
                    <div className="ticket-categories space-y-3">
                      {cats.map((cat) => (
                        <TicketCategoryCard
                          key={cat.id}
                          cat={cat}
                          eventSaleOpen={saleOpen}
                          isWarTicket={event.is_war_ticket}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-text-muted">
                    <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Belum ada tiket yang tersedia</p>
                  </div>
                )}

                {/* Safety Badges */}
                <div className="pt-4 border-t border-border flex items-center justify-center gap-4 text-[11px] text-text-muted flex-wrap">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-success" /> Aman & Terjamin
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-success" /> E-Ticket Resmi
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-accent" /> Instan
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </PageContainer>

      {/* ─── MOBILE STICKY BUY BAR ────────────────────────── */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-border p-4 flex items-center justify-between gap-4 lg:hidden"
          >
            <div>
              <div className="text-[10px] uppercase text-text-muted font-semibold">Mulai dari</div>
              <div className="text-base font-extrabold text-primary">{formatRupiah(minPrice)}</div>
            </div>
            {event.is_war_ticket ? (
              <Link href={`/waiting-room/${event.id}`}>
                <Button variant="danger" size="sm" leftIcon={<Zap className="w-4 h-4 fill-current" />}>
                  Masuk Waiting Room
                </Button>
              </Link>
            ) : (
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() =>
                  document.querySelector('.ticket-categories')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Beli Tiket
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
