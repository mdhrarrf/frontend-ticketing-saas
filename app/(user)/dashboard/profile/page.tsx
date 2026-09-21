'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import { Lock, Save, CheckCircle, AlertCircle, Eye, EyeOff, Loader2, Camera } from 'lucide-react';

type ToastState = { msg: string; type: 'success' | 'error' } | null;

function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.96 }}
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

export default function ProfilePage() {
  const { user, setAuth, token } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving,   setSaving]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [toast,    setToast]    = useState<ToastState>(null);
  const [showPw,   setShowPw]   = useState({ current: false, newPw: false, confirm: false });

  const [form, setForm] = useState({
    name: '', email: '', phone: '', id_number: '', birth_date: '', gender: 'other', city: '', province: '',
  });
  const [pwForm, setPwForm] = useState({
    current_password: '', new_password: '', confirm_password: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        name:       user.name       || '',
        email:      user.email      || '',
        phone:      user.phone      || '',
        id_number:  user.id_number  || '',
        birth_date: user.birth_date ? new Date(user.birth_date).toISOString().split('T')[0] : '',
        gender:     user.gender     || 'other',
        city:       user.city       || '',
        province:   user.province   || '',
      });
    }
  }, [user]);

  const notify = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.user.updateProfile(form);
      if (user) setAuth({ ...user, ...form } as any, token!);
      notify('Profil berhasil diperbarui!', 'success');
    } catch (err: any) {
      notify(err?.response?.data?.message || 'Gagal memperbarui profil', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      notify('Konfirmasi password tidak cocok', 'error');
      return;
    }
    if (pwForm.new_password.length < 8) {
      notify('Password baru minimal 8 karakter', 'error');
      return;
    }
    setPwSaving(true);
    try {
      await apiService.user.changePassword({
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      });
      notify('Password berhasil diubah!', 'success');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      notify(err?.response?.data?.message || 'Password saat ini salah', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  const initials = form.name?.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  return (
    <div>
      <AnimatePresence><Toast toast={toast} /></AnimatePresence>

      {/* Page title */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Profil Saya</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Kelola informasi pribadi dan keamanan akunmu</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Profile section ──────────────────────── */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {/* Section header */}
          <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Save size={15} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Informasi Pribadi</span>
          </div>

          <div style={{ padding: '24px' }}>
            {/* Avatar row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
              {/* Avatar with camera button */}
              <div style={{ position: 'relative', flexShrink: 0, width: 72, height: 72 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '1.4rem', fontWeight: 700,
                  userSelect: 'none',
                }}>
                  {initials}
                </div>
                {/* Camera button — perfectly circular, positioned bottom-right */}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  title="Ganti foto profil"
                  style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'var(--color-primary)',
                    border: '2px solid white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', padding: 0,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  }}
                >
                  <Camera size={12} color="white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} />
              </div>

              {/* Name + email */}
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 3 }}>
                  {form.name || 'Nama belum diisi'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{form.email}</div>
              </div>
            </div>

            {/* Form grid */}
            <form onSubmit={handleSaveProfile}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

                {/* Nama */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label" htmlFor="prof-name">Nama Lengkap</label>
                  <input
                    id="prof-name" className="input" type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nama lengkapmu"
                  />
                </div>

                {/* Email readonly */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label" htmlFor="prof-email">Email</label>
                  <input
                    id="prof-email" className="input" type="email"
                    value={form.email} readOnly
                    style={{ color: 'var(--text-muted)', cursor: 'not-allowed', background: 'var(--background)' }}
                  />
                </div>

                {/* Phone */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label" htmlFor="prof-phone">No. Handphone</label>
                  <input
                    id="prof-phone" className="input" type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+62..."
                  />
                </div>

                {/* Nomor Identitas (KTP) */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label" htmlFor="prof-id_number">Nomor Identitas (KTP/Paspor)</label>
                  <input
                    id="prof-id_number" className="input" type="text"
                    value={form.id_number}
                    onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))}
                    placeholder="Sesuai kartu identitas resmi"
                  />
                </div>

                {/* Tanggal lahir */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label" htmlFor="prof-dob">Tanggal Lahir</label>
                  <input
                    id="prof-dob" className="input" type="date"
                    value={form.birth_date}
                    onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))}
                  />
                </div>

                {/* Jenis Kelamin */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label" htmlFor="prof-gender">Jenis Kelamin</label>
                  <select
                    id="prof-gender" className="input"
                    value={form.gender}
                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>

                {/* Provinsi + Kota side by side in one cell */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="label" htmlFor="prof-province">Provinsi</label>
                    <input
                      id="prof-province" className="input" type="text"
                      value={form.province}
                      onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
                      placeholder="Provinsi"
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="label" htmlFor="prof-city">Kota</label>
                    <input
                      id="prof-city" className="input" type="text"
                      value={form.city}
                      onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="Kota"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ minWidth: 148 }}>
                  {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Change Password section ───────────────── */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={15} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Keamanan Akun</span>
          </div>

          <div style={{ padding: '24px' }}>
            <form onSubmit={handleChangePassword}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400, marginBottom: 20 }}>
                {([
                  { key: 'current_password' as const, label: 'Password Saat Ini',       show: showPw.current, toggle: () => setShowPw(s => ({ ...s, current: !s.current })) },
                  { key: 'new_password'     as const, label: 'Password Baru',            show: showPw.newPw,   toggle: () => setShowPw(s => ({ ...s, newPw: !s.newPw })) },
                  { key: 'confirm_password' as const, label: 'Konfirmasi Password Baru', show: showPw.confirm, toggle: () => setShowPw(s => ({ ...s, confirm: !s.confirm })) },
                ]).map(({ key, label, show, toggle }) => (
                  <div key={key} className="form-group" style={{ margin: 0 }}>
                    <label className="label" htmlFor={key}>{label}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id={key} className="input"
                        type={show ? 'text' : 'password'}
                        value={pwForm[key]}
                        onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))}
                        required
                        placeholder="••••••••"
                        style={{ paddingRight: 44 }}
                      />
                      <button
                        type="button" onClick={toggle}
                        style={{
                          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                        }}
                      >
                        {show ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" disabled={pwSaving} className="btn btn-primary" style={{ minWidth: 160 }}>
                {pwSaving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Lock size={15} />}
                {pwSaving ? 'Memperbarui...' : 'Ubah Password'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
