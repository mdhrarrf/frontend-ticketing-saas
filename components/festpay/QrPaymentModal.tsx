'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ShieldCheck, RefreshCw, AlertCircle, Sparkles, CheckCircle, Wallet, ArrowUpRight
} from 'lucide-react';
import QRCode from 'qrcode';
import { apiService } from '../../lib/api';

interface QrPaymentModalProps {
  walletId: number | null;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onTopUpRequested?: () => void;
}

export default function QrPaymentModal({
  walletId,
  eventTitle,
  isOpen,
  onClose,
  onTopUpRequested,
}: QrPaymentModalProps) {
  const [tokenData, setTokenData] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [currentTimeMs, setCurrentTimeMs] = useState<string>('');
  const isFetchingRef = useRef<boolean>(false);

  // Live anti-screenshot clock watermark
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0');
      setCurrentTimeMs(timeStr);
    }, 100);
    return () => clearInterval(interval);
  }, [isOpen]);

  const fetchToken = useCallback(async () => {
    if (!walletId || isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await apiService.festpay.getPaymentQr(walletId);
      const data = res.data ?? res;
      setTokenData(data);
      const remaining = data.seconds_remaining ?? 60;
      setTimeLeft(remaining);

      const url = await QRCode.toDataURL(data.token, {
        width: 260,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });
      setQrDataUrl(url);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch payment token', err);
      setError(err?.response?.data?.message || 'Gagal membuat QR token bayar');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [walletId]);

  useEffect(() => {
    if (isOpen && walletId) {
      setLoading(true);
      fetchToken();
    } else {
      setTokenData(null);
      setQrDataUrl('');
      setTimeLeft(60);
    }
  }, [isOpen, walletId, fetchToken]);

  // 60-second countdown
  useEffect(() => {
    if (!isOpen || !tokenData) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          fetchToken();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, tokenData, fetchToken]);

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / 60) * 100));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          style={{
            background: '#ffffff',
            borderRadius: 24,
            width: '100%',
            maxWidth: 420,
            overflow: 'hidden',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            padding: '20px 24px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c7d2fe' }}>
                <Sparkles size={13} />
                TIXORA FestPay™
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '2px 0 0', color: '#ffffff' }}>
                QR Bayar Kasir
              </h3>
              <p style={{ fontSize: '0.75rem', margin: 0, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                {eventTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '50%',
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '24px', textAlign: 'center' }}>
            {/* Balance Badge */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                <div style={{
                  background: '#e0e7ff',
                  color: '#4f46e5',
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Wallet size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>Saldo Tersedia</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    Rp {Number(tokenData?.balance ?? 0).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
              {onTopUpRequested && (
                <button
                  onClick={() => { onClose(); onTopUpRequested(); }}
                  style={{
                    background: '#4f46e5',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  Top Up <ArrowUpRight size={13} />
                </button>
              )}
            </div>

            {/* QR Card Container with Anti-Screenshot Watermark */}
            <div style={{
              position: 'relative',
              background: '#ffffff',
              border: '2px dashed #cbd5e1',
              borderRadius: 20,
              padding: '20px',
              display: 'inline-block',
              margin: '0 auto',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
            }}>
              {loading ? (
                <div style={{ width: 240, height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <RefreshCw className="animate-spin" size={32} style={{ color: '#6366f1' }} />
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Mengenkripsi token 60s...</span>
                </div>
              ) : error ? (
                <div style={{ width: 240, height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <AlertCircle size={36} style={{ color: '#ef4444' }} />
                  <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>{error}</span>
                  <button
                    onClick={fetchToken}
                    style={{
                      background: '#4f46e5', color: '#fff', border: 'none',
                      borderRadius: 8, padding: '6px 14px', fontSize: '0.75rem', cursor: 'pointer',
                    }}
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : (
                <>
                  {/* Watermark Overlay (Ghost Shield dynamic timestamp) */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.14,
                    transform: 'rotate(-25deg)',
                    userSelect: 'none',
                    fontWeight: 900,
                    fontSize: '0.78rem',
                    color: '#4338ca',
                    letterSpacing: '0.08em',
                  }}>
                    <span>TIXORA FESTPAY™</span>
                    <span>{currentTimeMs}</span>
                    <span>{tokenData?.wallet_number}</span>
                  </div>

                  {/* Real QR Code */}
                  {qrDataUrl && (
                    <img
                      src={qrDataUrl}
                      alt="FestPay Dynamic QR"
                      style={{
                        width: 240,
                        height: 240,
                        display: 'block',
                        borderRadius: 12,
                        filter: timeLeft <= 5 ? 'brightness(0.9)' : 'none',
                        transition: 'filter 0.3s',
                      }}
                    />
                  )}
                </>
              )}
            </div>

            {/* Countdown bar */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={14} style={{ color: '#10b981' }} /> Token Otomatis Berganti
                </span>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: timeLeft <= 10 ? '#ef4444' : '#4f46e5',
                }}>
                  {timeLeft}s
                </span>
              </div>
              <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: timeLeft <= 10 ? '#ef4444' : '#4f46e5',
                    transition: 'width 1s linear, background 0.3s',
                  }}
                />
              </div>
            </div>

            {/* Security note */}
            <div style={{
              marginTop: 16,
              background: '#f8fafc',
              border: '1px solid #f1f5f9',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: '0.72rem',
              color: '#64748b',
              textAlign: 'center',
            }}>
              Tunjukkan QR ini ke kasir booth F&B/Merchandise di dalam venue. Token dilindungi AES-256 + HMAC.
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
