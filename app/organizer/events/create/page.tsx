'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Calendar, MapPin, Tag, Save, Zap, AlertTriangle, Loader2, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiService } from '../../../../lib/api';

const eventSchema = z.object({
  title:       z.string().min(3, 'Nama event minimal 3 karakter').max(150),
  category:    z.string().min(1, 'Pilih kategori'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  tags:        z.string().optional(),

  event_date:  z.string().min(1, 'Tanggal event wajib diisi'),
  event_time:  z.string().min(1, 'Waktu event wajib diisi'),
  venue_name:  z.string().min(1, 'Nama venue wajib diisi'),
  venue_city:  z.string().min(1, 'Kota wajib diisi'),
  venue_address: z.string().optional(),

  sale_start_at:    z.string().min(1, 'Waktu buka penjualan wajib diisi'),
  sale_end_at:      z.string().min(1, 'Waktu tutup penjualan wajib diisi'),
  is_war_ticket:    z.boolean(),
  war_ticket_open_at: z.string().optional(),
  max_per_user:     z.number().min(1).max(10),

  categories: z.array(z.object({
    name:  z.string().min(1, 'Nama kategori wajib diisi'),
    type:  z.string().min(1),
    price: z.number().min(0),
    quota: z.number().min(1, 'Kuota minimal 1'),
    color: z.string(),
    description: z.string().optional(),
  })).min(1, 'Minimal 1 kategori tiket'),
});

type EventForm = z.infer<typeof eventSchema>;

const STEP_LABELS = [
  { id: 1, label: 'Info Dasar',    icon: Tag },
  { id: 2, label: 'Waktu & Tempat', icon: MapPin },
  { id: 3, label: 'Penjualan',     icon: Calendar },
  { id: 4, label: 'Tiket',         icon: Save },
  { id: 5, label: 'Review',        icon: Check },
];

const TICKET_COLORS = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444'];

function Field({ label, error, children, hint }: { label: string; error?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="form-group" style={{ margin: 0 }}>
      <label className="label">{label}</label>
      {children}
      {hint && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{hint}</p>}
      {error && <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

export default function CreateEventPage() {
  const router   = useRouter();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const totalSteps = 5;

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      is_war_ticket: false,
      max_per_user: 4,
      categories: [{ name: 'Regular', type: 'standing', price: 500000, quota: 500, color: '#6366F1', description: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'categories' });
  const isWarTicket    = watch('is_war_ticket');
  const watchAllFields = watch();

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const onSubmit = async (data: EventForm) => {
    setLoading(true);
    setError('');
    try {
      // Build payload for backend
      const payload = {
        title:        data.title,
        category:     data.category,
        description:  data.description,
        tags:         data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        event_date:   data.event_date,
        event_time:   data.event_time,
        venue_name:   data.venue_name,
        venue_city:   data.venue_city,
        venue_address: data.venue_address || '',
        sale_start_at:  data.sale_start_at,
        sale_end_at:    data.sale_end_at,
        is_war_ticket:  data.is_war_ticket,
        war_ticket_open_at: data.is_war_ticket ? data.war_ticket_open_at : null,
        max_per_user:   data.max_per_user,
        status:         'draft',
        ticket_categories: data.categories.map(c => ({
          name:        c.name,
          type:        c.type,
          price:       c.price,
          quota:       c.quota,
          color:       c.color,
          description: c.description || '',
          max_per_user: data.max_per_user,
        })),
      };

      const res = await apiService.organizer.createEvent(payload);
      setSuccess(true);
      setTimeout(() => router.push('/organizer/events'), 2000);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Gagal membuat event. Coba lagi.';
      const errs = e?.response?.data?.errors;
      if (errs) {
        setError(Object.values(errs).flat().join(', '));
      } else {
        setError(msg);
      }
      setStep(1); // Go back to step 1 on error
    } finally {
      setLoading(false);
    }
  };

  // ── Success State ──
  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '2px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Check size={32} style={{ color: '#10B981' }} />
        </div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Event Berhasil Dibuat!</h2>
        <p style={{ color: 'var(--text-muted)' }}>Event Anda disimpan sebagai draft. Mengarahkan ke daftar event...</p>
      </motion.div>
    );
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    background: 'var(--background)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
        <Link href="/organizer/events" style={{
          width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none',
        }}>
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Buat Event Baru</h1>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Lengkapi semua langkah untuk menerbitkan event</p>
        </div>
      </div>

      {/* Stepper */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 28px', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          {/* Progress bar background */}
          <div style={{ position: 'absolute', left: 18, right: 18, top: '50%', transform: 'translateY(-50%)', height: 2, background: 'var(--border)', zIndex: 0 }} />
          <div style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', height: 2, background: 'var(--color-primary)', zIndex: 0, transition: 'width 0.4s ease', width: `calc(${((step - 1) / (totalSteps - 1)) * 100}% - 36px + 18px)` }} />

          {STEP_LABELS.map((s) => {
            const Icon = s.icon;
            const done = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: done ? 'var(--color-primary)' : active ? 'var(--card)' : 'var(--card)',
                  border: `2px solid ${done || active ? 'var(--color-primary)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s',
                }}>
                  {done
                    ? <Check size={16} style={{ color: 'white' }} />
                    : <Icon size={15} style={{ color: active ? 'var(--color-primary)' : 'var(--text-muted)' }} />
                  }
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: done || active ? 'var(--color-primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '12px 16px', borderRadius: 12, marginBottom: 20, background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'flex-start', gap: 10, color: 'var(--danger)', fontSize: '0.85rem' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 32px', minHeight: 400 }}>
          <AnimatePresence mode="wait">

            {/* ── Step 1: Info Dasar ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Informasi Dasar Event</h2>

                <Field label="Nama Event *" error={errors.title?.message}>
                  <input {...register('title')} className="input" placeholder="Contoh: Neon Dreams Music Festival 2025" />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Kategori *" error={errors.category?.message}>
                    <select {...register('category')} className="input">
                      <option value="">Pilih Kategori</option>
                      <option value="concert">Konser Musik</option>
                      <option value="festival">Festival</option>
                      <option value="fan_meeting">Fan Meeting</option>
                      <option value="seminar">Seminar / Konferensi</option>
                      <option value="sports">Olahraga</option>
                      <option value="exhibition">Pameran / Exhibition</option>
                    </select>
                  </Field>
                  <Field label="Tags (pisahkan dengan koma)" error={errors.tags?.message} hint="Contoh: pop, kpop, edm">
                    <input {...register('tags')} className="input" placeholder="pop, kpop, edm" />
                  </Field>
                </div>

                <Field label="Deskripsi Event *" error={errors.description?.message}>
                  <textarea {...register('description')} className="input" rows={5} placeholder="Jelaskan event Anda dengan menarik..." style={{ resize: 'vertical' }} />
                </Field>
              </motion.div>
            )}

            {/* ── Step 2: Waktu & Tempat ── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Waktu & Tempat Pelaksanaan</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Tanggal Event *" error={errors.event_date?.message}>
                    <input {...register('event_date')} type="date" className="input" />
                  </Field>
                  <Field label="Jam Mulai *" error={errors.event_time?.message}>
                    <input {...register('event_time')} type="time" className="input" />
                  </Field>
                </div>

                <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="Nama Venue *" error={errors.venue_name?.message}>
                      <input {...register('venue_name')} className="input" placeholder="Gelora Bung Karno" />
                    </Field>
                    <Field label="Kota *" error={errors.venue_city?.message}>
                      <input {...register('venue_city')} className="input" placeholder="Jakarta" />
                    </Field>
                  </div>
                  <Field label="Alamat Lengkap (Opsional)" error={errors.venue_address?.message}>
                    <input {...register('venue_address')} className="input" placeholder="Jl. Pintu Satu Senayan, Gelora, Jakarta Pusat" />
                  </Field>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Pengaturan Penjualan ── */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Pengaturan Penjualan</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Waktu Buka Penjualan *" error={errors.sale_start_at?.message}>
                    <input {...register('sale_start_at')} type="datetime-local" className="input" />
                  </Field>
                  <Field label="Waktu Tutup Penjualan *" error={errors.sale_end_at?.message}>
                    <input {...register('sale_end_at')} type="datetime-local" className="input" />
                  </Field>
                </div>

                <Field label="Maks. Tiket per Transaksi" hint="Jumlah maksimal tiket yang bisa dibeli 1 user dalam 1 transaksi.">
                  <input {...register('max_per_user', { valueAsNumber: true })} type="number" min={1} max={10} className="input" style={{ width: 100 }} />
                </Field>

                {/* War Ticket Toggle */}
                <div style={{ padding: 20, background: 'var(--background)', border: `1px solid ${isWarTicket ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`, borderRadius: 12, transition: 'border-color 0.3s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Zap size={18} style={{ color: '#F59E0B' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Sistem War Ticket (Antrean Virtual)</div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Aktifkan untuk event high-demand. Pengguna akan masuk virtual waiting room sebelum bisa membeli tiket.</p>
                      </div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <input type="checkbox" {...register('is_war_ticket')} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                      <div style={{
                        width: 44, height: 24, borderRadius: 12, transition: 'background 0.3s',
                        background: isWarTicket ? '#F59E0B' : 'var(--border)', position: 'relative',
                      }}>
                        <div style={{
                          position: 'absolute', top: 2, left: isWarTicket ? 22 : 2, width: 20, height: 20,
                          borderRadius: '50%', background: 'white', transition: 'left 0.3s',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                        }} />
                      </div>
                    </label>
                  </div>
                  {isWarTicket && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                      <Field label="Waktu War Ticket Dibuka" hint="Pengguna mulai masuk antrean pada waktu ini.">
                        <input {...register('war_ticket_open_at')} type="datetime-local" className="input" />
                      </Field>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Step 4: Kategori Tiket ── */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Kategori Tiket</h2>
                  <button type="button"
                    onClick={() => append({ name: '', type: 'standing', price: 0, quota: 100, color: TICKET_COLORS[fields.length % TICKET_COLORS.length], description: '' })}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--color-primary)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={14} /> Tambah Kategori
                  </button>
                </div>

                {errors.categories && (
                  <p style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>{errors.categories.message}</p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {fields.map((field, index) => (
                    <motion.div key={field.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ padding: 18, background: 'var(--background)', border: `1px solid ${field.color}30`, borderLeft: `4px solid ${field.color}`, borderRadius: 12, position: 'relative' }}>

                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                        <Field label="Nama Kategori" error={errors.categories?.[index]?.name?.message}>
                          <input {...register(`categories.${index}.name`)} className="input" placeholder="VIP / Festival A / Reguler" style={{ fontSize: '0.875rem' }} />
                        </Field>
                        <Field label="Tipe">
                          <select {...register(`categories.${index}.type`)} className="input" style={{ fontSize: '0.875rem' }}>
                            <option value="standing">Standing</option>
                            <option value="seated">Seated</option>
                          </select>
                        </Field>
                        <Field label="Harga (Rp)" error={errors.categories?.[index]?.price?.message}>
                          <input {...register(`categories.${index}.price`, { valueAsNumber: true })} type="number" min={0} className="input" style={{ fontSize: '0.875rem' }} />
                        </Field>
                        <Field label="Kuota" error={errors.categories?.[index]?.quota?.message}>
                          <input {...register(`categories.${index}.quota`, { valueAsNumber: true })} type="number" min={1} className="input" style={{ fontSize: '0.875rem' }} />
                        </Field>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Warna:</span>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {TICKET_COLORS.map(color => (
                              <button key={color} type="button"
                                onClick={() => {
                                  // We need to manually update. Use Controller or setValue workaround
                                  const el = document.querySelector(`input[name="categories.${index}.color"]`) as HTMLInputElement;
                                  if (el) { el.value = color; el.dispatchEvent(new Event('change', { bubbles: true })); }
                                }}
                                style={{ width: 20, height: 20, borderRadius: '50%', background: color, cursor: 'pointer', border: `2px solid ${field.color === color ? 'white' : 'transparent'}`, outline: `2px solid ${field.color === color ? color : 'transparent'}`, transition: 'all 0.15s' }} />
                            ))}
                            <input {...register(`categories.${index}.color`)} type="hidden" />
                          </div>
                        </div>

                        {index > 0 && (
                          <button type="button" onClick={() => remove(index)}
                            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, background: 'var(--danger-bg)', border: 'none', color: 'var(--danger)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
                            <Trash2 size={12} /> Hapus
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Step 5: Review ── */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Review & Terbitkan Event</h2>

                <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                  {/* Event Header */}
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{watchAllFields.category || 'Kategori'}</div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>{watchAllFields.title || 'Belum ada nama event'}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Calendar size={13} /> {watchAllFields.event_date || '-'} pukul {watchAllFields.event_time || '-'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <MapPin size={13} /> {watchAllFields.venue_name || '-'}, {watchAllFields.venue_city || '-'}
                      </span>
                    </div>
                  </div>

                  {/* Ticket categories */}
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10 }}>KATEGORI TIKET ({watchAllFields.categories?.length || 0})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {watchAllFields.categories?.map((c, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--card)', borderRadius: 8, borderLeft: `3px solid ${c.color}` }}>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{c.name || 'Unnamed'}</span>
                            <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>({c.type})</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.9rem' }}>Rp {(c.price || 0).toLocaleString('id-ID')}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Kuota: {c.quota}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Settings */}
                  <div style={{ padding: '16px 24px', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: watchAllFields.is_war_ticket ? 'rgba(245,158,11,0.1)' : 'var(--background)', color: watchAllFields.is_war_ticket ? '#F59E0B' : 'var(--text-muted)', border: `1px solid ${watchAllFields.is_war_ticket ? 'rgba(245,158,11,0.3)' : 'var(--border)'}` }}>
                      {watchAllFields.is_war_ticket ? '⚡ War Ticket Aktif' : 'War Ticket: Tidak Aktif'}
                    </span>
                    <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: 'var(--background)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      Maks. {watchAllFields.max_per_user} tiket/user
                    </span>
                    <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: 'rgba(16,185,129,0.08)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                      Disimpan sebagai Draft
                    </span>
                  </div>
                </div>

                <div style={{ padding: 16, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  💡 <strong>Event akan disimpan sebagai Draft.</strong> Anda bisa mengeditnya kapan saja, lalu klik <strong>"Publish"</strong> di halaman daftar event untuk menerbitkannya ke publik.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
          {step > 1 ? (
            <button type="button" onClick={prevStep}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
              <ArrowLeft size={16} /> Kembali
            </button>
          ) : <div />}

          {step < totalSteps ? (
            <button type="button" onClick={nextStep}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 10, background: 'var(--color-primary)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
              Lanjut <ArrowRight size={16} />
            </button>
          ) : (
            <button type="submit" disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 28px', borderRadius: 10, background: loading ? 'var(--border)' : 'linear-gradient(135deg, #10B981, #059669)', border: 'none', color: 'white', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.9rem', boxShadow: loading ? 'none' : '0 4px 16px rgba(16,185,129,0.3)' }}>
              {loading ? <Loader2 size={16} style={{ animation: 'spin-slow 0.8s linear infinite' }} /> : <Check size={16} />}
              {loading ? 'Menyimpan...' : 'Simpan sebagai Draft'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
