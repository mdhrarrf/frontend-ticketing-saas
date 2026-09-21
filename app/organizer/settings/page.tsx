'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Save, CheckCircle, AlertCircle, Loader2, Building, Phone, Globe, MapPin, Landmark } from 'lucide-react';
import { apiService } from '../../../lib/api';

export default function OrganizerSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [form, setForm] = useState({
    organization_name: '', description: '', contact_email: '', contact_phone: '',
    website: '', province: '', city: '', address: '',
    bank_name: '', bank_account_number: '', bank_account_name: '',
  });

  const notify = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await apiService.organizer.getProfile();
        const data = (res as any)?.data ?? res;
        if (data) {
          setForm({
            organization_name:   data.organization_name   || '',
            description:         data.description         || '',
            contact_email:       data.contact_email        || '',
            contact_phone:       data.contact_phone        || '',
            website:             data.website              || '',
            province:            data.province             || '',
            city:                data.city                 || '',
            address:             data.address              || '',
            bank_name:           data.bank_name            || '',
            bank_account_number: data.bank_account_number  || '',
            bank_account_name:   data.bank_account_name    || '',
          });
        }
      } catch { }
      finally { setLoading(false); }
    })();
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.organizer.updateProfile(form);
      notify('Profil organizer berhasil diperbarui!', 'success');
    } catch (err: any) {
      notify(err?.response?.data?.message || 'Gagal menyimpan perubahan', 'error');
    } finally { setSaving(false); }
  };

  function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ color: 'var(--color-primary)' }}>{icon}</div>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>
    );
  }

  return (
    <div>
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 10, background: toast.type === 'success' ? '#10B981' : '#EF4444', color: 'white', fontSize: '0.85rem', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
            {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings size={20} style={{ color: 'var(--color-primary)' }} /> Pengaturan Organizer
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Kelola profil dan informasi EO kamu</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[180, 220, 160].map((h, i) => <div key={i} style={{ height: h, borderRadius: 14, background: 'var(--background-2)', opacity: 0.7 }} />)}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <SectionCard title="Informasi Organisasi" icon={<Building size={15} />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                <label className="label">Nama Organisasi / EO</label>
                <input className="input" type="text" value={form.organization_name} onChange={e => set('organization_name', e.target.value)} placeholder="Nama EO" />
              </div>
              <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                <label className="label">Deskripsi</label>
                <textarea className="input" value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Deskripsi EO..." style={{ resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="label">Email Kontak</label>
                <input className="input" type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="kontak@eo.com" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="label">No. Telepon</label>
                <input className="input" type="tel" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="+62..." />
              </div>
              <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                <label className="label">Website / Media Sosial</label>
                <input className="input" type="text" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://website.com atau @instagram" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Alamat" icon={<MapPin size={15} />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ margin: 0 }}><label className="label">Provinsi</label><input className="input" type="text" value={form.province} onChange={e => set('province', e.target.value)} placeholder="Jawa Barat" /></div>
              <div className="form-group" style={{ margin: 0 }}><label className="label">Kota</label><input className="input" type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Bandung" /></div>
              <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                <label className="label">Alamat Lengkap</label>
                <textarea className="input" value={form.address} onChange={e => set('address', e.target.value)} rows={2} placeholder="Jl. Contoh No. 123..." style={{ resize: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Rekening Bank (Payout)" icon={<Landmark size={15} />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="label">Nama Bank</label>
                <select className="input" value={form.bank_name} onChange={e => set('bank_name', e.target.value)} style={{ cursor: 'pointer' }}>
                  <option value="">Pilih Bank</option>
                  {['BCA','BNI','BRI','Mandiri','CIMB Niaga','Danamon','Permata','BTN','BSI'].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}><label className="label">Nomor Rekening</label><input className="input" type="text" value={form.bank_account_number} onChange={e => set('bank_account_number', e.target.value)} placeholder="Nomor rekening" /></div>
              <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}><label className="label">Nama Pemilik Rekening</label><input className="input" type="text" value={form.bank_account_name} onChange={e => set('bank_account_name', e.target.value)} placeholder="Sesuai buku tabungan" /></div>
            </div>
          </SectionCard>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ minWidth: 160, display: 'flex', alignItems: 'center', gap: 8 }}>
              {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

