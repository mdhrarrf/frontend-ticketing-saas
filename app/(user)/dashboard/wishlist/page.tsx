'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiService } from '../../../../lib/api';
import { Heart, Calendar, MapPin, Ticket, ChevronRight, Trash2 } from 'lucide-react';
import type { Event } from '../../../../types';

function fmt(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1).replace('.0', '')}jt`;
  if (n >= 1_000)     return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toLocaleString('id-ID')}`;
}

export default function WishlistPage() {
  const [events,   setEvents]   = useState<Event[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiService.user.getWishlist();
      const raw = (res as any)?.data ?? res;
      const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      setEvents(arr);
    } catch (e) {
      console.error(e);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (event: Event) => {
    try {
      setRemoving(event.slug);
      await apiService.events.toggleWishlist(event.slug);
      setEvents(prev => prev.filter(e => e.id !== event.id));
    } catch (e) {
      console.error(e);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          Wishlist Saya
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
          Event yang sudah kamu simpan
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 180, borderRadius: 14, background: 'var(--background-2)', opacity: 0.7 }} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '56px 0', borderRadius: 14,
          background: 'var(--card)', border: '1px solid var(--border)',
        }}>
          <Heart size={36} style={{ margin: '0 auto 14px', color: 'var(--text-muted)', opacity: 0.4 }} />
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Wishlist masih kosong</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 18px' }}>
            Simpan event favoritmu agar mudah ditemukan kembali.
          </p>
          <Link href="/events" className="btn btn-primary btn-sm">Jelajahi Event</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div style={{
                borderRadius: 14, background: 'var(--card)', border: '1px solid var(--border)',
                overflow: 'hidden', transition: 'border-color 0.15s, transform 0.15s',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border-bright)'; el.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.transform = 'none'; }}
              >
                {/* Banner */}
                <div style={{ height: 120, position: 'relative', overflow: 'hidden', background: 'var(--color-primary)' }}>
                  {event.banner ? (
                    <img src={event.banner} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Ticket size={32} color="rgba(255,255,255,0.5)" />
                    </div>
                  )}
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(event)}
                    disabled={removing === event.slug}
                    title="Hapus dari wishlist"
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.5)', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'background 0.15s',
                      opacity: removing === event.slug ? 0.5 : 1,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.8)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.5)'; }}
                  >
                    <Trash2 size={14} color="white" />
                  </button>

                  {/* Category badge */}
                  {event.category && (
                    <span style={{
                      position: 'absolute', bottom: 8, left: 8,
                      padding: '2px 8px', borderRadius: 20, fontSize: '0.65rem',
                      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                      background: 'rgba(0,0,0,0.5)', color: 'white',
                    }}>
                      {event.category.replace('_', ' ')}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 8 }}>
                    {event.title}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                    {event.event_date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Calendar size={12} />
                        {new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                    {event.venue && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <MapPin size={12} style={{ flexShrink: 0 }} />
                        {typeof event.venue === 'string' ? event.venue : (event.venue as any)?.name ?? ''}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      {(event.min_price ?? 0) > 0 ? `Mulai ${fmt(event.min_price ?? 0)}` : 'Gratis'}
                    </div>
                    <Link
                      href={`/events/${event.slug}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >
                      Lihat <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
