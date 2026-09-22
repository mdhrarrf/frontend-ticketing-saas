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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Mobile Navigation Pills */}
        <div className="lg:hidden mb-6 overflow-x-auto pb-2 scrollbar-none flex items-center gap-2">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                    : 'bg-card text-text-secondary border-border hover:border-border-bright hover:text-text-primary'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-text-muted'} />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 lg:gap-8 items-start">
          {/* ─── DESKTOP SIDEBAR ────────────────────────────── */}
          <aside className="hidden lg:block sticky top-24 space-y-3">
            {/* User info card */}
            <div className="rounded-2xl p-4 bg-card border border-border">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl shrink-0 bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-black text-lg">
                  {user?.name?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-text-primary truncate">
                    {user?.name ?? 'User'}
                  </div>
                  <div className="text-xs text-text-muted truncate">
                    {user?.email}
                  </div>
                </div>
              </div>
              {user?.email_verified && (
                <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-border text-[11px] font-semibold text-success">
                  <CheckCircle size={13} /> Akun Terverifikasi
                </div>
              )}
            </div>

            {/* Navigation Card */}
            <nav className="rounded-2xl overflow-hidden bg-card border border-border divide-y divide-border/60">
              {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                return (
                  <Link key={href} href={href} className="block group">
                    <div
                      className={`flex items-center gap-3 px-4 py-3 text-sm transition-all border-l-2 ${
                        isActive
                          ? 'border-primary bg-primary/10 text-text-primary font-bold'
                          : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-elevated/40'
                      }`}
                    >
                      <Icon
                        size={16}
                        className={isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-primary'}
                      />
                      <span>{label}</span>
                    </div>
                  </Link>
                );
              })}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-danger hover:bg-danger/10 transition-colors cursor-pointer border-l-2 border-transparent font-medium"
              >
                <LogOut size={16} className="shrink-0" />
                <span>Keluar</span>
              </button>
            </nav>
          </aside>

          {/* ─── MAIN CONTENT ────────────────────────────── */}
          <main className="min-w-0" key={pathname}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
