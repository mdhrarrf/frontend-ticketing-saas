'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import {
  Store, ShoppingCart, Plus, Minus, Trash2, QrCode, Radio,
  ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Sparkles,
  Camera, Volume2, ShieldCheck, Tag, X
} from 'lucide-react';
import { apiService } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';

interface PosPageProps {
  params: Promise<{ boothId: string }>;
}

export default function BoothPosPage({ params }: PosPageProps) {
  const resolvedParams = use(params);
  const boothId = resolvedParams.boothId;

  const [boothData, setBoothData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{ [productId: number]: number }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTabMobile, setActiveTabMobile] = useState<'catalog' | 'cart'>('catalog');

  // Payment Modal State
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'QR_WALLET' | 'NFC_WRISTBAND'>('QR_WALLET');
  const [credentialInput, setCredentialInput] = useState<string>('');
  const [isProcessingPay, setIsProcessingPay] = useState<boolean>(false);
  const [payError, setPayError] = useState<string>('');
  const [receiptData, setReceiptData] = useState<any>(null);

  // Camera Scanner State
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const scannerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const loadBooth = async () => {
    try {
      setLoading(true);
      const res = await apiService.festpay.getBooth(boothId);
      const data = res.data ?? res;
      setBoothData(data);
      setProducts(data.booth?.products ?? []);
    } catch (err) {
      console.error('Failed to load booth details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooth();
  }, [boothId]);

  // Play audio chime on successful scan / payment
  const playSound = (success: boolean) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = success ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(success ? 880 : 300, ctx.currentTime);
      if (success) {
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
      }
      gain.gain.value = 0.2;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio not permitted
    }
  };

  // Cart operations
  const addToCart = (product: any) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const currentQty = prev[product.id] || 0;
      if (currentQty >= product.stock) return prev;
      return { ...prev, [product.id]: currentQty + 1 };
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => {
      const current = prev[productId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return { ...prev, [productId]: current - 1 };
    });
  };

  const deleteFromCart = (productId: number) => {
    setCart(prev => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const clearCart = () => setCart({});

  // Compute total server-bound items & subtotal
  const cartItems = Object.entries(cart).map(([pId, qty]) => {
    const product = products.find(p => p.id === Number(pId));
    return {
      product_id: Number(pId),
      name: product?.name || 'Item',
      price: Number(product?.price || 0),
      quantity: qty,
      subtotal: Number(product?.price || 0) * qty,
    };
  });

  const cartTotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Initialize Camera Scanner for QR Wallet
  useEffect(() => {
    let html5QrCode: any = null;
    let isMounted = true;

    if (showPayModal && paymentMethod === 'QR_WALLET' && cameraActive && !receiptData) {
      (async () => {
        try {
          const { Html5Qrcode } = await import('html5-qrcode');
          const element = document.getElementById('pos-camera-viewport');
          if (!element || !isMounted) return;

          html5QrCode = new Html5Qrcode('pos-camera-viewport');
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'environment' },
            { fps: 15, qrbox: { width: 220, height: 220 } },
            (decodedText: string) => {
              handleProcessPayment(decodedText);
              if (html5QrCode.isScanning) {
                html5QrCode.stop().catch(() => {});
              }
            },
            () => {}
          );
        } catch (err) {
          console.warn('POS camera scanner failed to start', err);
        }
      })();
    }

    return () => {
      isMounted = false;
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [showPayModal, paymentMethod, cameraActive, receiptData]);

  // Web NFC for wristband tap
  const handleNfcTap = async () => {
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      setPayError('Browser ini tidak mendukung Web NFC. Silakan input nomor UID gelang di bawah.');
      return;
    }

    try {
      setPayError('');
      // @ts-ignore
      const ndef = new window.NDEFReader();
      await ndef.scan();

      // @ts-ignore
      ndef.onreading = (event: any) => {
        const serial = event.serialNumber;
        if (serial) {
          handleProcessPayment(serial.toUpperCase());
        }
      };
    } catch (err) {
      setPayError('Izin NFC ditolak atau fitur NFC belum aktif pada perangkat ini.');
    }
  };

  // Submit Payment to Backend
  const handleProcessPayment = async (credential: string) => {
    if (!credential || isProcessingPay) return;

    setIsProcessingPay(true);
    setPayError('');

    const payloadItems = cartItems.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
    }));

    try {
      const res = await apiService.festpay.boothPay(boothId, {
        items: payloadItems,
        payment_method: paymentMethod,
        credential: credential.trim(),
      });

      const data = res.data ?? res;
      if (res?.success === false || data?.success === false) {
        playSound(false);
        setPayError(data?.message || res?.message || 'Transaksi ditolak.');
        return;
      }

      setReceiptData(data);
      playSound(true);
      clearCart();
      loadBooth(); // Refresh today's revenue and stock
    } catch (err: any) {
      console.error('POS Payment Error', err);
      playSound(false);
      setPayError(err?.response?.data?.message || 'Transaksi ditolak. Periksa saldo atau validitas token.');
    } finally {
      setIsProcessingPay(false);
    }
  };

  const closePayModal = () => {
    setShowPayModal(false);
    setReceiptData(null);
    setPayError('');
    setCredentialInput('');
    setCameraActive(false);
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex flex-col bg-background text-text-primary">
      {/* Top POS Bar */}
      <div className="bg-card/90 backdrop-blur-md border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/organizer/booths"
            className="text-text-muted hover:text-text-primary flex items-center gap-1.5 text-xs font-semibold shrink-0 transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Kembali</span>
          </Link>
          <div className="h-4 w-px bg-border shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-text-primary truncate">
                {boothData?.booth?.name ?? 'Terminal POS'}
              </h1>
              <Badge variant="primary" size="sm">
                {boothData?.booth?.code ?? 'BOOTH'}
              </Badge>
            </div>
            <p className="text-[11px] text-text-muted truncate">
              {boothData?.booth?.event?.title ?? 'Event Festival'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 text-right">
          <div>
            <div className="text-[10px] sm:text-xs text-text-muted uppercase font-semibold">Penjualan Hari Ini</div>
            <div className="text-sm sm:text-base font-extrabold text-success">
              {formatRupiah(Number(boothData?.today_revenue ?? 0))}{' '}
              <span className="text-[11px] text-text-muted font-normal">
                ({boothData?.today_sales_count ?? 0} tx)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher (< 1024px) */}
      <div className="lg:hidden flex border-b border-border bg-card text-xs font-bold">
        <button
          onClick={() => setActiveTabMobile('catalog')}
          className={`flex-1 py-3 text-center border-b-2 transition-colors ${
            activeTabMobile === 'catalog'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Katalog ({products.length})
        </button>
        <button
          onClick={() => setActiveTabMobile('cart')}
          className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTabMobile === 'cart'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <ShoppingCart size={14} />
          Keranjang ({totalItemCount})
        </button>
      </div>

      {/* Main POS Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] overflow-hidden">
        {/* Left: Product Catalog */}
        <div
          className={`overflow-y-auto p-4 sm:p-6 flex flex-col ${
            activeTabMobile === 'catalog' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-text-primary">
              Katalog Produk ({products.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-16 text-text-muted">
              <RefreshCw className="animate-spin mx-auto mb-3 text-primary" size={28} />
              <div className="text-sm">Memuat katalog produk...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-text-muted text-sm">
              Belum ada produk pada katalog booth ini.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 pb-20 lg:pb-4">
              {products.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const inCartQty = cart[p.id] || 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    className={`bg-card rounded-2xl border transition-all p-3.5 sm:p-4 flex flex-col justify-between select-none ${
                      isOutOfStock
                        ? 'opacity-50 cursor-not-allowed border-border'
                        : inCartQty > 0
                        ? 'border-primary shadow-sm ring-1 ring-primary/40 cursor-pointer'
                        : 'border-border hover:border-primary/50 cursor-pointer shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span
                          className={`text-[11px] font-bold ${
                            isOutOfStock ? 'text-danger' : 'text-success'
                          }`}
                        >
                          {isOutOfStock ? 'HABIS' : `Stok: ${p.stock}`}
                        </span>
                        {inCartQty > 0 && (
                          <span className="bg-primary text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center">
                            {inCartQty}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-text-primary line-clamp-2 mb-2">
                        {p.name}
                      </h3>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                      <div className="text-xs sm:text-sm font-extrabold text-primary">
                        {formatRupiah(Number(p.price))}
                      </div>
                      <button
                        disabled={isOutOfStock}
                        className={`text-xs font-bold rounded-lg px-2.5 py-1 transition-colors ${
                          inCartQty > 0
                            ? 'bg-primary text-white'
                            : 'bg-background-elevated hover:bg-primary hover:text-white text-text-primary'
                        }`}
                      >
                        + Tambah
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Order Cart & Checkout Panel */}
        <div
          className={`bg-card border-t lg:border-t-0 lg:border-l border-border flex flex-col shadow-sm ${
            activeTabMobile === 'cart' ? 'flex flex-1' : 'hidden lg:flex'
          }`}
        >
          {/* Cart Header */}
          <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
              <ShoppingCart size={18} className="text-primary" />
              <span>Keranjang Kasir ({totalItemCount})</span>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-semibold text-danger hover:underline flex items-center gap-1"
              >
                <Trash2 size={13} /> Bersihkan
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 text-text-muted">
                <ShoppingCart size={36} className="mx-auto mb-2 opacity-30" />
                <div className="text-sm font-medium">Keranjang masih kosong</div>
                <div className="text-xs text-text-muted mt-1">
                  Pilih produk dari katalog untuk memulai pesanan.
                </div>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-background border border-border gap-2"
                >
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="text-xs sm:text-sm font-bold text-text-primary truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-text-muted">
                      @ {formatRupiah(item.price)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="w-7 h-7 rounded-lg border border-border bg-card hover:bg-background-elevated flex items-center justify-center text-text-primary transition-colors"
                      aria-label="Kurangi jumlah"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="text-xs sm:text-sm font-bold min-w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => addToCart({ id: item.product_id, stock: 9999 })}
                      className="w-7 h-7 rounded-lg border border-border bg-card hover:bg-background-elevated flex items-center justify-center text-text-primary transition-colors"
                      aria-label="Tambah jumlah"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <div className="text-right shrink-0 min-w-16 ml-2">
                    <div className="text-xs sm:text-sm font-extrabold text-text-primary">
                      {formatRupiah(item.subtotal)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          <div className="p-4 border-t border-border bg-card shrink-0">
            <div className="flex justify-between items-end mb-4">
              <div>
                <span className="text-[11px] text-text-muted uppercase font-bold tracking-wider">
                  Total Pembayaran
                </span>
                <div className="text-xl sm:text-2xl font-black text-text-primary">
                  {formatRupiah(cartTotal)}
                </div>
              </div>
              <Badge variant="success" size="sm">
                Harga Server
              </Badge>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={cartItems.length === 0}
              onClick={() => {
                setShowPayModal(true);
                setCameraActive(true);
              }}
            >
              <QrCode size={18} className="mr-2" />
              Proses Bayar FestPay
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Checkout Bar for Mobile (Catalog View) */}
      {activeTabMobile === 'catalog' && totalItemCount > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 bg-card border border-border shadow-xl rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-xs text-text-muted">{totalItemCount} item dalam keranjang</div>
            <div className="text-sm font-black text-text-primary">{formatRupiah(cartTotal)}</div>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setActiveTabMobile('cart')}
          >
            <ShoppingCart size={15} className="mr-1.5" />
            Buka Keranjang
          </Button>
        </div>
      )}

      {/* POS Payment Modal (Scan QR or NFC Tap) */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-background-elevated border-b border-border flex items-center justify-between">
              <div>
                <div className="text-xs text-primary font-bold uppercase tracking-wider">
                  Total Tagihan
                </div>
                <div className="text-xl font-black text-text-primary">
                  {formatRupiah(cartTotal)}
                </div>
              </div>
              <button
                onClick={closePayModal}
                className="w-8 h-8 rounded-full bg-card hover:bg-background border border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                aria-label="Tutup modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Receipt Success View */}
            {receiptData ? (
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-extrabold text-text-primary mb-1">
                  Pembayaran Berhasil!
                </h3>
                <p className="text-xs text-text-muted mb-4">
                  No. Transaksi: <strong className="text-text-primary">{receiptData.transaction_number}</strong>
                </p>

                <div className="bg-background rounded-xl p-4 border border-border text-left text-xs space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Metode:</span>
                    <span className="font-bold">{receiptData.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Wallet Pembeli:</span>
                    <span className="font-bold font-mono">{receiptData.buyer?.wallet_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Total Terpotong:</span>
                    <span className="font-extrabold text-success">
                      {formatRupiah(Number(receiptData.amount))}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border/50 pt-2">
                    <span className="text-text-muted">Sisa Saldo Pembeli:</span>
                    <span className="font-bold">
                      {formatRupiah(Number(receiptData.buyer?.remaining_balance ?? 0))}
                    </span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={closePayModal}
                >
                  Transaksi Baru
                </Button>
              </div>
            ) : (
              /* Payment Input View (Tabs: QR Scanner or NFC Wristband) */
              <div className="p-4 sm:p-6">
                {/* Method Tabs */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={() => { setPaymentMethod('QR_WALLET'); setCameraActive(true); }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      paymentMethod === 'QR_WALLET'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <QrCode size={16} /> Scan QR Pembeli
                  </button>

                  <button
                    onClick={() => { setPaymentMethod('NFC_WRISTBAND'); setCameraActive(false); }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      paymentMethod === 'NFC_WRISTBAND'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-text-muted hover:text-text-primary'
                    }`}
                  >
                    <Radio size={16} /> Tap Gelang NFC
                  </button>
                </div>

                {paymentMethod === 'QR_WALLET' ? (
                  <div>
                    {/* Camera Scanner Viewport */}
                    <div className="w-full h-56 bg-black rounded-xl overflow-hidden relative mb-3 border border-border">
                      <div id="pos-camera-viewport" className="w-full h-full" />
                      <div className="absolute inset-6 pointer-events-none border-2 border-dashed border-white/60 rounded-xl" />
                    </div>

                    <p className="text-center text-[11px] text-text-muted mb-3">
                      Arahkan kamera ke QR FestPay 60s pada aplikasi HP pembeli.
                    </p>

                    {/* Manual token input fallback (Barcode gun / copy paste) */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Atau scan dengan barcode gun..."
                        value={credentialInput}
                        onChange={(e) => setCredentialInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleProcessPayment(credentialInput)}
                        className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-hidden focus:border-primary"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleProcessPayment(credentialInput)}
                        disabled={isProcessingPay || !credentialInput.trim()}
                        loading={isProcessingPay}
                      >
                        Bayar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="bg-background rounded-xl p-6 text-center border border-dashed border-border mb-4">
                      <Radio size={36} className="text-primary mx-auto mb-2" />
                      <div className="text-sm font-bold text-text-primary">
                        Tempelkan Gelang NFC ke Belakang HP
                      </div>
                      <p className="text-xs text-text-muted mt-1 mb-4">
                        Pastikan sensor NFC HP kasir aktif. Saldo akan otomatis terpotong instan.
                      </p>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleNfcTap}
                      >
                        Aktifkan Reader NFC
                      </Button>
                    </div>

                    {/* Manual UID Fallback */}
                    <label className="block text-xs font-semibold text-text-muted mb-1.5">
                      Input UID Gelang Manual / RFID Reader USB:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: 04:A2:3F:89:C1:6B:80"
                        value={credentialInput}
                        onChange={(e) => setCredentialInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleProcessPayment(credentialInput)}
                        className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-hidden focus:border-primary"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleProcessPayment(credentialInput)}
                        disabled={isProcessingPay || !credentialInput.trim()}
                        loading={isProcessingPay}
                      >
                        Potong Saldo
                      </Button>
                    </div>
                  </div>
                )}

                {payError && (
                  <Alert variant="danger" className="mt-3">
                    {payError}
                  </Alert>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
