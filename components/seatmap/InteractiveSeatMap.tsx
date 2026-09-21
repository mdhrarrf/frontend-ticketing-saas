'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ZoomIn, ZoomOut, RotateCcw, Lock, Check,
  AlertCircle, Shield, Clock, Ticket, ChevronRight, X
} from 'lucide-react';
import type { SeatMapData, SeatNode, VenueSectionData } from '@/types';

interface InteractiveSeatMapProps {
  seatMapData: SeatMapData;
  selectedSeats: SeatNode[];
  onToggleSeat: (seat: SeatNode) => void;
  maxSelectable?: number;
  countdownSeconds?: number;
  onProceedToCheckout?: () => void;
  isLocking?: boolean;
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
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

  const filteredSections = useMemo(() => {
    if (activeSectionId === 'ALL') return seatMapData.sections;
    return seatMapData.sections.filter((s) => s.id === activeSectionId);
  }, [seatMapData.sections, activeSectionId]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ─── Top Controls & Section Filters ─── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
        alignItems: 'center', gap: 12, padding: '14px 18px',
        background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)',
        borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)'
      }}>
        {/* Section Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setActiveSectionId('ALL')}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700,
              cursor: 'pointer', border: '1px solid',
              background: activeSectionId === 'ALL' ? '#6366F1' : 'rgba(255,255,255,0.05)',
              borderColor: activeSectionId === 'ALL' ? '#6366F1' : 'rgba(255,255,255,0.1)',
              color: 'white', transition: 'all 0.2s',
            }}
          >
            Semua Zona ({seatMapData.summary.total})
          </button>
          {seatMapData.sections.map((sec) => {
            const isSelected = activeSectionId === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSectionId(sec.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
                  cursor: 'pointer', border: '1px solid',
                  background: isSelected ? `${sec.color}25` : 'rgba(255,255,255,0.05)',
                  borderColor: isSelected ? sec.color : 'rgba(255,255,255,0.1)',
                  color: isSelected ? sec.color : 'rgba(255,255,255,0.7)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: sec.color }} />
                <span>{sec.name}</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                  {formatRupiah(sec.category_price ?? 0)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => handleZoom(-0.15)}
            title="Perkecil"
            style={{
              width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'white', cursor: 'pointer',
            }}
          >
            <ZoomOut size={16} />
          </button>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: 40, textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => handleZoom(0.15)}
            title="Perbesar"
            style={{
              width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'white', cursor: 'pointer',
            }}
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset Ukuran"
            style={{
              width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'white', cursor: 'pointer',
            }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* ─── Status Legend ─── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center',
        padding: '10px 16px', background: 'rgba(255,255,255,0.03)',
        borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.8)' }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: '#6366F1' }} />
          <span>Tersedia</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', fontWeight: 700 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={10} color="white" />
          </div>
          <span>Dipilih Anda ({selectedSeats.length}/{maxSelectable})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#F59E0B' }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={9} color="white" />
          </div>
          <span>Sedang Dikunci (5 mnt)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)' }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.15)' }} />
          <span>Terjual</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EF4444' }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: 'rgba(239,68,68,0.3)', border: '1px solid #EF4444' }} />
          <span>Diblokir</span>
        </div>
      </div>

      {/* ─── Active Lock Countdown Banner ─── */}
      {countdownSeconds > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '12px 18px', borderRadius: 12,
            background: 'linear-gradient(90deg, rgba(245,158,11,0.2) 0%, rgba(239,68,68,0.2) 100%)',
            border: '1px solid rgba(245,158,11,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>
              Kursi Anda sedang diamankan. Selesaikan pembayaran sebelum waktu habis:
            </span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,0,0,0.4)', padding: '6px 12px', borderRadius: 8,
            fontWeight: 800, fontSize: '1rem', color: '#F59E0B'
          }}>
            <Clock size={16} />
            <span>{formatTimer(countdownSeconds)}</span>
          </div>
        </motion.div>
      )}

      {/* ─── Interactive Map Visual Canvas ─── */}
      <div style={{
        position: 'relative', overflow: 'auto', maxHeight: '68vh',
        background: 'radial-gradient(circle at center, #1E293B 0%, #0F172A 100%)',
        borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)',
        padding: '40px 24px 80px 24px', textAlign: 'center',
      }}>
        {/* Stage / Screen Representation */}
        <div style={{
          maxWidth: 600, margin: '0 auto 50px auto', position: 'relative',
        }}>
          <div style={{
            height: 48, borderRadius: '12px 12px 30px 30px',
            background: 'linear-gradient(180deg, rgba(99,102,241,0.6) 0%, rgba(99,102,241,0.15) 100%)',
            border: '2px solid rgba(99,102,241,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 25px rgba(99,102,241,0.3)',
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.2em', color: 'white', textTransform: 'uppercase' }}>
              ✦ PANGGUNG UTAMA / STAGE ✦
            </span>
          </div>
          <div style={{
            position: 'absolute', bottom: -12, left: '20%', right: '20%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)'
          }} />
        </div>

        {/* Scalable Container for Sections & Seats */}
        <div style={{
          transform: `scale(${scale})`, transformOrigin: 'top center',
          transition: 'transform 0.2s ease-out', display: 'inline-block',
          minWidth: '100%',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 36, alignItems: 'center' }}>
            {filteredSections.map((sec) => (
              <div
                key={sec.id}
                style={{
                  padding: 20, borderRadius: 16,
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${sec.color}35`,
                  position: 'relative', minWidth: 340, maxWidth: '95%',
                }}
              >
                {/* Section Header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: sec.color }} />
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'white' }}>{sec.name}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: sec.color }}>
                    {formatRupiah(sec.category_price ?? 0)}
                  </span>
                </div>

                {/* Rows & Seat Nodes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                  {sec.rows.map((row) => (
                    <div
                      key={row.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                      {/* Left Row Indicator */}
                      <span style={{
                        width: 24, fontSize: '0.75rem', fontWeight: 800,
                        color: 'rgba(255,255,255,0.4)', textAlign: 'right', userSelect: 'none'
                      }}>
                        {row.row_label}
                      </span>

                      {/* Row Seats */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'nowrap' }}>
                        {row.seats.map((seat) => {
                          const isSelected = selectedSeatIds.has(seat.id);
                          const isSold = seat.status === 'SOLD';
                          const isBlocked = seat.status === 'BLOCKED';
                          const isLockedOther = seat.status === 'LOCKED' && !seat.is_mine && !isSelected;

                          let seatBg = sec.color;
                          let seatBorder = 'transparent';
                          let cursor = 'pointer';
                          let opacity = 1;

                          if (isSelected) {
                            seatBg = '#10B981';
                            seatBorder = '2px solid #FFFFFF';
                          } else if (isSold) {
                            seatBg = 'rgba(255,255,255,0.12)';
                            cursor = 'not-allowed';
                            opacity = 0.4;
                          } else if (isBlocked) {
                            seatBg = 'rgba(239,68,68,0.2)';
                            seatBorder = '1px solid #EF4444';
                            cursor = 'not-allowed';
                            opacity = 0.5;
                          } else if (isLockedOther) {
                            seatBg = '#F59E0B';
                            cursor = 'not-allowed';
                            opacity = 0.65;
                          }

                          return (
                            <motion.button
                              key={seat.id}
                              whileHover={!isSold && !isBlocked && !isLockedOther ? { scale: 1.2 } : {}}
                              whileTap={!isSold && !isBlocked && !isLockedOther ? { scale: 0.9 } : {}}
                              onClick={() => {
                                if (!isSold && !isBlocked && !isLockedOther) {
                                  onToggleSeat(seat);
                                }
                              }}
                              onMouseEnter={() => setHoveredSeat(seat)}
                              onMouseLeave={() => setHoveredSeat(null)}
                              style={{
                                width: 26, height: 26, borderRadius: 6,
                                background: seatBg, border: seatBorder,
                                color: isSold ? 'transparent' : 'white',
                                fontSize: '0.65rem', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor, opacity, outline: 'none', position: 'relative',
                                boxShadow: isSelected ? '0 0 10px #10B981' : 'none',
                                transition: 'background-color 0.15s',
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
                          );
                        })}
                      </div>

                      {/* Right Row Indicator */}
                      <span style={{
                        width: 24, fontSize: '0.75rem', fontWeight: 800,
                        color: 'rgba(255,255,255,0.4)', textAlign: 'left', userSelect: 'none'
                      }}>
                        {row.row_label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Hover Seat Tooltip ─── */}
        <AnimatePresence>
          {hoveredSeat && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
                padding: '10px 18px', zIndex: 100, pointerEvents: 'none',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 14,
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'white' }}>
                  {hoveredSeat.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                  {hoveredSeat.section_name} • Baris {hoveredSeat.row_label}
                </div>
              </div>
              <div style={{ height: 24, width: 1, background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#10B981' }}>
                  {formatRupiah(hoveredSeat.price)}
                </div>
                <div style={{ fontSize: '0.7rem', color: hoveredSeat.status === 'AVAILABLE' ? '#10B981' : hoveredSeat.status === 'LOCKED' ? '#F59E0B' : '#EF4444' }}>
                  {hoveredSeat.status === 'AVAILABLE' ? 'Tersedia' : hoveredSeat.status === 'LOCKED' ? 'Sedang Dipilih' : hoveredSeat.status === 'SOLD' ? 'Terjual' : 'Diblokir'}
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
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99,
              background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(16px)',
              borderTop: '1px solid rgba(255,255,255,0.12)', padding: '16px 24px',
              boxShadow: '0 -10px 30px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{
              maxWidth: 1200, margin: '0 auto',
              display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between',
              alignItems: 'center', gap: 16
            }}>
              {/* Selected Seats chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 260 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Ticket size={14} style={{ color: '#10B981' }} />
                  <span>Kursi Terpilih ({selectedSeats.length} dari maks {maxSelectable}):</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedSeats.map((s) => (
                    <span
                      key={s.id}
                      style={{
                        padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700,
                        background: 'rgba(16, 185, 129, 0.15)', color: '#10B981',
                        border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      {s.label}
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleSeat(s); }}
                        style={{ background: 'none', border: 'none', color: '#10B981', cursor: 'pointer', padding: 0, display: 'flex' }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Total & Action Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Total Pembayaran</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981' }}>
                    {formatRupiah(subtotal + serviceFeeTotal)}
                  </div>
                </div>

                <button
                  disabled={isLocking}
                  onClick={onProceedToCheckout}
                  style={{
                    padding: '14px 28px', borderRadius: 12, fontWeight: 800, fontSize: '0.95rem',
                    background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                    color: 'white', border: 'none', cursor: isLocking ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 4px 20px rgba(99,102,241,0.4)', opacity: isLocking ? 0.7 : 1,
                  }}
                >
                  {isLocking ? (
                    <>Mengunci Kursi...</>
                  ) : (
                    <>
                      Kunci Kursi & Bayar <ChevronRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
