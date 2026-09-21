'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck, XCircle, Users, AlertCircle, ScanLine,
  Loader2, Camera, ShieldCheck, History, Check, Clock, X
} from 'lucide-react';
import { apiService } from '../../../lib/api';
import CameraScanner from '../../../components/scanner/CameraScanner';

export default function OrganizerScannerPage() {
  const [scanResult, setScanResult] = useState<'idle' | 'success' | 'used' | 'invalid'>('idle');
  const [ticketData, setTicketData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingScan, setProcessingScan] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  // Load events
  useEffect(() => {
    (async () => {
      try {
        const res = await apiService.organizer.getEvents({ per_page: 50, sort: '-created_at' });
        const data = (res as any)?.data?.data ?? (res as any)?.data ?? [];
        setEvents(data);
        if (data.length > 0) setSelectedEventId(data[0].id.toString());
      } catch (err) {
        console.error('Failed to load events', err);
      }
    })();
  }, []);

  // Load stats & recent scans when event selected
  const fetchStatsAndRecent = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const [statsRes, recentRes] = await Promise.allSettled([
        apiService.organizer.getCheckInStats(selectedEventId),
        apiService.organizer.getRecentScans(selectedEventId),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats((statsRes.value as any)?.data ?? statsRes.value);
      }

      if (recentRes.status === 'fulfilled') {
        const d = (recentRes.value as any)?.data ?? recentRes.value;
        setRecentScans(Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : []);
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndRecent();
  }, [selectedEventId]);

  const resetResult = () => {
    setScanResult('idle');
    setTicketData(null);
    setErrorMsg('');
  };

  // Handle REAL scan from camera
  const handleCameraScan = async (decodedText: string) => {
    if (!selectedEventId || processingScan || scanResult !== 'idle') return;

    setProcessingScan(true);
    try {
      const res = await apiService.organizer.checkIn({
        token: decodedText,
        qr_code: decodedText,
        event_id: selectedEventId,
        gate: 'Gate Utama',
      });

      const data = (res as any)?.data ?? res;
      const t = data?.ticket || {};

      const anyRes = res as any;
      if (anyRes?.valid === false || data?.valid === false) {
        const isUsed = data?.status === 'already_used' || anyRes?.status === 'already_used';
        if (isUsed) {
          setScanResult('used');
          setTicketData({
            name: t.holder_name || data?.holder_name || 'Pengunjung',
            ticketNumber: t.ticket_number || data?.ticket_number || '',
            usedAt: data?.used_at || 'Sebelumnya',
          });
        } else {
          setScanResult('invalid');
          setErrorMsg(data?.message || anyRes?.message || 'Token QR tidak valid atau sudah kedaluwarsa.');
        }
        return;
      }

      setScanResult('success');
      setTicketData({
        name: t.holder_name || 'Pengunjung',
        category: t.category || 'Regular',
        ticketNumber: t.ticket_number || 'TIX-VALID',
        time: new Date().toLocaleTimeString('id-ID'),
      });

      fetchStatsAndRecent();

    } catch (err: any) {
      const resp = err?.response?.data;
      const status = resp?.status || '';

      if (status === 'already_used' || err?.response?.status === 409) {
        setScanResult('used');
        setTicketData({
          name: resp?.ticket?.holder_name || 'Pengunjung',
          ticketNumber: resp?.ticket?.ticket_number || '',
          usedAt: resp?.used_at || 'Sebelumnya',
        });
      } else {
        setScanResult('invalid');
        setErrorMsg(resp?.message || 'Token QR tidak valid atau sudah kedaluwarsa.');
      }
    } finally {
      setProcessingScan(false);

      // Auto reset scanner modal overlay after 3.2 seconds
      setTimeout(() => {
        setScanResult(prev => (prev !== 'idle' ? 'idle' : prev));
        setTicketData(null);
        setErrorMsg('');
      }, 3200);
    }
  };

  // Handle manual simulation (Fallback / Demo testing)
  const handleSimulateScan = async (resultType: 'success' | 'used' | 'invalid') => {
    if (!selectedEventId) return alert('Pilih event terlebih dahulu');
    setProcessingScan(true);

    try {
      if (resultType === 'success') {
        setScanResult('success');
        setTicketData({
          name: 'Muhammad Haidar (Simulasi)',
          category: 'VIP Standing',
          ticketNumber: 'TXR-2026-VIP-SIM01',
          time: new Date().toLocaleTimeString('id-ID'),
        });
      } else if (resultType === 'used') {
        setScanResult('used');
        setTicketData({
          name: 'John Doe (Simulasi)',
          category: 'Regular',
          ticketNumber: 'TXR-2026-REG-SIM99',
          usedAt: '18:30:15 WIB',
        });
      } else {
        setScanResult('invalid');
        setErrorMsg('QR Code tidak valid atau token kedaluwarsa (>30 detik).');
      }

      setTimeout(() => {
        setScanResult(prev => (prev !== 'idle' ? 'idle' : prev));
        setTicketData(null);
        setErrorMsg('');
      }, 3200);
    } finally {
      setProcessingScan(false);
    }
  };

  const totalTickets = stats?.total_tickets ?? 0;
  const checkedIn = stats?.checked_in ?? 0;
  const percentage = totalTickets > 0 ? (checkedIn / totalTickets) * 100 : 0;

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Gate Access & Scanner
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 10px',
                borderRadius: 20,
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10B981',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}>
                <ShieldCheck size={13} /> Validasi AES-256
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Pemindai kamera langsung untuk memvalidasi Dynamic QR Code 30 detik pengunjung.
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <select 
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              className="input"
              style={{ padding: '8px 12px', minWidth: 220, fontSize: '0.875rem' }}
            >
              {events.length === 0 ? <option value="">Memuat event...</option> : null}
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} style={{ color: '#6366F1' }} />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Check-in</div>
          </div>
          {loading ? <div style={{ height: 32, width: 80, background: 'var(--background-2)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} /> : (
            <>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {checkedIn} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {totalTickets}</span>
              </div>
              <div style={{ marginTop: 12, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#6366F1', width: `${percentage}%`, transition: 'width 0.4s ease' }}></div>
              </div>
            </>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={20} style={{ color: '#10B981' }} />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sisa Belum Masuk</div>
          </div>
          {loading ? <div style={{ height: 32, width: 80, background: 'var(--background-2)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} /> : (
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats?.remaining ?? 0}</div>
          )}
        </motion.div>
      </div>

      {/* Persistent Main Scanner Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ 
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, 
          padding: '32px 24px', minHeight: 480, display: 'flex', flexDirection: 'column', 
          alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
          marginBottom: 24,
        }}>
        
        {/* Camera Scanner Component (Always Kept Mounted to Prevent DOM Media Interruption) */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CameraScanner
            onScan={handleCameraScan}
            isScanning={isCameraActive}
            onToggleScanning={setIsCameraActive}
            disabled={processingScan || scanResult !== 'idle'}
          />

          {/* Laser Box Placeholder when camera is OFF */}
          {!isCameraActive && (
            <div style={{ 
              width: 240, height: 240, border: '2px dashed var(--border)', borderRadius: 24, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0', position: 'relative' 
            }}>
              <div style={{ position: 'absolute', top: -2, left: -2, width: 28, height: 28, borderTop: '4px solid var(--color-primary)', borderLeft: '4px solid var(--color-primary)', borderTopLeftRadius: 24 }} />
              <div style={{ position: 'absolute', top: -2, right: -2, width: 28, height: 28, borderTop: '4px solid var(--color-primary)', borderRight: '4px solid var(--color-primary)', borderTopRightRadius: 24 }} />
              <div style={{ position: 'absolute', bottom: -2, left: -2, width: 28, height: 28, borderBottom: '4px solid var(--color-primary)', borderLeft: '4px solid var(--color-primary)', borderBottomLeftRadius: 24 }} />
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderBottom: '4px solid var(--color-primary)', borderRight: '4px solid var(--color-primary)', borderBottomRightRadius: 24 }} />
              <ScanLine size={56} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
            </div>
          )}

          <p style={{ color: 'var(--text-secondary)', margin: '14px 0 20px', fontWeight: 500, fontSize: '0.85rem' }}>
            {isCameraActive ? 'Arahkan kamera ke Dynamic QR Code tiket pengunjung' : 'Klik tombol di atas untuk menyalakan kamera HP / Laptop'}
          </p>

          {/* Simulation buttons */}
          <div style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            flexWrap: 'wrap',
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
            width: '100%',
            maxWidth: 460,
          }}>
            <span style={{ width: '100%', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 4 }}>
              Uji Coba Manual / Demo Simulator:
            </span>
            <button onClick={() => handleSimulateScan('success')} disabled={processingScan}
              style={{ padding: '8px 14px', background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
              Simulasi: Berhasil
            </button>
            <button onClick={() => handleSimulateScan('used')} disabled={processingScan}
              style={{ padding: '8px 14px', background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
              Simulasi: Sudah Digunakan
            </button>
            <button onClick={() => handleSimulateScan('invalid')} disabled={processingScan}
              style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
              Simulasi: Invalid / Expired
            </button>
          </div>
        </div>

        {/* Floating Scan Result Overlay (Appears Over Camera without unmounting video) */}
        <AnimatePresence>
          {scanResult !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              style={{
                position: 'absolute',
                inset: 12,
                borderRadius: 20,
                backgroundColor: 'rgba(10, 10, 15, 0.95)',
                backdropFilter: 'blur(10px)',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                border: scanResult === 'success' ? '2px solid #10B981' : scanResult === 'used' ? '2px solid #F59E0B' : '2px solid #EF4444',
                boxShadow: scanResult === 'success' ? '0 0 50px rgba(16, 185, 129, 0.3)' : scanResult === 'used' ? '0 0 50px rgba(245, 158, 11, 0.3)' : '0 0 50px rgba(239, 68, 68, 0.3)',
              }}
            >
              <button
                onClick={resetResult}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>

              {/* Success Result */}
              {scanResult === 'success' && (
                <div style={{ textAlign: 'center', maxWidth: 360 }}>
                  <div style={{ width: 76, height: 76, background: 'rgba(16,185,129,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <UserCheck size={40} style={{ color: '#10B981' }} />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10B981', margin: '0 0 4px 0' }}>CHECK-IN BERHASIL</h3>
                  <p style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{ticketData?.name}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>{ticketData?.category}</p>
                  
                  <div style={{ background: 'var(--card)', padding: '12px 16px', borderRadius: 14, fontSize: '0.82rem', color: 'var(--text-muted)', border: '1px solid var(--border)', marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span>No. Tiket</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{ticketData?.ticketNumber}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Waktu Masuk</span>
                      <span style={{ fontWeight: 700, color: '#10B981' }}>{ticketData?.time}</span>
                    </div>
                  </div>

                  <button
                    onClick={resetResult}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 10,
                      background: '#10B981',
                      color: 'white',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    Lanjut Scan Berikutnya
                  </button>
                </div>
              )}

              {/* Already Used Result */}
              {scanResult === 'used' && (
                <div style={{ textAlign: 'center', maxWidth: 360 }}>
                  <div style={{ width: 76, height: 76, background: 'rgba(245,158,11,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <AlertCircle size={40} style={{ color: '#F59E0B' }} />
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#F59E0B', margin: '0 0 6px 0' }}>TIKET SUDAH DIGUNAKAN</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
                    Tiket ini sudah di-scan sebelumnya dan tidak dapat dipakai dua kali.
                  </p>
                  
                  <div style={{ background: 'var(--card)', padding: '12px 16px', borderRadius: 14, fontSize: '0.82rem', color: 'var(--text-muted)', border: '1px solid var(--border)', marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span>Pemilik</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ticketData?.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Waktu Pertama Masuk</span>
                      <span style={{ fontWeight: 700, color: '#F59E0B' }}>{ticketData?.usedAt}</span>
                    </div>
                  </div>

                  <button
                    onClick={resetResult}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 10,
                      background: '#F59E0B',
                      color: 'white',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    Tutup
                  </button>
                </div>
              )}

              {/* Invalid Result */}
              {scanResult === 'invalid' && (
                <div style={{ textAlign: 'center', maxWidth: 360 }}>
                  <div style={{ width: 76, height: 76, background: 'rgba(239,68,68,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <XCircle size={40} style={{ color: '#EF4444' }} />
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#EF4444', margin: '0 0 6px 0' }}>TIKET TIDAK VALID</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
                    {errorMsg || 'QR Code palsu, kedaluwarsa, atau tidak terdaftar untuk event ini.'}
                  </p>

                  <button
                    onClick={resetResult}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 10,
                      background: '#EF4444',
                      color: 'white',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    Coba Lagi
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Recent Scans Activity Log */}
      {recentScans.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <History size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Riwayat Scan Terbaru (Gate Activity)</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentScans.slice(0, 5).map((scan: any, idx: number) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 12,
                background: 'var(--background-2)',
                fontSize: '0.82rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: scan.result === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: scan.result === 'success' ? '#10B981' : '#EF4444',
                  }}>
                    {scan.result === 'success' ? <Check size={14} /> : <XCircle size={14} />}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {scan.ticket?.holder_name || scan.ticket?.ticket_number || 'Tiket'}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 8 }}>
                      ({scan.gate || 'Gate Utama'})
                    </span>
                  </div>
                </div>

                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> {scan.scanned_at ? new Date(scan.scanned_at).toLocaleTimeString('id-ID') : '-'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
