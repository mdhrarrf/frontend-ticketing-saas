'use client';

import React, { use, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, AlertTriangle, ShieldCheck,
  Calendar, MapPin, Ticket, Loader2
} from 'lucide-react';
import { InteractiveSeatMap } from '@/components/seatmap/InteractiveSeatMap';
import { apiService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Event, SeatMapData, SeatNode } from '@/types';

export default function EventSeatsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router   = useRouter();
  const { user, token } = useAuthStore();

  const [event, setEvent] = useState<Event | null>(null);
  const [seatMap, setSeatMap] = useState<SeatMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeats, setSelectedSeats] = useState<SeatNode[]>([]);
  const [isLocking, setIsLocking] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string>('');

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize or restore session ID
  useEffect(() => {
    let sess = localStorage.getItem('tixora_seat_session');
    if (!sess) {
      sess = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('tixora_seat_session', sess);
    }
    setSessionId(sess);
  }, []);

  // Fetch Event & Seat Map data
  const fetchData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError('');
    try {
      const sess = localStorage.getItem('tixora_seat_session') || '';
      const [evRes, seatRes] = await Promise.all([
        apiService.events.getEvent(slug),
        apiService.seatMap.getSeatMap(slug, sess),
      ]);

      const evData = (evRes as any)?.data ?? evRes;
      const mapData = (seatRes as any)?.data ?? seatRes;

      setEvent(evData);
      setSeatMap(mapData);

      // Check if any seats were already locked by this session
      const myLockedSeats: SeatNode[] = [];
      let minRemaining = 0;

      mapData.sections?.forEach((sec: any) => {
        sec.rows?.forEach((row: any) => {
          row.seats?.forEach((seat: SeatNode) => {
            if (seat.is_mine && seat.status === 'LOCKED') {
              myLockedSeats.push(seat);
              if (minRemaining === 0 || seat.seconds_remaining < minRemaining) {
                minRemaining = seat.seconds_remaining;
              }
            }
          });
        });
      });

      if (myLockedSeats.length > 0) {
        setSelectedSeats(myLockedSeats);
        setCountdown(minRemaining);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat peta kursi event.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Countdown timer handler
  useEffect(() => {
    if (countdown > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            // Refresh map after lock expiry
            fetchData();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [countdown, fetchData]);

  const handleToggleSeat = (seat: SeatNode) => {
    setSelectedSeats((prev) => {
      const exists = prev.find((s) => s.id === seat.id);
      if (exists) {
        return prev.filter((s) => s.id !== seat.id);
      }
      if (prev.length >= 8) {
        alert('Maksimal pemilihan adalah 8 kursi sekaligus.');
        return prev;
      }
      return [...prev, seat];
    });
  };

  const handleProceedToCheckout = async () => {
    if (selectedSeats.length === 0) return;

    if (!token) {
      router.push(`/login?redirect=/events/${slug}/seats`);
      return;
    }

    setIsLocking(true);
    setError('');

    try {
      const seatIds = selectedSeats.map((s) => s.id);
      const lockRes = await apiService.seatMap.lockSeats(slug, seatIds, sessionId);
      const resData = (lockRes as any)?.data ?? lockRes;

      setCountdown(resData.seconds_remaining || 300);

      // Redirect to checkout with reserved seats params
      router.push(
        `/checkout?event=${event?.id}&session_id=${sessionId}&seats=${seatIds.join(',')}`
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Gagal mengunci kursi yang dipilih.';
      setError(msg);
      // Refresh seat map to get updated availability
      fetchData();
    } finally {
      setIsLocking(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Loader2 size={36} className="animate-spin" style={{ color: '#6366F1' }} />
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Memuat peta tempat duduk...</p>
      </div>
    );
  }

  if (error && !seatMap) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <AlertTriangle size={48} style={{ color: '#EF4444' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Peta Kursi Tidak Tersedia</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 460, textAlign: 'center' }}>{error}</p>
        <Link href={`/events/${slug}`} className="btn btn-primary">
          Kembali ke Detail Event
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '30px 20px 120px 20px', maxWidth: 1300, margin: '0 auto' }}>
      {/* ─── Breadcrumb & Navigation ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Link
          href={`/events/${slug}`}
          style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Detail Event</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: 20 }}>
          <ShieldCheck size={14} />
          <span>Sistem Proteksi Kursi Real-Time TIXORA</span>
        </div>
      </div>

      {/* ─── Event Header Banner ─── */}
      {event && (
        <div style={{
          padding: '20px 24px', borderRadius: 16,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
          gap: 16, marginBottom: 24,
        }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: '#6366F1', color: 'white' }}>
                PILIH KURSI
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}>
                {event.category?.toUpperCase()}
              </span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', fontWeight: 900, margin: 0, color: 'white' }}>
              {event.title}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 20, fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={15} style={{ color: '#6366F1' }} />
              <span>{new Date(event.event_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={15} style={{ color: '#EC4899' }} />
              <span>{seatMap?.venue?.name ?? event.venue_name ?? 'Gelora Bung Karno'}</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Error Notification ─── */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '12px 18px', borderRadius: 12, marginBottom: 20,
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#EF4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </motion.div>
      )}

      {/* ─── Interactive Seat Map Engine ─── */}
      {seatMap && seatMap.has_seat_map ? (
        <InteractiveSeatMap
          seatMapData={seatMap}
          selectedSeats={selectedSeats}
          onToggleSeat={handleToggleSeat}
          maxSelectable={8}
          countdownSeconds={countdown}
          onProceedToCheckout={handleProceedToCheckout}
          isLocking={isLocking}
        />
      ) : (
        <div style={{
          textAlign: 'center', padding: '60px 20px', borderRadius: 20,
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <Ticket size={48} style={{ opacity: 0.3, margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Event Menggunakan Tiket Festival / Standing</h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 440, margin: '8px auto 24px auto', fontSize: '0.88rem' }}>
            Event ini tidak memerlukan pemilihan nomor kursi tempat duduk. Anda dapat langsung memilih kategori tiket.
          </p>
          <Link href={`/events/${slug}`} className="btn btn-primary">
            Pilih Kategori Tiket
          </Link>
        </div>
      )}
    </div>
  );
}
