'use client';

import { useEffect, useState, use } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, MapPin, Clock, Users, Ticket, Zap, Shield,
  Share2, Heart, ChevronDown, ChevronUp, ArrowRight,
  AlertTriangle, CheckCircle, Info, Building, Check
} from 'lucide-react';
import { CountdownTimer } from '../../../../components/events/CountdownTimer';
import { apiService } from '../../../../lib/api';
import type { Event, TicketCategory } from '../../../../types';

const CATEGORY_COLORS: Record<string, string> = {
  concert: 'var(--color-primary)', festival: 'var(--color-primary)', fan_meeting: 'var(--color-primary)',
  seminar: 'var(--color-primary)', sports: 'var(--color-primary)', default: 'var(--color-primary)',
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Category Ticket Card ─────────────────────────────────────
function TicketCategoryCard({ cat, eventSaleOpen, isWarTicket, onSelect }: {
  cat: TicketCategory;
  eventSaleOpen: boolean;
  isWarTicket: boolean;
  onSelect: (cat: TicketCategory) => void;
}) {
  const available     = (cat.quota ?? 0) - (cat.sold ?? 0) - (cat.reserved ?? 0);
  const soldPercent   = cat.quota > 0 ? ((cat.sold + cat.reserved) / cat.quota) * 100 : 0;
  // Only show SOLD OUT when sale is actually open but stock is 0
  const isSoldOut     = eventSaleOpen && available <= 0;
  const isAlmostGone  = eventSaleOpen && soldPercent >= 75 && !isSoldOut;
  const isNotOpenYet  = !eventSaleOpen;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: 20, borderRadius: 16,
        background: 'var(--card)',
        border: `1px solid ${
          isNotOpenYet ? 'var(--border)'
          : isSoldOut  ? 'rgba(239,68,68,0.2)'
          : (cat.color ?? '#6366F1') + '30'
        }`,
        opacity: isSoldOut ? 0.55 : 1,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Color accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: isNotOpenYet ? 'var(--border)' : (cat.color ?? 'var(--color-primary)') }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: isNotOpenYet ? 'var(--text-muted)' : 'var(--text-primary)' }}>{cat.name}</h3>
            {isAlmostGone && (
              <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)', fontWeight: 700 }}>
                HAMPIR HABIS
              </span>
            )}
            {isSoldOut && (
              <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 20, background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: 700 }}>
                SOLD OUT
              </span>
            )}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: isNotOpenYet ? 'var(--text-muted)' : (cat.color ?? 'var(--color-primary)') }}>
            {formatRupiah(Number(cat.price))}
          </div>
          {cat.service_fee && Number(cat.service_fee) > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              + biaya layanan {formatRupiah(Number(cat.service_fee))}
            </div>
          )}
        </div>

        {/* Action button — only show when sale is open and NOT sold out */}
        {!isNotOpenYet && !isSoldOut && (
          <button
            onClick={() => onSelect(cat)}
            style={{
              padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem',
              background: isWarTicket ? '#EF4444' : (cat.color ?? 'var(--color-primary)'),
              color: 'white', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 0.2s', flexShrink: 0,
            }}
          >
            {isWarTicket ? <><Zap size={14} style={{ display: 'inline', marginRight: 4 }}/>War</> : 'Pilih'}
          </button>
        )}
      </div>

      {/* Progress bar — only show when sale is open */}
      {eventSaleOpen && (
        <div style={{ marginBottom: 10 }}>
          <div className="progress-bar">
            <div
              className={`progress-fill ${isAlmostGone ? 'progress-fill-danger' : ''}`}
              style={{ width: `${soldPercent}%` }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
            <span>{Math.round(soldPercent)}% terjual</span>
            <span>{available > 0 ? `${available.toLocaleString('id-ID')} tersisa` : 'Habis'}</span>
          </div>
        </div>
      )}

      {/* "Not yet open" state label */}
      {isNotOpenYet && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500,
          padding: '8px 12px', borderRadius: 8, background: 'var(--background)',
          border: '1px solid var(--border)', marginBottom: 10,
        }}>
          <Clock size={13} />
          Penjualan belum dibuka
        </div>
      )}

      {/* Benefits */}
      {cat.benefits && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(Array.isArray(cat.benefits) ? cat.benefits : []).map((b: string, i: number) => (
            <span key={i} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
              <Check size={12} style={{ display: 'inline', marginRight: 4, color: 'var(--success)' }} /> {b}
            </span>
          ))}
        </div>
      )}

      {/* Max per user */}
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 10 }}>
        Max {cat.max_per_user} tiket per orang
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────

export default function EventDetailPage() {
  const params               = useParams();
  const slug                 = params?.slug as string;
  const [event, setEvent]    = useState<Event | null>(null);
  const [cats, setCats]      = useState<TicketCategory[]>([]);
  const [loading, setLoading]= useState(true);
  const [saleOpen, setSaleOpen] = useState(false);
  const [openFaq, setOpenFaq]   = useState<number | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [evRes, catRes] = await Promise.all([
          apiService.events.getEvent(slug),
          apiService.events.getEventCategories(slug),
        ]);
        const ev  = (evRes as any)?.data ?? evRes;
        const cs  = (catRes as any)?.data ?? catRes ?? [];
        setEvent(ev);
        setCats(Array.isArray(cs) ? cs : []);
        setSaleOpen(new Date(ev.sale_start_at) <= new Date() && new Date(ev.sale_end_at) >= new Date());
      } catch { /* ignore */ }
      finally { setLoading(false); }
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--border-bright)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite' }} />
          <p style={{ color: 'var(--text-muted)' }}>Memuat event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <AlertTriangle size={48} style={{ color: 'var(--danger)', opacity: 0.6 }} />
        <h2>Event tidak ditemukan</h2>
        <Link href="/events" className="btn btn-primary">Kembali ke Events</Link>
      </div>
    );
  }

  const categoryColor = CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.default;
  const minPrice      = cats.length > 0 ? Math.min(...cats.map(c => Number(c.price))) : Number(event.min_price ?? 0);
  const hasSaleStarted = new Date(event.sale_start_at) <= new Date();

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 100 }}>

      {/* ─── HERO BANNER ─────────────────────────────────── */}
      <div style={{ position: 'relative', minHeight: 460, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden', paddingBottom: 40, paddingTop: 120 }}>
        {event.banner ? (
          <img src={event.banner} alt={event.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            backgroundColor: '#0F172A',
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Ticket size={160} style={{ color: 'white', opacity: 0.03, transform: 'rotate(-10deg)' }} />
          </div>
        )}
        {/* Overlay gradient so text is readable */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />

        {/* Content inside Banner */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }} className="container">
          <div style={{ flex: 1, color: 'white' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span style={{
                padding: '6px 14px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800,
                background: categoryColor, color: 'white', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {event.category}
              </span>
              {event.is_war_ticket && (
                <span style={{ background: '#EF4444', color: 'white', padding: '6px 14px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800 }}>
                  <Zap size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} /> WAR TICKET
                </span>
              )}
            </div>
            
            <h1 style={{ color: 'white', fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: 16, lineHeight: 1.1, fontWeight: 900, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              {event.title}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, fontSize: '0.95rem', opacity: 0.9, fontWeight: 500 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={18} />
                  {formatDate(event.event_date)}
                </div>
                {event.event_time && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={18} />
                    {event.event_time.slice(0, 5)} WIB
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={18} />
                  {event.venue_name ?? 'TBA'}{event.venue_city ? `, ${event.venue_city}` : ''}
                </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, paddingBottom: 8 }}>
              <button
                onClick={() => setWishlisted(!wishlisted)}
                style={{
                  width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <Heart size={20} style={{ color: wishlisted ? '#EF4444' : 'white', fill: wishlisted ? '#EF4444' : 'none' }} />
              </button>
              <button
                onClick={() => navigator.share?.({ title: event.title, url: window.location.href })}
                style={{
                  width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <Share2 size={20} color="white" />
              </button>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─────────────────────────────────── */}
      <div className="container" style={{ marginTop: 40, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40, alignItems: 'flex-start' }}>

          {/* LEFT COLUMN */}
          <div>

            {/* War Ticket Banner */}
            {event.is_war_ticket && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: 24, borderRadius: 16, marginBottom: 40,
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Zap size={24} color="white" />
                  </div>
                  <div>
                    <h3 style={{ marginBottom: 8, color: '#DC2626', fontSize: '1.15rem', fontWeight: 800 }}>Ini adalah War Ticket Event!</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                      Semua peserta yang mendaftar akan masuk ke <strong>Virtual Waiting Room</strong> secara bersamaan.
                      Sistem kami memproses antrian secara fair & transparan, dengan perlindungan anti-bot.
                      Bersiaplah tepat waktu!
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
                      {['Anti-bot protection', 'Fair queue system', 'Secure checkout', '10 menit untuk bayar'].map((t, i) => (
                        <span key={i} style={{ fontSize: '0.75rem', fontWeight: 600, padding: '6px 12px', borderRadius: 20, background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}><Check size={12} style={{ display: 'inline', marginRight: 4 }} /> {t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Description */}
            <section style={{ marginBottom: 40 }}>
              <h2 style={{ marginBottom: 16, fontSize: '1.3rem' }}>Tentang Event</h2>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
                {event.description}
              </div>
            </section>

            {/* Organizer */}
            {event.organizer && (
              <section style={{ marginBottom: 40 }}>
                <h2 style={{ marginBottom: 16, fontSize: '1.3rem' }}>Penyelenggara</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: `${categoryColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Building size={24} style={{ color: categoryColor }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{event.organizer.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={12} style={{ color: 'var(--success)' }} />
                      Organizer Terverifikasi
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Terms */}
            {event.terms_conditions && (
              <section style={{ marginBottom: 40 }}>
                <h2 style={{ marginBottom: 16, fontSize: '1.3rem' }}>Syarat & Ketentuan</h2>
                <div style={{ padding: 20, borderRadius: 16, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                  <Info size={14} style={{ color: 'var(--color-primary)', display: 'inline', marginRight: 6 }} />
                  {event.terms_conditions}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN — STICKY */}
          <div style={{ position: 'sticky', top: 100 }}>
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              style={{ borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border)' }}
            >
              {/* Sale countdown / status header */}
              <div style={{
                padding: 24,
                background: saleOpen ? 'rgba(16, 185, 129, 0.05)' : 'rgba(99, 102, 241, 0.05)',
                borderBottom: '1px solid var(--border)',
                textAlign: 'center',
              }}>
                {saleOpen ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                      <div className="animate-pulse-slow" style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)' }} />
                      <span style={{ fontWeight: 700, color: 'var(--success)' }}>TIKET SEDANG DIJUAL</span>
                    </div>
                    {event.sale_end_at && (
                      <>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>Penjualan berakhir dalam</p>
                        <CountdownTimer targetDate={event.sale_end_at} size="sm" />
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
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

              {/* Ticket categories */}
              <div style={{ padding: 20, background: 'var(--card)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Interactive Seat Map Banner Button */}
                <Link
                  href={`/events/${slug}/seats`}
                  style={{
                    padding: '12px 16px', borderRadius: 12,
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(236,72,153,0.15) 100%)',
                    border: '1px solid rgba(99,102,241,0.4)', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    transition: 'all 0.2s', marginBottom: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <Ticket size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'white' }}>Pilih Kursi Interaktif</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>Pilih nomor & zona tempat duduk</div>
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ color: '#6366F1' }} />
                </Link>

                {cats.length > 0 ? (
                  <>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Atau Pilih Kategori Tiket
                    </h3>
                    {cats.map((cat) => (
                      <TicketCategoryCard
                        key={cat.id}
                        cat={cat}
                        eventSaleOpen={saleOpen}
                        isWarTicket={event.is_war_ticket}
                        onSelect={handleSelect}
                      />
                    ))}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                    <Ticket size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                    <p style={{ fontSize: '0.875rem' }}>Belum ada tiket tersedia</p>
                  </div>
                )}

                {/* Safety badges */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}>
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[
                      { icon: Shield, text: 'Aman & Terjamin' },
                      { icon: CheckCircle, text: 'E-Ticket Resmi' },
                      { icon: Zap, text: 'Instan' },
                    ].map(({ icon: Icon, text }, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <Icon size={12} style={{ color: 'var(--success)' }} />
                        {text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ─── MOBILE STICKY BUY BAR ────────────────────────── */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
              background: 'rgba(13,13,22,0.95)', backdropFilter: 'blur(16px)',
              borderTop: '1px solid var(--border)', padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mulai dari</div>
              <div style={{ fontWeight: 900, fontSize: '1.2rem', color: categoryColor }}>
                {formatRupiah(minPrice)}
              </div>
            </div>
            {event.is_war_ticket ? (
              <Link href={`/waiting-room/${event.id}`} className="btn btn-primary">
                <Zap size={16} /> Masuk Waiting Room
              </Link>
            ) : (
              <button className="btn btn-primary" onClick={() => document.querySelector('.ticket-categories')?.scrollIntoView({ behavior: 'smooth' })}>
                Beli Tiket <ArrowRight size={16} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
