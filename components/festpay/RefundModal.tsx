'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDownLeft, CheckCircle2, AlertCircle, Info, Landmark } from 'lucide-react';
import { apiService } from '../../lib/api';

interface RefundModalProps {
  walletId: number | null;
  eventTitle: string;
  maxBalance: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BANKS = [
  'BCA (Bank Central Asia)',
  'Bank Mandiri',
  'BRI (Bank Rakyat Indonesia)',
  'BNI (Bank Negara Indonesia)',
  'Bank Syariah Indonesia (BSI)',
  'Bank CIMB Niaga',
  'GoPay / OVO / DANA (Transfer Bank)',
];

export default function RefundModal({
  walletId,
  eventTitle,
  maxBalance,
  isOpen,
  onClose,
  onSuccess,
}: RefundModalProps) {
  const [amount, setAmount] = useState<number>(maxBalance);
  const [bankName, setBankName] = useState<string>(BANKS[0]);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successData, setSuccessData] = useState<any>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletId) return;

    if (amount <= 0 || amount > maxBalance) {
      setError(`Nominal penarikan harus antara Rp 10.000 dan Rp ${maxBalance.toLocaleString('id-ID')}`);
      return;
    }
    if (!accountNumber.trim() || !accountName.trim()) {
      setError('Lengkapi nomor rekening dan nama pemilik rekening');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiService.festpay.requestRefund(walletId, {
        amount,
        bank_name: bankName,
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
      });

      setSuccessData(res.data ?? res);
      onSuccess();
    } catch (err: any) {
      console.error('Refund request error', err);
      setError(err?.response?.data?.message || 'Gagal mengajukan permohonan refund.');
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
                FestPay Settlement
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Tarik Saldo / Refund
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

          <div style={{ padding: '24px' }}>
            {successData ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', background: '#dcfce7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                  color: '#16a34a',
                }}>
                  <CheckCircle2 size={30} />
                </div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                  Permohonan Refund Diterima
                </h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 20px' }}>
                  Kode Refund:{' '}
                  <strong style={{ color: '#0f172a' }}>{successData.refund_number ?? 'REF-PENDING'}</strong>
                </p>
                <div style={{
                  background: '#f8fafc', borderRadius: 12, padding: '14px',
                  marginBottom: 20, textAlign: 'left', fontSize: '0.8rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Jumlah Penarikan:</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>Rp {Number(amount).toLocaleString('id-ID')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Bank Tujuan:</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{bankName.split(' ')[0]}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Rekening:</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{accountNumber} a.n {accountName}</span>
                  </div>
                </div>
                <button
                  onClick={resetAndClose}
                  style={{
                    width: '100%', padding: '12px', background: '#4f46e5', color: '#fff',
                    borderRadius: 12, border: 'none', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Tutup
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Auto refund info alert */}
                <div style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 12,
                  padding: '12px',
                  marginBottom: 18,
                  fontSize: '0.75rem',
                  color: '#1e40af',
                  display: 'flex',
                  gap: 10,
                }}>
                  <Info size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong>Auto-Refund H+1 FestPay™:</strong> Seluruh sisa saldo yang tidak terpakai saat event usai akan secara otomatis dikembalikan ke rekening/e-wallet Anda.
                  </div>
                </div>

                {/* Amount input */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                      Jumlah Penarikan (IDR)
                    </label>
                    <button
                      type="button"
                      onClick={() => setAmount(maxBalance)}
                      style={{
                        background: 'none', border: 'none', color: '#4f46e5',
                        fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0,
                      }}
                    >
                      Tarik Semua (Rp {maxBalance.toLocaleString('id-ID')})
                    </button>
                  </div>
                  <input
                    type="number"
                    max={maxBalance}
                    min={10000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #e2e8f0',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Bank Select */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Bank / E-Wallet Tujuan
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #e2e8f0',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                      background: '#fff',
                    }}
                  >
                    {BANKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Account Number */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Nomor Rekening / Akun E-Wallet
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1234567890"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #e2e8f0',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Account Name */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Nama Pemilik Rekening
                  </label>
                  <input
                    type="text"
                    placeholder="Sesuai buku tabungan / akun"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #e2e8f0',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
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

                <button
                  type="submit"
                  disabled={loading || maxBalance <= 0}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 12,
                    background: loading || maxBalance <= 0 ? '#94a3b8' : '#4f46e5',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: loading || maxBalance <= 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <ArrowDownLeft size={16} />
                  {loading ? 'Mengajukan...' : `Ajukan Refund Rp ${Number(amount).toLocaleString('id-ID')}`}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
