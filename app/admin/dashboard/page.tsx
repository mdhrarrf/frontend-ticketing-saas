'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Building,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { apiService } from '../../../lib/api';

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  href: string;
}

interface OrganizerRow {
  id: number | string;
  name: string;
  email: string;
  created_at: string;
  status: string;
}

export default function AdminDashboardPage() {
  const [totalUsers,      setTotalUsers]      = useState<number | null>(null);
  const [totalEvents,     setTotalEvents]     = useState<number | null>(null);
  const [totalOrganizers, setTotalOrganizers] = useState<number | null>(null);
  const [pendingCount,    setPendingCount]     = useState<number | null>(null);
  const [pendingList,     setPendingList]      = useState<OrganizerRow[]>([]);
  const [loading,         setLoading]          = useState(true);
  const [actionLoading,   setActionLoading]    = useState<string | null>(null);
  const [toast,           setToast]            = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, eventsRes, orgsRes, pendingRes] = await Promise.allSettled([
        apiService.admin.getUsers({ per_page: 1 }),
        apiService.admin.getEvents({ per_page: 1 }),
        apiService.admin.getOrganizers({ per_page: 1 }),
        apiService.admin.getOrganizers({ status: 'pending', per_page: 10 }),
      ]);

      if (usersRes.status === 'fulfilled') {
        const d = (usersRes.value as any);
        setTotalUsers(d?.data?.meta?.total ?? d?.meta?.total ?? 0);
      }
      if (eventsRes.status === 'fulfilled') {
        const d = (eventsRes.value as any);
        setTotalEvents(d?.data?.meta?.total ?? d?.meta?.total ?? 0);
      }
      if (orgsRes.status === 'fulfilled') {
        const d = (orgsRes.value as any);
        setTotalOrganizers(d?.data?.meta?.total ?? d?.meta?.total ?? 0);
      }
      if (pendingRes.status === 'fulfilled') {
        const d = (pendingRes.value as any);
        const raw = d?.data ?? d;
        const arr: OrganizerRow[] = Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw)
          ? raw
          : [];
        setPendingCount(raw?.meta?.total ?? arr.length);
        setPendingList(arr);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleApprove = async (id: string | number) => {
    setActionLoading(String(id) + '-approve');
    try {
      await apiService.admin.approveOrganizer(String(id));
      showToast('Organizer berhasil disetujui');
      fetchStats();
    } catch {
      showToast('Gagal menyetujui organizer', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const statCards: StatCard[] = [
    {
      label:   'Total Users',
      value:   totalUsers   ?? '—',
      icon:    <Users className="w-6 h-6" />,
      iconBg:  '#3B82F6',
      href:    '/admin/users',
    },
    {
      label:   'Total Events',
      value:   totalEvents  ?? '—',
      icon:    <Calendar className="w-6 h-6" />,
      iconBg:  '#10B981',
      href:    '/admin/events',
    },
    {
      label:   'Total Organizers',
      value:   totalOrganizers ?? '—',
      icon:    <Building className="w-6 h-6" />,
      iconBg:  '#8B5CF6',
      href:    '/admin/organizers',
    },
    {
      label:   'Pending Approvals',
      value:   pendingCount ?? '—',
      icon:    <Clock className="w-6 h-6" />,
      iconBg:  '#F59E0B',
      href:    '/admin/organizers?status=pending',
    },
  ];

  const fmt = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch { return dateStr; }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm"
          style={{ background: toast.type === 'success' ? '#10B981' : '#EF4444' }}
        >
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0F172A' }}>Platform Overview</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>Ringkasan statistik TIXORA</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border font-medium transition-colors"
          style={{ borderColor: '#E2E8F0', color: '#475569', background: '#FFFFFF' }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
          >
            <Link
              href={card.href}
              className="block p-5 rounded-xl border transition-shadow hover:shadow-md"
              style={{ background: '#FFFFFF', borderColor: '#E2E8F0' }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center text-white"
                  style={{ background: card.iconBg }}
                >
                  {card.icon}
                </div>
                <ArrowRight className="w-4 h-4 mt-1" style={{ color: '#CBD5E1' }} />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold" style={{ color: '#0F172A' }}>
                  {loading ? (
                    <span className="inline-block w-16 h-6 rounded animate-pulse" style={{ background: '#E2E8F0' }} />
                  ) : (
                    card.value
                  )}
                </p>
                <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>{card.label}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Pending Organizers Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-xl border overflow-hidden"
        style={{ background: '#FFFFFF', borderColor: '#E2E8F0' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: '#F1F5F9' }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" style={{ color: '#F59E0B' }} />
            <h2 className="font-semibold" style={{ color: '#0F172A' }}>
              Pending Organizer Approvals
            </h2>
            {pendingCount !== null && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: '#FEF3C7', color: '#92400E' }}
              >
                {pendingCount}
              </span>
            )}
          </div>
          <Link
            href="/admin/organizers?status=pending"
            className="text-sm font-medium transition-colors"
            style={{ color: '#3B82F6' }}
          >
            Lihat semua
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#64748B' }}>Nama Organizer</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#64748B' }}>Email</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#64748B' }}>Tanggal Daftar</th>
                <th className="text-right px-5 py-3 font-medium" style={{ color: '#64748B' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {[1, 2, 3, 4].map(j => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 rounded animate-pulse" style={{ background: '#E2E8F0', width: j === 4 ? 80 : '80%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pendingList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center" style={{ color: '#94A3B8' }}>
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#10B981' }} />
                    Tidak ada organizer yang menunggu persetujuan
                  </td>
                </tr>
              ) : (
                pendingList.map((org) => (
                  <tr
                    key={org.id}
                    style={{ borderBottom: '1px solid #F1F5F9' }}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: '#8B5CF6' }}
                        >
                          {(org.name ?? 'O').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium" style={{ color: '#0F172A' }}>{org.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: '#475569' }}>{org.email}</td>
                    <td className="px-5 py-3.5" style={{ color: '#475569' }}>{fmt(org.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(org.id)}
                          disabled={actionLoading === String(org.id) + '-approve'}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                          style={{ background: '#D1FAE5', color: '#065F46' }}
                        >
                          {actionLoading === String(org.id) + '-approve' ? 'Loading…' : 'Approve'}
                        </button>
                        <Link
                          href={`/admin/organizers`}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                          style={{ background: '#FEE2E2', color: '#991B1B' }}
                        >
                          Detail
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
