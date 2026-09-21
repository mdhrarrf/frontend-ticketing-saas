'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck, Users, AlertCircle, ScanLine,
  ShieldCheck, History, Check, Clock, X, RefreshCw
} from 'lucide-react';
import { apiService } from '../../../lib/api';
import CameraScanner from '../../../components/scanner/CameraScanner';
import { Button, Card, Badge } from '@/components/ui';
import { PageHeader } from '@/components/layout';

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

      // Auto reset scanner overlay after 3.2 seconds
      setTimeout(() => {
        setScanResult((prev) => (prev !== 'idle' ? 'idle' : prev));
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
        setScanResult((prev) => (prev !== 'idle' ? 'idle' : prev));
        setTicketData(null);
        setErrorMsg('');
      }, 3200);
    } finally {
      setProcessingScan(false);
    }
  };

  const totalTickets = stats?.total_tickets ?? 0;
  const checkedIn = stats?.checked_in ?? 0;
  const percentage = totalTickets > 0 ? Math.min(100, Math.round((checkedIn / totalTickets) * 100)) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <PageHeader
        title="Gate Access & Fast Scanner"
        badge={
          <Badge variant="success" size="sm" className="font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> Validasi Real-Time
          </Badge>
        }
        description="Pemindai kamera berkecepatan tinggi untuk memvalidasi Dynamic QR Code 30 detik tiket pengunjung."
        actions={
          <div className="w-full sm:w-auto">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full sm:w-64 h-10 px-3.5 text-xs rounded-xl bg-surface border border-border text-text-primary focus:outline-none focus:border-primary transition-all"
            >
              {events.length === 0 ? <option value="">Memuat event...</option> : null}
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card variant="default" className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Total Check-in
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-text-primary mb-3">
            {checkedIn}{' '}
            <span className="text-sm font-medium text-text-muted">/ {totalTickets}</span>
          </div>
          <div className="w-full h-1.5 bg-surface-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="text-[11px] text-text-muted mt-1 text-right">{percentage}% Masuk</div>
        </Card>

        <Card variant="default" className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center text-success">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Sisa Belum Masuk
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-text-primary">
            {stats?.remaining ?? 0}
          </div>
          <div className="text-xs text-text-muted mt-2">
            Pengunjung yang belum melewati pintu gate
          </div>
        </Card>
      </div>

      {/* Persistent Main Scanner Section */}
      <Card variant="elevated" className="p-6 sm:p-8 min-h-[460px] flex flex-col items-center justify-center relative overflow-hidden border-border/80 shadow-2xl">
        <div className="w-full flex flex-col items-center">
          <CameraScanner
            onScan={handleCameraScan}
            isScanning={isCameraActive}
            onToggleScanning={setIsCameraActive}
            disabled={processingScan || scanResult !== 'idle'}
          />

          {!isCameraActive && (
            <div className="w-56 h-56 border-2 border-dashed border-border rounded-2xl flex items-center justify-center my-6 relative">
              <div className="absolute -top-0.5 -left-0.5 w-7 h-7 border-t-4 border-l-4 border-primary rounded-tl-xl" />
              <div className="absolute -top-0.5 -right-0.5 w-7 h-7 border-t-4 border-r-4 border-primary rounded-tr-xl" />
              <div className="absolute -bottom-0.5 -left-0.5 w-7 h-7 border-b-4 border-l-4 border-primary rounded-bl-xl" />
              <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 border-b-4 border-r-4 border-primary rounded-br-xl" />
              <ScanLine className="w-14 h-14 text-text-muted opacity-40" />
            </div>
          )}

          <p className="text-xs sm:text-sm text-text-secondary mt-4 mb-6 font-medium text-center">
            {isCameraActive
              ? 'Arahkan kamera ke Dynamic QR Code tiket pengunjung'
              : 'Klik tombol nyalakan kamera untuk memulai proses scanning'}
          </p>

          {/* Quick Demo Simulator Buttons */}
          <div className="pt-4 border-t border-border/80 w-full max-w-md text-center">
            <span className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2.5">
              Simulasi Uji Gate Cepat:
            </span>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSimulateScan('success')}
                disabled={processingScan}
                className="text-xs text-success border-success/30 hover:bg-success/10"
              >
                Simulasi: Valid
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSimulateScan('used')}
                disabled={processingScan}
                className="text-xs text-warning border-warning/30 hover:bg-warning/10"
              >
                Simulasi: Used
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSimulateScan('invalid')}
                disabled={processingScan}
                className="text-xs text-danger border-danger/30 hover:bg-danger/10"
              >
                Simulasi: Invalid
              </Button>
            </div>
          </div>
        </div>

        {/* High-Speed Instant Full-Screen Overlay Result */}
        <AnimatePresence>
          {scanResult !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`absolute inset-3 rounded-2xl backdrop-blur-xl z-50 flex flex-col items-center justify-center p-6 text-center shadow-2xl border-2 ${
                scanResult === 'success'
                  ? 'bg-emerald-950/95 border-success shadow-success/30'
                  : scanResult === 'used'
                  ? 'bg-amber-950/95 border-warning shadow-warning/30'
                  : 'bg-rose-950/95 border-danger shadow-danger/30'
              }`}
            >
              <button
                onClick={resetResult}
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full bg-black/30 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>

              {/* SUCCESS / VALID */}
              {scanResult === 'success' && (
                <div className="max-w-sm space-y-4">
                  <div className="w-20 h-20 bg-success/20 border-2 border-success rounded-full flex items-center justify-center mx-auto text-success">
                    <Check className="w-10 h-10" strokeWidth={3} />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                      STATUS TIKET:
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white">
                      VALID & MASUK
                    </h2>
                  </div>
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-left space-y-1.5 text-xs">
                    <div className="font-bold text-sm text-white">{ticketData?.name}</div>
                    <div className="text-emerald-300 font-semibold">{ticketData?.category}</div>
                    <div className="font-mono text-text-muted">{ticketData?.ticketNumber}</div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={resetResult}
                    className="font-bold text-xs"
                  >
                    Lanjut Scan Berikutnya
                  </Button>
                </div>
              )}

              {/* ALREADY USED */}
              {scanResult === 'used' && (
                <div className="max-w-sm space-y-4">
                  <div className="w-20 h-20 bg-warning/20 border-2 border-warning rounded-full flex items-center justify-center mx-auto text-warning">
                    <AlertCircle className="w-10 h-10" strokeWidth={3} />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                      PERINGATAN:
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white">
                      SUDAH DIGUNAKAN
                    </h2>
                  </div>
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-left space-y-1.5 text-xs text-amber-200">
                    <div>Pemilik: <strong className="text-white">{ticketData?.name}</strong></div>
                    <div>Waktu Pertama Masuk: <strong className="text-white">{ticketData?.usedAt}</strong></div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetResult}
                    className="font-bold text-xs border-warning text-warning hover:bg-warning/20"
                  >
                    Tutup
                  </Button>
                </div>
              )}

              {/* INVALID / EXPIRED */}
              {scanResult === 'invalid' && (
                <div className="max-w-sm space-y-4">
                  <div className="w-20 h-20 bg-danger/20 border-2 border-danger rounded-full flex items-center justify-center mx-auto text-danger">
                    <X className="w-10 h-10" strokeWidth={3} />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-red-400">
                      DITOLAK:
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white">
                      TIKET TIDAK VALID
                    </h2>
                  </div>
                  <p className="text-xs text-red-200">{errorMsg}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetResult}
                    className="font-bold text-xs border-danger text-danger hover:bg-danger/20"
                  >
                    Coba Lagi
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
