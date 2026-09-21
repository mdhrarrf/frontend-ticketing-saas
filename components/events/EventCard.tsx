'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Ticket, Zap, Users, TrendingUp, Flame } from 'lucide-react';
import type { Event } from '../../types';

interface EventCardProps {
  event: Event;
}

const CATEGORY_COLORS: Record<string, string> = {
  concert: 'var(--color-primary)', festival: 'var(--color-primary)', fan_meeting: 'var(--color-primary)',
  seminar: 'var(--color-primary)', sports: 'var(--color-primary)', exhibition: 'var(--color-primary)', default: 'var(--color-primary)',
};

const CATEGORY_LABELS: Record<string, string> = {
  concert: 'Concert', festival: 'Festival', fan_meeting: 'Fan Meeting',
  seminar: 'Seminar', sports: 'Sports', exhibition: 'Exhibition',
};

function formatRupiah(amount: number) {
  if (amount >= 1000000) return `Rp ${(amount / 1000000).toFixed(1).replace('.0', '')}jt`;
  if (amount >= 1000)    return `Rp ${(amount / 1000).toFixed(0)}rb`;
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

const PLACEHOLDER_COLORS = [
  ['#4F46E5', '#7C3AED'], ['#DB2777', '#9D174D'], ['#6366F1', '#4F46E5'],
  ['#EC4899', '#DB2777'], ['#8B5CF6', '#7C3AED'],
];

function EventBanner({ event, index }: { event: Event; index?: number }) {
  const colors = PLACEHOLDER_COLORS[(index ?? 0) % PLACEHOLDER_COLORS.length];

  if (event.banner) {
    return (
      <img
        src={event.banner}
        alt={event.title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    );
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Bokeh circles */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
      <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
      {/* Icon */}
      <Ticket size={40} color="rgba(255,255,255,0.9)" style={{ marginBottom: 12 }} />
      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        {CATEGORY_LABELS[event.category] ?? 'Event'}
      </div>
    </div>
  );
}

export function EventCard({ event, index }: EventCardProps & { index?: number }) {
  const categoryColor = CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS.default;
  const soldPercent   = event.total_capacity > 0
    ? Math.round((event.total_sold / event.total_capacity) * 100)
    : 0;
  const isAlmostSoldOut = soldPercent >= 80;

  return (
    <Link href={`/events/${event.slug}`} style={{ display: 'block', height: '100%' }}>
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.2 }}
        style={{
          borderRadius: 20, overflow: 'hidden',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          height: '100%',
          display: 'flex', flexDirection: 'column'
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = categoryColor + '50';
          (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${categoryColor}20`;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        }}
      >
        {/* Banner */}
        <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: '#1A1A24' }}>
          <EventBanner event={event} index={index} />

          {/* Gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
          }} />

          {/* Badges top-left */}
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              padding: '6px 12px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 800,
              background: 'white', color: 'var(--text-primary)',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              {CATEGORY_LABELS[event.category] ?? event.category}
            </span>

            {event.is_war_ticket && (
              <span style={{
                padding: '6px 12px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 800,
                background: 'var(--color-primary)', color: 'white',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                display: 'flex', alignItems: 'center', gap: 4
              }}>
                <Zap size={10} fill="currentColor" /> WAR
              </span>
            )}
          </div>

          {/* Almost sold out */}
          {isAlmostSoldOut && (
            <span style={{
              position: 'absolute', top: 12, right: 12,
              padding: '4px 10px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700,
              background: 'rgba(239,68,68,0.2)', color: '#FCA5A5',
              border: '1px solid rgba(239,68,68,0.3)', backdropFilter: 'blur(8px)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Flame size={12} /> Hampir Habis</div>
            </span>
          )}

          {/* Date overlay bottom */}
          <div style={{
            position: 'absolute', bottom: 12, left: 12, right: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'rgba(255,255,255,0.9)' }}>
              <Calendar size={12} />
              <span>{formatDate(event.event_date)}</span>
            </div>
            {event.total_sold > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>
                <Users size={11} />
                <span>{event.total_sold.toLocaleString('id-ID')} terjual</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Title */}
          <h3 style={{
            fontSize: '0.975rem', fontWeight: 700, lineHeight: 1.3,
            marginBottom: 10, overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            color: 'var(--text-primary)',
          }}>
            {event.title}
          </h3>

          {/* Venue */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            <MapPin size={13} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.venue_name ?? event.venue_city ?? 'TBA'}
            </span>
          </div>

          {/* Stock progress */}
          {event.total_capacity > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${isAlmostSoldOut ? 'progress-fill-danger' : ''}`}
                  style={{ width: `${soldPercent}%` }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 5 }}>
                <span>{soldPercent}% terjual</span>
                <span>{(event.total_capacity - event.total_sold).toLocaleString('id-ID')} tersisa</span>
              </div>
            </div>
          )}

          {/* Price + CTA */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <div>
              {event.min_price !== undefined && (
                <>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Mulai dari</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: categoryColor }}>
                    {formatRupiah(Number(event.min_price))}
                  </div>
                </>
              )}
            </div>
            <div style={{
              padding: '8px 16px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 700,
              background: categoryColor,
              color: 'white', transition: 'all 0.2s',
            }}>
              {event.is_war_ticket ? <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Zap size={14} fill="currentColor" /> War Ticket</div> : 'Beli Tiket'}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
