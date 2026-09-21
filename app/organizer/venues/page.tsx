'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Plus, Grid, CheckCircle, AlertTriangle,
  Loader2, Layers, RefreshCw, X, Shield, Lock, Eye
} from 'lucide-react';
import { apiService } from '@/lib/api';
import type { Venue } from '@/types';

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function OrganizerVenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<any | null>(null);
  const [venueData, setVenueData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal states
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);

  // Form states
  const [secForm, setSecForm] = useState({
    name: '',
    code: '',
    color: '#6366F1',
    category_id: '',
    capacity: 50,
  });

  const [genForm, setGenForm] = useState({
    start_row: 'A',
    end_row: 'D',
    seats_per_row: 10,
    price_override: '',
  });

  // Load venues list
  const loadVenues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.venues.getVenues();
      const list = (res as any)?.data ?? res ?? [];
      setVenues(Array.isArray(list) ? list : []);
      if (list.length > 0) {
        setSelectedVenue(list[0]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat daftar venue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  // Load selected venue sections & seats
  const loadVenueDetails = useCallback(async (venueId: number | string) => {
    setLoadingDetails(true);
    setError('');
    try {
      const res = await apiService.seatMap.getVenueSections(venueId);
      const data = (res as any)?.data ?? res;
      setVenueData(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat detail denah kursi venue.');
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (selectedVenue?.id) {
      loadVenueDetails(selectedVenue.id);
    }
  }, [selectedVenue, loadVenueDetails]);

  // Handle Section Creation
  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVenue) return;
    try {
      await apiService.seatMap.createVenueSection(selectedVenue.id, {
        name: secForm.name,
        code: secForm.code,
        color: secForm.color,
        capacity: Number(secForm.capacity) || 0,
      });
      setShowSectionModal(false);
      setSecForm({ name: '', code: '', color: '#6366F1', category_id: '', capacity: 50 });
      setSuccessMsg('Seksi tempat duduk berhasil dibuat.');
      loadVenueDetails(selectedVenue.id);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal membuat seksi venue.');
    }
  };

  // Handle Seats Generation
  const handleGenerateSeats = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVenue || !selectedSectionId) return;
    try {
      await apiService.seatMap.generateSeats(selectedVenue.id, {
        section_id: selectedSectionId,
        start_row: genForm.start_row,
        end_row: genForm.end_row,
        seats_per_row: Number(genForm.seats_per_row),
        price_override: genForm.price_override ? Number(genForm.price_override) : undefined,
      });
      setShowGenerateModal(false);
      setSuccessMsg('Grid kursi berhasil digenerate.');
      loadVenueDetails(selectedVenue.id);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal menghasilkan kursi.');
    }
  };

  // Toggle seat status
  const handleToggleSeatStatus = async (seat: any) => {
    if (!selectedVenue) return;
    const newStatus = seat.status === 'BLOCKED' ? 'AVAILABLE' : 'BLOCKED';
    try {
      await apiService.seatMap.updateSeat(selectedVenue.id, seat.id, {
        status: newStatus,
      });
      // Update local state smoothly
      setVenueData((prev: any) => {
        if (!prev) return prev;
        const nextSections = prev.sections.map((sec: any) => ({
          ...sec,
          rows: sec.rows.map((row: any) => ({
            ...row,
            seats: row.seats.map((s: any) =>
              s.id === seat.id ? { ...s, status: newStatus } : s
            ),
          })),
        }));
        return { ...prev, sections: nextSections };
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memperbarui status kursi.');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Loader2 size={36} className="animate-spin" style={{ color: '#6366F1' }} />
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Memuat denah venue...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: '#6366F1', color: 'white' }}>
              SEAT MAP BUILDER
            </span>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Venue Management Engine</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white', margin: 0 }}>
            Peta Kursi & Denah Venue
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', marginTop: 4 }}>
            Kelola sektor, baris, dan kursi untuk event bertempat duduk. Klik kursi untuk memblokir/mengaktifkan.
          </p>
        </div>

        {selectedVenue && (
          <button
            onClick={() => setShowSectionModal(true)}
            style={{
              padding: '10px 18px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700,
              background: '#6366F1', color: 'white', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
            }}
          >
            <Plus size={16} /> Tambah Sektor Kursi
          </button>
        )}
      </div>

      {successMsg && (
        <div style={{
          padding: '12px 18px', borderRadius: 12, marginBottom: 20,
          background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10B981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px 18px', borderRadius: 12, marginBottom: 20,
          background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#EF4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Venue Selector Tabs ─── */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16, marginBottom: 24 }}>
        {venues.map((v) => {
          const isSelected = selectedVenue?.id === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setSelectedVenue(v)}
              style={{
                padding: '10px 18px', borderRadius: 12, fontSize: '0.85rem', fontWeight: 700,
                cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap',
                background: isSelected ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                borderColor: isSelected ? '#6366F1' : 'rgba(255,255,255,0.08)',
                color: isSelected ? 'white' : 'rgba(255,255,255,0.6)',
                display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s',
              }}
            >
              <MapPin size={15} style={{ color: isSelected ? '#6366F1' : 'rgba(255,255,255,0.4)' }} />
              <span>{v.name}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Venue Sections & Builder Canvas ─── */}
      {loadingDetails ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <Loader2 size={30} className="animate-spin" style={{ color: '#6366F1', margin: '0 auto 12px auto' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Memuat denah kursi...</p>
        </div>
      ) : venueData?.sections && venueData.sections.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {venueData.sections.map((sec: any) => (
            <div
              key={sec.id}
              style={{
                padding: 24, borderRadius: 18,
                background: 'rgba(255,255,255,0.02)', border: `1px solid ${sec.color}35`,
              }}
            >
              {/* Section Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: sec.color }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', margin: 0 }}>{sec.name}</h3>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 6 }}>
                    {sec.code} • Kapasitas: {sec.capacity}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSelectedSectionId(sec.id);
                    setShowGenerateModal(true);
                  }}
                  style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Grid size={14} /> Generate Baris & Kursi
                </button>
              </div>

              {/* Rows & Interactive Seat Matrix */}
              {sec.rows && sec.rows.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowX: 'auto', padding: '10px 0' }}>
                  {sec.rows.map((row: any) => (
                    <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 28, fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>
                        {row.row_label}
                      </span>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'nowrap' }}>
                        {row.seats.map((seat: any) => {
                          const isBlocked = seat.status === 'BLOCKED';
                          return (
                            <button
                              key={seat.id}
                              onClick={() => handleToggleSeatStatus(seat)}
                              title={`Klik untuk ${isBlocked ? 'buka' : 'blokir'} ${seat.label}`}
                              style={{
                                width: 30, height: 30, borderRadius: 6,
                                background: isBlocked ? 'rgba(239,68,68,0.25)' : sec.color,
                                border: isBlocked ? '2px solid #EF4444' : 'none',
                                color: 'white', fontSize: '0.65rem', fontWeight: 800,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.15s', opacity: isBlocked ? 0.6 : 1,
                              }}
                            >
                              {isBlocked ? <Lock size={12} color="#EF4444" /> : seat.seat_number}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                  Belum ada baris atau kursi pada seksi ini. Klik <strong>Generate Baris & Kursi</strong> untuk membuatnya otomatis.
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 20px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Layers size={48} style={{ opacity: 0.3, margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>Belum Ada Sektor Kursi</h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 440, margin: '8px auto 20px auto', fontSize: '0.88rem' }}>
            Venue ini belum memiliki sektor tempat duduk. Tambahkan sektor pertama Anda seperti VIP atau Tribun.
          </p>
          <button
            onClick={() => setShowSectionModal(true)}
            style={{
              padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: '0.88rem',
              background: '#6366F1', color: 'white', border: 'none', cursor: 'pointer',
            }}
          >
            + Buat Sektor Kursi Baru
          </button>
        </div>
      )}

      {/* ─── Modal: Create Section ─── */}
      <AnimatePresence>
        {showSectionModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%', maxWidth: 460, borderRadius: 18,
                background: '#0F172A', border: '1px solid rgba(255,255,255,0.12)',
                padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', margin: 0 }}>
                  Tambah Sektor Tempat Duduk
                </h3>
                <button
                  onClick={() => setShowSectionModal(false)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSection} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                    Nama Sektor
                  </label>
                  <input
                    type="text"
                    required
                    value={secForm.name}
                    onChange={(e) => setSecForm({ ...secForm, name: e.target.value })}
                    placeholder="Contoh: VIP Tribuna Barat"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                      color: 'white', fontSize: '0.85rem', outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                      Kode Sektor
                    </label>
                    <input
                      type="text"
                      required
                      value={secForm.code}
                      onChange={(e) => setSecForm({ ...secForm, code: e.target.value })}
                      placeholder="SEC-VIP"
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                        color: 'white', fontSize: '0.85rem', outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                      Warna Label
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42 }}>
                      <input
                        type="color"
                        value={secForm.color}
                        onChange={(e) => setSecForm({ ...secForm, color: e.target.value })}
                        style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent' }}
                      />
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'white' }}>{secForm.color}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowSectionModal(false)}
                    style={{
                      padding: '10px 16px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 600,
                      background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white', cursor: 'pointer',
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 20px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700,
                      background: '#6366F1', border: 'none', color: 'white', cursor: 'pointer',
                    }}
                  >
                    Simpan Sektor
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Modal: Generate Seats ─── */}
      <AnimatePresence>
        {showGenerateModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%', maxWidth: 440, borderRadius: 18,
                background: '#0F172A', border: '1px solid rgba(255,255,255,0.12)',
                padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', margin: 0 }}>
                  Generate Baris & Kursi Otomatis
                </h3>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleGenerateSeats} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                      Dari Baris
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      required
                      value={genForm.start_row}
                      onChange={(e) => setGenForm({ ...genForm, start_row: e.target.value.toUpperCase() })}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                        color: 'white', fontSize: '0.9rem', fontWeight: 700, textAlign: 'center', outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                      Sampai Baris
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      required
                      value={genForm.end_row}
                      onChange={(e) => setGenForm({ ...genForm, end_row: e.target.value.toUpperCase() })}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                        color: 'white', fontSize: '0.9rem', fontWeight: 700, textAlign: 'center', outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                    Jumlah Kursi per Baris
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={genForm.seats_per_row}
                    onChange={(e) => setGenForm({ ...genForm, seats_per_row: parseInt(e.target.value, 10) || 1 })}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                      color: 'white', fontSize: '0.85rem', outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    style={{
                      padding: '10px 16px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 600,
                      background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white', cursor: 'pointer',
                    }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 20px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700,
                      background: '#10B981', border: 'none', color: 'white', cursor: 'pointer',
                    }}
                  >
                    Generate Kursi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
