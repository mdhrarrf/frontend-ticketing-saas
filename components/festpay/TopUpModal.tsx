'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, CheckCircle2, AlertCircle, CreditCard, QrCode, ArrowRight } from 'lucide-react';
import { apiService } from '../../lib/api';

interface TopUpModalProps {
  walletId: number | null;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

const PRESET_AMOUNTS = [50000, 100000, 250000, 500000, 1000000];

const CHANNELS = [
  { id: 'QRIS', label: 'QRIS (Instant)', icon: QrCode, desc: 'BCA, Mandiri, GoPay, OVO, ShopeePay' },
  { id: 'BCA_VA', label: 'BCA Virtual Account', icon: CreditCard, desc: 'Konfirmasi otomatis 24 jam' },
  { id: 'MANDIRI_VA', label: 'Mandiri Virtual Account', icon: CreditCard, desc: 'Konfirmasi instan' },
  { id: 'GOPAY', label: 'GoPay E-Wallet', icon: Wallet, desc: 'Pembayaran instan 1-klik' },
];

export default function TopUpModal({
  walletId,
  eventTitle,
  isOpen,
  onClose,
  onSuccess,
}: TopUpModalProps) {
  const [amount, setAmount] = useState<number>(100000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('QRIS');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successData, setSuccessData] = useState<any>(null);

  if (!isOpen) return null;

  const currentAmount = customAmount ? Number(customAmount) : amount;

  const handleTopUp = async () => {
    if (!walletId || currentAmount < 10000) {
      setError('Nominal minimal top-up adalah Rp 10.000');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiService.festpay.topUpWallet(walletId, {
        amount: currentAmount,
        payment_method: selectedChannel,
      });

      const data = res.data ?? res;
      setSuccessData(data);
      if (data.new_balance !== undefined) {
        onSuccess(data.new_balance);
      }
    } catch (err: any) {
      console.error('Top-up error', err);
      setError(err?.response?.data?.message || 'Gagal memproses top-up. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setSuccessData(null);
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.2 }}
          style={{
            background: '#ffffff',
            borderRadius: 24,
            width: '100%',
            maxWidth: 440,
            overflow: 'hidden',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase' }}>
                FestPay Wallet
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Top Up Saldo
              </h3>
              <p style={{ fontSize: '0.75rem', margin: 0, color: '#64748b' }}>
                {eventTitle}
              </p>
            </div>
            <button
              onClick={resetAndClose}
              style={{
                background: '#f1f5f9', border: 'none', borderRadius: '50%',
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#64748b', cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '24px' }}>
            {successData ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%', background: '#dcfce7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                  color: '#16a34a',
                }}>
                  <CheckCircle2 size={32} />
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                  Top Up Berhasil!
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 20px' }}>
                  Saldo FestPay berhasil ditambahkan sebesar{' '}
                  <strong style={{ color: '#0f172a' }}>Rp {Number(currentAmount).toLocaleString('id-ID')}</strong>
                </p>
                <div style={{
                  background: '#f8fafc', borderRadius: 12, padding: '14px',
                  marginBottom: 24, textAlign: 'left', fontSize: '0.8rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Nomor Referensi:</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{successData.transaction?.reference_id ?? 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Saldo Baru:</span>
                    <span style={{ fontWeight: 800, color: '#16a34a' }}>
                      Rp {Number(successData.new_balance ?? 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={resetAndClose}
                  style={{
                    width: '100%', padding: '12px', background: '#4f46e5', color: '#fff',
                    borderRadius: 12, border: 'none', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Selesai
                </button>
              </div>
            ) : (
              <>
                {/* Nominal Presets */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 8 }}>
                    Pilih Nominal Cepat
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {PRESET_AMOUNTS.map((p) => {
                      const isSelected = amount === p && !customAmount;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => { setAmount(p); setCustomAmount(''); }}
                          style={{
                            padding: '10px 4px',
                            borderRadius: 10,
                            border: `1.5px solid ${isSelected ? '#4f46e5' : '#e2e8f0'}`,
                            background: isSelected ? '#eef2ff' : '#ffffff',
                            color: isSelected ? '#4f46e5' : '#1e293b',
                            fontSize: '0.78rem',
                            fontWeight: isSelected ? 700 : 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          Rp {(p / 1000).toLocaleString('id-ID')}k
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Amount */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Atau Masukkan Nominal Lain (IDR)
                  </label>
                  <input
                    type="number"
                    min="10000"
                    step="5000"
                    placeholder="Contoh: 150000"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #e2e8f0',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Payment Channel */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 8 }}>
                    Metode Pembayaran
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {CHANNELS.map((ch) => {
                      const isSelected = selectedChannel === ch.id;
                      const Icon = ch.icon;
                      return (
                        <div
                          key={ch.id}
                          onClick={() => setSelectedChannel(ch.id)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: `1.5px solid ${isSelected ? '#4f46e5' : '#e2e8f0'}`,
                            background: isSelected ? '#f5f7ff' : '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: isSelected ? '#e0e7ff' : '#f1f5f9',
                              color: isSelected ? '#4f46e5' : '#64748b',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Icon size={16} />
                            </div>
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{ch.label}</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{ch.desc}</div>
                            </div>
                          </div>
                          <div style={{
                            width: 18, height: 18, borderRadius: '50%',
                            border: `2px solid ${isSelected ? '#4f46e5' : '#cbd5e1'}`,
                            background: isSelected ? '#4f46e5' : 'transparent',
                          }} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div style={{
                    marginBottom: 16, padding: '10px 12px', borderRadius: 8,
                    background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c',
                    fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <AlertCircle size={15} /> {error}
                  </div>
                )}

                {/* Submit button */}
                <button
                  onClick={handleTopUp}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 12,
                    background: loading ? '#94a3b8' : '#4f46e5',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {loading ? 'Memproses Top-Up...' : `Konfirmasi Top Up Rp ${Number(currentAmount).toLocaleString('id-ID')}`}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
