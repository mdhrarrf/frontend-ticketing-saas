'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store, Plus, ArrowRight, ShoppingBag, DollarSign,
  Calendar, CheckCircle, RefreshCw, X, AlertCircle
} from 'lucide-react';
import { apiService } from '../../../lib/api';

export default function OrganizerBoothsPage() {
  const [booths, setBooths] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form state
  const [formEventId, setFormEventId] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formCode, setFormCode] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('FOOD');
  const [formContact, setFormContact] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [boothsRes, eventsRes] = await Promise.all([
        apiService.festpay.getBooths(),
        apiService.organizer.getEvents({ per_page: 50 }),
      ]);
      setBooths(boothsRes.data ?? []);
      const evList = (eventsRes.data as any)?.data ?? eventsRes.data ?? [];
      setEvents(evList);
      if (evList.length > 0 && !formEventId) {
        setFormEventId(String(evList[0].id));
      }
    } catch (err) {
      console.error('Failed to load booths', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBooth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEventId || !formName || !formCode) {
      setFormError('Lengkapi semua data wajib');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      await apiService.festpay.createBooth({
        event_id: Number(formEventId),
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        category: formCategory,
        contact: formContact.trim(),
      });

      setShowCreateModal(false);
      setFormName('');
      setFormCode('');
      setFormContact('');
      loadData();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Gagal membuat booth vendor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: '#4f46e5', color: '#fff', fontSize: '0.68rem', fontWeight: 800,
              padding: '2px 8px', borderRadius: 4, letterSpacing: '0.05em'
            }}>
              FESTPAY™ ECOSYSTEM
            </span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Tenant Booths & Cashier POS
            </h1>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0' }}>
            Kelola booth F&B/Merchandise di dalam venue dan buka terminal POS kasir untuk pembayaran QR/NFC.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 12,
            padding: '10px 18px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <Plus size={16} /> Tambah Booth Baru
        </button>
      </div>

      {loading ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 48, textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <RefreshCw className="animate-spin" size={32} style={{ color: '#4f46e5', margin: '0 auto 12px' }} />
          <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Memuat data booth festival...</div>
        </div>
      ) : booths.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 20, padding: 48, textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <Store size={48} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
            Belum Ada Booth Terdaftar
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: 400, margin: '0 auto 20px' }}>
            Daftarkan booth F&B atau merchandise tenant pada event Anda untuk memulai ekosistem pembayaran cashless.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 10,
              padding: '10px 20px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Buat Booth Pertama
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {booths.map((booth) => {
            const productCount = booth.products?.length ?? 0;
            return (
              <div
                key={booth.id}
                style={{
                  background: '#ffffff',
                  borderRadius: 18,
                  border: '1px solid #e2e8f0',
                  padding: '22px',
                  boxShadow: '0 4px 12px -2px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                      background: booth.category === 'FOOD' ? '#fef3c7' : booth.category === 'BEVERAGE' ? '#e0e7ff' : '#f3e8ff',
                      color: booth.category === 'FOOD' ? '#b45309' : booth.category === 'BEVERAGE' ? '#4338ca' : '#7e22ce',
                    }}>
                      {booth.category}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', fontFamily: 'monospace' }}>
                      {booth.code}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                    {booth.name}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={13} /> {booth.event?.title ?? 'Event'}
                  </div>

                  <div style={{
                    background: '#f8fafc', borderRadius: 12, padding: '12px 14px', marginBottom: 20,
                    display: 'flex', justifyContent: 'space-around', border: '1px solid #f1f5f9',
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Katalog Menu</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                        {productCount} item
                      </div>
                    </div>
                    <div style={{ width: 1, background: '#e2e8f0' }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Status Booth</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#16a34a' }}>
                        AKTIF
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/organizer/booths/${booth.id}/pos`}
                  style={{
                    background: '#0f172a', color: '#fff', borderRadius: 12, padding: '12px',
                    textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 8, fontSize: '0.85rem', fontWeight: 700,
                  }}
                >
                  <Store size={16} /> Buka POS Kasir <ArrowRight size={15} />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah Booth */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 20, width: '100%', maxWidth: 440,
            overflow: 'hidden', padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Tambah Tenant Booth Baru
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBooth}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Pilih Event Festival
                </label>
                <select
                  value={formEventId}
                  onChange={(e) => setFormEventId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Nama Booth / Tenant
                </label>
                <input
                  type="text"
                  placeholder="Contoh: TIXORA Coffee Bar"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Kode Booth (Singkat)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BOOTH-FNB-02"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Kategori
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  <option value="FOOD">Makanan (Food)</option>
                  <option value="BEVERAGE">Minuman (Beverage)</option>
                  <option value="MERCHANDISE">Merchandise Resmi</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Kontak / Email PIC
                </label>
                <input
                  type="text"
                  placeholder="tenant@vendor.com"
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              {formError && (
                <div style={{
                  marginBottom: 16, padding: '8px 12px', borderRadius: 8,
                  background: '#fef2f2', color: '#b91c1c', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <AlertCircle size={14} /> {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10,
                  background: submitting ? '#94a3b8' : '#4f46e5', color: '#fff', border: 'none',
                  fontWeight: 700, fontSize: '0.9rem', cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Menyimpan...' : 'Simpan Booth'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
