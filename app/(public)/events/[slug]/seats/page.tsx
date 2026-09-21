'use client';

import React, { use, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ShieldCheck,
  Calendar, MapPin, Ticket
} from 'lucide-react';
import { InteractiveSeatMap } from '@/components/seatmap/InteractiveSeatMap';
import { apiService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Event, SeatMapData, SeatNode } from '@/types';
import { Button, Badge, Card, Alert, LoadingState, ErrorState, EmptyState } from '@/components/ui';
import { PageContainer } from '@/components/layout';
import { formatDate } from '@/lib/utils';

export default function EventSeatsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { token } = useAuthStore();

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
      console.error('Error loading seat map:', err);
      setError(err?.response?.data?.message || err?.message || 'Gagal memuat peta kursi event.');
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
      fetchData();
    } finally {
      setIsLocking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingState message="Memuat peta tempat duduk..." />
      </div>
    );
  }

  if (error && !seatMap) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <ErrorState
          title="Peta Kursi Tidak Tersedia"
          description={error}
          retryText="Kembali ke Detail Event"
          onRetry={() => router.push(`/events/${slug}`)}
        />
      </div>
    );
  }

  return (
    <PageContainer size="lg" className="py-6 sm:py-8 pb-32">
      {/* ─── Breadcrumb & Header Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <Link href={`/events/${slug}`}>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="text-text-secondary hover:text-text-primary px-0"
          >
            Kembali ke Detail Event
          </Button>
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-success bg-success/10 border border-success/20 px-3 py-1 rounded-full font-medium w-fit">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Sistem Proteksi Kursi Real-Time TIXORA</span>
        </div>
      </div>

      {/* ─── Event Header Card ─── */}
      {event && (
        <Card variant="default" className="p-4 sm:p-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="primary" size="sm">
                  PILIH KURSI
                </Badge>
                <Badge variant="secondary" size="sm">
                  {event.category?.toUpperCase()}
                </Badge>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary">
                {event.title}
              </h1>
            </div>

            <div className="flex items-center gap-4 text-xs sm:text-sm text-text-secondary flex-wrap">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{formatDate(event.event_date)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-accent" />
                <span>{seatMap?.venue?.name ?? event.venue_name ?? 'Gelora Bung Karno'}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ─── Error Notification ─── */}
      {error && (
        <Alert variant="danger" title="Perhatian" className="mb-6">
          {error}
        </Alert>
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
        <Card variant="default" className="py-16">
          <EmptyState
            icon={<Ticket className="w-8 h-8 text-text-muted" />}
            title="Event Menggunakan Tiket Festival / Standing"
            description="Event ini tidak memerlukan pemilihan nomor kursi tempat duduk. Anda dapat langsung memilih kategori tiket festival."
            action={
              <Link href={`/events/${slug}`}>
                <Button variant="primary" size="md">
                  Pilih Kategori Tiket
                </Button>
              </Link>
            }
          />
        </Card>
      )}
    </PageContainer>
  );
}
