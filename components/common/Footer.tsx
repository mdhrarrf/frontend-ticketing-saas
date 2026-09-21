'use client';
import Link from 'next/link';
import { Globe, MessageCircle, Play, Music, Mail, Ticket, Zap } from 'lucide-react';

export function Footer() {
  return (
    <footer style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', paddingTop: 64, paddingBottom: 32, position: 'relative', overflow: 'hidden' }}>
      {/* Light border top line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'var(--color-primary)' }} />

      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>

          {/* Brand */}
          <div>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, textDecoration: 'none' }}>
              <Ticket className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                TIXORA
              </span>
            </Link>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: 24, maxWidth: 280 }}>
              Platform ticketing konser dan event terpercaya #1 Indonesia. Aman, cepat, dan transparan.
            </p>
            {/* Social links */}
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { icon: Globe,         href: '#', label: 'Website' },
                { icon: MessageCircle, href: '#', label: 'Twitter/X' },
                { icon: Play,          href: '#', label: 'YouTube' },
                { icon: Music,         href: '#', label: 'TikTok' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  style={{
                    width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
                    transition: 'all 0.2s', textDecoration: 'none',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-primary)'; (e.currentTarget as HTMLElement).style.color = 'white'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--background)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Jelajahi</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { href: '/events',                    label: 'Semua Events' },
                { href: '/events?category=concert',   label: 'Concert' },
                { href: '/events?category=festival',  label: 'Festival' },
                { href: '/events?war_ticket=true',    label: 'War Ticket' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-primary)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Organizers */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Organizer</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { href: '/organizer/dashboard', label: 'Dashboard' },
                { href: '/organizer/events/create', label: 'Buat Event' },
                { href: '/organizer/analytics', label: 'Analytics' },
                { href: '/organizer/scanner', label: 'QR Scanner' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-primary)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bantuan</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { href: '/faq',     label: 'FAQ' },
                { href: '/terms',   label: 'Syarat & Ketentuan' },
                { href: '/privacy', label: 'Kebijakan Privasi' },
                { href: '/contact', label: 'Hubungi Kami' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-primary)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div style={{
          padding: '24px 28px', borderRadius: 16, marginBottom: 40,
          background: 'var(--background)',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Mail size={16} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Dapatkan Info War Ticket Terbaru</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
              Subscribe dan jangan pernah ketinggalan jadwal war ticket favoritmu.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 240 }}>
            <input
              type="email"
              placeholder="email@kamu.com"
              className="input"
              style={{ flex: 1, borderRadius: '10px 0 0 10px', borderRight: 'none', background: 'var(--card)' }}
            />
            <button className="btn btn-primary" style={{ borderRadius: '0 10px 10px 0', whiteSpace: 'nowrap' }}>
              Subscribe
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
            © {new Date().getFullYear()} TIXORA. All rights reserved.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <Zap size={12} style={{ color: 'var(--color-primary)' }} />
            Made with passion for Indonesian concert fans
          </div>
        </div>
      </div>
    </footer>
  );
}
