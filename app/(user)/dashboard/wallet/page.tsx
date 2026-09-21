'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, QrCode, PlusCircle, Radio, ArrowDownLeft,
  ArrowUpRight, Clock, ShieldCheck, RefreshCw, AlertCircle,
  CheckCircle2, Sparkles, ChevronRight, Store, ShoppingBag
} from 'lucide-react';
import { apiService } from '../../../../lib/api';
import QrPaymentModal from '../../../../components/festpay/QrPaymentModal';
import TopUpModal from '../../../../components/festpay/TopUpModal';
import WristbandModal from '../../../../components/festpay/WristbandModal';
import RefundModal from '../../../../components/festpay/RefundModal';

export default function UserWalletPage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
  const [walletDetails, setWalletDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Modals
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [showWristbandModal, setShowWristbandModal] = useState<boolean>(false);
  const [showRefundModal, setShowRefundModal] = useState<boolean>(false);

  // Available events to activate wallet if none exists
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [activatingEventId, setActivatingEventId] = useState<number | null>(null);

  // Load all user wallets
  const loadWallets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.festpay.getWallets();
      const list = res.data ?? [];
      setWallets(list);

      if (list.length > 0) {
        // Select first or keep selected
        const current = list.find((w: any) => w.id === selectedWalletId) || list[0];
        setSelectedWalletId(current.id);
        await loadWalletDetails(current.id);
      } else {
        // Load published events so user can activate a wallet
        const eventsRes = await apiService.events.getEvents({ per_page: 5 });
        const evData = (eventsRes.data as any)?.data ?? eventsRes.data ?? [];
        setAvailableEvents(evData);
      }
      setError('');
    } catch (err: any) {
      console.error('Failed to load wallets', err);
      setError(err?.response?.data?.message || 'Gagal memuat dompet FestPay');
    } finally {
      setLoading(false);
    }
  }, [selectedWalletId]);

  const loadWalletDetails = async (id: number) => {
    try {
      const res = await apiService.festpay.getWallet(id);
      setWalletDetails(res.data ?? res);
    } catch (err) {
      console.error('Failed to load wallet details', err);
    }
  };

  useEffect(() => {
    loadWallets();
  }, []);

  const handleSelectWallet = async (id: number) => {
    setSelectedWalletId(id);
    await loadWalletDetails(id);
  };

  const handleActivateWallet = async (eventId: number) => {
    try {
      setActivatingEventId(eventId);
      const res = await apiService.festpay.getOrCreateWallet(eventId);
      const newWallet = res.data ?? res;
      await loadWallets();
      if (newWallet?.wallet_id) {
        setSelectedWalletId(newWallet.wallet_id);
        await loadWalletDetails(newWallet.wallet_id);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal mengaktifkan FestPay Wallet');
    } finally {
      setActivatingEventId(null);
    }
  };

  const activeWallet = wallets.find(w => w.id === selectedWalletId);
  const currentEventTitle = activeWallet?.event?.title || walletDetails?.event?.title || 'Festival Venue';
  const balance = Number(walletDetails?.balance ?? activeWallet?.balance ?? 0);
  const wristbands = walletDetails?.wristbands ?? activeWallet?.wristbands ?? [];
  const activeBand = wristbands.find((w: any) => w.status === 'ACTIVE');

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 8px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#fff', fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6,
              letterSpacing: '0.05em'
            }}>
              CASHDISPLAY™ v2
            </span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              TIXORA FestPay™
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0' }}>
            Dompet digital cashless resmi untuk F&B, merchandise, dan wahana di venue event.
          </p>
        </div>

        {/* Event Selector Dropdown if multiple wallets */}
        {wallets.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Pilih Venue Event:</label>
            <select
              value={selectedWalletId ?? ''}
              onChange={(e) => handleSelectWallet(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: '1.5px solid #cbd5e1',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: '#fff',
                outline: 'none',
              }}
            >
              {wallets.map(w => (
                <option key={w.id} value={w.id}>
                  {w.event?.title} (Rp {Number(w.balance).toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading && wallets.length === 0 ? (
        <div style={{
          background: '#ffffff', borderRadius: 20, padding: 48, textAlign: 'center',
          border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
        }}>
          <RefreshCw className="animate-spin" size={36} style={{ color: '#6366f1', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>Memuat FestPay Wallet...</div>
        </div>
      ) : wallets.length === 0 ? (
        /* Empty State: No active wallets yet */
        <div style={{
          background: '#ffffff', borderRadius: 24, padding: '40px 24px', textAlign: 'center',
          border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: '#e0e7ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            color: '#4f46e5',
          }}>
            <Wallet size={36} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
            Aktifkan TIXORA FestPay™ Anda
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: 460, margin: '0 auto 28px' }}>
            Belum ada dompet cashless yang aktif. Pilih event festival yang Anda ikuti untuk mengaktifkan saldo FestPay, QR Bayar dinamis, dan pairing gelang NFC.
          </p>

          <div style={{ maxWidth: 540, margin: '0 auto', textAlign: 'left' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 12 }}>
              Event Tersedia untuk FestPay:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {availableEvents.map(ev => (
                <div
                  key={ev.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px', borderRadius: 14, border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{ev.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {ev.event_date ? new Date(ev.event_date).toLocaleDateString('id-ID', { dateStyle: 'full' }) : 'Segera Berlangsung'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleActivateWallet(ev.id)}
                    disabled={activatingEventId === ev.id}
                    style={{
                      background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10,
                      padding: '8px 16px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {activatingEventId === ev.id ? 'Mengaktifkan...' : 'Aktifkan Wallet'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Active Wallet View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Hero Cashless Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #31104b 100%)',
              borderRadius: 24,
              padding: '30px 28px',
              color: '#ffffff',
              boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.45), 0 0 0 1px rgba(255,255,255,0.08) inset',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Background Glow */}
            <div style={{
              position: 'absolute', top: -40, right: -40, width: 220, height: 220,
              borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.28) 0%, rgba(0,0,0,0) 70%)',
              pointerEvents: 'none',
            }} />

            {/* Top Bar on Card */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 26, borderRadius: 6, background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.4)',
                }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)' }}>
                  CONTACTLESS CHIP
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {activeBand ? (
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, background: 'rgba(34, 197, 94, 0.2)',
                    color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.4)',
                    padding: '4px 10px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <Radio size={12} /> GELANG TERPASANG
                  </span>
                ) : (
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600, background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.7)', padding: '4px 10px', borderRadius: 999,
                  }}>
                    GELANG BELUM DIPASANG
                  </span>
                )}
              </div>
            </div>

            {/* Balance & Event info */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', fontWeight: 500, marginBottom: 4 }}>
                Saldo FestPay • {currentEventTitle}
              </div>
              <div style={{
                fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}>
                Rp {balance.toLocaleString('id-ID')}
              </div>
            </div>

            {/* Bottom Card Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Nomor Wallet</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.9)' }}>
                  {activeWallet?.wallet_number ?? 'WAL-ONLINE'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Security</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={14} /> AES-256 ISOLATED
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Grid Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            {/* 1. Show Payment QR */}
            <button
              onClick={() => setShowQrModal(true)}
              style={{
                background: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                borderRadius: 16,
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                boxShadow: '0 8px 20px -4px rgba(79, 70, 229, 0.35)',
                transition: 'transform 0.15s',
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <QrCode size={22} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 800 }}>QR Bayar Kasir</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)' }}>Token Dinamis 60s</div>
              </div>
            </button>

            {/* 2. Top Up */}
            <button
              onClick={() => setShowTopUpModal(true)}
              style={{
                background: '#ffffff',
                color: '#0f172a',
                border: '1.5px solid #e2e8f0',
                borderRadius: 16,
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                boxShadow: '0 4px 12px -2px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 12, background: '#eff6ff',
                color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <PlusCircle size={22} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 800 }}>Top Up Saldo</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>QRIS / Virtual Account</div>
              </div>
            </button>

            {/* 3. NFC Wristband */}
            <button
              onClick={() => setShowWristbandModal(true)}
              style={{
                background: '#ffffff',
                color: '#0f172a',
                border: '1.5px solid #e2e8f0',
                borderRadius: 16,
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                boxShadow: '0 4px 12px -2px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 12, background: '#ecfdf5',
                color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Radio size={22} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 800 }}>Gelang NFC</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {activeBand ? 'Kelola / Blokir' : 'Hubungkan Gelang'}
                </div>
              </div>
            </button>

            {/* 4. Refund / Withdrawal */}
            <button
              onClick={() => setShowRefundModal(true)}
              style={{
                background: '#ffffff',
                color: '#0f172a',
                border: '1.5px solid #e2e8f0',
                borderRadius: 16,
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                boxShadow: '0 4px 12px -2px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 12, background: '#fef3c7',
                color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ArrowDownLeft size={22} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 800 }}>Tarik Saldo</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Refund Instan / H+1</div>
              </div>
            </button>
          </div>

          {/* Event Isolation Notice */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: '#475569',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={16} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>
                <strong>Venue Isolation Active:</strong> Saldo FestPay ini hanya dapat dibelanjakan pada booth di dalam <strong>{currentEventTitle}</strong>.
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1' }}>
              Auto-Refund H+1 Aktif
            </span>
          </div>

          {/* Transaction Ledger */}
          <div style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 4px 12px -2px rgba(0,0,0,0.03)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Riwayat Transaksi Ledger
              </h3>
              <button
                onClick={() => selectedWalletId && loadWalletDetails(selectedWalletId)}
                style={{
                  background: 'none', border: 'none', color: '#6366f1',
                  fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {walletDetails?.recent_transactions?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {walletDetails.recent_transactions.map((tx: any) => {
                  const isCredit = tx.direction === 'CREDIT';
                  return (
                    <div
                      key={tx.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px', borderRadius: 12,
                        background: '#f8fafc', border: '1px solid #f1f5f9',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: isCredit ? '#dcfce7' : '#fee2e2',
                          color: isCredit ? '#16a34a' : '#dc2626',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {isCredit ? <ArrowUpRight size={18} /> : <ShoppingBag size={18} />}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                            {tx.description || (isCredit ? 'Top Up Saldo' : 'Pembelian Booth')}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {new Date(tx.created_at).toLocaleString('id-ID')} • Ref: {tx.reference_id || 'TX-' + tx.id}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: '0.92rem', fontWeight: 800,
                          color: isCredit ? '#16a34a' : '#0f172a',
                        }}>
                          {isCredit ? '+' : '-'} Rp {Number(tx.amount).toLocaleString('id-ID')}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          Sisa: Rp {Number(tx.balance_after).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                Belum ada mutasi transaksi pada wallet ini.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedWalletId && (
        <>
          <QrPaymentModal
            walletId={selectedWalletId}
            eventTitle={currentEventTitle}
            isOpen={showQrModal}
            onClose={() => setShowQrModal(false)}
            onTopUpRequested={() => setShowTopUpModal(true)}
          />

          <TopUpModal
            walletId={selectedWalletId}
            eventTitle={currentEventTitle}
            isOpen={showTopUpModal}
            onClose={() => setShowTopUpModal(false)}
            onSuccess={(newBal) => {
              loadWalletDetails(selectedWalletId);
              loadWallets();
            }}
          />

          <WristbandModal
            walletId={selectedWalletId}
            eventId={activeWallet?.event_id ?? walletDetails?.event?.id ?? null}
            eventTitle={currentEventTitle}
            wristbands={wristbands}
            isOpen={showWristbandModal}
            onClose={() => setShowWristbandModal(false)}
            onUpdated={() => {
              loadWalletDetails(selectedWalletId);
            }}
          />

          <RefundModal
            walletId={selectedWalletId}
            eventTitle={currentEventTitle}
            maxBalance={balance}
            isOpen={showRefundModal}
            onClose={() => setShowRefundModal(false)}
            onSuccess={() => {
              loadWalletDetails(selectedWalletId);
              loadWallets();
            }}
          />
        </>
      )}
    </div>
  );
}
