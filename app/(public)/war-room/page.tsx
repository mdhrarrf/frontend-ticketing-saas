'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, ShieldCheck, Database, Server, Users,
  Ticket, Armchair, CreditCard, RefreshCw, AlertTriangle,
  CheckCircle2, XCircle, ArrowUpRight, BarChart3, Radio
} from 'lucide-react';
import { apiService } from '../../../lib/api';

export default function WarRoomPage() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await apiService.warRoom.getTelemetry();
      if (res && res.data) {
        setTelemetry(res.data);
        setLastUpdated(new Date().toLocaleTimeString('id-ID'));
      }
    } catch (err) {
      console.error('Failed to fetch telemetry:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    if (!autoRefresh) return;
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, [fetchTelemetry, autoRefresh]);

  const sys = telemetry?.system || {};
  const comm = telemetry?.commerce || {};
  const seats = telemetry?.seats || {};
  const gates = telemetry?.gates?.breakdown || [];
  const fest = telemetry?.festpay || {};

  return (
    <div style={{ minHeight: '100vh', background: '#090D16', color: '#F1F5F9', fontFamily: 'monospace, system-ui', padding: '24px 20px' }}>
      {/* ── Top Mission Control Header ──────────────── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16, marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Radio size={22} style={{ color: '#EF4444' }} className="animate-pulse" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.05em', color: '#FFFFFF' }}>TIXORA WAR ROOM™</h1>
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.2)', border: '1px solid #10B981', color: '#34D399', fontWeight: 700 }}>
                MISSION CONTROL LIVE
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
              Real-time Ingress, Concurrency, Gate Scanner & Cashless Telemetry
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Update Terakhir: <strong style={{ color: '#E2E8F0' }}>{lastUpdated || 'Menghubungkan...'}</strong>
          </span>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              padding: '6px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              background: autoRefresh ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
              border: autoRefresh ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
              color: autoRefresh ? '#34D399' : '#94A3B8',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <RefreshCw size={13} className={autoRefresh ? 'animate-spin' : ''} />
            {autoRefresh ? 'Auto-Sync (5s)' : 'Paused'}
          </button>
          <button
            onClick={fetchTelemetry}
            style={{ padding: '6px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, background: '#6366F1', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            Refresh Now
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* ── KPI Stat Row ────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {/* DB Health */}
          <div style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Database Engine</span>
              <Database size={16} style={{ color: sys.db_status === 'ONLINE' ? '#10B981' : '#EF4444' }} />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: sys.db_status === 'ONLINE' ? '#34D399' : '#F87171' }}>
              {sys.db_status || '...'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 4 }}>
              Latency: {sys.db_latency_ms !== undefined ? `${sys.db_latency_ms} ms` : '-'}
            </div>
          </div>

          {/* Redis Engine */}
          <div style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Distributed Lock</span>
              <Server size={16} style={{ color: sys.redis_status === 'ONLINE' ? '#10B981' : '#F59E0B' }} />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: sys.redis_status === 'ONLINE' ? '#34D399' : '#FBBF24' }}>
              {sys.redis_status || '...'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 4 }}>
              Redlock Safe Lua Protection
            </div>
          </div>

          {/* Active 300s Seat Locks */}
          <div style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Active Seat Locks</span>
              <Armchair size={16} style={{ color: '#6366F1' }} />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#818CF8' }}>
              {seats.active_locks || 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 4 }}>
              TTL 300s Active Reservations
            </div>
          </div>

          {/* FestPay Total Balance */}
          <div style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Cashless Volume</span>
              <CreditCard size={16} style={{ color: '#10B981' }} />
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#F1F5F9' }}>
              Rp {(fest.total_balance || 0).toLocaleString('id-ID')}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 4 }}>
              {fest.total_wallets || 0} Wallets Terbit
            </div>
          </div>

          {/* Active Users */}
          <div style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase' }}>Live Ingress</span>
              <Users size={16} style={{ color: '#38BDF8' }} />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38BDF8' }}>
              {sys.active_users || 1}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 4 }}>
              Active Sessions
            </div>
          </div>
        </div>

        {/* ── Gate Scanner Telemetry Section ──────────── */}
        <div style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>
                GATE SCANNER TELEMETRY MATRIX
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                Per-Gate Real-time Validation, Token Check-ins & Tampering Defenses
              </p>
            </div>
            <div style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(99,102,241,0.15)', border: '1px solid #6366F1', fontSize: '0.75rem', color: '#A5B4FC', fontWeight: 600 }}>
              Total Check-in: {telemetry?.gates?.total_check_ins || 0}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {gates.map((g: any, idx: number) => (
              <div key={idx} style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#F1F5F9' }}>{g.gate}</span>
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.2)', color: '#34D399', fontWeight: 700 }}>
                    ACTIVE
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: '#94A3B8' }}>Valid Check-ins:</span>
                    <strong style={{ color: '#34D399' }}>{g.valid}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: '#94A3B8' }}>Already Used:</span>
                    <strong style={{ color: '#FBBF24' }}>{g.already_used}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: '#94A3B8' }}>Invalid Token:</span>
                    <strong style={{ color: '#F87171' }}>{g.invalid}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Two Column: Venue Seats & FestPay Cashless ─ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
          {/* Venue & Seat Contention */}
          <div style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 20 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>
              VENUE SEAT ENGINE TELEMETRY
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ background: '#1E293B', padding: 12, borderRadius: 8 }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Total Kursi Terdaftar</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F1F5F9', marginTop: 4 }}>
                  {seats.total_seats || 0}
                </div>
              </div>
              <div style={{ background: '#1E293B', padding: 12, borderRadius: 8 }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Kursi Tersedia</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981', marginTop: 4 }}>
                  {seats.available_seats || 0}
                </div>
              </div>
              <div style={{ background: '#1E293B', padding: 12, borderRadius: 8 }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Sedang Terkunci (300s)</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#6366F1', marginTop: 4 }}>
                  {seats.active_locks || 0}
                </div>
              </div>
              <div style={{ background: '#1E293B', padding: 12, borderRadius: 8 }}>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Kursi Diblokir VIP</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#64748B', marginTop: 4 }}>
                  {seats.blocked_seats || 0}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
              Proteksi Concurrency: Redis Redlock + All-or-nothing rollback pada 409 conflict
            </div>
          </div>

          {/* FestPay Cashless Booth Leaderboard */}
          <div style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 20 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>
              FESTPAY™ CASHLESS BOOTH LEADERBOARD
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(fest.top_booths || []).map((b: any, i: number) => (
                <div key={b.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1E293B', padding: '10px 14px', borderRadius: 8, fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#F1F5F9' }}>#{i + 1} {b.name}</span>
                    <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginLeft: 8 }}>({b.category})</span>
                  </div>
                  <strong style={{ color: '#10B981' }}>Rp {(b.revenue || 0).toLocaleString('id-ID')}</strong>
                </div>
              ))}
              {(!fest.top_booths || fest.top_booths.length === 0) && (
                <p style={{ fontSize: '0.8rem', color: '#64748B', textAlign: 'center', padding: '20px 0' }}>Belum ada transaksi booth hari ini</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
