'use client';

import { use, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Clock, Zap, Shield, AlertTriangle, CheckCircle,
  ArrowRight, RefreshCw, WifiOff
} from 'lucide-react';
import { apiService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { QueueStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';

// Queue position ring animation
function QueueRing({ position }: { position: number }) {
  return (
    <div className="relative w-56 h-56 mx-auto">
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-4 border-primary/20" />

      {/* Inner glow ring */}
      <div className="absolute inset-3 rounded-full border border-border bg-card/60 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center shadow-inner" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-[11px] font-bold text-text-muted tracking-widest uppercase mb-1">
          Posisi Kamu
        </div>
        <motion.div
          key={position}
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl sm:text-5xl font-black text-text-primary tracking-tight leading-none"
        >
          {position.toLocaleString('id-ID')}
        </motion.div>
        <div className="text-xs text-text-muted mt-2 font-medium">dalam antrian</div>
      </div>
    </div>
  );
}

export default function WaitingRoomPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const router = useRouter();
  const { user, token } = useAuthStore();

  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [offline, setOffline] = useState(false);
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
      const d = (res as any)?.data ?? res;
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
        setWaitMinutes(Math.ceil(d.position / 100) * 0.5);
      }
    } catch (e: any) {
      if (e?.response?.status !== 404) setOffline(true);
    }
  }, [eventId, router]);

  // Join queue
  const joinQueue = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
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
      setError(e?.response?.data?.message ?? 'Gagal bergabung. Silakan coba lagi.');
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
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [joined, fetchStatus]);

  if (!token) return null;

  const position = status?.position ?? 0;
  const total = status?.total_in_queue ?? 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative bg-background text-text-primary px-4 py-8 sm:py-12">
      <div className="relative z-10 w-full max-w-lg">
        {/* ─── TOP STATUS BAR ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-6 flex-wrap gap-2 text-xs text-text-muted"
        >
          <div className="flex items-center gap-2 font-bold text-text-primary">
            <Zap size={16} className="text-warning fill-warning" />
            <span>War Ticket Waiting Room</span>
          </div>
          <div className="flex items-center gap-3">
            {offline && (
              <span className="flex items-center gap-1 text-danger font-semibold">
                <WifiOff size={13} /> Offline
              </span>
            )}
            <span>
              Update: {lastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            {joined && (
              <button
                onClick={fetchStatus}
                className="hover:text-text-primary cursor-pointer transition-colors p-1"
                aria-label="Refresh status"
              >
                <RefreshCw size={13} />
              </button>
            )}
          </div>
        </motion.div>

        {/* ─── MAIN CARD ──────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              exit={{ opacity: 0 }}
              className="text-center p-12 bg-card border border-border rounded-3xl"
            >
              <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-text-muted">Memeriksa status antrian...</p>
            </motion.div>
          ) : !joined ? (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="p-6 sm:p-10 rounded-3xl text-center bg-card border border-border shadow-xl"
            >
              {/* Solid Accent Icon */}
              <div className="w-16 h-16 rounded-2xl mx-auto mb-6 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Zap size={32} className="fill-primary" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary mb-3">
                Siap Masuk <span className="text-primary">Antrian?</span>
              </h1>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">
                Kamu akan masuk ke virtual waiting room berkapasitas tinggi. Sistem memproses urutan secara <strong>fair & anti-bot</strong>.
              </p>

              {/* Queue stats preview */}
              {total > 0 && (
                <div className="flex justify-center mb-6">
                  <div className="px-6 py-3 rounded-2xl bg-background border border-border text-center">
                    <div className="text-2xl font-black text-primary">
                      {total.toLocaleString('id-ID')}
                    </div>
                    <div className="text-[11px] text-text-muted font-bold uppercase tracking-wider mt-0.5">
                      Orang dalam antrian
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="danger" className="mb-6 text-left">
                  {error}
                </Alert>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-full text-base font-extrabold"
                onClick={joinQueue}
                loading={joining}
              >
                <Zap size={18} className="mr-2 fill-white" />
                Masuk Waiting Room
              </Button>

              <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <Shield size={13} className="text-success" /> Anti-bot Protection
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-primary" /> Fair First-Come
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className="text-warning" /> 10 Menit Checkout
                </span>
              </div>
            </motion.div>
          ) : status?.status === 'checkout' ? (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 sm:p-12 rounded-3xl text-center bg-card border border-border shadow-xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-success/15 border border-success/30 text-success mx-auto mb-6 flex items-center justify-center">
                <CheckCircle size={36} />
              </div>
              <h2 className="text-2xl font-black text-success mb-2">Giliranmu Tiba!</h2>
              <p className="text-text-secondary text-sm mb-6">
                Kamu sedang diarahkan otomatis ke halaman pembayaran checkout...
              </p>
              <div className="w-8 h-8 border-3 border-success/30 border-t-success rounded-full animate-spin mx-auto" />
            </motion.div>
          ) : (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 sm:p-10 rounded-3xl text-center bg-card border border-border shadow-xl"
            >
              {/* Queue ring */}
              <QueueRing position={position} />

              <div className="mt-6 mb-6">
                <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary mb-1.5">
                  Kamu Sedang Dalam Antrian
                </h2>
                <p className="text-text-secondary text-xs sm:text-sm">
                  Sistem sedang memproses tiket untuk <strong>{total.toLocaleString('id-ID')}</strong> pengguna aktif.
                </p>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                <div className="p-3 rounded-2xl bg-background border border-border text-center">
                  <Users size={18} className="text-text-muted mx-auto mb-1.5" />
                  <div className="text-sm sm:text-base font-extrabold text-text-primary">
                    {total.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                    Total
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-background border border-border text-center">
                  <Clock size={18} className="text-text-muted mx-auto mb-1.5" />
                  <div className="text-sm sm:text-base font-extrabold text-text-primary">
                    {waitMinutes > 0 ? `~${waitMinutes} mnt` : 'Segera'}
                  </div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                    Estimasi
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-background border border-border text-center">
                  <Shield size={18} className="text-success mx-auto mb-1.5" />
                  <div className="text-sm sm:text-base font-extrabold text-success">
                    Aktif
                  </div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                    Status
                  </div>
                </div>
              </div>

              {/* Animated Progress indicator */}
              <div className="mb-6">
                <div className="h-2 w-full bg-background rounded-full overflow-hidden relative border border-border">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    animate={{ x: ['-100%', '150%'] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                    style={{ width: '45%' }}
                  />
                </div>
                <p className="text-[11px] text-text-muted mt-2 flex items-center justify-center gap-1">
                  <Zap size={12} className="text-primary" /> Antrian diproses otomatis. Sistem me-refresh tiap 5 detik.
                </p>
              </div>

              {/* Tips Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-background border border-border text-left">
                <div className="text-xs font-bold text-text-primary mb-2.5">
                  Tips Penting War Ticket:
                </div>
                <ul className="space-y-1.5 text-xs text-text-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">1.</span>
                    Jangan me-refresh browser atau menutup tab ini.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">2.</span>
                    Pastikan koneksi internet stabil.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">3.</span>
                    Setelah masuk checkout, selesaikan pembayaran dalam 10 menit.
                  </li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── EVENT INFO FOOTER ───────────────────────────── */}
        <div className="mt-6 text-center text-xs text-text-muted">
          Dengan berada dalam waiting room, kamu menyetujui Ketentuan Tiket TIXORA.
        </div>
      </div>
    </div>
  );
}
