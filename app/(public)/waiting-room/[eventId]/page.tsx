'use client';

import { use, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Clock, Zap, Shield, AlertTriangle, CheckCircle,
  ArrowRight, RefreshCw, WifiOff
} from 'lucide-react';
import { apiService } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import type { QueueStatus } from '../../../../types';

// Queue position ring animation
function QueueRing({ position }: { position: number }) {
  return (
    <div style={{ position: 'relative', width: 240, height: 240, margin: '0 auto' }}>
      {/* Outer ring */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        border: '6px solid rgba(99,102,241,0.1)',
      }}>
      </div>

      {/* Inner glow ring */}
      <div style={{
        position: 'absolute', inset: 12, borderRadius: '50%',
        border: '1px solid var(--border)', background: 'var(--card-hover)',
      }} />

      {/* Content */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
          Posisi Kamu
        </div>
        <motion.div
          key={position}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}
        >
          {position.toLocaleString('id-ID')}
        </motion.div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>dalam antrian</div>
      </div>
    </div>
  );
}

export default function WaitingRoomPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId }   = use(params);
  const router        = useRouter();
  const { user, token } = useAuthStore();

  const [status,      setStatus]    = useState<QueueStatus | null>(null);
  const [loading,     setLoading]   = useState(true);
  const [joining,     setJoining]   = useState(false);
  const [joined,      setJoined]    = useState(false);
  const [error,       setError]     = useState('');
  const [lastUpdate,  setLastUpdate] = useState(new Date());
  const [offline,     setOffline]   = useState(false);
  const [waitMinutes, setWaitMinutes] = useState(0);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!token) {
      router.replace(`/login?redirect=/waiting-room/${eventId}`);
    }
  }, [token, router, eventId]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiService.queue.getQueueStatus(eventId);
      const d   = (res as any)?.data ?? res;
      setStatus(d);
      setJoined(!!d?.session_token || d?.status === 'waiting' || d?.status === 'in_queue' || d?.status === 'checkout');
      setLastUpdate(new Date());
      setOffline(false);

      // If moved to checkout, redirect
      if (d?.status === 'checkout' || d?.status === 'ready') {
        clearInterval(pollRef.current!);
        router.push(`/checkout?queue_token=${d.checkout_token}&event=${eventId}`);
      }

      // Estimate wait
      if (d?.position && d?.position > 0) {
        setWaitMinutes(Math.ceil(d.position / 100) * 0.5); // rough estimate
      }
    } catch (e: any) {
      if (e?.response?.status !== 404) setOffline(true);
    }
  }, [eventId, router]);

  // Join queue
  const joinQueue = async () => {
    if (!user) { router.push('/login'); return; }
    setJoining(true);
    setError('');
    try {
      const fingerprint = Math.random().toString(36).slice(2);
      const res = await apiService.queue.joinQueue(eventId, {
        fingerprint,
        user_agent: navigator.userAgent,
      });
      const d = (res as any)?.data ?? res;
      setStatus(d);
      setJoined(true);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Gagal bergabung. Coba lagi.');
    } finally {
      setJoining(false);
    }
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchStatus();
      setLoading(false);
    };
    init();
  }, [fetchStatus]);

  // Polling every 5 seconds when joined
  useEffect(() => {
    if (joined) {
      pollRef.current = setInterval(fetchStatus, 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [joined, fetchStatus]);

  if (!token) return null;

  const position = status?.position ?? 0;
  const total    = status?.total_in_queue ?? 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', background: 'var(--background)', padding: '24px 16px' }}>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 560 }}>

        {/* ─── TOP STATUS BAR ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 8 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} style={{ color: '#F59E0B' }} />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>War Ticket Waiting Room</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {offline && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--danger)' }}>
                <WifiOff size={12} /> Offline
              </span>
            )}
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Update: {lastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            {joined && (
              <button onClick={fetchStatus} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 0 }}>
                <RefreshCw size={14} />
              </button>
            )}
          </div>
        </motion.div>

        {/* ─── MAIN CARD ──────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ width: 48, height: 48, border: '3px solid rgba(99,102,241,0.3)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin-slow 0.8s linear infinite' }} />
              <p style={{ color: 'var(--text-muted)' }}>Memeriksa antrian...</p>
            </motion.div>

          ) : !joined ? (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{
                padding: 48, borderRadius: 24, textAlign: 'center',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--glow-sm)',
              }}
            >
              {/* Clean solid icon */}
              <div
                style={{
                  width: 80, height: 80, borderRadius: 20, margin: '0 auto 24px',
                  background: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Zap size={36} color="white" />
              </div>

              <h1 style={{ marginBottom: 12, fontSize: '1.8rem', color: 'var(--text-primary)' }}>
                Siap Masuk <span style={{ color: 'var(--color-primary)' }}>Antrian?</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.7, fontSize: '0.95rem' }}>
                Kamu akan masuk ke virtual waiting room. Sistem kami akan memproses secara <strong>fair & anti-bot</strong>. Pastikan kamu siap sebelum tombol ditekan!
              </p>

              {/* Queue stats preview */}
              {total > 0 && (
                <div style={{
                  display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap',
                }}>
                  <div style={{ padding: '16px 24px', borderRadius: 16, background: 'var(--background-2)', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-primary)' }}>{total.toLocaleString('id-ID')}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase' }}>Dalam antrian</div>
                  </div>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '12px 16px', borderRadius: 10, marginBottom: 20,
                    background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)',
                    display: 'flex', alignItems: 'center', gap: 10,
                    color: 'var(--danger)', fontSize: '0.875rem',
                  }}
                >
                  <AlertTriangle size={16} />
                  {error}
                </motion.div>
              )}

              <button
                onClick={joinQueue}
                disabled={joining}
                className="btn btn-primary btn-xl"
                style={{ width: '100%', fontSize: '1.1rem' }}
              >
                {joining ? (
                  <><div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin-slow 0.8s linear infinite' }} /> Bergabung...</>
                ) : (
                  <><Zap size={20} /> Masuk Waiting Room</>
                )}
              </button>

              <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span><Shield size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Anti-bot</span>
                <span><CheckCircle size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Fair Queue</span>
                <span><Clock size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> 10 menit checkout</span>
              </div>
            </motion.div>

          ) : status?.status === 'checkout' ? (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ padding: 48, borderRadius: 24, textAlign: 'center', background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--glow-sm)' }}
            >
              <div
                style={{ width: 80, height: 80, borderRadius: 20, background: 'var(--success-bg)', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <CheckCircle size={40} style={{ color: 'var(--success)' }} />
              </div>
              <h2 style={{ color: 'var(--success)', marginBottom: 12 }}>Giliranmu Tiba!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Kamu sedang diarahkan ke halaman checkout...</p>
              <div style={{ width: 40, height: 40, border: '3px solid rgba(16,185,129,0.3)', borderTopColor: 'var(--success)', borderRadius: '50%', margin: '0 auto', animation: 'spin-slow 0.8s linear infinite' }} />
            </motion.div>

          ) : (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: 48, borderRadius: 24, textAlign: 'center',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--glow-sm)',
              }}
            >
              {/* Queue ring */}
              <QueueRing position={position} />

              <div style={{ marginTop: 32, marginBottom: 24 }}>
                <h2 style={{ marginBottom: 8, color: 'var(--text-primary)' }}>Kamu dalam antrian</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  Sistem sedang memproses <strong>{total.toLocaleString('id-ID')}</strong> orang dalam antrian
                </p>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
                {[
                  { icon: Users, label: 'Total Antrian', value: total.toLocaleString('id-ID') },
                  { icon: Clock, label: 'Est. Tunggu',   value: waitMinutes > 0 ? `~${waitMinutes} mnt` : 'Segera' },
                  { icon: Shield,label: 'Status',        value: 'Aman' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{
                    padding: '16px 20px', borderRadius: 16, textAlign: 'center', minWidth: 100,
                    background: 'var(--background-2)', border: '1px solid var(--border)',
                  }}>
                    <Icon size={20} style={{ color: 'var(--text-secondary)', margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 2, color: 'var(--text-primary)' }}>{value}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Progress indicator */}
              <div style={{ marginBottom: 28 }}>
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    style={{ width: '40%' }}
                  />
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  <Zap size={12} style={{ display: 'inline', marginRight: 4 }} /> Antrian diproses otomatis. Halaman ini refresh setiap 5 detik.
                </p>
              </div>

              {/* Tips */}
              <div style={{
                padding: '24px', borderRadius: 16, marginBottom: 24,
                background: 'var(--background-2)', border: '1px solid var(--border)',
                textAlign: 'left',
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: 16, color: 'var(--text-primary)' }}>Tips War Ticket</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    'Jangan refresh atau tutup halaman ini!',
                    'Siapkan data dirimu (KTP/Paspor) sebelumnya',
                    'Siapkan metode pembayaran favoritmu',
                    'Setelah masuk checkout, bayar dalam 10 menit!',
                  ].map((tip, i) => (
                    <li key={i} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: 'var(--color-primary)', flexShrink: 0, fontWeight: 700 }}>{i + 1}.</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── EVENT INFO FOOTER ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ marginTop: 24, textAlign: 'center' }}
        >
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Dengan memasuki waiting room, kamu setuju dengan{' '}
            <a href="/terms" style={{ color: 'var(--color-primary)' }}>syarat & ketentuan</a>{' '}
            Tixora.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
