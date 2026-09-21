'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ZoomIn, ZoomOut, RotateCcw, Lock, Check,
  Clock, Ticket, ChevronRight, X
} from 'lucide-react';
import type { SeatMapData, SeatNode, VenueSectionData } from '@/types';
import { Button, Card, Badge } from '@/components/ui';
import { formatRupiah } from '@/lib/utils';

interface InteractiveSeatMapProps {
  seatMapData: SeatMapData;
  selectedSeats: SeatNode[];
  onToggleSeat: (seat: SeatNode) => void;
  maxSelectable?: number;
  countdownSeconds?: number;
  onProceedToCheckout?: () => void;
  isLocking?: boolean;
}

function formatTimer(totalSecs: number) {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function InteractiveSeatMap({
  seatMapData,
  selectedSeats,
  onToggleSeat,
  maxSelectable = 8,
  countdownSeconds = 0,
  onProceedToCheckout,
  isLocking = false,
}: InteractiveSeatMapProps) {
  const [scale, setScale] = useState(1);
  const [activeSectionId, setActiveSectionId] = useState<number | 'ALL'>('ALL');
  const [hoveredSeat, setHoveredSeat] = useState<SeatNode | null>(null);

  const selectedSeatIds = useMemo(() => new Set(selectedSeats.map((s) => s.id)), [selectedSeats]);

  const layoutGroups = useMemo(() => {
    if (activeSectionId !== 'ALL') {
      const single = seatMapData.sections.filter((s) => s.id === activeSectionId);
      return { hasWings: false, front: [], center: [], left: [], right: [], rear: [], unclassified: [], single };
    }

    const front: VenueSectionData[] = [];
    const center: VenueSectionData[] = [];
    const left: VenueSectionData[] = [];
    const right: VenueSectionData[] = [];
    const rear: VenueSectionData[] = [];
    const unclassified: VenueSectionData[] = [];

    seatMapData.sections.forEach((sec) => {
      const name = sec.name.toLowerCase();
      if (name.includes('front') || name.includes('vvip')) {
        front.push(sec);
      } else if (name.includes('left') || name.includes('kiri') || name.includes('west')) {
        left.push(sec);
      } else if (name.includes('right') || name.includes('kanan') || name.includes('east')) {
        right.push(sec);
      } else if (name.includes('center') || name.includes('gold') || name.includes('tengah')) {
        center.push(sec);
      } else if (name.includes('balcony') || name.includes('balkon') || name.includes('upper') || name.includes('tier 2')) {
        rear.push(sec);
      } else {
        unclassified.push(sec);
      }
    });

    const hasWings = left.length > 0 && right.length > 0;
    return { hasWings, front, center, left, right, rear, unclassified, single: [] };
  }, [seatMapData.sections, activeSectionId]);

  const renderSectionBlock = (sec: VenueSectionData, isWing: boolean = false) => {
    return (
      <div
        key={sec.id}
        className={`p-4 sm:p-5 rounded-2xl bg-surface/50 border relative transition-all duration-200 ${
          isWing ? 'min-w-[280px] max-w-[95%] sm:max-w-[48%] flex-1' : 'min-w-[300px] max-w-[95%]'
        }`}
        style={{ borderColor: `${sec.color}50` }}
      >
        {/* Section Header */}
        <div className="flex justify-between items-center mb-4 pb-2.5 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: sec.color, boxShadow: `0 0 8px ${sec.color}` }}
            />
            <span className="font-extrabold text-sm sm:text-base text-text-primary">
              {sec.name}
            </span>
          </div>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-md"
            style={{
              color: sec.color,
              background: `${sec.color}15`,
              border: `1px solid ${sec.color}35`,
            }}
          >
            {formatRupiah(sec.category_price ?? 0)}
          </span>
        </div>

        {/* Rows & Seat Nodes */}
        <div className="flex flex-col gap-2.5 items-center overflow-x-auto pb-1 scrollbar-none">
          {sec.rows.map((row) => (
            <div key={row.id} className="flex items-center gap-2">
              {/* Left Row Indicator */}
              <span className="w-5 text-[11px] font-bold text-text-muted text-right select-none">
                {row.row_label}
              </span>

              {/* Row Seats */}
              <div className="flex gap-1.5 flex-nowrap items-center">
                {row.seats.map((seat, seatIdx) => {
                  const isSelected = selectedSeatIds.has(seat.id);
                  const isSold = seat.status === 'SOLD';
                  const isBlocked = seat.status === 'BLOCKED';
                  const isLockedOther = seat.status === 'LOCKED' && !seat.is_mine && !isSelected;

                  // Insert aisle separator in the middle of long rows
                  const isAisleGap = row.seats.length > 8 && seatIdx === Math.floor(row.seats.length / 2);

                  let seatBg = `${sec.color}35`;
                  let seatBorder = `1px solid ${sec.color}80`;
                  let seatTextColor = '#FFFFFF';
                  let cursor = 'pointer';
                  let opacity = 1;

                  if (isSelected) {
                    seatBg = '#10B981';
                    seatBorder = '2px solid #FFFFFF';
                    seatTextColor = '#FFFFFF';
                  } else if (isSold) {
                    seatBg = 'rgba(255,255,255,0.08)';
                    seatBorder = '1px solid rgba(255,255,255,0.05)';
                    cursor = 'not-allowed';
                    opacity = 0.35;
                  } else if (isBlocked) {
                    seatBg = 'rgba(239,68,68,0.2)';
                    seatBorder = '1px solid #EF4444';
                    cursor = 'not-allowed';
                    opacity = 0.5;
                  } else if (isLockedOther) {
                    seatBg = '#F59E0B';
                    seatBorder = '1px solid #D97706';
                    cursor = 'not-allowed';
                    opacity = 0.7;
                  }

                  return (
                    <React.Fragment key={seat.id}>
                      {isAisleGap && (
                        <div
                          className="w-2.5 h-4 border-l border-dashed border-white/20 mx-0.5"
                          title="Lorong / Aisle"
                        />
                      )}
                      <motion.button
                        whileHover={!isSold && !isBlocked && !isLockedOther ? { scale: 1.2, y: -2 } : {}}
                        whileTap={!isSold && !isBlocked && !isLockedOther ? { scale: 0.9 } : {}}
                        onClick={() => {
                          if (!isSold && !isBlocked && !isLockedOther) {
                            onToggleSeat(seat);
                          }
                        }}
                        onMouseEnter={() => setHoveredSeat(seat)}
                        onMouseLeave={() => setHoveredSeat(null)}
                        style={{
                          width: 27,
                          height: 27,
                          borderRadius: '6px 6px 3px 3px',
                          background: seatBg,
                          border: seatBorder,
                          color: isSold ? 'transparent' : seatTextColor,
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor,
                          opacity,
                          outline: 'none',
                          position: 'relative',
                          boxShadow: isSelected
                            ? '0 0 12px #10B981, 0 2px 8px rgba(0,0,0,0.5)'
                            : '0 2px 4px rgba(0,0,0,0.2)',
                          transition: 'background-color 0.15s, border-color 0.15s',
                        }}
                      >
                        {isSelected ? (
                          <Check size={12} strokeWidth={3} />
                        ) : isLockedOther ? (
                          <Lock size={10} />
                        ) : (
                          seat.seat_number
                        )}
                      </motion.button>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Right Row Indicator */}
              <span className="w-5 text-[11px] font-bold text-text-muted text-left select-none">
                {row.row_label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const subtotal = useMemo(() => {
    return selectedSeats.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  }, [selectedSeats]);

  const serviceFeeTotal = useMemo(() => {
    return selectedSeats.reduce((sum, s) => sum + (Number(s.service_fee) || 0), 0);
  }, [selectedSeats]);

  const handleZoom = (delta: number) => {
    setScale((prev) => Math.max(0.7, Math.min(1.8, prev + delta)));
  };

  const handleResetZoom = () => {
    setScale(1);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ─── Top Controls & Section Filters ─── */}
      <Card variant="default" className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Section Tabs */}
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            variant={activeSectionId === 'ALL' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveSectionId('ALL')}
            className="text-xs font-bold"
          >
            Semua Zona ({seatMapData.summary.total})
          </Button>
          {seatMapData.sections.map((sec) => {
            const isSelected = activeSectionId === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSectionId(sec.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  isSelected
                    ? 'bg-primary/20 border-primary text-text-primary'
                    : 'bg-card border-border text-text-secondary hover:border-border-bright'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: sec.color }} />
                <span>{sec.name}</span>
                <span className="text-[10px] text-text-muted">
                  {formatRupiah(sec.category_price ?? 0)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => handleZoom(-0.15)}
            title="Perkecil"
            className="w-8 h-8 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold min-w-10 text-center text-text-muted">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => handleZoom(0.15)}
            title="Perbesar"
            className="w-8 h-8 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset Ukuran"
            className="w-8 h-8 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </Card>

      {/* ─── Status Legend ─── */}
      <div className="flex flex-wrap gap-4 sm:gap-6 justify-center p-3 rounded-xl bg-surface/60 border border-border text-xs">
        <div className="flex items-center gap-2 text-text-secondary">
          <div className="w-3.5 h-3.5 rounded-md bg-primary/40 border border-primary/70" />
          <span>Tersedia</span>
        </div>
        <div className="flex items-center gap-2 text-success font-semibold">
          <div className="w-3.5 h-3.5 rounded-md bg-success flex items-center justify-center text-white">
            <Check className="w-2.5 h-2.5" />
          </div>
          <span>Dipilih Anda ({selectedSeats.length}/{maxSelectable})</span>
        </div>
        <div className="flex items-center gap-2 text-warning">
          <div className="w-3.5 h-3.5 rounded-md bg-warning flex items-center justify-center text-white">
            <Lock className="w-2.5 h-2.5" />
          </div>
          <span>Sedang Dikunci (5 mnt)</span>
        </div>
        <div className="flex items-center gap-2 text-text-muted">
          <div className="w-3.5 h-3.5 rounded-md bg-white/10" />
          <span>Terjual</span>
        </div>
        <div className="flex items-center gap-2 text-danger">
          <div className="w-3.5 h-3.5 rounded-md bg-danger/25 border border-danger" />
          <span>Diblokir</span>
        </div>
      </div>

      {/* ─── Active Lock Countdown Banner ─── */}
      {countdownSeconds > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-warning/20 to-danger/20 border border-warning/40 flex items-center justify-between gap-3 flex-wrap"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-warning animate-ping" />
            <span className="text-xs sm:text-sm font-semibold text-text-primary">
              Kursi Anda sedang diamankan. Selesaikan pembayaran sebelum waktu habis:
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg font-mono font-bold text-sm text-warning">
            <Clock className="w-4 h-4" />
            <span>{formatTimer(countdownSeconds)}</span>
          </div>
        </motion.div>
      )}

      {/* ─── Interactive Map Visual Canvas ─── */}
      <div className="relative overflow-auto max-h-[68vh] bg-gradient-to-b from-[#172033] to-[#0B1020] rounded-2xl border border-border p-6 sm:p-10 text-center shadow-inner">
        {/* Stage / Screen Representation */}
        <div className="max-w-xl mx-auto mb-10 relative">
          <div className="h-11 rounded-t-xl rounded-b-3xl bg-gradient-to-b from-primary/60 to-primary/10 border-2 border-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
            <span className="text-xs sm:text-sm font-black tracking-widest text-white uppercase">
              ✦ PANGGUNG UTAMA / STAGE ✦
            </span>
          </div>
          <div className="absolute -bottom-2 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>

        {/* Scalable Container for Sections & Seats */}
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-out',
            display: 'inline-block',
            minWidth: '100%',
          }}
        >
          <div className="flex flex-col gap-8 items-center">
            {layoutGroups.single.length > 0 ? (
              layoutGroups.single.map((sec) => renderSectionBlock(sec))
            ) : layoutGroups.hasWings ? (
              <>
                {/* 1. FRONT TIER */}
                {layoutGroups.front.map((sec) => renderSectionBlock(sec))}

                {/* 2. CENTER TIER */}
                {layoutGroups.center.map((sec) => renderSectionBlock(sec))}

                {/* 3. WINGS TIER (Side-by-side with Aisle) */}
                <div className="flex flex-wrap justify-center items-start gap-6 w-full max-w-5xl relative">
                  {layoutGroups.left.map((sec) => renderSectionBlock(sec, true))}

                  {/* Central Aisle Pathway Visualizer */}
                  <div className="hidden sm:flex flex-col items-center justify-center px-3 py-4 self-stretch text-[10px] font-bold tracking-widest text-white/20 uppercase">
                    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                      ║ LORONG UTAMA (AISLE) ║
                    </span>
                  </div>

                  {layoutGroups.right.map((sec) => renderSectionBlock(sec, true))}
                </div>

                {/* 4. REAR TIER */}
                {layoutGroups.rear.map((sec) => renderSectionBlock(sec))}

                {/* Unclassified */}
                {layoutGroups.unclassified.map((sec) => renderSectionBlock(sec))}
              </>
            ) : (
              seatMapData.sections.map((sec) => renderSectionBlock(sec))
            )}
          </div>
        </div>

        {/* ─── Hover Seat Tooltip ─── */}
        <AnimatePresence>
          {hoveredSeat && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-xl border border-border rounded-xl p-3 z-50 pointer-events-none shadow-2xl flex items-center gap-4 text-left"
            >
              <div>
                <div className="font-extrabold text-sm text-text-primary">{hoveredSeat.label}</div>
                <div className="text-xs text-text-muted">
                  {hoveredSeat.section_name} • Baris {hoveredSeat.row_label}
                </div>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="text-right">
                <div className="font-extrabold text-sm text-success">
                  {formatRupiah(hoveredSeat.price)}
                </div>
                <div
                  className={`text-[10px] font-semibold ${
                    hoveredSeat.status === 'AVAILABLE'
                      ? 'text-success'
                      : hoveredSeat.status === 'LOCKED'
                      ? 'text-warning'
                      : 'text-danger'
                  }`}
                >
                  {hoveredSeat.status === 'AVAILABLE'
                    ? 'Tersedia'
                    : hoveredSeat.status === 'LOCKED'
                    ? 'Sedang Dipilih'
                    : hoveredSeat.status === 'SOLD'
                    ? 'Terjual'
                    : 'Diblokir'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Bottom Floating Checkout Summary Bar ─── */}
      <AnimatePresence>
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-border p-4 sm:px-8 shadow-2xl"
          >
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Selected Seats chips */}
              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                <div className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-success" />
                  <span>
                    Kursi Terpilih ({selectedSeats.length} dari maks {maxSelectable}):
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                  {selectedSeats.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-success/15 text-success border border-success/30"
                    >
                      {s.label}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSeat(s);
                        }}
                        className="hover:text-white transition-colors"
                        aria-label={`Hapus kursi ${s.label}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Total & Action Button */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                <div className="text-left sm:text-right">
                  <div className="text-[10px] uppercase font-bold text-text-muted">Total Pembayaran</div>
                  <div className="text-base sm:text-xl font-black text-success">
                    {formatRupiah(subtotal + serviceFeeTotal)}
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  loading={isLocking}
                  onClick={onProceedToCheckout}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                  className="font-bold shadow-lg shadow-primary/25 shrink-0"
                >
                  {isLocking ? 'Mengunci Kursi...' : 'Kunci Kursi & Bayar'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
