'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Calendar, ShoppingBag, BarChart3,
  Gift, Banknote, QrCode, Settings, LogOut, Ticket, ChevronRight, Store,
  Layers, Palette, Menu, X
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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace('/login?redirect=/organizer/dashboard');
      return;
    }
    if (user && user.role !== 'organizer' && user.role !== 'super_admin') {
      router.replace('/become-organizer');
    }
  }, [token, user, router]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!token || !user) return null;
  if (user.role !== 'organizer' && user.role !== 'super_admin') return null;

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    router.push('/');
  };

  const initials = user.name?.trim().split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || 'O';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Mobile Backdrop ─────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border shrink-0">
          <Link href="/organizer/dashboard" className="flex items-center gap-2.5 text-decoration-none">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
              <Ticket size={18} />
            </div>
            <span className="text-base font-black tracking-tight text-white">TIXORA</span>
            <span className="text-[10px] font-bold text-primary bg-primary/15 border border-primary/30 px-1.5 py-0.5 rounded">
              ORG
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-text-muted hover:text-text-primary rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          {NAV.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/organizer/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} className="block group">
                <div
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-md shadow-primary/25 font-bold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/60'
                  }`}
                >
                  <Icon
                    size={16}
                    className={isActive ? 'text-white' : 'text-text-muted group-hover:text-text-primary'}
                  />
                  <span>{label}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto text-white/80" />}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-border p-4 shrink-0 bg-surface/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl shrink-0 bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-text-primary truncate">{user.name}</div>
              <div className="text-[11px] text-text-muted truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-danger bg-danger/5 hover:bg-danger/15 border border-danger/20 transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ───────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="lg:hidden h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-text-secondary hover:text-text-primary rounded-lg focus:outline-none"
            aria-label="Buka Menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 font-black text-sm tracking-tight text-white">
            <Ticket size={16} className="text-primary" />
            <span>TIXORA ORGANIZER</span>
          </div>
          <div className="w-8" />
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
