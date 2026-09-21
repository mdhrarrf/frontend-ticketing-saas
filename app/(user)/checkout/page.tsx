'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShieldCheck, ArrowLeft, Ticket, User,
  ChevronRight
} from 'lucide-react';
import { apiService } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Event, TicketCategory } from '@/types';
import {
  Button,
  Card,
  Input,
  FormField,
  Alert,
  LoadingState,
} from '@/components/ui';
import { PageContainer } from '@/components/layout';
import { formatRupiah } from '@/lib/utils';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuthStore();

  const eventId = searchParams.get('event');
  const catId = searchParams.get('cat');
  const seatsParam = searchParams.get('seats');
  const sessionId = searchParams.get('session_id') || '';
  const queueToken = searchParams.get('queue_token');

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
        setAttendees(
          Array.from({ length: matchedSeats.length || 1 }, (_, i) => ({
            name: i === 0 && user ? user.name : '',
            email: i === 0 && user ? user.email : '',
            phone: i === 0 && user ? user.phone || '' : '',
            id_number: i === 0 && user ? user.id_number || '' : '',
          }))
        );
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
  const subtotal =
    seatsParam && seatNodes.length > 0
      ? seatNodes.reduce((sum, s) => sum + (Number(s.price) || 0), 0)
      : Number(selectedCat?.price || 0) * quantity;

  const serviceFee =
    seatsParam && seatNodes.length > 0
      ? seatNodes.reduce((sum, s) => sum + (Number(s.service_fee) || 0), 0)
      : Number(selectedCat?.service_fee || 0) * quantity;

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
        orderItems = [
          {
            ticket_category_id: selectedCat.id,
            quantity: quantity,
            attendees: attendees.map((att) => ({
              name: att.name || user?.name,
              email: att.email || user?.email,
              phone: att.phone || user?.phone,
              id_number: att.id_number || user?.id_number,
            })),
          },
        ];
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
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingState message="Menyiapkan form checkout..." />
      </div>
    );
  }

  return (
    <PageContainer size="md" className="py-8 sm:py-12">
      {/* ─── Header Navigation ─── */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="text-text-secondary hover:text-text-primary px-0"
        >
          Kembali
        </Button>

        <div className="flex items-center gap-1.5 text-xs text-success bg-success/10 border border-success/20 px-3 py-1.5 rounded-full font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>Checkout Terenkripsi 256-bit</span>
        </div>
      </div>

      {error && (
        <Alert variant="danger" title="Terjadi Kendala" className="mb-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleCreateOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ─── LEFT COLUMN: Attendee Details ─── */}
        <div className="lg:col-span-7 space-y-6">
          <Card variant="default" className="p-6">
            <h2 className="text-base sm:text-lg font-extrabold text-text-primary mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Informasi Pemesan & Pengunjung
            </h2>

            <div className="space-y-6 divide-y divide-border">
              {attendees.map((att, idx) => (
                <div key={idx} className={idx > 0 ? 'pt-6' : ''}>
                  <div className="text-xs font-bold text-primary mb-4 uppercase tracking-wider">
                    Tiket #{idx + 1} {seatNodes[idx] ? `(${seatNodes[idx].label})` : ''}
                  </div>

                  <div className="space-y-4">
                    <FormField label="Nama Lengkap (Sesuai KTP)" required>
                      <Input
                        type="text"
                        required
                        value={att.name}
                        onChange={(e) => handleAttendeeChange(idx, 'name', e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                      />
                    </FormField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Email" required>
                        <Input
                          type="email"
                          required
                          value={att.email}
                          onChange={(e) => handleAttendeeChange(idx, 'email', e.target.value)}
                          placeholder="nama@email.com"
                        />
                      </FormField>

                      <FormField label="Nomor WhatsApp" required>
                        <Input
                          type="tel"
                          required
                          value={att.phone}
                          onChange={(e) => handleAttendeeChange(idx, 'phone', e.target.value)}
                          placeholder="08123456789"
                        />
                      </FormField>
                    </div>

                    <FormField label="Nomor KTP / Paspor">
                      <Input
                        type="text"
                        value={att.id_number}
                        onChange={(e) => handleAttendeeChange(idx, 'id_number', e.target.value)}
                        placeholder="3171xxxxxxxxxxxx"
                      />
                    </FormField>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ─── RIGHT COLUMN: Order Summary ─── */}
        <div className="lg:col-span-5">
          <Card variant="elevated" className="p-6 sticky top-24 border-border/80 shadow-xl">
            <h2 className="text-base sm:text-lg font-extrabold text-text-primary mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-accent" />
              Ringkasan Pesanan
            </h2>

            {event && (
              <div className="pb-4 mb-4 border-b border-border">
                <div className="font-bold text-sm text-text-primary mb-1">{event.title}</div>
                <div className="text-xs text-text-muted">
                  {new Date(event.event_date).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                </div>
              </div>
            )}

            {/* Selected Seats Breakdown or Category */}
            <div className="space-y-2.5 mb-6 text-xs sm:text-sm">
              {seatsParam && seatNodes.length > 0 ? (
                <>
                  <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                    Kursi Terpilih ({seatNodes.length}):
                  </div>
                  {seatNodes.map((seat) => (
                    <div key={seat.id} className="flex justify-between items-center">
                      <span className="text-text-secondary">
                        {seat.label} ({seat.section_name})
                      </span>
                      <span className="font-bold text-text-primary">{formatRupiah(seat.price)}</span>
                    </div>
                  ))}
                </>
              ) : selectedCat ? (
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">
                    {selectedCat.name} × {quantity}
                  </span>
                  <span className="font-bold text-text-primary">
                    {formatRupiah(Number(selectedCat.price) * quantity)}
                  </span>
                </div>
              ) : null}

              {serviceFee > 0 && (
                <div className="flex justify-between items-center text-text-muted pt-2 border-t border-border/40">
                  <span>Biaya Layanan</span>
                  <span>{formatRupiah(serviceFee)}</span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="flex justify-between items-center pt-4 border-t border-border mb-6">
              <span className="font-bold text-sm text-text-primary">Total Pembayaran</span>
              <span className="font-extrabold text-xl text-success">{formatRupiah(totalAmount)}</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={creating}
              rightIcon={<ChevronRight className="w-5 h-5" />}
              className="font-bold shadow-lg shadow-primary/25"
            >
              {creating ? 'Memproses Pesanan...' : 'Lanjut ke Pembayaran'}
            </Button>
          </Card>
        </div>
      </form>
    </PageContainer>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <LoadingState message="Menyiapkan checkout..." />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
