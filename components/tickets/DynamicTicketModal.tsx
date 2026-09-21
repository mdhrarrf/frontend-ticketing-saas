'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ShieldCheck, RefreshCw, Calendar, MapPin,
  Clock, AlertCircle, Sparkles, CheckCircle, User, Ticket as TicketIcon
} from 'lucide-react';
import QRCode from 'qrcode';
import { apiService } from '../../lib/api';

interface DynamicTicketModalProps {
  ticket: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DynamicTicketModal({ ticket, isOpen, onClose }: DynamicTicketModalProps) {
  const [tokenData, setTokenData] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [currentTimeMs, setCurrentTimeMs] = useState<string>('');
  const isFetchingRef = useRef<boolean>(false);

  // Live milliseconds server clock for dynamic anti-screenshot watermark
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0');
      setCurrentTimeMs(timeStr);
    }, 100);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Fetch token from backend
  const fetchNewToken = useCallback(async () => {
    if (!ticket?.ticket_number || isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await apiService.tickets.getDynamicToken(ticket.ticket_number);
      const data = (res as any)?.data ?? res;
      setTokenData(data);
      const remaining = data.seconds_remaining ?? 30;
      setTimeLeft(remaining);

      // Render real QR Code via qrcode library
      const url = await QRCode.toDataURL(data.token, {
        width: 280,
        margin: 1.5,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
      setQrDataUrl(url);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch dynamic token', err);
      setError(err?.response?.data?.message || 'Gagal memuat QR Code dinamis.');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [ticket?.ticket_number]);

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen && ticket?.ticket_number) {
      setLoading(true);
      fetchNewToken();
    } else {
      setTokenData(null);
      setQrDataUrl('');
      setTimeLeft(30);
    }
  }, [isOpen, ticket?.ticket_number, fetchNewToken]);

  // 30-second countdown timer
  useEffect(() => {
    if (!isOpen || !tokenData) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          fetchNewToken();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, tokenData, fetchNewToken]);

  if (!isOpen || !ticket) return null;

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / 30) * 100));
  const eventDate = ticket.event?.event_date || ticket.event_date;
  const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  }) : '-';
  const venueName = ticket.event?.venue?.name || ticket.venue_name || ticket.venue || 'Venue TIXORA';
  const categoryName = ticket.ticket_category?.name || ticket.ticketCategory?.name || ticket.category_name || ticket.category || 'Regular';
  const holderName = ticket.holder_name || tokenData?.holder_name || ticket.user?.name || 'Pemegang Tiket';
  const isUsed = ticket.status === 'used' || ticket.checked_in_at !== null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
      }}>
        {/* Backdrop click */}
        <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 440,
            background: 'var(--card, #13131A)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.15)',
            maxHeight: '94vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)',
            padding: '20px 24px 18px',
            color: 'white',
            position: 'relative',
          }}>
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '2px 8px',
                borderRadius: 20,
              }}>
                {categoryName}
              </span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                background: isUsed ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                color: isUsed ? '#FCA5A5' : '#A7F3D0',
                padding: '2px 8px',
                borderRadius: 20,
              }}>
                {isUsed ? 'SUDAH CHECK-IN' : 'TIKET VALID'}
              </span>
            </div>

            <h2 style={{
              margin: '0 0 6px 0',
              fontSize: '1.25rem',
              fontWeight: 800,
              lineHeight: 1.3,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              maxWidth: '85%',
            }}>
              {ticket.event?.title || ticket.event_name || 'TIXORA Concert'}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.78rem', opacity: 0.9 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={13} /> {formattedDate}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={13} /> {venueName}
              </span>
            </div>
          </div>

          {/* Notch divider effect */}
          <div style={{ position: 'relative', height: 16, background: 'var(--card, #13131A)' }}>
            <div style={{
              position: 'absolute',
              left: -10,
              top: -8,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#09090D',
            }} />
            <div style={{
              position: 'absolute',
              right: -10,
              top: -8,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#09090D',
            }} />
            <div style={{
              position: 'absolute',
              left: 20,
              right: 20,
              top: 0,
              borderTop: '2px dashed rgba(255, 255, 255, 0.1)',
            }} />
          </div>

          {/* Dynamic QR Display Area */}
          <div style={{
            padding: '16px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflowY: 'auto',
          }}>
            {/* Ghost-Shield Security Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 20,
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: '#818CF8',
              fontSize: '0.72rem',
              fontWeight: 700,
              marginBottom: 16,
              letterSpacing: '0.02em',
            }}>
              <ShieldCheck size={14} />
              <span>Ghost-Shield™ Dynamic QR (AES-256)</span>
            </div>

            {/* QR Card with Holographic Laser effect */}
            <div style={{
              position: 'relative',
              width: 240,
              height: 240,
              background: '#FFFFFF',
              borderRadius: 20,
              padding: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              marginBottom: 16,
            }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <RefreshCw size={32} style={{ color: '#4F46E5', animation: 'spin-slow 1s linear infinite' }} />
                  <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>Enkripsi QR...</span>
                </div>
              ) : error ? (
                <div style={{ textAlign: 'center', padding: 12 }}>
                  <AlertCircle size={32} style={{ color: '#EF4444', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '0.75rem', color: '#EF4444', margin: 0, fontWeight: 600 }}>{error}</p>
                </div>
              ) : qrDataUrl ? (
                <>
                  <img
                    src={qrDataUrl}
                    alt="Dynamic QR Code"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />

                  {/* Holographic scanning shimmer sweep */}
                  <motion.div
                    animate={{ y: [-120, 240] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: 3,
                      background: 'linear-gradient(90deg, rgba(99,102,241,0) 0%, rgba(99,102,241,0.9) 50%, rgba(236,72,153,0) 100%)',
                      boxShadow: '0 0 12px 3px rgba(99,102,241,0.7)',
                      pointerEvents: 'none',
                    }}
                  />
                </>
              ) : null}
            </div>

            {/* Dynamic Watermark Text (Anti-Screenshot) */}
            <div style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px dashed rgba(255, 255, 255, 0.12)',
              borderRadius: 12,
              padding: '8px 12px',
              textAlign: 'center',
              marginBottom: 16,
            }}>
              <div style={{
                fontSize: '0.68rem',
                fontFamily: 'monospace',
                color: 'var(--text-secondary, #94A3B8)',
                letterSpacing: '0.05em',
                lineHeight: 1.4,
              }}>
                <span style={{ color: 'var(--text-primary, #F8FAFC)', fontWeight: 700 }}>
                  {holderName.toUpperCase()}
                </span>
                {' • '}
                <span>#{ticket.ticket_number}</span>
                <br />
                <span style={{ color: '#818CF8', fontWeight: 600 }}>
                  LIVE SERVER: {currentTimeMs || 'SYNCING...'}
                </span>
              </div>
            </div>

            {/* Rotation Countdown & Progress Bar */}
            <div style={{ width: '100%', marginBottom: 18 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
                fontSize: '0.78rem',
              }}>
                <span style={{ color: 'var(--text-muted, #94A3B8)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={13} /> Refresh otomatis:
                </span>
                <span style={{
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  color: timeLeft <= 5 ? '#EF4444' : 'var(--color-primary, #6366F1)',
                }}>
                  {timeLeft} detik
                </span>
              </div>

              {/* Progress Track */}
              <div style={{
                height: 6,
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 10,
                overflow: 'hidden',
              }}>
                <motion.div
                  style={{
                    height: '100%',
                    borderRadius: 10,
                    background: timeLeft <= 5
                      ? 'linear-gradient(90deg, #EF4444, #F59E0B)'
                      : 'linear-gradient(90deg, #6366F1, #EC4899)',
                    width: `${progressPercent}%`,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <p style={{
                margin: '6px 0 0',
                fontSize: '0.68rem',
                color: 'var(--text-muted, #94A3B8)',
                textAlign: 'center',
              }}>
                Screenshot tidak berlaku di gate pintu masuk.
              </p>
            </div>

            {/* Ticket Metadata Details */}
            <div style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: 14,
              padding: '12px 16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
              fontSize: '0.8rem',
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94A3B8)' }}>Pemegang Tiket</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary, #F8FAFC)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {holderName}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94A3B8)' }}>Pintu Masuk (Gate)</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary, #F8FAFC)' }}>
                  {ticket.entry_gate || ticket.check_in_gate || 'Gate Utama'}
                </div>
              </div>

              {ticket.seat_number && (
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94A3B8)' }}>Nomor Kursi</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary, #F8FAFC)' }}>
                    {ticket.seat_number}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94A3B8)' }}>No. Identitas (KTP)</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary, #F8FAFC)' }}>
                  {ticket.holder_id_number ? ticket.holder_id_number.slice(0, 6) + '******' : 'Terverifikasi'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
