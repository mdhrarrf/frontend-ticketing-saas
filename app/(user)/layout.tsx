'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link'
import {
  LayoutDashboard, Ticket, ShoppingBag, Heart,
  User, Settings, LogOut, CheckCircle, Wallet
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Navbar } from '../../components/common/Navbar';

const NAV_ITEMS = [
  { href: '/dashboard',          icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/tickets',  icon: Ticket,          label: 'Tiket Saya' },
  { href: '/dashboard/wallet',   icon: Wallet,          label: 'FestPay Wallet' },
  { href: '/dashboard/orders',   icon: ShoppingBag,     label: 'Pesanan' },
  { href: '/dashboard/wishlist', icon: Heart,           label: 'Wishlist' },
  { href: '/dashboard/profile',  icon: User,            label: 'Profil' },
  { href: '/dashboard/settings', icon: Settings,        label: 'Pengaturan' },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, token, logout } = useAuthStore();

  useEffect(() => {
    if (!token) router.replace(`/login?redirect=${pathname}`);
  }, [token, router, pathname]);

  if (!token) return null;

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    router.push('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 88, paddingBottom: 60 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28, alignItems: 'flex-start' }}>

          {/* ─── SIDEBAR ────────────────────────────── */}
          <aside style={{ position: 'sticky', top: 88 }}>

            {/* User info */}
            <div style={{
              borderRadius: 14, padding: '16px 18px', marginBottom: 12,
              background: 'var(--card)', border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Avatar — plain color, no gradient */}
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '1rem', fontWeight: 700,
                }}>
                  {user?.name?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                    {user?.name ?? 'User'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.email}
                  </div>
                </div>
              </div>
              {user?.email_verified && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, fontSize: '0.7rem', color: 'var(--success)' }}>
                  <CheckCircle size={12} /> Akun Terverifikasi
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--card)', border: '1px solid var(--border)' }}>
              {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                return (
                  <Link key={href} href={href} style={{ textDecoration: 'none', display: 'block' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px',
                      borderLeft: `3px solid ${isActive ? 'var(--color-primary)' : 'transparent'}`,
                      background: isActive ? 'rgba(99,102,241,0.07)' : 'transparent',
                      transition: 'background 0.15s',
                    }}>
                      <Icon size={16} style={{ color: isActive ? 'var(--color-primary)' : 'var(--text-muted)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {label}
                      </span>
                    </div>
                  </Link>
                );
              })}

              <button
                onClick={handleLogout}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 16px', background: 'none', border: 'none',
                  borderTop: '1px solid var(--border)', cursor: 'pointer',
                  borderLeft: '3px solid transparent', transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <LogOut size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>Keluar</span>
              </button>
            </nav>
          </aside>

          {/* ─── CONTENT ────────────────────────────── */}
          <main key={pathname}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
