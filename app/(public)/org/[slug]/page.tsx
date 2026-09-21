'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Building2, CheckCircle, Search, Calendar, MapPin,
  Ticket, ArrowRight, Globe, Mail, Phone, ExternalLink,
  ShieldCheck, AlertTriangle, Loader2, Sparkles
} from 'lucide-react';
import { TenantThemeProvider } from '@/components/tenant/TenantThemeProvider';
import { apiService } from '@/lib/api';
import type { TenantBranding, Event } from '@/types';

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function TenantPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const loadPortalData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError('');

    try {
      const [brandRes, eventsRes] = await Promise.all([
        apiService.tenant.getBranding(slug),
        apiService.tenant.getEvents(slug, { search: search || undefined }),
      ]);

      const brandData = (brandRes as any)?.data ?? brandRes;
      const eventsData = (eventsRes as any)?.data?.data ?? (eventsRes as any)?.data ?? [];

      setBranding(brandData);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Portal promotor tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  }, [slug, search]);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  const filteredEvents = events.filter((ev) => {
    if (selectedCategory === 'ALL') return true;
    return ev.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Loader2 size={36} className="animate-spin" style={{ color: '#6366F1' }} />
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Memuat portal resmi...</p>
      </div>
    );
  }

  if (error || !branding) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <AlertTriangle size={48} style={{ color: '#EF4444' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Portal Tidak Ditemukan</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 440, textAlign: 'center' }}>
          {error || 'Promotor ini belum mengaktifkan portal publik White-Label mereka.'}
        </p>
        <Link href="/events" className="btn btn-primary">
          Jelajahi Semua Event TIXORA
        </Link>
      </div>
    );
  }

  const primaryColor = branding.primary_color || '#6366F1';
  const secondaryColor = branding.secondary_color || '#EC4899';

  return (
    <TenantThemeProvider branding={branding}>
      <div style={{ minHeight: '100vh', paddingBottom: 100 }}>
        {/* ─── Top White-Label Brand Bar ─── */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {branding.logo ? (
              <img src={branding.logo} alt={branding.name} style={{ height: 32, objectFit: 'contain', borderRadius: 6 }} />
            ) : (
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: primaryColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800
              }}>
                {branding.name[0]}
              </div>
            )}
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white' }}>
              {branding.portal_title || branding.name}
            </span>
            {branding.is_verified && (
              <span style={{
                fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <CheckCircle size={10} />
                Verified Organizer
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
              Powered by <strong style={{ color: '#6366F1' }}>TIXORA Engine</strong>
            </span>
          </div>
        </div>

        {/* ─── Hero Branded Banner ─── */}
        <div style={{
          position: 'relative', overflow: 'hidden', padding: '70px 24px',
          background: `linear-gradient(135deg, ${primaryColor}22 0%, ${secondaryColor}15 50%, #0F172A 100%)`,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          {branding.banner && (
            <img
              src={branding.banner}
              alt={branding.name}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', opacity: 0.15, filter: 'blur(2px)',
              }}
            />
          )}

          <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 10 }}>
            {branding.portal_settings?.announcement && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 20, marginBottom: 16,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                fontSize: '0.75rem', fontWeight: 600, color: 'white',
              }}>
                <Sparkles size={12} style={{ color: primaryColor }} />
                <span>{branding.portal_settings.announcement}</span>
              </div>
            )}

            <h1 style={{
              fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900,
              color: 'white', lineHeight: 1.15, marginBottom: 12,
            }}>
              {branding.portal_title || `Portal Resmi ${branding.name}`}
            </h1>

            <p style={{
              fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', color: 'rgba(255,255,255,0.7)',
              maxWidth: 600, lineHeight: 1.6, marginBottom: 24,
            }}>
              {branding.portal_tagline || branding.description || 'Pusat tiket resmi konser, festival musik, dan acara eksklusif dengan Dynamic QR Code 30 detik.'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <div style={{
                padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)',
                fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <ShieldCheck size={16} style={{ color: '#10B981' }} />
                Garansi Tiket Asli & Anti-Calo
              </div>
              <div style={{
                padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)',
                fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Ticket size={16} style={{ color: primaryColor }} />
                Dukungan Peta Kursi Interaktif Real-Time
              </div>
            </div>
          </div>
        </div>

        {/* ─── Main Catalog Section ─── */}
        <div style={{ maxWidth: 1200, margin: '40px auto 0 auto', padding: '0 20px' }}>
          {/* Filter & Search Bar */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
            alignItems: 'center', gap: 16, marginBottom: 32,
          }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['ALL', 'concert', 'festival', 'sports', 'seminar'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '8px 16px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700,
                    cursor: 'pointer', border: '1px solid',
                    background: selectedCategory === cat ? primaryColor : 'rgba(255,255,255,0.04)',
                    borderColor: selectedCategory === cat ? primaryColor : 'rgba(255,255,255,0.1)',
                    color: selectedCategory === cat ? 'white' : 'rgba(255,255,255,0.7)',
                    textTransform: 'capitalize', transition: 'all 0.2s',
                  }}
                >
                  {cat === 'ALL' ? 'Semua Kategori' : cat}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: 280 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'rgba(255,255,255,0.4)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari event promotor..."
                style={{
                  width: '100%', padding: '8px 14px 8px 36px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'white', fontSize: '0.85rem', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Events Grid */}
          {filteredEvents.length > 0 ? (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24,
            }}>
              {filteredEvents.map((ev) => (
                <motion.div
                  key={ev.id}
                  whileHover={{ y: -6 }}
                  style={{
                    borderRadius: 18, overflow: 'hidden',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', flexDirection: 'column',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {/* Event Banner */}
                  <div style={{ height: 160, position: 'relative', background: '#1E293B', overflow: 'hidden' }}>
                    {ev.banner ? (
                      <img src={ev.banner} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ticket size={48} style={{ color: 'rgba(255,255,255,0.2)' }} />
                      </div>
                    )}
                    <span style={{
                      position: 'absolute', top: 12, right: 12,
                      fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: 12,
                      background: primaryColor, color: 'white', textTransform: 'uppercase',
                    }}>
                      {ev.category}
                    </span>
                  </div>

                  {/* Event Info */}
                  <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', marginBottom: 12, lineHeight: 1.3 }}>
                      {ev.title}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', marginBottom: 20, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={14} style={{ color: primaryColor }} />
                        <span>{new Date(ev.event_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={14} style={{ color: secondaryColor }} />
                        <span>{ev.venue?.name ?? ev.venue_name ?? 'Gelora Bung Karno'}</span>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)' }}>Mulai dari</div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#10B981' }}>
                          {formatRupiah(Number(ev.min_price || 300000))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link
                          href={`/events/${ev.slug}/seats`}
                          style={{
                            padding: '8px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700,
                            background: 'rgba(255,255,255,0.08)', color: 'white', textDecoration: 'none',
                            border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          Peta Kursi
                        </Link>
                        <Link
                          href={`/events/${ev.slug}`}
                          style={{
                            padding: '8px 14px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700,
                            background: primaryColor, color: 'white', textDecoration: 'none',
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          Beli Tiket <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.5)' }}>
              <Ticket size={40} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
              <p>Belum ada event yang sesuai dengan pencarian.</p>
            </div>
          )}
        </div>
      </div>
    </TenantThemeProvider>
  );
}
