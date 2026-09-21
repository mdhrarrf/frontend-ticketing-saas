'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building,
  Calendar,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../lib/api';

const navItems = [
  { label: 'Dashboard',     href: '/admin/dashboard',  icon: LayoutDashboard },
  { label: 'War Room Live', href: '/admin/war-room',   icon: Activity },
  { label: 'Organizer',     href: '/admin/organizers', icon: Building },
  { label: 'Events',        href: '/admin/events',     icon: Calendar },
  { label: 'Users',         href: '/admin/users',      icon: Users },
  { label: 'Laporan',       href: '/admin/reports',    icon: BarChart3 },
  { label: 'Pengaturan',    href: '/admin/settings',   icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router    = useRouter();
  const pathname  = usePathname();
  const { user, token, logout } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    if (user && user.role !== 'super_admin') {
      alert('Akses ditolak');
      router.replace('/');
    }
  }, [token, user, router]);

  const handleLogout = async () => {
    try { await apiService.auth.logout(); } catch {}
    logout();
    router.replace('/login');
  };

  if (!token || (user && user.role !== 'super_admin')) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F8FAFC' }}>
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col"
        style={{ background: '#0F172A' }}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center px-6 gap-2 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="w-7 h-7 rounded bg-red-500 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-wide">TIXORA</span>
          <span
            className="ml-1 text-xs font-semibold px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}
          >
            ADMIN
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative"
                style={{
                  color:      isActive ? '#ffffff' : 'rgba(255,255,255,0.55)',
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  borderLeft: isActive ? '3px solid #ffffff' : '3px solid transparent',
                }}
              >
                <Icon style={{ width: 18, height: 18 }} className="shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div
          className="p-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          {user && (
            <div className="mb-3 px-1">
              <p className="text-white text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {user.email}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: '#f87171' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.12)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────── */}
      <main className="flex-1 overflow-y-auto" style={{ background: '#F8FAFC' }}>
        <div className="p-6 lg:p-8 max-w-screen-2xl">
          {children}
        </div>
      </main>
    </div>
  );
}
