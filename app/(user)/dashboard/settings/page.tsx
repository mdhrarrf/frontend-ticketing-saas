'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Globe, Shield, Trash2, CheckCircle, AlertCircle, ChevronRight, Moon, Sun, Monitor } from 'lucide-react';

type ToastState = { msg: string; type: 'success' | 'error' } | null;

function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      style={{
        position: 'fixed', top: 24, right: 24, zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '13px 20px', borderRadius: 12,
        background: toast.type === 'success' ? '#10B981' : '#EF4444',
        color: 'white', fontSize: '0.85rem', fontWeight: 600,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      }}
    >
      {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {toast.msg}
    </motion.div>
  );
}

function SettingRow({
  label,
  description,
  children,
  danger,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, padding: '16px 0',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: danger ? 'var(--danger)' : 'var(--text-primary)', marginBottom: description ? 2 : 0 }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{description}</div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12, position: 'relative',
        background: value ? 'var(--color-primary)' : 'var(--border-bright)',
        border: 'none', cursor: 'pointer', transition: 'background 0.2s', padding: 0,
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: value ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%', background: 'white',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ color: 'var(--color-primary)' }}>{icon}</div>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
      </div>
      <div style={{ padding: '0 24px' }}>
        {children}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--border)' }} />;
}

export default function SettingsPage() {
  const [toast, setToast] = useState<ToastState>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [notif, setNotif] = useState({
    email_order:     true,
    email_promo:     false,
    email_reminder:  true,
    push_order:      true,
    push_promo:      false,
  });

  const [privacy, setPrivacy] = useState({
    show_wishlist:   false,
    data_analytics:  true,
  });

  const [appearance, setAppearance] = useState<'light' | 'dark' | 'system'>('light');

  const [lang, setLang] = useState('id');

  const notify = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const saveSettings = () => {
    notify('Pengaturan berhasil disimpan', 'success');
  };

  return (
    <div>
      <AnimatePresence><Toast toast={toast} /></AnimatePresence>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Pengaturan</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Kelola preferensi dan pengaturan akunmu</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Notifikasi ─────────────────────────── */}
        <SectionCard title="Notifikasi" icon={<Bell size={15} />}>
          <SettingRow
            label="Email: Konfirmasi Pesanan"
            description="Terima email setiap kali pesanan dikonfirmasi atau berubah status"
          >
            <Toggle value={notif.email_order} onChange={v => setNotif(n => ({ ...n, email_order: v }))} />
          </SettingRow>
          <Divider />
          <SettingRow
            label="Email: Promo & Penawaran"
            description="Dapatkan penawaran eksklusif dan diskon tiket event"
          >
            <Toggle value={notif.email_promo} onChange={v => setNotif(n => ({ ...n, email_promo: v }))} />
          </SettingRow>
          <Divider />
          <SettingRow
            label="Email: Pengingat Event"
            description="Ingatkan 1 hari sebelum event yang kamu miliki tiketnya"
          >
            <Toggle value={notif.email_reminder} onChange={v => setNotif(n => ({ ...n, email_reminder: v }))} />
          </SettingRow>
          <Divider />
          <SettingRow
            label="Notifikasi Browser: Status Pesanan"
            description="Notifikasi real-time di browser untuk update pesanan"
          >
            <Toggle value={notif.push_order} onChange={v => setNotif(n => ({ ...n, push_order: v }))} />
          </SettingRow>
          <Divider />
          <SettingRow
            label="Notifikasi Browser: Promo"
            description="Notifikasi promo dan event baru yang sesuai minatmu"
          >
            <Toggle value={notif.push_promo} onChange={v => setNotif(n => ({ ...n, push_promo: v }))} />
          </SettingRow>
          <div style={{ paddingBottom: 16 }} />
        </SectionCard>

        {/* ── Tampilan ───────────────────────────── */}
        <SectionCard title="Tampilan & Bahasa" icon={<Globe size={15} />}>
          <SettingRow label="Tema Tampilan" description="Pilih tema yang nyaman untukmu">
            <div style={{ display: 'flex', gap: 6 }}>
              {([
                { value: 'light',  icon: <Sun size={14} />,     label: 'Terang' },
                { value: 'system', icon: <Monitor size={14} />, label: 'Sistem' },
                { value: 'dark',   icon: <Moon size={14} />,    label: 'Gelap' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setAppearance(opt.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.15s',
                    border: '1px solid var(--border)',
                    background: appearance === opt.value ? 'var(--color-primary)' : 'var(--card)',
                    color: appearance === opt.value ? 'white' : 'var(--text-secondary)',
                  }}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </SettingRow>
          <Divider />
          <SettingRow label="Bahasa" description="Pilih bahasa antarmuka aplikasi">
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              style={{
                padding: '7px 12px', borderRadius: 8, fontSize: '0.82rem',
                border: '1px solid var(--border)', background: 'var(--card)',
                color: 'var(--text-primary)', cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="id">🇮🇩 Bahasa Indonesia</option>
              <option value="en">🇺🇸 English</option>
            </select>
          </SettingRow>
          <div style={{ paddingBottom: 16 }} />
        </SectionCard>

        {/* ── Privasi ────────────────────────────── */}
        <SectionCard title="Privasi & Data" icon={<Shield size={15} />}>
          <SettingRow
            label="Tampilkan Wishlist ke Publik"
            description="Orang lain bisa melihat daftar event yang kamu simpan"
          >
            <Toggle value={privacy.show_wishlist} onChange={v => setPrivacy(p => ({ ...p, show_wishlist: v }))} />
          </SettingRow>
          <Divider />
          <SettingRow
            label="Bantu Tingkatkan Layanan"
            description="Izinkan penggunaan data anonim untuk meningkatkan pengalaman aplikasi"
          >
            <Toggle value={privacy.data_analytics} onChange={v => setPrivacy(p => ({ ...p, data_analytics: v }))} />
          </SettingRow>
          <div style={{ paddingBottom: 16 }} />
        </SectionCard>

        {/* ── Save button ────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={saveSettings} className="btn btn-primary" style={{ minWidth: 160 }}>
            Simpan Pengaturan
          </button>
        </div>

        {/* ── Danger Zone ────────────────────────── */}
        <div style={{ background: 'var(--card)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trash2 size={15} style={{ color: 'var(--danger)' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--danger)' }}>Zona Berbahaya</span>
          </div>
          <div style={{ padding: '0 24px' }}>
            <SettingRow
              label="Hapus Akun"
              description="Tindakan ini permanen dan tidak dapat dibatalkan. Semua data termasuk tiket dan riwayat pesanan akan dihapus."
              danger
            >
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
                    border: '1px solid var(--danger)', color: 'var(--danger)', background: 'transparent',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  Hapus Akun
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      padding: '7px 14px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
                      border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--card)',
                      cursor: 'pointer',
                    }}
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => notify('Hubungi support untuk menghapus akun', 'error')}
                    style={{
                      padding: '7px 14px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
                      border: 'none', color: 'white', background: 'var(--danger)',
                      cursor: 'pointer',
                    }}
                  >
                    Ya, Hapus Akun
                  </button>
                </div>
              )}
            </SettingRow>
            <div style={{ paddingBottom: 8 }} />
          </div>
        </div>

      </div>
    </div>
  );
}
