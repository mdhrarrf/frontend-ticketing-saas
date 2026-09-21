'use client';
import Link from 'next/link';
import { Globe, MessageCircle, Play, Music, Mail, Ticket, Zap } from 'lucide-react';
import { PageContainer } from '@/components/layout';
import { Button } from '@/components/ui';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border pt-16 pb-8 relative overflow-hidden">
      {/* Decorative top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

      <PageContainer size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand & Socials */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <Ticket className="w-4 h-4" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">TIXORA</span>
            </Link>
            <p className="text-sm text-text-secondary leading-relaxed mb-6 max-w-sm">
              Platform ticketing konser dan event terpercaya #1 Indonesia. Aman, cepat, dan transparan dengan sistem antrean anti-bot dan seat selection interaktif.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {[
                { icon: Globe, href: '#', label: 'Website' },
                { icon: MessageCircle, href: '#', label: 'Twitter/X' },
                { icon: Play, href: '#', label: 'YouTube' },
                { icon: Music, href: '#', label: 'TikTok' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface border border-border text-text-secondary hover:text-white hover:bg-primary hover:border-primary transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-4">
              Jelajahi
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: '/events', label: 'Semua Events' },
                { href: '/events?category=concert', label: 'Concert' },
                { href: '/events?category=festival', label: 'Festival' },
                { href: '/events?war_ticket=true', label: 'War Ticket' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Organizer */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-4">
              Organizer
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: '/organizer/dashboard', label: 'Dashboard' },
                { href: '/organizer/events/create', label: 'Buat Event' },
                { href: '/organizer/analytics', label: 'Analytics' },
                { href: '/organizer/scanner', label: 'QR Scanner' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-4">
              Bantuan
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: '/faq', label: 'FAQ' },
                { href: '/terms', label: 'Syarat & Ketentuan' },
                { href: '/privacy', label: 'Kebijakan Privasi' },
                { href: '/contact', label: 'Hubungi Kami' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Box */}
        <div className="p-6 sm:p-7 rounded-2xl bg-surface/60 border border-border flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-sm font-bold text-text-primary mb-1">
                Dapatkan Info War Ticket Terbaru
              </h5>
              <p className="text-xs text-text-secondary max-w-md">
                Subscribe newsletter resmi kami dan jangan pernah ketinggalan jadwal war ticket konser artis favoritmu.
              </p>
            </div>
          </div>
          <div className="w-full md:w-auto flex items-center gap-2 max-w-md">
            <input
              type="email"
              placeholder="email@kamu.com"
              className="h-10 w-full md:w-64 px-3.5 text-xs rounded-xl bg-card border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            <Button variant="primary" size="sm" className="whitespace-nowrap shrink-0 text-xs">
              Subscribe
            </Button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p>© {new Date().getFullYear()} TIXORA. All rights reserved.</p>
          <div className="flex items-center gap-2 text-text-secondary">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span>Made with passion for Indonesian concert fans</span>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
}
