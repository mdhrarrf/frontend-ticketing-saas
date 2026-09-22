'use client';

import { useState, useEffect } from 'react';
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
  Menu,
  X
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
  const [mobileOpen, setMobileOpen] = useState(false);

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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try { await apiService.auth.logout(); } catch {}
    logout();
    router.replace('/login');
  };

  if (!token || (user && user.role !== 'super_admin')) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-text-primary">
      {/* ── Mobile Backdrop ─────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-danger/20 border border-danger/40 flex items-center justify-center text-danger">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-base font-black tracking-tight text-white">TIXORA</span>
            <span className="text-[10px] font-bold text-danger bg-danger/15 border border-danger/30 px-1.5 py-0.5 rounded">
              ADMIN
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-text-muted hover:text-text-primary rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-danger/15 text-danger border border-danger/30 font-bold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-danger' : 'text-text-muted'}`} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-border p-4 shrink-0 bg-surface/30">
          {user && (
            <div className="mb-3">
              <p className="text-text-primary text-xs font-bold truncate">{user.name}</p>
              <p className="text-[11px] text-text-muted truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-danger bg-danger/5 hover:bg-danger/15 border border-danger/20 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-text-secondary hover:text-text-primary rounded-lg focus:outline-none"
            aria-label="Buka Menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 font-black text-sm tracking-tight text-white">
            <ShieldCheck size={16} className="text-danger" />
            <span>TIXORA ADMIN</span>
          </div>
          <div className="w-8" />
        </header>

        {/* Scrollable View */}
        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
          <div className="max-w-screen-2xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
