'use client';

import { useState, useEffect } from 'react';
import { Download, TrendingUp, Calendar, DollarSign, Activity, Users, ArrowUpRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiService } from '../../../lib/api';

function fmt(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)}rb`;
  return `Rp ${n.toLocaleString('id-ID')}`;
}

export default function OrganizerAnalyticsPage() {
  const [dateRange, setDateRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ovRes, revRes] = await Promise.allSettled([
          apiService.organizer.getOverview({ range: dateRange }),
          apiService.organizer.getRevenue({ range: dateRange }),
        ]);

        if (ovRes.status === 'fulfilled') {
          const d = (ovRes.value as any)?.data ?? ovRes.value;
          setOverview(d);
        }
        
        if (revRes.status === 'fulfilled') {
          const d = (revRes.value as any)?.data ?? revRes.value;
          // Sort ascending (oldest to newest) for chart
          const sorted = (Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []).sort((a: any, b: any) => 
             (a.month || a.date)?.localeCompare(b.month || b.date)
          );
          setRevenueData(sorted);
        }
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dateRange]);

  // --- KPI Stats Calculation ---
  const kpis = [
    { label: 'Total Revenue', value: fmt(Number(overview?.total_revenue ?? 0)), icon: DollarSign, color: '#10B981', trend: '+12.5%' },
    { label: 'Tiket Terjual', value: (overview?.total_tickets_sold ?? 0).toLocaleString(), icon: Activity, color: '#6366F1', trend: '+5.2%' },
    { label: 'Total Pesanan', value: (overview?.total_orders ?? 0).toLocaleString(), icon: Users, color: '#F59E0B', trend: '+18.1%' },
    { label: 'Event Aktif', value: (overview?.active_events ?? 0).toLocaleString(), icon: Calendar, color: '#EC4899', trend: '+0.0%' }
  ];

  // --- Chart Calculation ---
  const maxRev = revenueData.length > 0 ? Math.max(...revenueData.map(d => Number(d.gross_revenue))) : 100;
  // Pad maxRev slightly so the highest point isn't exactly at the ceiling
  const yMax = maxRev * 1.1; 
  
  // Create path
  let pathD = '';
  let fillPathD = '';
  let points: {x: number, y: number, label: string, val: number}[] = [];
  
  if (revenueData.length > 1) {
    points = revenueData.map((d, i) => {
      const x = (i / (revenueData.length - 1)) * 100;
      const y = 100 - ((Number(d.gross_revenue) / yMax) * 100);
      return { 
        x, y, 
        label: (d.month || d.date || '').replace('2026-', ''), // Simplified label
        val: Number(d.gross_revenue)
      };
    });
    
    pathD = `M${points.map(p => `${p.x},${p.y}`).join(' L')}`;
    fillPathD = `${pathD} L100,100 L0,100 Z`;
  } else if (revenueData.length === 1) {
    // If only one data point, draw a flat line
    points = [
      { x: 0, y: 50, label: revenueData[0].month || revenueData[0].date, val: Number(revenueData[0].gross_revenue) },
      { x: 100, y: 50, label: '', val: Number(revenueData[0].gross_revenue) }
    ];
    pathD = `M0,50 L100,50`;
    fillPathD = `M0,50 L100,50 L100,100 L0,100 Z`;
  }

  // Generate Y-axis labels
  const yLabels = [yMax, yMax * 0.75, yMax * 0.5, yMax * 0.25, 0].map(v => {
    if (v === 0) return '0';
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return v.toString();
  });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, marginBottom: 4, color: 'var(--text-primary)' }}>Analytics & Laporan</h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pantau performa penjualan event dan pendapatan Anda</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input"
              style={{ padding: '8px 12px', minWidth: 160, fontSize: '0.875rem' }}
            >
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
              <option value="90d">90 Hari Terakhir</option>
              <option value="all">Semua Waktu</option>
            </select>
            
            <button style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', 
              borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)', 
              color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' 
            }}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        {kpis.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
              <span style={{ 
                display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 20, 
                fontSize: '0.75rem', fontWeight: 700, 
                background: stat.trend.startsWith('+') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', 
                color: stat.trend.startsWith('+') ? '#10B981' : '#EF4444' 
              }}>
                {stat.trend} <ArrowUpRight size={12} style={{ transform: stat.trend.startsWith('-') ? 'rotate(90deg)' : 'none' }}/>
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>{stat.label}</div>
            {loading ? (
              <div style={{ height: 28, width: 100, background: 'var(--background-2)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
            ) : (
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</div>
            )}
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {/* Main Chart Area */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, gridColumn: '1 / -1' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} style={{ color: 'var(--color-primary)' }}/> Revenue Trend
            </h2>
            {loading && <Loader2 size={16} style={{ color: 'var(--color-primary)', animation: 'spin-slow 1s linear infinite' }} />}
          </div>

          <div style={{ height: 320, width: '100%', position: 'relative' }}>
            {/* Y-Axis */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 20, width: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {yLabels.map((l, i) => <span key={i}>{l}</span>)}
            </div>
            
            {/* Chart Area */}
            <div style={{ position: 'absolute', left: 50, right: 0, top: 8, bottom: 20 }}>
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((p, i) => (
                <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${p}%`, height: 1, background: 'var(--border)', borderTop: '1px dashed var(--border)' }} />
              ))}
              
              {/* SVG Chart */}
              {revenueData.length > 0 ? (
                <svg style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1, overflow: 'visible' }} preserveAspectRatio="none" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="gradientLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--color-primary)" />
                      <stop offset="100%" stopColor="var(--color-secondary)" />
                    </linearGradient>
                    <linearGradient id="gradientFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  <path d={fillPathD} fill="url(#gradientFill)" />
                  <path d={pathD} fill="none" stroke="url(#gradientLine)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                  
                  {/* Data points */}
                  {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--card)" stroke="var(--color-primary)" strokeWidth="2" vectorEffect="non-scaling-stroke">
                      <title>{p.label}: {fmt(p.val)}</title>
                    </circle>
                  ))}
                </svg>
              ) : !loading ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Tidak ada data revenue pada rentang waktu ini.
                </div>
              ) : null}
            </div>
            
            {/* X-Axis Labels */}
            <div style={{ position: 'absolute', left: 50, right: 0, bottom: -5, display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', paddingTop: 8 }}>
              {points.map((p, i) => (
                <span key={i} style={{ position: 'absolute', left: `${p.x}%`, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
