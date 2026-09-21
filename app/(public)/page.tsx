'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Search, Zap, Shield, Ticket, Users, Star, ArrowRight,
  Music2, Mic2, Theater, BookOpen, Trophy, Heart, ChevronRight,
  Play, TrendingUp, Globe, Clock, Flame, Tag, MapPin,
  LayoutDashboard, ShieldCheck, BarChart3,
} from 'lucide-react';
import { EventCard } from '../../components/events/EventCard';
import { CountdownTimer } from '../../components/events/CountdownTimer';
import { apiService } from '../../lib/api';
import type { Event } from '../../types';

// ─── Stat Counter ────────────────────────────────────────────
function StatCounter({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = end / (duration / 16);
    const id = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(id); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [end]);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1, color: 'var(--color-primary)' }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ─── Category Card ────────────────────────────────────────────
const CATEGORIES = [
  { icon: Music2,   label: 'Concert',      color: '#6366F1', filter: 'concert' },
  { icon: Mic2,     label: 'Fan Meeting',  color: '#EC4899', filter: 'fan_meeting' },
  { icon: Theater,  label: 'Festival',     color: '#F59E0B', filter: 'festival' },
  { icon: BookOpen, label: 'Seminar',      color: '#10B981', filter: 'seminar' },
  { icon: Trophy,   label: 'Sports',       color: '#3B82F6', filter: 'sports' },
  { icon: Globe,    label: 'Exhibition',   color: '#8B5CF6', filter: 'exhibition' },
];

// ─── Steps ────────────────────────────────────────────────────
const STEPS = [
  { num: '01', icon: Search, title: 'Temukan Event', desc: 'Cari konser & event favorit kamu dari ribuan pilihan event terbaik.' },
  { num: '02', icon: Users,  title: 'Antri Virtual', desc: 'Masuk waiting room kami yang fair & transparan. Sistem war ticket anti-bot.' },
  { num: '03', icon: Shield, title: 'Bayar Aman',    desc: 'Pembayaran terenkripsi via QRIS, VA, e-wallet. Multi-gateway payment.' },
  { num: '04', icon: Ticket, title: 'Nikmati!',      desc: 'Tiket digital dengan QR code unik dikirim langsung ke email & akun kamu.' },
];

// ─── Page ─────────────────────────────────────────────────────
export default function HomePage() {
  const [events, setEvents]         = useState<Event[]>([]);
  const [warTickets, setWarTickets] = useState<Event[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');

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

  return (
    <main style={{ background: 'var(--background)' }}>

      {/* ═══════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════ */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          paddingTop: 80,
        }}
        className="gradient-hero"
      >


        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto', paddingTop: 40 }}
          >
            <h1 style={{ marginBottom: 20, fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: 900, lineHeight: 1.1, color: 'var(--text-primary)' }}>
              Platform{' '}
              <span style={{ color: 'var(--color-primary)' }}>Tiket Konser</span>{' '}
              Terbaik
            </h1>

            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
              Beli tiket konser, festival & fan meeting impianmu. Sistem antrian yang fair, aman, dan anti-bot.
            </p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                display: 'flex',
                gap: 12,
                maxWidth: 560,
                margin: '0 auto 48px',
                background: 'var(--card)',
                border: '1px solid var(--border-bright)',
                borderRadius: 16,
                padding: 8,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16 }}>
                <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && window.location.assign(`/events?q=${search}`)}
                  placeholder="Cari konser, artis, atau venue..."
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: 'var(--text-primary)', fontSize: '0.95rem', width: '100%',
                  }}
                />
              </div>
              <Link href={`/events${search ? `?q=${search}` : ''}`} className="btn btn-primary btn-sm" style={{ borderRadius: 10, padding: '10px 20px' }}>
                Cari
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ delay: 1.5, repeat: Infinity, duration: 2 }}
          style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scroll</div>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, var(--text-muted), transparent)' }} />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          WAR TICKET SECTION
      ═══════════════════════════════════════════════════════ */}
      {warTickets.length > 0 && (
        <section className="section" style={{ position: 'relative', overflow: 'hidden' }}>
          {/* Background - Removed gradient tint for a cleaner look */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'transparent',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
          }} />

          <div className="container" style={{ position: 'relative' }}>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
                }}>
                  <Zap size={22} color="white" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)', fontWeight: 800 }}>War Ticket</h2>
                    <span className="badge" style={{ background: 'var(--danger)', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 20 }}>LIVE</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Event dengan sistem antrian virtual</p>
                </div>
              </div>
              <Link href="/events?war_ticket=true" className="btn btn-secondary btn-sm" style={{ fontWeight: 600 }}>
                Lihat Semua <ArrowRight size={14} />
              </Link>
            </motion.div>

            {/* War Ticket Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {warTickets.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={`/events/${event.slug}`}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 24,
                      padding: '24px',
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderLeft: '4px solid var(--color-primary)',
                      borderRadius: 16,
                      boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    onMouseEnter={e => { 
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; 
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(99,102,241,0.1)'; 
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)'; 
                    }}
                    onMouseLeave={e => { 
                      (e.currentTarget as HTMLElement).style.transform = 'none'; 
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.04)'; 
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; 
                    }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: 8, color: 'var(--text-primary)' }}>{event.title}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <MapPin size={14} style={{display:'inline'}}/> {event.venue_name} · <Clock size={14} style={{display:'inline'}}/> {new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                      {event.war_ticket_open_at && new Date(event.war_ticket_open_at) > new Date() && (
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Dibuka dalam
                          </div>
                          <CountdownTimer targetDate={event.war_ticket_open_at} size="sm" />
                        </div>
                      )}
                      <div style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
                        <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          FEATURED EVENTS
      ═══════════════════════════════════════════════════════ */}
      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}
          >
            <div>
              <h2 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}><Flame className="text-orange-500" /> Event Terpopuler</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>Event yang paling ditunggu-tunggu</p>
            </div>
            <Link href="/events" className="btn btn-secondary btn-sm">
              Lihat Semua Event <ArrowRight size={14} />
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid-events">
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ borderRadius: 16, overflow: 'hidden' }}>
                  <div className="skeleton" style={{ height: 200, marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 20, width: '80%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 16, width: '60%' }} />
                </div>
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="grid-events">
              {events.map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  style={{ height: '100%' }}
                >
                  <EventCard event={event} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
              <Ticket size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p>Belum ada event tersedia. Pantau terus!</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CATEGORIES
      ═══════════════════════════════════════════════════════ */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ marginBottom: 32 }}
          >
            <h2 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}><Tag className="text-indigo-400" /> Kategori Event</h2>
            <p style={{ color: 'var(--text-muted)' }}>Temukan event sesuai minatmu</p>
          </motion.div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {CATEGORIES.map(({ icon: Icon, label, color, filter }, i) => (
              <motion.div
                key={filter}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Link href={`/events?category=${filter}`}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 20px', borderRadius: 50,
                    background: `${color}14`,
                    border: `1px solid ${color}30`,
                    cursor: 'pointer', transition: 'all 0.2s',
                    fontWeight: 600, fontSize: '0.9rem',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}25`; (e.currentTarget as HTMLElement).style.borderColor = `${color}60`; (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${color}14`; (e.currentTarget as HTMLElement).style.borderColor = `${color}30`; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                  >
                    <Icon size={16} style={{ color }} />
                    <span style={{ color }}>{label}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════ */}
      <section className="section" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(236,72,153,0.03) 100%)',
        borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
      }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 64 }}
          >
            <h2 style={{ marginBottom: 12 }}>Cara Kerja TIXORA</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto' }}>
              4 langkah mudah untuk mendapatkan tiket event impianmu
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {STEPS.map(({ num, icon: Icon, title, desc }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                style={{
                  padding: 28, borderRadius: 20,
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {/* Step number BG */}
                <div style={{
                  position: 'absolute', top: -20, right: -10,
                  fontSize: '6rem', fontWeight: 900, opacity: 0.04,
                  color: 'white', lineHeight: 1, userSelect: 'none',
                }}>
                  {num}
                </div>
                {/* Icon */}
                <div style={{
                  width: 52, height: 52, borderRadius: 14, marginBottom: 20,
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(236,72,153,0.2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}>
                  <Icon size={24} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>
                  STEP {num}
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          WHY US
      ═══════════════════════════════════════════════════════ */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="badge badge-primary" style={{ marginBottom: 20 }}>Kenapa TIXORA?</span>
              <h2 style={{ marginBottom: 20 }}>
                Platform Ticketing <span style={{ color: 'var(--color-primary)' }}>Paling Terpercaya</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.8 }}>
                Kami menghadirkan teknologi anti-bot, sistem antrian yang fair, dan pengalaman pembelian tiket yang seamless untuk jutaan pecinta konser Indonesia.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { icon: Shield,      text: 'Anti-bot protection & device fingerprinting', color: '#6366F1' },
                  { icon: Users,       text: 'Virtual waiting room yang fair & transparan',  color: '#EC4899' },
                  { icon: Zap,         text: 'Proses checkout super cepat < 10 menit',       color: '#F59E0B' },
                  { icon: TrendingUp,  text: 'Real-time analytics untuk organizer',          color: '#10B981' },
                ].map(({ icon: Icon, text, color }, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: `${color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={16} style={{ color }} />
                    </div>
                    <span style={{ fontSize: '0.925rem', color: 'var(--text-secondary)' }}>{text}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 40, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/register" className="btn btn-primary">
                  Daftar Gratis <ArrowRight size={16} />
                </Link>
                <Link href="/events" className="btn btn-secondary">
                  Jelajahi Event
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            >
              {[
                { label: '1M+',  sub: 'Tiket Terjual',   color: '#6366F1', icon: Ticket },
                { label: '500+', sub: 'Event Sukses',     color: '#EC4899', icon: Star },
                { label: '99%',  sub: 'Uptime SLA',       color: '#10B981', icon: Shield },
                { label: '< 3s', sub: 'Response Time',    color: '#F59E0B', icon: Clock },
              ].map(({ label, sub, color, icon: Icon }, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.04, y: -4 }}
                  style={{
                    padding: 28, borderRadius: 20,
                    background: `linear-gradient(135deg, ${color}0F, ${color}06)`,
                    border: `1px solid ${color}25`,
                    textAlign: 'center',
                  }}
                >
                  <Icon size={28} style={{ color, margin: '0 auto 12px' }} />
                  <div style={{ fontSize: '2rem', fontWeight: 900, color }}>{label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════════════════════ */}
      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
              borderRadius: 32, overflow: 'hidden', position: 'relative',
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED, #DB2777)',
              padding: 'clamp(40px, 8vw, 80px)',
              textAlign: 'center',
            }}
          >
            {/* Bokeh */}
            <div style={{ position: 'absolute', top: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', bottom: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', filter: 'blur(30px)' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><Ticket size={48} /></div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', marginBottom: 16, color: 'white' }}>
                Siap War Tiket Konsermu?
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 480, margin: '0 auto 40px', fontSize: '1.1rem' }}>
                Bergabung dengan lebih dari 1 juta pengguna yang sudah mempercayakan pembelian tiket konser ke TIXORA.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/register" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '16px 32px', borderRadius: 12,
                  background: 'white', color: '#4F46E5',
                  fontWeight: 700, fontSize: '1rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                >
                  Daftar Gratis Sekarang <ArrowRight size={18} />
                </Link>
                <Link href="/events" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '16px 32px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.12)', color: 'white',
                  fontWeight: 700, fontSize: '1rem', border: '1px solid rgba(255,255,255,0.2)',
                  transition: 'all 0.2s',
                }}>
                  Lihat Events <Play size={18} />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
