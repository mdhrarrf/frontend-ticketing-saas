'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, CheckCircle2, CreditCard, Sparkles, ShieldCheck,
  QrCode, ArrowRight, ArrowLeft, Mail, Lock, Phone, Users,
  Check, Loader2, Landmark, Radio, Calendar, Zap
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { apiService } from '../../../lib/api';

const PACKAGES = [
  {
    id: 'ARENA_CONCERT',
    name: 'Paket Konser Skala Arena / Stadion',
    price: 2500000,
    badge: 'PALING POPULER',
    desc: 'Solusi terlengkap untuk konser musik besar dan tur arena dengan ribuan penonton.',
    features: [
      'Dynamic QR E-Ticket 30 Detik Anti-Calo',
      'Real Camera Gate Scanner (HP/Tablet/Laptop)',
      'Interactive Seat Map & Real-time 300s Locking',
      'FestPay™ Booth POS F&B & Merchandise',
      'Multi-Tenant White-Label Portal & Branding',
      'Proteksi Concurrency & Anti-Bot War Ticket',
    ],
  },
  {
    id: 'FESTIVAL',
    name: 'Paket Festival Musik & Multi-Stage',
    price: 3500000,
    badge: 'ULTIMATE SUITE',
    desc: 'Dirancang untuk festival musik outdoor dengan banyak panggung dan booth tenant.',
    features: [
      'Semua fitur Paket Konser Arena',
      'Integrasi Gelang NFC Wristband Tap & Go',
      'Multi-Booth POS Cashier Terminal dengan Stok Live',
      'Double-Entry Financial Ledger Audit Trail',
      'Waiting Room Queue Engine hingga 500k Users',
      'Prioritas SLA Dukungan Teknis Hari-H',
    ],
  },
  {
    id: 'THEATER',
    name: 'Paket Teater & Hall Seated',
    price: 1500000,
    badge: 'STARTER PRO',
    desc: 'Pilihan hemat untuk pertunjukan teater, seminar eksklusif, dan konser indoor.',
    features: [
      'Interactive Seat Map Layout',
      'Dynamic QR E-Ticket 30 Detik',
      'Real Camera Gate Scanner Validasi Tiket',
      'Laporan Penjualan Tiket Real-Time',
      'Dashboard Penyelenggara Lengkap',
    ],
  },
];

export default function BecomeOrganizerPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();

  const [step, setStep] = useState<number>(1);
  const [selectedPackage, setSelectedPackage] = useState<string>('ARENA_CONCERT');
  const [formData, setFormData] = useState({
    event_title: '',
    organizer_name: '',
    contact_phone: user?.phone || '',
    estimated_attendees: 5000,
    payment_method: 'QRIS',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState<any>(null);

  // Email to be assigned as organizer
  const [targetEmail, setTargetEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [activationResult, setActivationResult] = useState<any>(null);

  const currentPkg = PACKAGES.find(p => p.id === selectedPackage) || PACKAGES[0];

  // 1. Submit event application & initiate payment
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.event_title.trim()) {
      setError('Nama konser / acara wajib diisi.');
      return;
    }
    if (!formData.organizer_name.trim()) {
      setError('Nama grup / promotor penyelenggara wajib diisi.');
      return;
    }
    if (!formData.contact_phone.trim()) {
      setError('Nomor telepon kontak PIC wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiService.organizerApplication.checkout({
        ...formData,
        package_type: selectedPackage,
        target_email: user?.email || undefined,
      });

      if (res && res.data && res.data.application) {
        setInvoice(res.data.application);
        setStep(3); // Go to Payment step
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal membuat pengajuan invoice.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Confirm payment and submit target organizer email
  const handleConfirmPaymentAndAssignOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmail.trim()) {
      setError('Email akun yang mau dijadikan organizer wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiService.organizerApplication.confirmPayment(invoice.invoice_number, {
        organizer_email: targetEmail,
        organizer_name: formData.organizer_name,
        password: password.trim() ? password : undefined,
      });

      if (res && res.data) {
        setActivationResult(res.data);
        // Automatically update the user auth session in store if token provided
        if (res.data.access_token && res.data.user) {
          setAuth(res.data.user, res.data.access_token);
        }
        setStep(5); // Go to Success celebration step
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal memverifikasi pembayaran dan peran organizer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', paddingTop: 84, paddingBottom: 60 }}>
      <div className="container" style={{ maxWidth: 1040, margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span style={{
            fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '4px 14px', borderRadius: 999, background: 'rgba(99,102,241,0.12)', color: 'var(--color-primary)'
          }}>
            TIXORA FOR EVENT ORGANIZERS
          </span>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginTop: 12, marginBottom: 8, color: 'var(--text-primary)' }}>
            Adakan Acara Konser di TIXORA
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 640, margin: '0 auto' }}>
            Setiap acara konser didukung teknologi enterprise: Dynamic QR 30 Detik, Interactive Seat Map, FestPay Cashless POS, dan Portal White-Label mandiri.
          </p>
        </div>

        {/* Step Wizard Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
          {[
            { num: 1, label: 'Pilih Paket' },
            { num: 2, label: 'Data Acara' },
            { num: 3, label: 'Pembayaran' },
            { num: 4, label: 'Email Organizer' },
          ].map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 700,
                  background: isCompleted ? '#10B981' : isCurrent ? 'var(--color-primary)' : 'var(--border)',
                  color: isCompleted || isCurrent ? '#FFFFFF' : 'var(--text-muted)'
                }}>
                  {isCompleted ? <Check size={16} /> : s.num}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {s.label}
                </span>
                {s.num < 4 && <div style={{ width: 24, height: 1, background: 'var(--border)' }} />}
              </div>
            );
          })}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', borderRadius: 12, padding: '12px 16px', color: '#EF4444', fontSize: '0.875rem', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 700 }}>Peringatan:</span> {error}
          </div>
        )}

        {/* ── STEP 1: PILIH PAKET ─────────────────────────── */}
        {step === 1 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 36 }}>
              {PACKAGES.map((pkg) => {
                const isSelected = selectedPackage === pkg.id;
                return (
                  <motion.div
                    key={pkg.id}
                    whileHover={{ y: -4 }}
                    onClick={() => setSelectedPackage(pkg.id)}
                    style={{
                      background: 'var(--card)', border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border)',
                      borderRadius: 18, padding: 28, cursor: 'pointer', display: 'flex', flexDirection: 'column', position: 'relative',
                      boxShadow: isSelected ? '0 12px 30px rgba(99,102,241,0.15)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                        background: isSelected ? 'var(--color-primary)' : 'var(--border)',
                        color: isSelected ? '#FFFFFF' : 'var(--text-muted)'
                      }}>
                        {pkg.badge}
                      </span>
                      {isSelected && <CheckCircle2 size={20} style={{ color: 'var(--color-primary)' }} />}
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>
                      {pkg.name}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 20, minHeight: 40, lineHeight: 1.5 }}>
                      {pkg.desc}
                    </p>

                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 20 }}>
                      Rp {pkg.price.toLocaleString('id-ID')}
                      <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: 6 }}>/ acara</span>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {pkg.features.map((feat, fi) => (
                        <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                          <Check size={14} style={{ color: '#10B981', flexShrink: 0 }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setStep(2)}
                className="btn btn-primary"
                style={{ padding: '14px 40px', fontSize: '1rem', fontWeight: 700, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                Lanjutkan ke Data Acara <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: DATA ACARA & PROMOTOR ───────────────── */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 640, margin: '0 auto' }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 36 }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                Detail Acara & Grup Penyelenggara
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 24 }}>
                Paket yang dipilih: <strong style={{ color: 'var(--color-primary)' }}>{currentPkg.name}</strong> (Rp {currentPkg.price.toLocaleString('id-ID')})
              </p>

              <form onSubmit={handleProceedToPayment} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                    Nama Konser / Acara *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Sheila On 7 Tunggu Aku Di Jakarta 2027"
                    value={formData.event_title}
                    onChange={e => setFormData({ ...formData, event_title: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                    Nama Grup Promotor / Penyelenggara *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Antara Suara x Golden Event"
                    value={formData.organizer_name}
                    onChange={e => setFormData({ ...formData, organizer_name: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                      Nomor Telepon PIC (WhatsApp) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="081234567890"
                      value={formData.contact_phone}
                      onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                      Estimasi Penonton
                    </label>
                    <input
                      type="number"
                      min={50}
                      value={formData.estimated_attendees}
                      onChange={e => setFormData({ ...formData, estimated_attendees: parseInt(e.target.value) || 5000 })}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                    Pilihan Metode Pembayaran Lisensi
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                  >
                    <option value="QRIS">QRIS Dinamis (BCA, GoPay, OVO, ShopeePay, Dana)</option>
                    <option value="BCA_VA">BCA Virtual Account</option>
                    <option value="MANDIRI_VA">Mandiri Virtual Account</option>
                    <option value="INSTANT_SIMULATOR">Simulator Sandbox Instan (Demo Mode)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn btn-secondary"
                    style={{ padding: '12px 24px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <ArrowLeft size={16} /> Kembali
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ padding: '12px 28px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Lanjut ke Pembayaran'}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: SISTEM PEMBAYARAN ──────────────────── */}
        {step === 3 && invoice && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: 580, margin: '0 auto' }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 36, boxShadow: '0 20px 40px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 20 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>NOMOR INVOICE</span>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{invoice.invoice_number}</div>
                </div>
                <span style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontSize: '0.75rem', fontWeight: 700 }}>
                  MENUNGGU PEMBAYARAN
                </span>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Paket Aktivasi:</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{invoice.event_title}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Penyelenggara: {invoice.organizer_name}</div>
              </div>

              <div style={{ background: 'var(--background)', borderRadius: 12, padding: 18, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 8, color: 'var(--text-secondary)' }}>
                  <span>Biaya Lisensi Platform TIXORA:</span>
                  <span>Rp {parseFloat(invoice.amount).toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 8, color: 'var(--text-secondary)' }}>
                  <span>Biaya Layanan & Enkripsi:</span>
                  <span style={{ color: '#10B981', fontWeight: 600 }}>GRATIS (Promo)</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  <span>Total Tagihan:</span>
                  <span>Rp {parseFloat(invoice.amount).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* QRIS / VA Display */}
              <div style={{ textAlign: 'center', padding: '20px 0', border: '1px dashed var(--border)', borderRadius: 14, marginBottom: 24 }}>
                <div style={{ width: 140, height: 140, margin: '0 auto 12px', background: '#FFFFFF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
                  <QrCode size={120} style={{ color: '#0F172A' }} />
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {invoice.payment_method === 'BCA_VA' ? 'BCA Virtual Account: ' + invoice.payment_metadata?.va_number : 'Scan QRIS Dinamis TIXORA'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Didukung seluruh mobile banking & e-wallet di Indonesia
                </div>
              </div>

              <button
                onClick={() => setStep(4)}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                Saya Sudah Membayar <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── STEP 4: MASUKKAN EMAIL AKUN CALON ORGANIZER ──── */}
        {step === 4 && invoice && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 580, margin: '0 auto' }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 36 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16,185,129,0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <ShieldCheck size={28} />
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                Tentukan Akun Email Organizer
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 24, lineHeight: 1.6 }}>
                Pembayaran invoice <strong style={{ color: 'var(--text-primary)' }}>{invoice.invoice_number}</strong> telah siap diverifikasi.
                Sesuai alur, masukkan alamat email akun yang akan resmi diangkat sebagai <strong>Organizer Acara</strong>.
              </p>

              <form onSubmit={handleConfirmPaymentAndAssignOrganizer} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                    Alamat Email Akun Organizer *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      required
                      placeholder="promotor@acara-anda.com"
                      value={targetEmail}
                      onChange={e => setTargetEmail(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                    Jika email ini sudah terdaftar sebagai pengguna biasa, perannya akan otomatis di-upgrade menjadi Organizer.
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                    Password Akun (Hanya jika akun email baru)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-muted)' }} />
                    <input
                      type="password"
                      placeholder="Password login akun organizer"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: '1rem', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Verifikasi & Jadikan Akun Ini Organizer'}
                  <ArrowRight size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* ── STEP 5: SUKSES & ROLE UPGRADE TERVERIFIKASI ─── */}
        {step === 5 && activationResult && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: 580, margin: '0 auto' }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 24, padding: 44, textAlign: 'center', boxShadow: '0 24px 50px rgba(0,0,0,0.08)' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle2 size={36} />
              </div>

              <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.2)', color: '#059669' }}>
                PEMBAYARAN LUNAS & ROLE RESMI
              </span>

              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '14px 0 8px', color: 'var(--text-primary)' }}>
                Akun Resmi Menjadi Organizer!
              </h2>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 28 }}>
                Akun email <strong style={{ color: 'var(--color-primary)' }}>{activationResult.user?.email}</strong> kini memiliki peran penuh sebagai <strong>Organizer TIXORA</strong> untuk acara <strong>{formData.event_title}</strong>.
              </p>

              <div style={{ background: 'var(--background)', borderRadius: 14, padding: 18, textAlign: 'left', marginBottom: 28, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Nama Organizer:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{activationResult.organizer?.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Hak Akses Role:</span>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>ORGANIZER (Verified)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Portal Slug:</span>
                  <code style={{ color: 'var(--color-primary)' }}>/org/{activationResult.organizer?.slug}</code>
                </div>
              </div>

              <button
                onClick={() => router.push('/organizer/dashboard')}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                Buka Panel Organizer Sekarang <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
