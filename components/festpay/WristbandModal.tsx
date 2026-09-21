'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Radio, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, Nfc } from 'lucide-react';
import { apiService } from '../../lib/api';

interface WristbandModalProps {
  walletId: number | null;
  eventId: number | null;
  eventTitle: string;
  wristbands: any[];
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export default function WristbandModal({
  walletId,
  eventId,
  eventTitle,
  wristbands,
  isOpen,
  onClose,
  onUpdated,
}: WristbandModalProps) {
  const [rawUid, setRawUid] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [reportingLostId, setReportingLostId] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [nfcReading, setNfcReading] = useState<boolean>(false);

  if (!isOpen) return null;

  const activeBand = wristbands.find(w => w.status === 'ACTIVE');

  // Web NFC Reader handler for mobile devices with NFC hardware
  const handleScanNfc = async () => {
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      setError('Browser perangkat ini tidak mendukung Web NFC. Silakan masukkan nomor serial UID gelang secara manual.');
      return;
    }

    try {
      setNfcReading(true);
      setError('');
      // @ts-ignore
      const ndef = new window.NDEFReader();
      await ndef.scan();

      // @ts-ignore
      ndef.onreading = (event: any) => {
        const serialNumber = event.serialNumber;
        if (serialNumber) {
          setRawUid(serialNumber.toUpperCase());
          setNfcReading(false);
        }
      };

      // @ts-ignore
      ndef.onreadingerror = () => {
        setError('Gagal membaca tag NFC. Coba dekatkan gelang kembali ke belakang HP Anda.');
        setNfcReading(false);
      };
    } catch (err: any) {
      console.warn('NFC Error', err);
      setError('Izin NFC ditolak atau fitur NFC dimatikan di HP Anda.');
      setNfcReading(false);
    }
  };

  const handlePair = async () => {
    if (!walletId || !eventId || !rawUid.trim()) {
      setError('Masukkan kode UID fisik gelang NFC');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await apiService.festpay.pairWristband({
        event_id: eventId,
        wallet_id: walletId,
        raw_uid: rawUid.trim(),
      });

      setSuccessMsg('Gelang NFC berhasil dipasangkan dengan wallet!');
      setRawUid('');
      onUpdated();
    } catch (err: any) {
      console.error('Pair wristband error', err);
      setError(err?.response?.data?.message || 'Gagal memasangkan gelang NFC');
    } finally {
      setLoading(false);
    }
  };

  const handleReportLost = async (wristbandId: number) => {
    if (!confirm('Apakah Anda yakin ingin memblokir gelang ini? Gelang tidak akan bisa digunakan bertransaksi lagi.')) {
      return;
    }

    setReportingLostId(wristbandId);
    setError('');
    setSuccessMsg('');

    try {
      await apiService.festpay.reportLostWristband(wristbandId);
      setSuccessMsg('Gelang berhasil diblokir. Saldo Anda aman.');
      onUpdated();
    } catch (err: any) {
      console.error('Report lost error', err);
      setError(err?.response?.data?.message || 'Gagal melaporkan gelang hilang');
    } finally {
      setReportingLostId(null);
    }
  };

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
          transition={{ duration: 0.2 }}
          style={{
            background: '#ffffff',
            borderRadius: 24,
            width: '100%',
            maxWidth: 440,
            overflow: 'hidden',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase' }}>
                FestPay Tap & Go
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                NFC Wristband
              </h3>
              <p style={{ fontSize: '0.75rem', margin: 0, color: '#64748b' }}>
                {eventTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9', border: 'none', borderRadius: '50%',
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b', cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: '24px' }}>
            {/* Active Wristband status */}
            {activeBand ? (
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 14,
                padding: '16px',
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', background: '#dcfce7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a',
                    }}>
                      <Radio size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#14532d' }}>
                        Gelang Terpasang & Aktif
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#166534' }}>
                        Dipasangkan pada {new Date(activeBand.paired_at).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 800, background: '#22c55e', color: '#fff',
                    padding: '3px 8px', borderRadius: 999,
                  }}>
                    READY
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#15803d', margin: '0 0 12px' }}>
                  Cukup tempelkan gelang ke alat EDC / scanner di booth festival untuk pembayaran instan tanpa membuka HP.
                </p>
                <button
                  onClick={() => handleReportLost(activeBand.id)}
                  disabled={reportingLostId === activeBand.id}
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fca5a5',
                    color: '#b91c1c',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    width: '100%',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldAlert size={14} />
                  {reportingLostId === activeBand.id ? 'Memblokir...' : 'Laporkan Gelang Hilang / Rusak (Blokir)'}
                </button>
              </div>
            ) : (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: '16px',
                marginBottom: 20,
                textAlign: 'center',
              }}>
                <Radio size={28} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>
                  Belum Ada Gelang Terpasang
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0' }}>
                  Dapatkan wristband RFID di gate penukaran tiket, lalu masukkan nomor UID gelang di bawah ini.
                </p>
              </div>
            )}

            {/* Pair New Wristband Form */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Pasangkan UID Gelang Fisik
              </label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="Contoh: 04:A2:3F:89:C1:6B:80"
                  value={rawUid}
                  onChange={(e) => setRawUid(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={handleScanNfc}
                  style={{
                    padding: '0 14px',
                    borderRadius: 10,
                    border: '1.5px solid #cbd5e1',
                    background: nfcReading ? '#fef3c7' : '#f8fafc',
                    color: '#0f172a',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                  title="Scan langsung via NFC HP"
                >
                  <Nfc size={16} />
                  {nfcReading ? 'Dekatkan...' : 'Tap HP'}
                </button>
              </div>

              {error && (
                <div style={{
                  marginBottom: 12, padding: '8px 12px', borderRadius: 8,
                  background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c',
                  fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {successMsg && (
                <div style={{
                  marginBottom: 12, padding: '8px 12px', borderRadius: 8,
                  background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d',
                  fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <CheckCircle2 size={14} /> {successMsg}
                </div>
              )}

              <button
                onClick={handlePair}
                disabled={loading || !rawUid.trim()}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: 10,
                  background: loading || !rawUid.trim() ? '#94a3b8' : '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: loading || !rawUid.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Memverifikasi...' : 'Hubungkan Gelang'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
