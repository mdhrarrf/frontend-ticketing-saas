'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search, Zap, Shield, Ticket, Users, Star, ArrowRight,
  Music2, Mic2, Theater, BookOpen, Trophy, Globe, Clock,
  Flame, Tag, MapPin, ChevronRight, Play, CheckCircle2
} from 'lucide-react';
import { EventCard } from '@/components/events/EventCard';
import { CountdownTimer } from '@/components/events/CountdownTimer';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { apiService } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Event } from '@/types';

// Categories Definition
const CATEGORIES = [
  { icon: Music2,   label: 'Concert',      color: '#8B5CF6', filter: 'concert' },
  { icon: Mic2,     label: 'Fan Meeting',  color: '#EC4899', filter: 'fan_meeting' },
  { icon: Theater,  label: 'Festival',     color: '#F59E0B', filter: 'festival' },
  { icon: BookOpen, label: 'Seminar',      color: '#10B981', filter: 'seminar' },
  { icon: Trophy,   label: 'Sports',       color: '#3B82F6', filter: 'sports' },
  { icon: Globe,    label: 'Exhibition',   color: '#06B6D4', filter: 'exhibition' },
];

// Steps Definition
const STEPS = [
  {
    num: '01',
    icon: Search,
    title: 'Temukan Event',
    desc: 'Cari konser & event favorit kamu dari ribuan pilihan event terverifikasi.'
  },
  {
    num: '02',
    icon: Users,
    title: 'Antri Virtual',
    desc: 'Masuk waiting room fair & transparan berteknologi antrian anti-bot.'
  },
  {
    num: '03',
    icon: Shield,
    title: 'Bayar Aman',
    desc: 'Pembayaran instan terenkripsi via QRIS, Virtual Account, & E-Wallet.'
  },
  {
    num: '04',
    icon: Ticket,
    title: 'Nikmati Konser!',
    desc: 'Tiket digital QR dinamis aman siap pakai di gate venue konser.'
  },
];

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [warTickets, setWarTickets] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiService.events.getEvents({ per_page: 6 });
        const all: Event[] = (res.data as any)?.data ?? (res as any)?.data ?? [];
        setEvents(all);
        setWarTickets(all.filter((e) => e.is_war_ticket));
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      window.location.assign(`/events?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <main className="min-h-screen bg-background text-text-primary overflow-x-hidden">
      {/* ═══════════════════════════════════════════════════════
          1. HERO SECTION
      ═══════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-16 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

        <PageContainer size="lg" className="relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-3xl mx-auto"
          >
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <Zap size={14} className="fill-primary" />
              Platform War Tiket Konser #1 Indonesia
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] mb-6 text-text-primary">
              Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary">Tiket Konser</span> Terbaik
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              Beli tiket konser, festival musik, dan fan meeting impianmu. Sistem antrian virtual yang fair, aman, dan berkapasitas tinggi.
            </p>

            {/* Search Bar */}
            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 max-w-xl mx-auto p-2 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-xl shadow-black/30 mb-8"
            >
              <div className="flex-1 flex items-center gap-3 pl-3">
                <Search size={18} className="text-text-muted shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari konser, artis, atau venue..."
                  className="w-full bg-transparent border-none outline-hidden text-sm text-text-primary placeholder:text-text-muted font-medium"
                />
              </div>
              <Button type="submit" variant="primary" size="md" className="rounded-xl px-5">
                Cari
              </Button>
            </motion.form>
          </motion.div>
        </PageContainer>
      </section>

      {/* ═══════════════════════════════════════════════════════
          2. WAR TICKET SECTION
      ═══════════════════════════════════════════════════════ */}
      {warTickets.length > 0 && (
        <section className="py-16 border-y border-border/70 bg-card/30">
          <PageContainer size="lg">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-xs">
                  <Zap size={22} className="fill-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary">
                      War Ticket
                    </h2>
                    <Badge variant="danger" size="sm" className="animate-pulse">
                      LIVE
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                    Event dengan sistem antrian virtual & kuota real-time
                  </p>
                </div>
              </div>

              <Link href="/events?war_ticket=true">
                <Button variant="outline" size="sm">
                  Lihat Semua <ArrowRight size={14} className="ml-1.5" />
                </Button>
              </Link>
            </div>

            {/* War Ticket Cards */}
            <div className="space-y-3 sm:space-y-4">
              {warTickets.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link href={`/events/${event.slug}`} className="block group">
                    <Card
                      variant="interactive"
                      className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-l-4 border-l-primary group-hover:border-primary/80 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-xl font-bold text-text-primary group-hover:text-primary transition-colors truncate mb-1">
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                          <span className="flex items-center gap-1.5">
                            <MapPin size={13} /> {event.venue_name ?? 'Venue Segera Diumumkan'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <Clock size={13} /> {event.event_date ? formatDate(event.event_date) : '-'}
                          </span>
                        </div>
                      </div>

                      {event.war_ticket_open_at && new Date(event.war_ticket_open_at) > new Date() && (
                        <div className="text-left sm:text-right shrink-0">
                          <div className="text-[10px] uppercase font-bold text-text-muted tracking-wider mb-1">
                            Dibuka Dalam
                          </div>
                          <CountdownTimer targetDate={event.war_ticket_open_at} size="sm" />
                        </div>
                      )}

                      <div className="hidden sm:flex w-9 h-9 rounded-xl bg-surface border border-border items-center justify-center text-text-muted group-hover:text-text-primary group-hover:bg-primary/20 transition-all shrink-0">
                        <ChevronRight size={18} />
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </PageContainer>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          3. FEATURED EVENTS (EVENT TERPOPULER)
      ═══════════════════════════════════════════════════════ */}
      <section className="py-16">
        <PageContainer size="lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary flex items-center gap-2">
                <Flame className="text-orange-500 fill-orange-500" size={24} />
                Event Terpopuler
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                Konser dan festival yang paling banyak dinantikan
              </p>
            </div>
            <Link href="/events">
              <Button variant="outline" size="sm">
                Lihat Semua Event <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                  <Skeleton className="w-full aspect-video rounded-xl" />
                  <Skeleton className="h-5 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-1/2 rounded-md" />
                </div>
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="h-full"
                >
                  <EventCard event={event} index={i} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card border border-border rounded-2xl">
              <Ticket size={48} className="mx-auto mb-3 text-text-muted opacity-30" />
              <p className="text-sm text-text-muted">Belum ada event tersedia saat ini.</p>
            </div>
          )}
        </PageContainer>
      </section>

      {/* ═══════════════════════════════════════════════════════
          4. CATEGORIES
      ═══════════════════════════════════════════════════════ */}
      <section className="py-12 border-t border-border/70 bg-card/20">
        <PageContainer size="lg">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-text-primary flex items-center gap-2">
              <Tag size={20} className="text-primary" />
              Kategori Event
            </h2>
            <p className="text-xs text-text-muted mt-0.5">Temukan event sesuai preferensi dan minatmu</p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {CATEGORIES.map(({ icon: Icon, label, filter }) => (
              <Link key={filter} href={`/events?category=${filter}`}>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border hover:border-primary/50 hover:bg-primary/10 text-text-secondary hover:text-primary transition-all text-xs font-semibold cursor-pointer shadow-2xs">
                  <Icon size={14} />
                  <span>{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* ═══════════════════════════════════════════════════════
          5. HOW IT WORKS
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20 border-t border-border bg-card/40">
        <PageContainer size="lg">
          <div className="text-center max-w-xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary mb-2">
              Cara Kerja TIXORA
            </h2>
            <p className="text-xs sm:text-sm text-text-muted">
              4 langkah mudah untuk mendapatkan tiket event konser impianmu
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(({ num, icon: Icon, title, desc }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 h-full flex flex-col justify-between relative overflow-hidden group hover:border-primary/50 transition-colors">
                  <div className="absolute top-2 right-4 text-5xl font-black text-white/5 select-none pointer-events-none">
                    {num}
                  </div>

                  <div>
                    <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-4">
                      <Icon size={22} />
                    </div>
                    <div className="text-[10px] font-black text-primary tracking-widest uppercase mb-1">
                      LANGKAH {num}
                    </div>
                    <h3 className="text-base font-bold text-text-primary mb-2">
                      {title}
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* ═══════════════════════════════════════════════════════
          6. WHY US (KENAPA TIXORA)
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20 border-t border-border">
        <PageContainer size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <Badge variant="primary" size="sm">
                Kenapa TIXORA?
              </Badge>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight leading-tight">
                Platform Ticketing <span className="text-primary">Paling Terpercaya</span>
              </h2>

              <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                Kami menghadirkan teknologi anti-bot mutakhir, sistem antrian yang fair, dan pengalaman pembelian tiket yang seamless bagi jutaan pecinta konser di Indonesia.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  'Sistem proteksi anti-bot & verifikasi fingerprint perangkat',
                  'Virtual waiting room yang transparan dengan estimasi posisi real-time',
                  'Proses checkout super cepat di bawah 10 menit dengan multi-gateway',
                  'Fitur cashless FestPay & QR tiket dinamis anti-screenshot palsu',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-text-secondary">{text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Link href="/register">
                  <Button variant="primary" size="md">
                    Daftar Akun Gratis <ArrowRight size={16} className="ml-1.5" />
                  </Button>
                </Link>
                <Link href="/events">
                  <Button variant="outline" size="md">
                    Jelajahi Event
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right KPI Stats */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              {[
                { label: '1M+', sub: 'Tiket Terjual', icon: Ticket, color: 'text-primary' },
                { label: '500+', sub: 'Event Berhasil', icon: Star, color: 'text-secondary' },
                { label: '99.9%', sub: 'Uptime SLA', icon: Shield, color: 'text-success' },
                { label: '< 3s', sub: 'Response Time', icon: Clock, color: 'text-warning' },
              ].map(({ label, sub, icon: Icon, color }, i) => (
                <Card key={i} className="p-6 text-center hover:border-primary/40 transition-colors">
                  <Icon size={24} className={`${color} mx-auto mb-2.5`} />
                  <div className="text-2xl sm:text-3xl font-black text-text-primary mb-1">
                    {label}
                  </div>
                  <div className="text-xs text-text-muted font-medium">
                    {sub}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ═══════════════════════════════════════════════════════
          7. CTA SECTION
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20 border-t border-border">
        <PageContainer size="lg">
          <div className="rounded-3xl p-8 sm:p-14 text-center bg-gradient-to-r from-primary via-purple-700 to-secondary text-white shadow-2xl relative overflow-hidden">
            {/* Background Blur Rings */}
            <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 max-w-xl mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/20">
                <Ticket size={24} />
              </div>

              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                Siap War Tiket Konsermu?
              </h2>

              <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-md mx-auto mb-6">
                Bergabung dengan lebih dari 1 juta pengguna yang mempercayakan pembelian tiket konser favorit ke TIXORA.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link href="/register">
                  <button className="px-6 py-3 rounded-xl bg-white text-primary font-extrabold text-sm hover:bg-white/90 transition-all shadow-lg cursor-pointer">
                    Daftar Gratis Sekarang <ArrowRight size={16} className="inline ml-1" />
                  </button>
                </Link>
                <Link href="/events">
                  <button className="px-6 py-3 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-extrabold text-sm transition-all cursor-pointer">
                    Lihat Events <Play size={15} className="inline ml-1" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>
    </main>
  );
}
