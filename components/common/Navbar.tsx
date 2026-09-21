'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Menu, X, User as UserIcon, LogOut, Ticket, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

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
    <nav style={{
      position: 'fixed', top: 0, width: '100%', zIndex: 50, transition: 'all 0.3s',
      background: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      boxShadow: isScrolled ? '0 4px 20px rgba(0,0,0,0.05)' : 'none',
    }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <Ticket size={28} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>TIXORA</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="desktop-menu">
            <Link href="/" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}>Beranda</Link>
            <Link href="/events" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}>Events</Link>
            {user && (user.role === 'organizer' || user.role === 'super_admin') && (
              <Link href="/organizer/dashboard" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: 6 }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}>
                <LayoutDashboard size={15} /> Panel Organizer
              </Link>
            )}
            <Link href="/become-organizer" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 700, border: '1.5px solid var(--color-primary)', borderRadius: 8, padding: '6px 14px', transition: 'all 0.2s', fontSize: '0.875rem' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = 'white'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-primary)'; }}>Jadi Organizer</Link>
            
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', position: 'relative', display: 'flex' }} 
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'} 
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    <Bell size={20} />
                    <span style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, background: 'var(--color-secondary)', borderRadius: '50%' }}></span>
                  </button>

                  <AnimatePresence>
                    {notificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        style={{ position: 'absolute', right: -60, top: '100%', marginTop: 16, width: 300, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 100 }}
                      >
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem' }}>Notifikasi</h4>
                        <div style={{ height: 1, background: 'var(--border)', margin: '0 -16px 12px -16px' }} />
                        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)' }}>
                          <Bell size={32} style={{ opacity: 0.2, margin: '0 auto 8px auto' }} />
                          <p style={{ fontSize: '0.8rem', margin: 0 }}>Belum ada notifikasi baru</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: 'white' }}>
                      {user.name.charAt(0)}
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, width: 192, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 8, boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 100 }}
                      >
                        <Link href={user.role === 'organizer' ? '/organizer/dashboard' : user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', borderRadius: 8, transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-hover)'; e.currentTarget.style.color = 'var(--color-primary)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                          <UserIcon size={16} style={{ marginRight: 8 }} /> Dashboard
                        </Link>
                        {user.role === 'user' && (
                          <Link href="/dashboard/tickets" style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', borderRadius: 8, transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-hover)'; e.currentTarget.style.color = 'var(--color-primary)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                            <Ticket size={16} style={{ marginRight: 8 }} /> Tiket Saya
                          </Link>
                        )}
                        <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
                        <button 
                          onClick={logout}
                          style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '10px 16px', fontSize: '0.875rem', color: 'var(--danger)', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', borderRadius: 8, transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-bg)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <LogOut size={16} style={{ marginRight: 8 }} /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Link href="/login" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}>Login</Link>
                <Link href="/register" className="btn btn-primary btn-sm">
                  Register
                </Link>
              </div>
            )}
          </div>

          <div className="mobile-menu-btn" style={{ display: 'none' }}>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .desktop-menu { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}} />
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', background: 'var(--card)', margin: '0 8px 8px', borderRadius: 12, border: '1px solid var(--border)' }}
          >
            <div style={{ padding: '8px 8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Link href="/" style={{ padding: '12px 16px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, borderRadius: 8 }}>Beranda</Link>
              <Link href="/events" style={{ padding: '12px 16px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, borderRadius: 8 }}>Events</Link>
              <Link href="/become-organizer" style={{ padding: '12px 16px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, borderRadius: 8 }}>Jadi Organizer</Link>
              {user && (user.role === 'organizer' || user.role === 'super_admin') && (
                <Link href="/organizer/dashboard" style={{ padding: '12px 16px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LayoutDashboard size={15} /> Panel Organizer
                </Link>
              )}
              {!user && (
                <>
                  <Link href="/login" style={{ padding: '12px 16px', color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, borderRadius: 8 }}>Login</Link>
                  <Link href="/register" style={{ padding: '12px 16px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500, borderRadius: 8 }}>Register</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
