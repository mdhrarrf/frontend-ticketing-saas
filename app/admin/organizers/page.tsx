'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw, Search } from 'lucide-react';
import { apiService } from '../../../lib/api';

const FILTERS = [
  { key: 'all',       label: 'Semua' },
  { key: 'pending',   label: 'Pending' },
  { key: 'active',    label: 'Aktif' },
  { key: 'suspended', label: 'Ditangguhkan' },
  { key: 'rejected',  label: 'Ditolak' },
];

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Pending',       color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  active:    { label: 'Aktif',         color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  suspended: { label: 'Ditangguhkan',  color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
  rejected:  { label: 'Ditolak',       color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
};

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 10, background: type === 'success' ? '#10B981' : '#EF4444', color: 'white', fontSize: '0.85rem', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
      {type === 'success' ? <CheckCircle size={15} /> : <XCircle size={15} />} {msg}
    </motion.div>
  );
}

function ReasonModal({ title, onConfirm, onCancel, loading }: { title: string; onConfirm: (r: string) => void; onCancel: () => void; loading: boolean }) {
  const [reason, setReason] = useState('');
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} style={{ background: 'white', borderRadius: 16, padding: 28, maxWidth: 440, width: '100%' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14, color: '#0F172A' }}>{title}</h3>
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Tulis alasan..." rows={3}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none', resize: 'none', marginBottom: 16, boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>Batal</button>
          <button onClick={() => onConfirm(reason)} disabled={loading || !reason.trim()}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#EF4444', color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, opacity: (!reason.trim() || loading) ? 0.5 : 1 }}>
            {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Konfirmasi'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminOrganizersPage() {
  const [organizers, setOrganizers] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');
  const [search,     setSearch]     = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast,    setToast]    = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [modal,    setModal]    = useState<{ type: 'reject' | 'suspend'; id: string } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filter !== 'all') params.status = filter;
      const res = await apiService.admin.getOrganizers(params);
      const raw = (res as any)?.data ?? res;
      const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      setOrganizers(arr);
    } catch { setOrganizers([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const handleApprove = async (id: string) => {
    setActionLoading(id + '_approve');
    try {
      await apiService.admin.approveOrganizer(id);
      showToast('Organizer berhasil disetujui', 'success');
      load();
    } catch { showToast('Gagal menyetujui organizer', 'error'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (id: string, reason: string) => {
    setActionLoading(id + '_reject');
    try {
      await (apiService.admin as any).rejectOrganizer(id, { reason });
      showToast('Organizer ditolak', 'success');
      setModal(null); load();
    } catch { showToast('Gagal menolak organizer', 'error'); }
    finally { setActionLoading(null); }
  };

  const handleSuspend = async (id: string, reason: string) => {
    setActionLoading(id + '_suspend');
    try {
      await apiService.admin.suspendOrganizer(id, reason);
      showToast('Organizer ditangguhkan', 'success');
      setModal(null); load();
    } catch { showToast('Gagal menangguhkan organizer', 'error'); }
    finally { setActionLoading(null); }
  };

  const filtered = organizers.filter(o =>
    !search || o.organization_name?.toLowerCase().includes(search.toLowerCase()) || o.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <AnimatePresence>{toast && <Toast msg={toast.msg} type={toast.type} />}</AnimatePresence>
      {modal && (
        <ReasonModal
          title={modal.type === 'reject' ? 'Alasan Penolakan' : 'Alasan Penangguhan'}
          loading={actionLoading !== null}
          onCancel={() => setModal(null)}
          onConfirm={reason => modal.type === 'reject' ? handleReject(modal.id, reason) : handleSuspend(modal.id, reason)}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Building2 size={22} style={{ color: '#6366F1' }} /> Manajemen Organizer
        </h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>Review dan kelola pendaftaran event organizer</p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau email..."
            style={{ width: '100%', paddingLeft: 36, paddingRight: 14, height: 38, borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', border: '1px solid #E2E8F0', background: filter === f.key ? '#6366F1' : 'white', color: filter === f.key ? 'white' : '#475569', transition: 'all 0.15s' }}>
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={load} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#475569' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              {['Nama Organizer', 'Email', 'Status', 'Tanggal Daftar', 'Aksi'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '0.9rem' }}>Tidak ada organizer ditemukan</td></tr>
            ) : filtered.map((org, i) => {
              const st = STATUS_CFG[org.status] ?? { label: org.status, color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' };
              const isActioning = actionLoading?.startsWith(org.id);
              return (
                <motion.tr key={org.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0F172A' }}>{org.organization_name || org.name}</div>
                    {org.contact_phone && <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 2 }}>{org.contact_phone}</div>}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#475569' }}>{org.contact_email || org.user?.email}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, color: st.color, background: st.bg }}>{st.label}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.78rem', color: '#94A3B8' }}>
                    {org.created_at ? new Date(org.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {org.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(org.id)} disabled={!!isActioning}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: 'none', background: '#10B981', color: 'white', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', opacity: isActioning ? 0.6 : 1 }}>
                            {actionLoading === org.id + '_approve' ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={12} />} Setujui
                          </button>
                          <button onClick={() => setModal({ type: 'reject', id: org.id })} disabled={!!isActioning}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: 'none', background: '#EF4444', color: 'white', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', opacity: isActioning ? 0.6 : 1 }}>
                            <XCircle size={12} /> Tolak
                          </button>
                        </>
                      )}
                      {org.status === 'active' && (
                        <button onClick={() => setModal({ type: 'suspend', id: org.id })} disabled={!!isActioning}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: 'none', background: '#F59E0B', color: 'white', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                          <AlertTriangle size={12} /> Tangguhkan
                        </button>
                      )}
                      {org.status === 'suspended' && (
                        <button onClick={() => handleApprove(org.id)} disabled={!!isActioning}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: 'none', background: '#10B981', color: 'white', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                          <CheckCircle size={12} /> Aktifkan
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
