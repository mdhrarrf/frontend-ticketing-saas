'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Palette, Globe, Image, Sparkles, Check,
  ExternalLink, Save, Loader2, AlertCircle, RefreshCw, Eye, Ticket
} from 'lucide-react';
import { apiService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { TenantBranding } from '@/types';

const COLOR_PRESETS = [
  { name: 'TIXORA Indigo',   primary: '#6366F1', secondary: '#EC4899', accent: '#10B981' },
  { name: 'Cyber Neon',      primary: '#06B6D4', secondary: '#8B5CF6', accent: '#F43F5E' },
  { name: 'Royal Gold',      primary: '#F59E0B', secondary: '#D97706', accent: '#10B981' },
  { name: 'Sunset Crimson',  primary: '#EF4444', secondary: '#F97316', accent: '#3B82F6' },
  { name: 'Emerald VIP',     primary: '#10B981', secondary: '#059669', accent: '#F59E0B' },
  { name: 'Midnight Violet', primary: '#8B5CF6', secondary: '#3B82F6', accent: '#EC4899' },
];

export default function OrganizerBrandingPage() {
  const { user } = useAuthStore();

  const [branding, setBranding] = useState<TenantBranding>({
    id: '',
    name: '',
    slug: '',
    custom_domain: '',
    logo: '',
    banner: '',
    favicon: '',
    primary_color: '#6366F1',
    secondary_color: '#EC4899',
    accent_color: '#10B981',
    portal_title: '',
    portal_tagline: '',
    portal_settings: {
      hero_headline: '',
      announcement: '',
      contact_email: '',
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  const loadOrganizerBranding = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiService.organizer.getProfile();
      const org = (res as any)?.data ?? res;

      if (org) {
        setBranding({
          id: org.id || '',
          name: org.name || '',
          slug: org.slug || '',
          custom_domain: org.custom_domain || '',
          logo: org.logo || '',
          banner: org.banner || '',
          favicon: org.favicon || '',
          primary_color: org.primary_color || '#6366F1',
          secondary_color: org.secondary_color || '#EC4899',
          accent_color: org.accent_color || '#10B981',
          portal_title: org.portal_title || org.name || '',
          portal_tagline: org.portal_tagline || org.description || '',
          portal_settings: org.portal_settings || {
            announcement: 'Dapatkan E-Ticket Resmi dengan Dynamic QR & Perlindungan Anti-Calo.',
          },
        });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat pengaturan branding.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrganizerBranding();
  }, [loadOrganizerBranding]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      const res = await apiService.tenant.updateBranding(branding);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal menyimpan konfigurasi branding.');
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setBranding((prev) => ({
      ...prev,
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      accent_color: preset.accent,
    }));
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Loader2 size={36} className="animate-spin" style={{ color: '#6366F1' }} />
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Memuat White-Label Studio...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: '#6366F1', color: 'white' }}>
              WHITE-LABEL STUDIO
            </span>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Multi-Tenant Engine</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white', margin: 0 }}>
            Kustomisasi Portal Promotor
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', marginTop: 4 }}>
            Sesuaikan identitas visual portal tiket Anda (Domain, Warna, Logo, dan Banner) secara mandiri.
          </p>
        </div>

        {branding.slug && (
          <Link
            href={`/org/${branding.slug}`}
            target="_blank"
            style={{
              padding: '10px 18px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <Eye size={16} />
            <span>Buka Portal Publik</span>
            <ExternalLink size={14} style={{ opacity: 0.6 }} />
          </Link>
        )}
      </div>

      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '12px 18px', borderRadius: 12, marginBottom: 24,
            background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10B981', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <Check size={18} />
          <span>Konfigurasi White-Label berhasil disimpan dan langsung aktif!</span>
        </motion.div>
      )}

      {error && (
        <div style={{
          padding: '12px 18px', borderRadius: 12, marginBottom: 24,
          background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#EF4444', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Two-Column Studio Layout ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 480px) 1fr', gap: 28, alignItems: 'start' }}>
        {/* ─── LEFT: Settings Form ─── */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Card 1: Colors & Presets */}
          <div style={{
            padding: 22, borderRadius: 16,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Palette size={18} style={{ color: branding.primary_color }} />
              Palet Warna Desain Token
            </h3>

            {/* Quick Presets */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Preset Cepat:</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    style={{
                      padding: '8px 10px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 600,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 2 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.primary }} />
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.secondary }} />
                    </div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Pickers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                  Primary
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="color"
                    value={branding.primary_color}
                    onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                    style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent' }}
                  />
                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.8)' }}>
                    {branding.primary_color}
                  </span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                  Secondary
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="color"
                    value={branding.secondary_color}
                    onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                    style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent' }}
                  />
                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.8)' }}>
                    {branding.secondary_color}
                  </span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                  Accent
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="color"
                    value={branding.accent_color}
                    onChange={(e) => setBranding({ ...branding, accent_color: e.target.value })}
                    style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent' }}
                  />
                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.8)' }}>
                    {branding.accent_color}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Domain & Identity */}
          <div style={{
            padding: 22, borderRadius: 16,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={18} style={{ color: '#06B6D4' }} />
              Domain & URL Portal
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                  Subdomain Default
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', padding: '0 12px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>/org/{branding.slug}</span>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>
                    (atau {branding.slug}.tixora.id)
                  </span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                  Custom Domain Pribadi
                </label>
                <input
                  type="text"
                  value={branding.custom_domain || ''}
                  onChange={(e) => setBranding({ ...branding, custom_domain: e.target.value })}
                  placeholder="tickets.namaorganizer.com"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'white', fontSize: '0.85rem', outline: 'none',
                  }}
                />
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                  Arahkan CNAME domain Anda ke <code>cname.tixora.id</code> untuk aktivasi instan.
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Texts & Assets */}
          <div style={{
            padding: 22, borderRadius: 16,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'white', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Image size={18} style={{ color: '#EC4899' }} />
              Teks & Aset Visual
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                  Judul Portal
                </label>
                <input
                  type="text"
                  value={branding.portal_title || ''}
                  onChange={(e) => setBranding({ ...branding, portal_title: e.target.value })}
                  placeholder="Contoh: SM Entertainment Indonesia Live"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'white', fontSize: '0.85rem', outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                  Tagline / Deskripsi Hero
                </label>
                <textarea
                  rows={2}
                  value={branding.portal_tagline || ''}
                  onChange={(e) => setBranding({ ...branding, portal_tagline: e.target.value })}
                  placeholder="Official Ticketing & Cashless Experience Partner"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'white', fontSize: '0.85rem', outline: 'none', resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                  URL Logo Promotor
                </label>
                <input
                  type="text"
                  value={branding.logo || ''}
                  onChange={(e) => setBranding({ ...branding, logo: e.target.value })}
                  placeholder="https://domain.com/logo.png"
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'white', fontSize: '0.85rem', outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                  Pengumuman / Announcement Bar
                </label>
                <input
                  type="text"
                  value={branding.portal_settings?.announcement || ''}
                  onChange={(e) => setBranding({
                    ...branding,
                    portal_settings: { ...branding.portal_settings, announcement: e.target.value },
                  })}
                  placeholder="Dapatkan diskon presale eksklusif..."
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'white', fontSize: '0.85rem', outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '14px 24px', borderRadius: 12, fontWeight: 800, fontSize: '0.95rem',
              background: `linear-gradient(135deg, ${branding.primary_color}, ${branding.secondary_color})`,
              color: 'white', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: `0 4px 20px ${branding.primary_color}55`, opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                <Save size={18} /> Simpan Konfigurasi White-Label
              </>
            )}
          </button>
        </form>

        {/* ─── RIGHT: Live Interactive Preview Frame ─── */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 10, padding: '0 4px',
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} style={{ color: branding.primary_color }} />
              Live Portal Preview
            </span>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
              Render Real-Time
            </span>
          </div>

          <div style={{
            borderRadius: 20, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.15)',
            background: '#0F172A',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          }}>
            {/* Fake Browser Top Bar */}
            <div style={{
              background: '#1E293B', padding: '10px 16px',
              display: 'flex', alignItems: 'center', gap: 8,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
              <div style={{
                flex: 1, margin: '0 16px', background: 'rgba(0,0,0,0.3)',
                padding: '4px 12px', borderRadius: 6, fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.5)', textAlign: 'center',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                https://{branding.custom_domain || `${branding.slug || 'promotor'}.tixora.id`}
              </div>
            </div>

            {/* Preview Body */}
            <div style={{ height: 480, overflowY: 'auto' }}>
              {/* Portal Header */}
              <div style={{
                padding: '12px 18px', background: 'rgba(15, 23, 42, 0.95)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {branding.logo ? (
                    <img src={branding.logo} alt="Logo" style={{ height: 22, objectFit: 'contain' }} />
                  ) : (
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: branding.primary_color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 800 }}>
                      {branding.name[0] || 'T'}
                    </div>
                  )}
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'white' }}>
                    {branding.portal_title || branding.name || 'Portal Promotor'}
                  </span>
                </div>
                <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)' }}>Powered by TIXORA</span>
              </div>

              {/* Preview Hero */}
              <div style={{
                padding: '36px 20px',
                background: `linear-gradient(135deg, ${branding.primary_color}33 0%, ${branding.secondary_color}22 100%)`,
                borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'center',
              }}>
                {branding.portal_settings?.announcement && (
                  <div style={{
                    display: 'inline-block', fontSize: '0.65rem', padding: '3px 10px',
                    borderRadius: 12, background: 'rgba(255,255,255,0.1)', color: 'white', marginBottom: 10,
                  }}>
                    {branding.portal_settings.announcement}
                  </div>
                )}
                <h4 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', margin: 0, marginBottom: 6 }}>
                  {branding.portal_title || 'Portal Resmi Konser & Event'}
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', margin: 0, maxWidth: 360, marginInline: 'auto' }}>
                  {branding.portal_tagline || 'Pesan tiket resmi Anda dengan proteksi Dynamic QR anti-calo.'}
                </p>
              </div>

              {/* Preview Event Card */}
              <div style={{ padding: 18 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'white', marginBottom: 12 }}>
                  Event Mendatang
                </div>
                <div style={{
                  padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 12, alignItems: 'center'
                }}>
                  <div style={{ width: 64, height: 64, borderRadius: 8, background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Ticket size={24} style={{ color: branding.primary_color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      JAKARTA FESTIVAL 2027
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                      Gelora Bung Karno • 28 Okt 2027
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: branding.accent_color, marginTop: 4 }}>
                      Rp 750.000
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{
                      padding: '6px 12px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700,
                      background: branding.primary_color, color: 'white', border: 'none', cursor: 'pointer',
                    }}
                  >
                    Beli
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
