'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Calendar, ShoppingBag, BarChart3,
  Gift, Banknote, QrCode, Settings, LogOut, Ticket, ChevronRight, Store,
  Layers, Palette
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const NAV = [
  { label: 'Dashboard',   href: '/organizer/dashboard',  icon: LayoutDashboard },
  { label: 'Events',      href: '/organizer/events',     icon: Calendar },
  { label: 'Seat Maps',   href: '/organizer/venues',     icon: Layers },
  { label: 'Branding',    href: '/organizer/branding',   icon: Palette },
  { label: 'Pesanan',     href: '/organizer/orders',     icon: ShoppingBag },
  { label: 'Analytics',   href: '/organizer/analytics',  icon: BarChart3 },
  { label: 'Promo Code',  href: '/organizer/promos',     icon: Gift },
  { label: 'Payout',      href: '/organizer/payouts',    icon: Banknote },
  { label: 'Scanner',     href: '/organizer/scanner',    icon: QrCode },
  { label: 'FestPay POS', href: '/organizer/booths',     icon: Store },
  { label: 'Pengaturan',  href: '/organizer/settings',   icon: Settings },
];

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.replace('/login?redirect=/organizer/dashboard');
      return;
    }
    if (user && user.role !== 'organizer' && user.role !== 'super_admin') {
      router.replace('/become-organizer');
    }
  }, [token, user, router]);

  if (!token || !user) return null;
  if (user.role !== 'organizer' && user.role !== 'super_admin') return null;

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    router.push('/');
  };

  const initials = user.name?.trim().split(' ').slice(0,2).map((w: string) => w[0]).join('').toUpperCase() || 'O';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--background)' }}>

      {/* ── Sidebar ─────────────────────────────── */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: '#0F172A',
        display: 'flex', flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Logo */}
        <div style={{ height: 60, display: 'flex', alignItems: 'center', paddingLeft: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <Link href="/organizer/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Ticket size={22} style={{ color: '#6366F1' }} />
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#6366F1' }}>TIXORA</span>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'rgba(99,102,241,0.2)', padding: '2px 6px', borderRadius: 4 }}>ORG</span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
          {NAV.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/organizer/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8,
                  background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                  borderLeft: isActive ? '3px solid #6366F1' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}>
                  <Icon size={16} style={{ color: isActive ? '#6366F1' : 'rgba(255,255,255,0.45)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 400, color: isActive ? 'white' : 'rgba(255,255,255,0.55)' }}>
                    {label}
                  </span>
                  {isActive && <ChevronRight size={13} style={{ color: '#6366F1', marginLeft: 'auto' }} />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '14px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '0.8rem', fontWeight: 700,
            }}>{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.15s', color: 'rgba(239,68,68,0.8)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <LogOut size={15} />
            <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>Keluar</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--background)' }}>
        <div style={{ padding: '28px', minHeight: '100%' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
