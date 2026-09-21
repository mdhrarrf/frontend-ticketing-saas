'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiService } from '../../../lib/api';

const ROLE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  super_admin: { label: 'Super Admin', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  organizer:   { label: 'Organizer',   color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
  user:        { label: 'User',        color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
};

export default function AdminUsersPage() {
  const [users,   setUsers]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total,   setTotal]   = useState(0);

  const load = async (p = 1, q = '') => {
    setLoading(true);
    try {
      const res  = await apiService.admin.getUsers({ page: p, per_page: 20, search: q || undefined });
      const raw  = (res as any)?.data ?? res;
      const arr  = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
      setUsers(arr);
      setLastPage(raw?.last_page ?? 1);
      setTotal(raw?.total ?? arr.length);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(page, search); }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(1, search);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0F172A', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={20} style={{ color: '#6366F1' }} /> Manajemen Pengguna
        </h1>
        <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>Total {total.toLocaleString('id-ID')} pengguna terdaftar</p>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau email..."
            style={{ width: '100%', paddingLeft: 36, paddingRight: 14, height: 38, borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <button type="submit" style={{ padding: '0 18px', borderRadius: 8, border: 'none', background: '#6366F1', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Cari</button>
      </form>

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              {['Nama', 'Email', 'Role', 'Status', 'Bergabung'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center' }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto', color: '#94A3B8' }} /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#94A3B8', fontSize: '0.9rem' }}>Tidak ada pengguna ditemukan</td></tr>
            ) : users.map((u, i) => {
              const rc = ROLE_CFG[u.role] ?? { label: u.role, color: '#64748B', bg: 'rgba(100,116,139,0.1)' };
              return (
                <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                        {u.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0F172A' }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '0.82rem', color: '#475569' }}>{u.email}</td>
                  <td style={{ padding: '13px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, color: rc.color, background: rc.bg }}>{rc.label}</span></td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, color: u.is_active !== false ? '#10B981' : '#EF4444', background: u.is_active !== false ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
                      {u.is_active !== false ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '0.78rem', color: '#94A3B8' }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {lastPage > 1 && (
          <div style={{ padding: '14px 16px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Halaman {page} dari {lastPage}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 7, border: '1px solid #E2E8F0', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, fontSize: '0.8rem' }}>
                <ChevronLeft size={14} /> Sebelumnya
              </button>
              <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 7, border: '1px solid #E2E8F0', background: 'white', cursor: page === lastPage ? 'not-allowed' : 'pointer', opacity: page === lastPage ? 0.4 : 1, fontSize: '0.8rem' }}>
                Berikutnya <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
