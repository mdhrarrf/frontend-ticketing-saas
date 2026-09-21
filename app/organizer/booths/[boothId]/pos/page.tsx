'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import {
  Store, ShoppingCart, Plus, Minus, Trash2, QrCode, Radio,
  ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Sparkles,
  Camera, Volume2, ShieldCheck, Tag
} from 'lucide-react';
import { apiService } from '../../../../../lib/api';

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
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

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
            { fps: 15, qrbox: { width: 240, height: 240 } },
            (decodedText: string) => {
              // Found QR token!
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
      setPayError('Izin NFC ditolak atau fitur NFC belum aktif pada HP Anda.');
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
      setPayError(err?.response?.data?.message || 'Transaksi ditolak. Periksa saldo atau validitas QR.');
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
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* Top POS Header */}
      <div style={{
        background: '#0f172a',
        color: '#ffffff',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link
            href="/organizer/booths"
            style={{
              color: 'rgba(255,255,255,0.7)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
              fontSize: '0.8rem', fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> Kembali
          </Link>
          <div style={{ height: 20, width: 1, background: 'rgba(255,255,255,0.15)' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                {boothData?.booth?.name ?? 'Terminal POS'}
              </h2>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#4f46e5', padding: '2px 6px', borderRadius: 4 }}>
                {boothData?.booth?.code ?? 'BOOTH'}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
              {boothData?.booth?.event?.title ?? 'Event Festival'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Penjualan Hari Ini</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10b981' }}>
              Rp {Number(boothData?.today_revenue ?? 0).toLocaleString('id-ID')}{' '}
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 400 }}>
                ({boothData?.today_sales_count ?? 0} tx)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* POS Workspace (Catalog Left / Cart Right) */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', overflow: 'hidden' }}>
        {/* Left: Product Catalog */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
              Pilih Menu / Produk ({products.length})
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 12px', color: '#4f46e5' }} />
              <div>Memuat katalog produk...</div>
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
              Belum ada produk pada katalog booth ini.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {products.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const inCartQty = cart[p.id] || 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    style={{
                      background: '#ffffff',
                      borderRadius: 16,
                      border: `1.5px solid ${inCartQty > 0 ? '#4f46e5' : '#e2e8f0'}`,
                      padding: '16px',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      opacity: isOutOfStock ? 0.5 : 1,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.12s',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: isOutOfStock ? '#ef4444' : '#16a34a' }}>
                          {isOutOfStock ? 'HABIS' : `Stok: ${p.stock}`}
                        </span>
                        {inCartQty > 0 && (
                          <span style={{
                            background: '#4f46e5', color: '#fff', fontSize: '0.72rem', fontWeight: 800,
                            width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {inCartQty}
                          </span>
                        )}
                      </div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                        {p.name}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#4f46e5' }}>
                        Rp {Number(p.price).toLocaleString('id-ID')}
                      </div>
                      <button
                        disabled={isOutOfStock}
                        style={{
                          background: inCartQty > 0 ? '#4f46e5' : '#f1f5f9',
                          color: inCartQty > 0 ? '#fff' : '#0f172a',
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
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
        <div style={{
          background: '#ffffff',
          borderLeft: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 16px rgba(0,0,0,0.02)',
        }}>
          {/* Cart Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
              <ShoppingCart size={18} /> Keranjang Kasir ({cartItems.length})
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                style={{
                  background: 'none', border: 'none', color: '#ef4444',
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <Trash2 size={13} /> Bersihkan
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                <ShoppingCart size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <div style={{ fontSize: '0.85rem' }}>Keranjang masih kosong.</div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 4 }}>Klik produk di sebelah kiri untuk menambahkan.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cartItems.map((item) => (
                  <div
                    key={item.product_id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        @ Rp {item.price.toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        style={{
                          width: 26, height: 26, borderRadius: 6, border: '1px solid #cbd5e1',
                          background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, minWidth: 18, textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addToCart({ id: item.product_id, stock: 9999 })}
                        style={{
                          width: 26, height: 26, borderRadius: 6, border: '1px solid #cbd5e1',
                          background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: 72, marginLeft: 10 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                        Rp {item.subtotal.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          <div style={{ padding: '20px', borderTop: '1px solid #f1f5f9', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Pembayaran</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  Rp {cartTotal.toLocaleString('id-ID')}
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                Harga Server Terverifikasi
              </div>
            </div>

            <button
              disabled={cartItems.length === 0}
              onClick={() => {
                setShowPayModal(true);
                setCameraActive(true);
              }}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 14,
                background: cartItems.length === 0 ? '#cbd5e1' : '#4f46e5',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.95rem',
                fontWeight: 800,
                cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: cartItems.length === 0 ? 'none' : '0 8px 20px -4px rgba(79, 70, 229, 0.4)',
              }}
            >
              <QrCode size={18} /> Proses Bayar FestPay
            </button>
          </div>
        </div>
      </div>

      {/* POS Payment Modal (Scan QR or NFC Tap) */}
      {showPayModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 24, width: '100%', maxWidth: 460,
            overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px', background: '#0f172a', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Tagihan
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900 }}>
                  Rp {cartTotal.toLocaleString('id-ID')}
                </div>
              </div>
              <button
                onClick={closePayModal}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Receipt Success View */}
            {receiptData ? (
              <div style={{ padding: '28px 24px', textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', background: '#dcfce7',
                  color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <CheckCircle2 size={36} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                  Pembayaran Berhasil!
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 20 }}>
                  No. Transaksi: <strong>{receiptData.transaction_number}</strong>
                </div>

                <div style={{
                  background: '#f8fafc', borderRadius: 14, padding: '16px', border: '1px solid #e2e8f0',
                  textAlign: 'left', fontSize: '0.82rem', marginBottom: 24,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#64748b' }}>Metode:</span>
                    <span style={{ fontWeight: 700 }}>{receiptData.payment_method}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#64748b' }}>Wallet Pembeli:</span>
                    <span style={{ fontWeight: 700 }}>{receiptData.buyer?.wallet_number}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#64748b' }}>Total Terpotong:</span>
                    <span style={{ fontWeight: 800, color: '#16a34a' }}>
                      Rp {Number(receiptData.amount).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Sisa Saldo Pembeli:</span>
                    <span style={{ fontWeight: 700 }}>
                      Rp {Number(receiptData.buyer?.remaining_balance ?? 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={closePayModal}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 12,
                    background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Transaksi Baru
                </button>
              </div>
            ) : (
              /* Payment Input View (Tabs: QR Scanner or NFC Wristband) */
              <div style={{ padding: '20px 24px' }}>
                {/* Method Tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
                  <button
                    onClick={() => { setPaymentMethod('QR_WALLET'); setCameraActive(true); }}
                    style={{
                      padding: '10px', borderRadius: 10,
                      border: `1.5px solid ${paymentMethod === 'QR_WALLET' ? '#4f46e5' : '#e2e8f0'}`,
                      background: paymentMethod === 'QR_WALLET' ? '#eef2ff' : '#fff',
                      color: paymentMethod === 'QR_WALLET' ? '#4f46e5' : '#475569',
                      fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <QrCode size={16} /> Scan QR Pembeli
                  </button>

                  <button
                    onClick={() => { setPaymentMethod('NFC_WRISTBAND'); setCameraActive(false); }}
                    style={{
                      padding: '10px', borderRadius: 10,
                      border: `1.5px solid ${paymentMethod === 'NFC_WRISTBAND' ? '#4f46e5' : '#e2e8f0'}`,
                      background: paymentMethod === 'NFC_WRISTBAND' ? '#eef2ff' : '#fff',
                      color: paymentMethod === 'NFC_WRISTBAND' ? '#4f46e5' : '#475569',
                      fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <Radio size={16} /> Tap Gelang NFC
                  </button>
                </div>

                {paymentMethod === 'QR_WALLET' ? (
                  <div>
                    {/* Camera Scanner Viewport */}
                    <div style={{
                      width: '100%', height: 260, background: '#0f172a', borderRadius: 16,
                      overflow: 'hidden', position: 'relative', marginBottom: 14,
                    }}>
                      <div id="pos-camera-viewport" style={{ width: '100%', height: '100%' }} />

                      {/* Aim target frame overlay */}
                      <div style={{
                        position: 'absolute', inset: '25px', pointerEvents: 'none',
                        border: '2px dashed rgba(255,255,255,0.7)', borderRadius: 16,
                      }} />
                    </div>

                    <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', marginBottom: 12 }}>
                      Arahkan kamera ke QR FestPay 60s pada aplikasi HP pembeli.
                    </div>

                    {/* Manual token input fallback (Barcode gun / copy paste) */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Atau masukkan kode / scanner gun..."
                        value={credentialInput}
                        onChange={(e) => setCredentialInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleProcessPayment(credentialInput)}
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
                          fontSize: '0.8rem', outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => handleProcessPayment(credentialInput)}
                        disabled={isProcessingPay || !credentialInput.trim()}
                        style={{
                          padding: '8px 14px', borderRadius: 8, background: '#4f46e5', color: '#fff',
                          border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        Bayar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      background: '#f8fafc', borderRadius: 16, padding: '30px 20px',
                      textAlign: 'center', border: '1.5px dashed #cbd5e1', marginBottom: 16,
                    }}>
                      <Radio size={44} style={{ color: '#4f46e5', margin: '0 auto 12px' }} />
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                        Tempelkan Gelang NFC ke Belakang HP
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '6px 0 16px' }}>
                        Pastikan sensor NFC HP kasir aktif. Saldo akan otomatis terpotong secara instan.
                      </p>

                      <button
                        type="button"
                        onClick={handleNfcTap}
                        style={{
                          background: '#059669', color: '#fff', border: 'none', borderRadius: 10,
                          padding: '10px 18px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        Aktifkan Reader NFC
                      </button>
                    </div>

                    {/* Manual UID Fallback */}
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Input UID Gelang Manual / RFID Reader USB:
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Contoh: 04:A2:3F:89:C1:6B:80"
                        value={credentialInput}
                        onChange={(e) => setCredentialInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleProcessPayment(credentialInput)}
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
                          fontSize: '0.8rem', fontFamily: 'monospace', outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => handleProcessPayment(credentialInput)}
                        disabled={isProcessingPay || !credentialInput.trim()}
                        style={{
                          padding: '8px 14px', borderRadius: 8, background: '#4f46e5', color: '#fff',
                          border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        Potong Saldo
                      </button>
                    </div>
                  </div>
                )}

                {payError && (
                  <div style={{
                    marginTop: 14, padding: '10px 12px', borderRadius: 8,
                    background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c',
                    fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <AlertCircle size={15} /> {payError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
