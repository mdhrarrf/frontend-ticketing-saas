'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Menu, X, User as UserIcon, LogOut, Ticket, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '@/components/ui';
import { PageContainer } from '@/components/layout';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 border-b ${
        isScrolled
          ? 'bg-surface/90 backdrop-blur-xl border-border shadow-lg shadow-black/20'
          : 'bg-surface/75 backdrop-blur-md border-border/60'
      }`}
    >
      <PageContainer size="lg">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5 text-decoration-none group">
              <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <Ticket className="w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-white group-hover:text-primary transition-colors">
                TIXORA
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Beranda
            </Link>
            <Link
              href="/events"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Events
            </Link>
            {user && (user.role === 'organizer' || user.role === 'super_admin') && (
              <Link
                href="/organizer/dashboard"
                className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4 text-primary" /> Panel Organizer
              </Link>
            )}

            <Link href="/become-organizer">
              <Button variant="outline" size="sm" className="font-semibold text-xs border-primary/40 hover:border-primary text-primary hover:bg-primary/10">
                Jadi Organizer
              </Button>
            </Link>

            {user ? (
              <div className="flex items-center gap-4 relative">
                {/* Notification Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen);
                      setProfileOpen(false);
                    }}
                    className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors relative"
                    aria-label="Notifikasi"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full ring-2 ring-surface animate-pulse" />
                  </button>

                  <AnimatePresence>
                    {notificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-[-40px] sm:right-0 top-full mt-3 w-80 bg-card border border-border rounded-xl p-4 shadow-2xl z-50"
                      >
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                          <h4 className="text-sm font-semibold text-text-primary">Notifikasi</h4>
                          <span className="text-[11px] text-text-muted">Tandai sudah dibaca</span>
                        </div>
                        <div className="text-center py-6 text-text-muted flex flex-col items-center justify-center">
                          <Bell className="w-8 h-8 opacity-20 mb-2" />
                          <p className="text-xs">Belum ada notifikasi baru</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setProfileOpen(!profileOpen);
                      setNotificationsOpen(false);
                    }}
                    className="flex items-center gap-2 p-1 rounded-full border border-border/80 hover:border-primary/50 transition-colors focus:outline-none"
                    aria-label="User Profile"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white shadow-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-3 w-56 bg-card border border-border rounded-xl p-1.5 shadow-2xl z-50"
                      >
                        <div className="px-3 py-2 border-b border-border mb-1">
                          <p className="text-xs font-bold text-text-primary truncate">{user.name}</p>
                          <p className="text-[11px] text-text-muted truncate">{user.email}</p>
                        </div>
                        <Link
                          href={
                            user.role === 'organizer'
                              ? '/organizer/dashboard'
                              : user.role === 'admin'
                              ? '/admin/dashboard'
                              : '/dashboard'
                          }
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
                          onClick={() => setProfileOpen(false)}
                        >
                          <UserIcon className="w-4 h-4 text-primary" /> Dashboard
                        </Link>
                        {user.role === 'user' && (
                          <Link
                            href="/dashboard/tickets"
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
                            onClick={() => setProfileOpen(false)}
                          >
                            <Ticket className="w-4 h-4 text-accent" /> Tiket Saya
                          </Link>
                        )}
                        <div className="my-1 border-t border-border" />
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10 rounded-lg transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-xs font-semibold text-text-secondary hover:text-text-primary">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm" className="text-xs font-semibold shadow-md shadow-primary/20">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-text-secondary hover:text-text-primary rounded-lg focus:outline-none"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </PageContainer>

      {/* Mobile Menu Content */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-card/95 backdrop-blur-xl border-b border-border px-4 py-3"
          >
            <div className="flex flex-col gap-1.5">
              <Link
                href="/"
                className="px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Beranda
              </Link>
              <Link
                href="/events"
                className="px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Events
              </Link>
              <Link
                href="/become-organizer"
                className="px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Jadi Organizer
              </Link>
              {user && (user.role === 'organizer' || user.role === 'super_admin') && (
                <Link
                  href="/organizer/dashboard"
                  className="px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4 text-primary" /> Panel Organizer
                </Link>
              )}
              {!user ? (
                <div className="pt-2 border-t border-border flex flex-col gap-2 mt-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="sm" fullWidth>
                      Login
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" fullWidth>
                      Register
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="pt-2 border-t border-border mt-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 rounded-lg flex items-center gap-2 text-left"
                  >
                    <LogOut className="w-4 h-4" /> Logout ({user.name})
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
