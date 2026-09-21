'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Clock, ArrowLeft, Ticket, User, Mail,
  Phone, CreditCard, ChevronRight, AlertTriangle, Loader2
} from 'lucide-react';
import { apiService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Event, TicketCategory, SeatNode } from '@/types';

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuthStore();

  const eventId     = searchParams.get('event');
  const catId       = searchParams.get('cat');
  const seatsParam  = searchParams.get('seats');
  const sessionId   = searchParams.get('session_id') || '';
  const queueToken  = searchParams.get('queue_token');

  const [event, setEvent] = useState<Event | null>(null);
  const [selectedCat, setSelectedCat] = useState<TicketCategory | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [seatNodes, setSeatNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Attendee state
  const [attendees, setAttendees] = useState<{ name: string; email: string; phone: string; id_number: string }[]>([
    { name: '', email: '', phone: '', id_number: '' },
  ]);

  // Auth check
  useEffect(() => {
    if (!token) {
      const currentUrl = window.location.pathname + window.location.search;
      router.replace(`/login?redirect=${encodeURIComponent(currentUrl)}`);
    }
  }, [token, router]);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setAttendees([
        {
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          id_number: user.id_number || '',
        },
      ]);
    }
  }, [user]);

  // Load Event & Seats / Category data
  const loadData = useCallback(async () => {
    if (!eventId) {
      setError('Parameter event tidak valid.');
      setLoading(false);
      return;
    }

    try {
      const evRes = await apiService.events.getEvent(eventId);
      const ev = (evRes as any)?.data ?? evRes;
      setEvent(ev);

      // Mode A: Seated Event (seats param present)
      if (seatsParam) {
        const seatIds = seatsParam.split(',').map((id) => parseInt(id, 10)).filter(Boolean);
        const mapRes = await apiService.seatMap.getSeatMap(ev.slug, sessionId);
        const mapData = (mapRes as any)?.data ?? mapRes;

        const matchedSeats: any[] = [];
        mapData.sections?.forEach((sec: any) => {
          sec.rows?.forEach((row: any) => {
            row.seats?.forEach((s: any) => {
              if (seatIds.includes(s.id)) {
                matchedSeats.push(s);
              }
            });
          });
        });

        setSeatNodes(matchedSeats);
        setQuantity(matchedSeats.length || 1);

        // Adjust attendees array size
        setAttendees(Array.from({ length: matchedSeats.length || 1 }, (_, i) => ({
          name: i === 0 && user ? user.name : '',
          email: i === 0 && user ? user.email : '',
          phone: i === 0 && user ? user.phone || '' : '',
          id_number: i === 0 && user ? user.id_number || '' : '',
        })));
      }
      // Mode B: Ticket Category selection
      else if (catId) {
        const catsRes = await apiService.events.getEventCategories(ev.slug);
        const cats = (catsRes as any)?.data ?? catsRes;
        const found = cats.find((c: TicketCategory) => String(c.id) === String(catId));
        if (found) {
          setSelectedCat(found);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memuat rincian pesanan.');
    } finally {
      setLoading(false);
    }
  }, [eventId, catId, seatsParam, sessionId, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update attendee fields
  const handleAttendeeChange = (idx: number, field: string, val: string) => {
    setAttendees((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  // Compute pricing
  const subtotal = seatsParam && seatNodes.length > 0
    ? seatNodes.reduce((sum, s) => sum + (Number(s.price) || 0), 0)
    : (Number(selectedCat?.price || 0) * quantity);

  const serviceFee = seatsParam && seatNodes.length > 0
    ? seatNodes.reduce((sum, s) => sum + (Number(s.service_fee) || 0), 0)
    : (Number(selectedCat?.service_fee || 0) * quantity);

  const totalAmount = subtotal + serviceFee;

  // Submit order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setCreating(true);
    setError('');

    try {
      let orderItems: any[] = [];

      if (seatsParam && seatNodes.length > 0) {
        // Group seats by ticket category
        const grouped: Record<string, { catId: number; count: number; attendees: any[] }> = {};
        seatNodes.forEach((seat, idx) => {
          const cId = seat.ticket_category_id || 1;
          if (!grouped[cId]) {
            grouped[cId] = { catId: cId, count: 0, attendees: [] };
          }
          grouped[cId].count += 1;
          grouped[cId].attendees.push({
            name: attendees[idx]?.name || user?.name,
            email: attendees[idx]?.email || user?.email,
            phone: attendees[idx]?.phone || user?.phone,
            id_number: attendees[idx]?.id_number || user?.id_number,
            seat: seat.label,
          });
        });

        orderItems = Object.values(grouped).map((g) => ({
          ticket_category_id: g.catId,
          quantity: g.count,
          attendees: g.attendees,
        }));
      } else if (selectedCat) {
        orderItems = [{
          ticket_category_id: selectedCat.id,
          quantity: quantity,
          attendees: attendees.map((att) => ({
            name: att.name || user?.name,
            email: att.email || user?.email,
            phone: att.phone || user?.phone,
            id_number: att.id_number || user?.id_number,
          })),
        }];
      } else {
        throw new Error('Kategori tiket atau kursi belum dipilih.');
      }

      const payload = {
        event_id: event.id,
        items: orderItems,
        checkout_token: queueToken || undefined,
        buyer_data: {
          name: attendees[0]?.name || user?.name,
          email: attendees[0]?.email || user?.email,
          phone: attendees[0]?.phone || user?.phone,
        },
      };

      const res = await apiService.orders.createOrder(payload);
      const order = (res as any)?.data ?? res;

      // Navigate to payment page
      router.push(`/checkout/${order.order_number}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Gagal membuat pesanan. Silakan coba lagi.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Loader2 size={36} className="animate-spin" style={{ color: '#6366F1' }} />
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Menyiapkan form checkout...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '30px 20px 100px 20px', maxWidth: 1000, margin: '0 auto' }}>
      {/* ─── Header Navigation ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} />
          <span>Kembali</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: 20 }}>
          <ShieldCheck size={14} />
          <span>Checkout Terenkripsi 256-bit</span>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '12px 18px', borderRadius: 12, marginBottom: 20,
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#EF4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </motion.div>
      )}

      <form onSubmit={handleCreateOrder} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* ─── LEFT COLUMN: Attendee Details ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            padding: 24, borderRadius: 18,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'white' }}>
              <User size={18} style={{ color: '#6366F1' }} />
              Informasi Pemesan & Pengunjung
            </h2>

            {attendees.map((att, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: idx < attendees.length - 1 ? 20 : 0,
                  paddingBottom: idx < attendees.length - 1 ? 20 : 0,
                  borderBottom: idx < attendees.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6366F1', marginBottom: 12 }}>
                  Tiket #{idx + 1} {seatNodes[idx] ? `(${seatNodes[idx].label})` : ''}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                      Nama Lengkap (Sesuai KTP)
                    </label>
                    <input
                      type="text"
                      required
                      value={att.name}
                      onChange={(e) => handleAttendeeChange(idx, 'name', e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                        color: 'white', fontSize: '0.88rem',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={att.email}
                        onChange={(e) => handleAttendeeChange(idx, 'email', e.target.value)}
                        placeholder="nama@email.com"
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 10,
                          background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                          color: 'white', fontSize: '0.88rem',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                        Nomor WhatsApp
                      </label>
                      <input
                        type="tel"
                        required
                        value={att.phone}
                        onChange={(e) => handleAttendeeChange(idx, 'phone', e.target.value)}
                        placeholder="08123456789"
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: 10,
                          background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                          color: 'white', fontSize: '0.88rem',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                      Nomor KTP / Paspor
                    </label>
                    <input
                      type="text"
                      value={att.id_number}
                      onChange={(e) => handleAttendeeChange(idx, 'id_number', e.target.value)}
                      placeholder="3171xxxxxxxxxxxx"
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                        color: 'white', fontSize: '0.88rem',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Order Summary ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            padding: 24, borderRadius: 18,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'white' }}>
              <Ticket size={18} style={{ color: '#EC4899' }} />
              Ringkasan Pesanan
            </h2>

            {event && (
              <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'white', marginBottom: 4 }}>
                  {event.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                  {new Date(event.event_date).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                </div>
              </div>
            )}

            {/* Selected Seats Breakdown or Category */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {seatsParam && seatNodes.length > 0 ? (
                <>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                    Kursi Terpilih ({seatNodes.length}):
                  </div>
                  {seatNodes.map((seat) => (
                    <div
                      key={seat.id}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}
                    >
                      <span style={{ color: 'white' }}>{seat.label} ({seat.section_name})</span>
                      <span style={{ fontWeight: 700, color: 'white' }}>{formatRupiah(seat.price)}</span>
                    </div>
                  ))}
                </>
              ) : selectedCat ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'white' }}>{selectedCat.name} × {quantity}</span>
                  <span style={{ fontWeight: 700, color: 'white' }}>{formatRupiah(Number(selectedCat.price) * quantity)}</span>
                </div>
              ) : null}

              {serviceFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                  <span>Biaya Layanan</span>
                  <span>{formatRupiah(serviceFee)}</span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', marginBottom: 24,
            }}>
              <span style={{ fontWeight: 700, color: 'white' }}>Total Pembayaran</span>
              <span style={{ fontWeight: 900, fontSize: '1.3rem', color: '#10B981' }}>
                {formatRupiah(totalAmount)}
              </span>
            </div>

            <button
              type="submit"
              disabled={creating}
              style={{
                width: '100%', padding: '14px', borderRadius: 12,
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                color: 'white', fontWeight: 800, fontSize: '0.95rem',
                border: 'none', cursor: creating ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)', opacity: creating ? 0.7 : 1,
              }}
            >
              {creating ? (
                <>Memproses Pesanan...</>
              ) : (
                <>
                  Lanjut ke Pembayaran <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={36} className="animate-spin" style={{ color: '#6366F1' }} />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
