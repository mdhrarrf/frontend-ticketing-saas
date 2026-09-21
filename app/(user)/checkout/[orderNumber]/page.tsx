'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Clock, ChevronRight, ChevronLeft,
  CheckCircle, Ticket, Tag, X,
  Building, Smartphone, Wallet, Calendar, MapPin, Copy
} from 'lucide-react';
import { CountdownTimer } from '../../../../components/events/CountdownTimer';
import { apiService } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import type { Order, PaymentMethod } from '../../../../types';
import {
  Button, Card, Input, FormField, Alert,
  LoadingState, ErrorState, toast
} from '@/components/ui';
import { PageContainer } from '@/components/layout';
import { formatRupiah, formatDate } from '@/lib/utils';

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'bca_va', gateway: 'tripay', type: 'bank_transfer', name: 'BCA Virtual Account', code: 'BCAVA', logo: <Building className="w-5 h-5" />, fee: 4500 },
  { id: 'bni_va', gateway: 'tripay', type: 'bank_transfer', name: 'BNI Virtual Account', code: 'BNIVA', logo: <Building className="w-5 h-5" />, fee: 4500 },
  { id: 'bri_va', gateway: 'tripay', type: 'bank_transfer', name: 'BRI Virtual Account', code: 'BRIVA', logo: <Building className="w-5 h-5" />, fee: 4500 },
  { id: 'mandiri_va', gateway: 'tripay', type: 'bank_transfer', name: 'Mandiri Bill', code: 'MANDIRIVA', logo: <Building className="w-5 h-5" />, fee: 4500 },
  { id: 'qris', gateway: 'tripay', type: 'qris', name: 'QRIS', code: 'QRIS', logo: <Smartphone className="w-5 h-5" />, fee: 0, fee_type: 'percent' },
  { id: 'gopay', gateway: 'midtrans', type: 'ewallet', name: 'GoPay', code: 'GOPAY', logo: <Wallet className="w-5 h-5" />, fee: 0 },
  { id: 'ovo', gateway: 'midtrans', type: 'ewallet', name: 'OVO', code: 'OVO', logo: <Wallet className="w-5 h-5" />, fee: 0 },
  { id: 'dana', gateway: 'midtrans', type: 'ewallet', name: 'DANA', code: 'DANA', logo: <Wallet className="w-5 h-5" />, fee: 0 },
  { id: 'shopeepay', gateway: 'midtrans', type: 'ewallet', name: 'ShopeePay', code: 'SHOPEEPAY', logo: <Wallet className="w-5 h-5" />, fee: 0 },
];

const METHOD_TYPE_LABELS: Record<string, string> = {
  bank_transfer: 'Transfer Bank / Virtual Account',
  qris: 'QRIS (Gopay, OVO, Dana, BCA)',
  ewallet: 'E-Wallet',
  credit_card: 'Kartu Kredit',
};

function StepIndicator({ step, current }: { step: number; current: number }) {
  const done = current > step;
  const active = current === step;
  const labels = ['Detail', 'Pembayaran', 'Konfirmasi'];
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
          done
            ? 'bg-success text-white shadow-md shadow-success/20'
            : active
            ? 'bg-primary text-white shadow-md shadow-primary/25 ring-2 ring-primary/30'
            : 'bg-surface-elevated text-text-muted border border-border'
        }`}
      >
        {done ? <CheckCircle className="w-5 h-5" /> : step}
      </div>
      <span className={`text-[11px] font-semibold ${active ? 'text-primary' : 'text-text-muted'}`}>
        {labels[step - 1]}
      </span>
    </div>
  );
}

export default function CheckoutPaymentPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = use(params);
  const router = useRouter();
  const { token } = useAuthStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [attendees, setAttendees] = useState<{ name: string; id_number: string; phone: string }[]>([]);

  // Step 2
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentResult, setPaymentResult] = useState<{ payment_url?: string; va_number?: string; qr_code_url?: string } | null>(null);

  const [expireTime] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 12);
    return d.toISOString();
  });

  useEffect(() => {
    if (!token) {
      router.replace(`/login?redirect=/checkout/${orderNumber}`);
      return;
    }
    const load = async () => {
      try {
        const res = await apiService.orders.getOrder(orderNumber);
        const o = (res as any)?.data ?? res;
        setOrder(o);
        const total = o.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) ?? 1;
        setAttendees(Array.from({ length: total }, () => ({ name: '', id_number: '', phone: '' })));
      } catch {
        setError('Order tidak ditemukan atau sudah kadaluarsa.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderNumber, token, router]);

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const res = await apiService.orders.applyPromo(orderNumber, promoCode);
      const d = (res as any)?.data ?? res;
      setPromoApplied({ code: promoCode, discount: d.discount_amount ?? 0 });
      setOrder(d.order ?? { ...order!, discount_amount: d.discount_amount, total_amount: d.total_amount });
      toast.success('Kode promo berhasil diterapkan!');
    } catch (e: any) {
      setPromoError(e?.response?.data?.message ?? 'Promo tidak valid');
    } finally {
      setPromoLoading(false);
    }
  };

  const processPayment = async () => {
    if (!selectedMethod) {
      setError('Pilih metode pembayaran terlebih dahulu.');
      return;
    }
    setProcessing(true);
    setError('');
    try {
      const res = await apiService.payments.createPayment(orderNumber, {
        gateway: selectedMethod.gateway,
        payment_type: selectedMethod.code,
        attendee_data: attendees,
      });
      const d = (res as any)?.data ?? res;
      setPaymentResult(d);
      setStep(3);
      if (d.payment_url) {
        window.open(d.payment_url, '_blank');
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Pembayaran gagal diproses. Coba lagi.');
    } finally {
      setProcessing(false);
    }
  };

  if (!token) return null;

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <LoadingState message="Memuat rincian pesanan..." />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <ErrorState
          title="Pesanan Tidak Ditemukan"
          description={error}
          retryText="Kembali ke Daftar Events"
          onRetry={() => router.push('/events')}
        />
      </div>
    );
  }

  const totalAmount = order ? Number(order.total_amount) - (promoApplied?.discount ?? 0) : 0;
  const methodsByType = PAYMENT_METHODS.reduce<Record<string, PaymentMethod[]>>((acc, m) => {
    (acc[m.type] = acc[m.type] ?? []).push(m);
    return acc;
  }, {});

  return (
    <PageContainer size="md" className="py-8 sm:py-12">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-success" />
          <h1 className="text-xl sm:text-2xl font-black text-text-primary">
            Checkout Aman TIXORA
          </h1>
        </div>
        <div className="flex items-center gap-2 p-2.5 px-4 rounded-xl bg-danger/10 border border-danger/25 text-xs text-red-300 w-fit">
          <Clock className="w-4 h-4 text-danger animate-pulse" />
          <span className="font-semibold">Batas bayar:</span>
          <CountdownTimer targetDate={expireTime} size="sm" onComplete={() => router.replace('/events')} />
        </div>
      </div>

      {/* ─── Step Indicator ─── */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
        <StepIndicator step={1} current={step} />
        <div className={`w-12 sm:w-20 h-0.5 transition-colors ${step > 1 ? 'bg-success' : 'bg-border'}`} />
        <StepIndicator step={2} current={step} />
        <div className={`w-12 sm:w-20 h-0.5 transition-colors ${step > 2 ? 'bg-success' : 'bg-border'}`} />
        <StepIndicator step={3} current={step} />
      </div>

      {order && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─── MAIN COLUMN ─── */}
          <div className="lg:col-span-7 space-y-6">
            <AnimatePresence mode="wait">
              {/* STEP 1: Detail Pesanan + Attendee */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="space-y-6"
                >
                  <Card variant="default" className="p-5 sm:p-6">
                    <h2 className="text-base font-extrabold text-text-primary mb-4 flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-primary" />
                      Detail Tiket
                    </h2>
                    <div className="divide-y divide-border">
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="py-3.5 flex justify-between items-center text-xs sm:text-sm">
                          <div>
                            <div className="font-bold text-text-primary">
                              {item.ticketCategory?.name ?? 'Tiket'}
                            </div>
                            <div className="text-xs text-text-muted mt-0.5">
                              {item.quantity}x · {formatRupiah(Number(item.unit_price))} per tiket
                            </div>
                          </div>
                          <div className="font-extrabold text-primary">
                            {formatRupiah(Number(item.subtotal))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Attendee Data */}
                  {attendees.length > 0 && (
                    <Card variant="default" className="p-5 sm:p-6">
                      <h2 className="text-base font-extrabold text-text-primary mb-4">
                        Data Identitas Peserta
                      </h2>
                      <div className="space-y-5 divide-y divide-border/60">
                        {attendees.map((att, i) => (
                          <div key={i} className={i > 0 ? 'pt-5' : ''}>
                            <div className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">
                              Peserta {i + 1}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              <FormField label="Nama Lengkap *" required>
                                <Input
                                  placeholder="Nama sesuai KTP"
                                  value={att.name}
                                  onChange={(e) => {
                                    const a = [...attendees];
                                    a[i].name = e.target.value;
                                    setAttendees(a);
                                  }}
                                />
                              </FormField>
                              <FormField label="No. KTP / Paspor">
                                <Input
                                  placeholder="3171xxxxxxxxxxxx"
                                  value={att.id_number}
                                  onChange={(e) => {
                                    const a = [...attendees];
                                    a[i].id_number = e.target.value;
                                    setAttendees(a);
                                  }}
                                />
                              </FormField>
                              <div className="sm:col-span-2">
                                <FormField label="Nomor WhatsApp">
                                  <Input
                                    placeholder="08xxxxxxxxxx"
                                    value={att.phone}
                                    onChange={(e) => {
                                      const a = [...attendees];
                                      a[i].phone = e.target.value;
                                      setAttendees(a);
                                    }}
                                  />
                                </FormField>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Promo Code */}
                  <Card variant="default" className="p-5 sm:p-6">
                    <h2 className="text-base font-extrabold text-text-primary mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-accent" />
                      Kode Promo / Voucher
                    </h2>
                    {promoApplied ? (
                      <div className="p-3.5 rounded-xl bg-success/15 border border-success/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Tag className="w-4 h-4 text-success" />
                          <div>
                            <div className="font-bold text-xs text-success">{promoApplied.code}</div>
                            <div className="text-[11px] text-text-muted">
                              Diskon {formatRupiah(promoApplied.discount)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setPromoApplied(null);
                            setPromoCode('');
                          }}
                          className="text-text-muted hover:text-text-primary p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Ketik kode promo..."
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                          className="text-xs"
                        />
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={applyPromo}
                          loading={promoLoading}
                          className="shrink-0 text-xs font-semibold"
                        >
                          Terapkan
                        </Button>
                      </div>
                    )}
                    {promoError && (
                      <p className="text-xs text-danger mt-2 font-medium">{promoError}</p>
                    )}
                  </Card>
                </motion.div>
              )}

              {/* STEP 2: Metode Pembayaran */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  className="space-y-6"
                >
                  <Card variant="default" className="p-5 sm:p-6">
                    <h2 className="text-base font-extrabold text-text-primary mb-6">
                      Pilih Metode Pembayaran
                    </h2>
                    <div className="space-y-6">
                      {Object.entries(methodsByType).map(([type, methods]) => (
                        <div key={type}>
                          <div className="text-xs font-bold uppercase text-text-muted tracking-wider mb-3">
                            {METHOD_TYPE_LABELS[type] ?? type}
                          </div>
                          <div className="space-y-2">
                            {methods.map((m) => {
                              const isSelected = selectedMethod?.id === m.id;
                              const fee =
                                m.fee_type === 'percent'
                                  ? Math.ceil(totalAmount * 0.007)
                                  : m.fee ?? 0;
                              return (
                                <button
                                  key={m.id}
                                  onClick={() => setSelectedMethod(m)}
                                  className={`w-full p-4 rounded-xl text-left flex items-center justify-between gap-4 border transition-all ${
                                    isSelected
                                      ? 'bg-primary/10 border-primary ring-1 ring-primary'
                                      : 'bg-surface/60 border-border hover:border-border-bright'
                                  }`}
                                >
                                  <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-primary shrink-0">
                                      {m.logo}
                                    </div>
                                    <div>
                                      <div className="font-bold text-xs sm:text-sm text-text-primary">
                                        {m.name}
                                      </div>
                                      <div className="text-[11px] text-text-muted mt-0.5">
                                        {fee > 0
                                          ? `+ ${formatRupiah(fee)} biaya admin`
                                          : 'Bebas biaya admin'}
                                      </div>
                                    </div>
                                  </div>

                                  <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                      isSelected ? 'border-primary' : 'border-border'
                                    }`}
                                  >
                                    {isSelected && (
                                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* STEP 3: Konfirmasi & Instruksi */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card variant="elevated" className="p-6 sm:p-8 text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success mx-auto shadow-lg shadow-success/20">
                      <CheckCircle className="w-8 h-8" />
                    </div>

                    <div>
                      <h2 className="text-xl font-black text-text-primary mb-2">
                        Instruksi Pembayaran
                      </h2>
                      <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                        Order <strong className="text-primary font-mono">#{order.order_number}</strong> siap dibayar.
                        Selesaikan transaksi sebelum waktu habis.
                      </p>
                    </div>

                    {paymentResult?.va_number && (
                      <div className="p-5 rounded-2xl bg-surface border border-border space-y-2">
                        <div className="text-xs text-text-muted font-medium">Nomor Virtual Account</div>
                        <div className="text-2xl font-black font-mono tracking-wider text-primary">
                          {paymentResult.va_number}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Copy className="w-3.5 h-3.5" />}
                          onClick={() => {
                            navigator.clipboard.writeText(paymentResult.va_number!);
                            toast.success('Nomor VA disalin!');
                          }}
                          className="text-xs"
                        >
                          Salin Nomor VA
                        </Button>
                      </div>
                    )}

                    {paymentResult?.qr_code_url && (
                      <div className="p-5 rounded-2xl bg-surface border border-border flex flex-col items-center gap-3">
                        <img
                          src={paymentResult.qr_code_url}
                          alt="QRIS Pembayaran"
                          className="w-48 h-48 rounded-xl bg-white p-2 shadow-md"
                        />
                        <p className="text-xs text-text-muted">
                          Pindai kode QR menggunakan m-Banking atau e-Wallet favoritmu
                        </p>
                      </div>
                    )}

                    {paymentResult?.payment_url && (
                      <a
                        href={paymentResult.payment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Button variant="primary" size="lg" fullWidth className="font-bold">
                          Buka Link Pembayaran Gateway →
                        </Button>
                      </a>
                    )}

                    <div className="pt-4 border-t border-border flex justify-center gap-3">
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => router.push('/dashboard/tickets')}
                      >
                        Lihat Tiket Saya
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => router.push(`/order-success/${order.order_number}`)}
                      >
                        Halaman Konfirmasi
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            {error && (
              <Alert variant="danger" title="Kendala Pembayaran">
                {error}
              </Alert>
            )}

            {/* Step Navigation Controls */}
            {step < 3 && (
              <div className="flex items-center gap-3 pt-4">
                {step > 1 && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setStep((s) => s - 1)}
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                    className="flex-1 font-semibold"
                  >
                    Kembali
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="lg"
                  loading={processing}
                  disabled={processing || (step === 2 && !selectedMethod)}
                  onClick={step === 2 ? processPayment : () => setStep((s) => s + 1)}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                  className="flex-[2] font-bold shadow-lg shadow-primary/25"
                >
                  {processing
                    ? 'Memproses Pembayaran...'
                    : step === 2
                    ? `Bayar ${formatRupiah(totalAmount)}`
                    : 'Lanjut ke Pembayaran'}
                </Button>
              </div>
            )}
          </div>

          {/* ─── SIDEBAR: Order Summary ─── */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <Card variant="elevated" className="p-5 sm:p-6 border-border/80 shadow-xl">
              <h3 className="text-base font-extrabold text-text-primary mb-4 pb-3 border-b border-border">
                Ringkasan Pesanan
              </h3>

              {/* Event Info */}
              <div className="space-y-1.5 pb-4 mb-4 border-b border-border/60">
                <div className="font-bold text-sm text-text-primary leading-snug">
                  {order.event?.title}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>{formatDate(order.event?.event_date)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <MapPin className="w-3.5 h-3.5 text-accent" />
                  <span>{order.event?.venue_name ?? 'TBA'}</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal Tiket</span>
                  <span className="font-semibold text-text-primary">
                    {formatRupiah(Number(order.subtotal))}
                  </span>
                </div>

                {Number(order.service_fee ?? 0) > 0 && (
                  <div className="flex justify-between text-text-secondary">
                    <span>Biaya Layanan</span>
                    <span className="font-semibold text-text-primary">
                      {formatRupiah(Number(order.service_fee))}
                    </span>
                  </div>
                )}

                {promoApplied && (
                  <div className="flex justify-between text-success font-semibold">
                    <span>Diskon Promo</span>
                    <span>-{formatRupiah(promoApplied.discount)}</span>
                  </div>
                )}

                {selectedMethod && (selectedMethod.fee ?? 0) > 0 && (
                  <div className="flex justify-between text-text-secondary">
                    <span>Biaya Admin</span>
                    <span className="font-semibold text-text-primary">
                      {formatRupiah(selectedMethod.fee!)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between pt-3 border-t border-border font-extrabold text-base sm:text-lg">
                  <span className="text-text-primary">Total Tagihan</span>
                  <span className="text-success">{formatRupiah(totalAmount)}</span>
                </div>
              </div>

              {/* Security Badges */}
              <div className="mt-6 pt-4 border-t border-border space-y-2 text-[11px] text-text-muted">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-success shrink-0" />
                  <span>Pembayaran terenkripsi aman SSL 256-bit</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ticket className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>E-Ticket & Dynamic QR terbit instan setelah pembayaran</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
