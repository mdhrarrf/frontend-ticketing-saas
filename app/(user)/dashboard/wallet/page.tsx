'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, QrCode, PlusCircle, Radio, ArrowDownLeft,
  ArrowUpRight, ShieldCheck, RefreshCw,
  ShoppingBag, ChevronRight
} from 'lucide-react';
import { apiService } from '../../../../lib/api';
import QrPaymentModal from '../../../../components/festpay/QrPaymentModal';
import TopUpModal from '../../../../components/festpay/TopUpModal';
import WristbandModal from '../../../../components/festpay/WristbandModal';
import RefundModal from '../../../../components/festpay/RefundModal';
import { Button, Card, Badge, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { formatRupiah, formatDate } from '@/lib/utils';

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
        const current = list.find((w: any) => w.id === selectedWalletId) || list[0];
        setSelectedWalletId(current.id);
        await loadWalletDetails(current.id);
      } else {
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

  const activeWallet = wallets.find((w) => w.id === selectedWalletId);
  const currentEventTitle =
    activeWallet?.event?.title || walletDetails?.event?.title || 'Festival Venue';
  const balance = Number(walletDetails?.balance ?? activeWallet?.balance ?? 0);
  const wristbands = walletDetails?.wristbands ?? activeWallet?.wristbands ?? [];
  const activeBand = wristbands.find((w: any) => w.status === 'ACTIVE');
  const transactions = walletDetails?.transactions ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Header */}
      <PageHeader
        title="TIXORA FestPay™ Cashless"
        badge={
          <Badge variant="accent" size="sm" className="font-bold">
            FESTPAY v2
          </Badge>
        }
        description="Dompet digital cashless resmi untuk transaksi F&B, merchandise, dan wahana di venue konser & festival."
        actions={
          wallets.length > 1 ? (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-text-muted">Venue Event:</label>
              <select
                value={selectedWalletId ?? ''}
                onChange={(e) => handleSelectWallet(Number(e.target.value))}
                className="h-9 px-3 rounded-xl bg-surface border border-border text-xs font-semibold text-text-primary focus:outline-none focus:border-primary"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.event?.title} ({formatRupiah(Number(w.balance))})
                  </option>
                ))}
              </select>
            </div>
          ) : undefined
        }
      />

      {loading && wallets.length === 0 ? (
        <Card variant="default" className="p-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <div className="text-sm font-semibold text-text-secondary">Memuat FestPay Wallet...</div>
        </Card>
      ) : wallets.length === 0 ? (
        /* Empty State: No active wallets yet */
        <Card variant="default" className="p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mx-auto mb-4">
            <Wallet className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-text-primary mb-2">
            Aktifkan TIXORA FestPay™ Anda
          </h2>
          <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto mb-8 leading-relaxed">
            Belum ada dompet cashless yang aktif. Pilih event festival yang Anda ikuti untuk mengaktifkan saldo FestPay, QR Bayar dinamis, dan pairing gelang NFC.
          </p>

          <div className="max-w-md mx-auto text-left space-y-3">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Event Tersedia untuk FestPay:
            </div>
            {availableEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between gap-4"
              >
                <div>
                  <div className="font-bold text-sm text-text-primary">{ev.title}</div>
                  <div className="text-xs text-text-muted">
                    {ev.event_date ? formatDate(ev.event_date) : 'Segera Berlangsung'}
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleActivateWallet(ev.id)}
                  loading={activatingEventId === ev.id}
                  className="font-bold text-xs shrink-0"
                >
                  Aktifkan Wallet
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        /* Active Wallet View */
        <div className="space-y-6">
          {/* Hero Cashless Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0B1020] via-[#1A1235] to-[#2D124D] border border-primary/30 shadow-2xl relative overflow-hidden text-white"
          >
            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

            {/* Top Bar on Card */}
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-7 rounded-md bg-gradient-to-r from-amber-400 to-amber-600 border border-white/40 shadow-sm" />
                <span className="text-[10px] font-extrabold tracking-widest text-white/70">
                  CONTACTLESS CHIP
                </span>
              </div>

              {activeBand ? (
                <Badge variant="success" size="sm" className="font-bold">
                  <Radio className="w-3 h-3" /> GELANG TERPASANG
                </Badge>
              ) : (
                <Badge variant="secondary" size="sm" className="bg-white/10 text-white/70">
                  GELANG BELUM DIPASANG
                </Badge>
              )}
            </div>

            {/* Balance & Event info */}
            <div className="mb-6 relative z-10">
              <div className="text-xs text-white/70 font-medium mb-1">
                Saldo FestPay • {currentEventTitle}
              </div>
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {formatRupiah(balance)}
              </div>
            </div>

            {/* Bottom Card Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs relative z-10">
              <div>
                <div className="text-[10px] text-white/50 uppercase font-semibold">Nomor Wallet</div>
                <div className="font-mono font-bold text-white/90">
                  {activeWallet?.wallet_number ?? 'WAL-ONLINE'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-white/50 uppercase font-semibold">Security</div>
                <div className="font-bold text-accent flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> AES-256 ISOLATED
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Grid Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Show Payment QR */}
            <Card
              variant="interactive"
              onClick={() => setShowQrModal(true)}
              className="p-4 flex items-center gap-3.5 cursor-pointer border-primary/40 hover:border-primary"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-text-primary">QR Bayar Kasir</div>
                <div className="text-[11px] text-text-muted">Token Dinamis 60s</div>
              </div>
            </Card>

            {/* 2. Top Up */}
            <Card
              variant="interactive"
              onClick={() => setShowTopUpModal(true)}
              className="p-4 flex items-center gap-3.5 cursor-pointer hover:border-primary/50"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-text-primary">Top Up Saldo</div>
                <div className="text-[11px] text-text-muted">QRIS / Virtual Account</div>
              </div>
            </Card>

            {/* 3. NFC Wristband */}
            <Card
              variant="interactive"
              onClick={() => setShowWristbandModal(true)}
              className="p-4 flex items-center gap-3.5 cursor-pointer hover:border-primary/50"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-text-primary">Gelang NFC</div>
                <div className="text-[11px] text-text-muted">
                  {activeBand ? 'Kelola / Blokir' : 'Hubungkan Gelang'}
                </div>
              </div>
            </Card>

            {/* 4. Refund */}
            <Card
              variant="interactive"
              onClick={() => setShowRefundModal(true)}
              className="p-4 flex items-center gap-3.5 cursor-pointer hover:border-primary/50"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-text-primary">Tarik Saldo</div>
                <div className="text-[11px] text-text-muted">Refund Instan / H+1</div>
              </div>
            </Card>
          </div>

          {/* Event Isolation Notice */}
          <div className="p-3.5 rounded-xl bg-surface/80 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-text-secondary">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-success shrink-0" />
              <span>
                <strong>Venue Isolation Active:</strong> Saldo FestPay ini aman terisolasi khusus di dalam <strong>{currentEventTitle}</strong>.
              </span>
            </div>
            <span className="font-bold text-primary whitespace-nowrap">
              Auto-Refund H+1 Aktif
            </span>
          </div>

          {/* Transaction Ledger */}
          <Card variant="default" className="p-5 sm:p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <h3 className="font-extrabold text-sm sm:text-base text-text-primary">
                Riwayat Transaksi Ledger
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectedWalletId && loadWalletDetails(selectedWalletId)}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Refresh
              </Button>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-8 text-text-muted text-xs">
                Belum ada mutasi transaksi pada dompet ini.
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx: any) => {
                  const isCredit = tx.type === 'TOPUP' || tx.type === 'REFUND_REVERSAL';
                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-xl bg-surface/50 border border-border/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isCredit
                              ? 'bg-success/15 text-success border border-success/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-text-primary">{tx.description || tx.type}</div>
                          <div className="text-[10px] text-text-muted">
                            {tx.created_at ? formatDate(tx.created_at) : 'Hari ini'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`font-black text-sm ${
                            isCredit ? 'text-success' : 'text-text-primary'
                          }`}
                        >
                          {isCredit ? '+' : '-'}
                          {formatRupiah(Math.abs(Number(tx.amount)))}
                        </div>
                        <div className="text-[10px] text-text-muted">
                          Saldo: {formatRupiah(Number(tx.balance_after ?? 0))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* FestPay Action Modals */}
      {selectedWalletId && (
        <>
          <QrPaymentModal
            walletId={selectedWalletId}
            eventTitle={currentEventTitle}
            isOpen={showQrModal}
            onClose={() => setShowQrModal(false)}
            onTopUpRequested={() => {
              setShowQrModal(false);
              setShowTopUpModal(true);
            }}
          />
          <TopUpModal
            walletId={selectedWalletId}
            eventTitle={currentEventTitle}
            isOpen={showTopUpModal}
            onClose={() => setShowTopUpModal(false)}
            onSuccess={() => {
              loadWalletDetails(selectedWalletId);
            }}
          />
          <WristbandModal
            walletId={selectedWalletId}
            eventId={activeWallet?.event_id ?? null}
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
            }}
          />
        </>
      )}
    </div>
  );
}
