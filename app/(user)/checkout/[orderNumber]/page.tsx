'use client';

import { use, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, CreditCard, Clock, ChevronRight, ChevronLeft,
  AlertTriangle, CheckCircle, Ticket, User, Phone, Mail, Zap,
  Tag, X, Loader2, Building2, QrCode,
  Building, Smartphone, Wallet, Calendar, MapPin
} from 'lucide-react';
import { CountdownTimer } from '../../../../components/events/CountdownTimer';
import { apiService } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import type { Order, Event, TicketCategory, PaymentMethod } from '../../../../types';

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'bca_va',        gateway: 'tripay',  type: 'bank_transfer', name: 'BCA Virtual Account',   code: 'BCAVA',    logo: <Building size={20} />, fee: 4500  },
  { id: 'bni_va',        gateway: 'tripay',  type: 'bank_transfer', name: 'BNI Virtual Account',   code: 'BNIVA',    logo: <Building size={20} />, fee: 4500  },
  { id: 'bri_va',        gateway: 'tripay',  type: 'bank_transfer', name: 'BRI Virtual Account',   code: 'BRIVA',    logo: <Building size={20} />, fee: 4500  },
  { id: 'mandiri_va',    gateway: 'tripay',  type: 'bank_transfer', name: 'Mandiri Bill',          code: 'MANDIRIVA',logo: <Building size={20} />, fee: 4500  },
  { id: 'qris',          gateway: 'tripay',  type: 'qris',          name: 'QRIS',                  code: 'QRIS',     logo: <Smartphone size={20} />, fee: 0,    fee_type: 'percent' },
  { id: 'gopay',         gateway: 'midtrans',type: 'ewallet',       name: 'GoPay',                 code: 'GOPAY',    logo: <Wallet size={20} />, fee: 0     },
  { id: 'ovo',           gateway: 'midtrans',type: 'ewallet',       name: 'OVO',                   code: 'OVO',      logo: <Wallet size={20} />, fee: 0     },
  { id: 'dana',          gateway: 'midtrans',type: 'ewallet',       name: 'DANA',                  code: 'DANA',     logo: <Wallet size={20} />, fee: 0     },
  { id: 'shopeepay',     gateway: 'midtrans',type: 'ewallet',       name: 'ShopeePay',             code: 'SHOPEEPAY',logo: <Wallet size={20} />, fee: 0     },
];

const METHOD_TYPE_LABELS: Record<string, string> = {
  bank_transfer: 'Transfer Bank / Virtual Account',
  qris:          'QRIS',
  ewallet:       'E-Wallet',
  credit_card:   'Kartu Kredit',
};

function fmt(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

function StepIndicator({ step, current }: { step: number; current: number }) {
  const done   = current > step;
  const active = current === step;
  const labels = ['Detail', 'Pembayaran', 'Konfirmasi'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? 'var(--success)' : active ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' : 'rgba(255,255,255,0.06)',
        border: done || active ? 'none' : '1px solid var(--border)', fontWeight: 700, fontSize: '0.875rem',
        transition: 'all 0.3s',
      }}>
        {done ? <CheckCircle size={18} /> : step}
      </div>
      <span style={{ fontSize: '0.7rem', color: active ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: active ? 700 : 400 }}>
        {labels[step - 1]}
      </span>
    </div>
  );
}

export default function CheckoutPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber }    = use(params);
  const router             = useRouter();
  const searchParams       = useSearchParams();
  const { user, token }    = useAuthStore();

  const [order,       setOrder]       = useState<Order | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [step,        setStep]        = useState(1);
  const [processing,  setProcessing]  = useState(false);
  const [error,       setError]       = useState('');

  // Step 1
  const [promoCode,   setPromoCode]   = useState('');
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError,  setPromoError]  = useState('');
  const [attendees,   setAttendees]   = useState<{ name: string; id_number: string; phone: string }[]>([]);

  // Step 2
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentResult, setPaymentResult] = useState<{ payment_url?: string; va_number?: string; qr_code_url?: string } | null>(null);

  const [expireTime] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 12);
    return d.toISOString();
  });

  useEffect(() => {
    if (!token) { router.replace(`/login?redirect=/checkout/${orderNumber}`); return; }
    const load = async () => {
      try {
        const res = await apiService.orders.getOrder(orderNumber);
        const o = (res as any)?.data ?? res;
        setOrder(o);
        // Prefill attendees
        const total = o.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) ?? 1;
        setAttendees(Array.from({ length: total }, () => ({ name: '', id_number: '', phone: '' })));
      } catch {
        setError('Order tidak ditemukan atau sudah kadaluarsa');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderNumber, token, router]);

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true); setPromoError('');
    try {
      const res = await apiService.orders.applyPromo(orderNumber, promoCode);
      const d = (res as any)?.data ?? res;
      setPromoApplied({ code: promoCode, discount: d.discount_amount ?? 0 });
      setOrder(d.order ?? { ...order!, discount_amount: d.discount_amount, total_amount: d.total_amount });
    } catch (e: any) {
      setPromoError(e?.response?.data?.message ?? 'Promo tidak valid');
    } finally {
      setPromoLoading(false);
    }
  };

  const processPayment = async () => {
    if (!selectedMethod) { setError('Pilih metode pembayaran dahulu'); return; }
    setProcessing(true); setError('');
    try {
      const res = await apiService.payments.createPayment(orderNumber, {
        gateway:        selectedMethod.gateway,
        payment_type:   selectedMethod.code,
        attendee_data:  attendees,
      });
      const d = (res as any)?.data ?? res;
      setPaymentResult(d);
      setStep(3);
      if (d.payment_url) window.open(d.payment_url, '_blank');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Pembayaran gagal diproses. Coba lagi.');
    } finally {
      setProcessing(false);
    }
  };

  if (!token) return null;

  const totalAmount  = order ? Number(order.total_amount) - (promoApplied?.discount ?? 0) : 0;
  const methodsByType = PAYMENT_METHODS.reduce<Record<string, PaymentMethod[]>>((acc, m) => {
    (acc[m.type] = acc[m.type] ?? []).push(m);
    return acc;
  }, {});

  return (
    <div style={{ minHeight: '100vh', paddingTop: 90, paddingBottom: 60, background: 'var(--background)' }}>
      <div className="container" style={{ maxWidth: 1000 }}>

        {/* ─── HEADER ─────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={22} style={{ color: 'var(--success)' }} />
            <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Checkout Aman</h1>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          }}>
            <Clock size={15} style={{ color: '#FCA5A5' }} />
            <span style={{ fontSize: '0.8rem', color: '#FCA5A5', fontWeight: 600 }}>Selesaikan dalam:</span>
            <CountdownTimer targetDate={expireTime} size="sm" onComplete={() => router.replace('/events')} />
          </div>
        </div>

        {/* ─── STEP INDICATOR ─────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 40 }}>
          <StepIndicator step={1} current={step} />
          <div style={{ width: 80, height: 2, background: step > 1 ? 'var(--success)' : 'var(--border)', transition: 'background 0.3s', margin: '0 4px' }} />
          <StepIndicator step={2} current={step} />
          <div style={{ width: 80, height: 2, background: step > 2 ? 'var(--success)' : 'var(--border)', transition: 'background 0.3s', margin: '0 4px' }} />
          <StepIndicator step={3} current={step} />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Loader2 size={40} style={{ margin: '0 auto', animation: 'spin-slow 1s linear infinite', color: 'var(--color-primary)' }} />
            <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>Memuat data order...</p>
          </div>
        ) : error && !order ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <AlertTriangle size={48} style={{ color: 'var(--danger)', margin: '0 auto 16px' }} />
            <h2 style={{ marginBottom: 8 }}>{error}</h2>
            <button onClick={() => router.push('/events')} className="btn btn-primary" style={{ marginTop: 16 }}>Kembali ke Events</button>
          </div>
        ) : order && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'flex-start' }}>

            {/* ─── MAIN COLUMN ──────────────────────────── */}
            <div>
              <AnimatePresence mode="wait">

                {/* STEP 1: Detail Pesanan + Attendee */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                    <div style={{ borderRadius: 20, background: 'var(--card)', border: '1px solid var(--border)', padding: 24, marginBottom: 20 }}>
                      <h2 style={{ fontSize: '1.1rem', marginBottom: 20 }}>Detail Pesanan</h2>
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{item.ticketCategory?.name ?? 'Tiket'}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                              {item.quantity}x · {fmt(Number(item.unit_price))} per tiket
                            </div>
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{fmt(Number(item.subtotal))}</div>
                        </div>
                      ))}
                    </div>

                    {/* Attendee data */}
                    {attendees.length > 0 && (
                      <div style={{ borderRadius: 20, background: 'var(--card)', border: '1px solid var(--border)', padding: 24, marginBottom: 20 }}>
                        <h2 style={{ fontSize: '1.1rem', marginBottom: 20 }}>Data Peserta</h2>
                        {attendees.map((att, i) => (
                          <div key={i} style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                              Peserta {i + 1}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                              <div className="form-group">
                                <label className="label">Nama Lengkap *</label>
                                <input className="input" placeholder="Nama sesuai KTP" value={att.name}
                                  onChange={e => { const a = [...attendees]; a[i].name = e.target.value; setAttendees(a); }} />
                              </div>
                              <div className="form-group">
                                <label className="label">No. KTP / Paspor</label>
                                <input className="input" placeholder="1234567890xxxx" value={att.id_number}
                                  onChange={e => { const a = [...attendees]; a[i].id_number = e.target.value; setAttendees(a); }} />
                              </div>
                              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="label">Nomor WhatsApp</label>
                                <input className="input" placeholder="08xxxxxxxxxx" value={att.phone}
                                  onChange={e => { const a = [...attendees]; a[i].phone = e.target.value; setAttendees(a); }} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Promo code */}
                    <div style={{ borderRadius: 20, background: 'var(--card)', border: '1px solid var(--border)', padding: 24 }}>
                      <h2 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Kode Promo</h2>
                      {promoApplied ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Tag size={16} style={{ color: 'var(--success)' }} />
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--success)' }}>{promoApplied.code}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Diskon {fmt(promoApplied.discount)}</div>
                            </div>
                          </div>
                          <button onClick={() => { setPromoApplied(null); setPromoCode(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 10 }}>
                          <input className="input" placeholder="Masukkan kode promo" value={promoCode}
                            onChange={e => setPromoCode(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === 'Enter' && applyPromo()}
                          />
                          <button onClick={applyPromo} disabled={promoLoading} className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                            {promoLoading ? <Loader2 size={16} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> : 'Pakai'}
                          </button>
                        </div>
                      )}
                      {promoError && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 8 }}>{promoError}</p>}
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Metode Pembayaran */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div style={{ borderRadius: 20, background: 'var(--card)', border: '1px solid var(--border)', padding: 24 }}>
                      <h2 style={{ fontSize: '1.1rem', marginBottom: 24 }}>Pilih Metode Pembayaran</h2>
                      {Object.entries(methodsByType).map(([type, methods]) => (
                        <div key={type} style={{ marginBottom: 24 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                            {METHOD_TYPE_LABELS[type] ?? type}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {methods.map(m => {
                              const isSelected = selectedMethod?.id === m.id;
                              const fee = m.fee_type === 'percent' ? Math.ceil(totalAmount * 0.007) : (m.fee ?? 0);
                              return (
                                <button
                                  key={m.id}
                                  onClick={() => setSelectedMethod(m)}
                                  style={{
                                    padding: '14px 18px', borderRadius: 12, textAlign: 'left',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                                    background: isSelected ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--border)'}`,
                                    cursor: 'pointer', transition: 'all 0.15s',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: '1.4rem' }}>{m.logo}</span>
                                    <div>
                                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{m.name}</div>
                                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                        {fee > 0 ? `+ ${fmt(fee)} biaya admin` : 'Gratis biaya admin'}
                                      </div>
                                    </div>
                                  </div>
                                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {isSelected && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--color-primary)' }} />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Konfirmasi & Instruksi */}
                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                    <div style={{ borderRadius: 20, padding: 40, textAlign: 'center', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: 2, duration: 0.4 }}>
                        <CheckCircle size={64} style={{ color: 'var(--success)', margin: '0 auto 20px' }} />
                      </motion.div>
                      <h2 style={{ marginBottom: 12, color: 'var(--success)' }}>Pesanan Dikonfirmasi!</h2>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.7 }}>
                        Order <strong>#{order.order_number}</strong> berhasil dibuat.<br />
                        Selesaikan pembayaran sebelum waktu habis.
                      </p>

                      {paymentResult?.payment_url && (
                        <a href={paymentResult.payment_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginBottom: 16 }}>
                          Bayar Sekarang →
                        </a>
                      )}
                      {paymentResult?.va_number && (
                        <div style={{ padding: '16px', borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)', marginBottom: 16 }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Nomor Virtual Account</div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.1em', color: 'var(--color-primary)' }}>{paymentResult.va_number}</div>
                          <button onClick={() => navigator.clipboard.writeText(paymentResult.va_number!)} className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}>Salin</button>
                        </div>
                      )}
                      {paymentResult?.qr_code_url && (
                        <div style={{ padding: '16px', borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)', marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <img src={paymentResult.qr_code_url} alt="QR Code" style={{ width: 200, height: 200 }} />
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>Scan QR Code dengan aplikasi bank/e-wallet</div>
                        </div>
                      )}

                      <button onClick={() => router.push('/dashboard/tickets')} className="btn btn-secondary" style={{ marginTop: 8 }}>
                        Lihat Tiket Saya
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error message */}
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ padding: '12px 16px', borderRadius: 10, marginTop: 16, background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--danger)', fontSize: '0.875rem' }}>
                  <AlertTriangle size={16} />
                  {error}
                </motion.div>
              )}

              {/* Navigation buttons */}
              {step < 3 && (
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  {step > 1 && (
                    <button onClick={() => setStep(s => s - 1)} className="btn btn-secondary" style={{ flex: 1 }}>
                      <ChevronLeft size={16} /> Kembali
                    </button>
                  )}
                  <button
                    onClick={step === 2 ? processPayment : () => setStep(s => s + 1)}
                    disabled={processing || (step === 2 && !selectedMethod)}
                    className="btn btn-primary"
                    style={{ flex: 2 }}
                  >
                    {processing ? (
                      <><Loader2 size={16} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> Memproses...</>
                    ) : step === 2 ? (
                      <><Zap size={16} /> Bayar {fmt(totalAmount)}</>
                    ) : (
                      <>Lanjutkan ke Pembayaran <ChevronRight size={16} /></>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* ─── ORDER SUMMARY SIDEBAR ────────────────── */}
            <div style={{ position: 'sticky', top: 100 }}>
              <div style={{ borderRadius: 20, background: 'var(--card)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', background: 'rgba(99,102,241,0.08)', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Ringkasan Pesanan</h3>
                </div>
                <div style={{ padding: 20 }}>
                  {/* Event info */}
                  <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, marginBottom: 4, lineHeight: 1.3 }}>{order.event?.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <Calendar size={16} style={{ display: 'inline', marginRight: 6, color: 'var(--text-muted)' }} /> {new Date(order.event?.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <MapPin size={16} style={{ display: 'inline', marginRight: 6, color: 'var(--text-muted)' }} /> {order.event?.venue_name ?? 'TBA'}
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                      <span>{fmt(Number(order.subtotal))}</span>
                    </div>
                    {Number(order.service_fee ?? 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Biaya Layanan</span>
                        <span>{fmt(Number(order.service_fee))}</span>
                      </div>
                    )}
                    {promoApplied && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--success)' }}>Diskon Promo</span>
                        <span style={{ color: 'var(--success)' }}>-{fmt(promoApplied.discount)}</span>
                      </div>
                    )}
                    {selectedMethod && (selectedMethod.fee ?? 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Biaya Admin</span>
                        <span>{fmt(selectedMethod.fee!)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)', fontWeight: 900, fontSize: '1.1rem' }}>
                      <span>Total</span>
                      <span style={{ color: 'var(--color-primary)' }}>{fmt(totalAmount)}</span>
                    </div>
                  </div>

                  {/* Security badges */}
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { icon: ShieldCheck, text: 'Pembayaran terenkripsi SSL 256-bit' },
                      { icon: Ticket,      text: 'E-Ticket dikirim via email' },
                      { icon: CheckCircle, text: 'Tiket resmi bergaransi' },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Icon size={13} style={{ color: 'var(--success)', flexShrink: 0 }} />
                        {text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
