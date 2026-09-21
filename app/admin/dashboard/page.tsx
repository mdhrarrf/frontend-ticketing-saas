'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Building,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { apiService } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/organizer/StatCard';

interface OrganizerRow {
  id: number | string;
  name: string;
  email: string;
  created_at: string;
  status: string;
}

export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalEvents, setTotalEvents] = useState<number | null>(null);
  const [totalOrganizers, setTotalOrganizers] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [pendingList, setPendingList] = useState<OrganizerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

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
        const d = usersRes.value as any;
        setTotalUsers(d?.data?.meta?.total ?? d?.meta?.total ?? 0);
      }
      if (eventsRes.status === 'fulfilled') {
        const d = eventsRes.value as any;
        setTotalEvents(d?.data?.meta?.total ?? d?.meta?.total ?? 0);
      }
      if (orgsRes.status === 'fulfilled') {
        const d = orgsRes.value as any;
        setTotalOrganizers(d?.data?.meta?.total ?? d?.meta?.total ?? 0);
      }
      if (pendingRes.status === 'fulfilled') {
        const d = pendingRes.value as any;
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

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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

  return (
    <div className="space-y-6">
      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-semibold transition-all ${
            toast.type === 'success' ? 'bg-success text-white' : 'bg-danger text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
            Platform Overview
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Ringkasan telemetri dan statistik global TIXORA
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          loading={loading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh Data
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/users" className="block focus:outline-hidden">
          <StatCard
            title="Total Users"
            value={totalUsers ?? '—'}
            icon={Users}
            iconColorClass="text-blue-500"
            iconBgClass="bg-blue-500/10 border-blue-500/20"
            loading={loading}
          />
        </Link>
        <Link href="/admin/events" className="block focus:outline-hidden">
          <StatCard
            title="Total Events"
            value={totalEvents ?? '—'}
            icon={Calendar}
            iconColorClass="text-emerald-500"
            iconBgClass="bg-emerald-500/10 border-emerald-500/20"
            loading={loading}
          />
        </Link>
        <Link href="/admin/organizers" className="block focus:outline-hidden">
          <StatCard
            title="Total Organizers"
            value={totalOrganizers ?? '—'}
            icon={Building}
            iconColorClass="text-purple-500"
            iconBgClass="bg-purple-500/10 border-purple-500/20"
            loading={loading}
          />
        </Link>
        <Link href="/admin/organizers?status=pending" className="block focus:outline-hidden">
          <StatCard
            title="Pending Approvals"
            value={pendingCount ?? '—'}
            icon={Clock}
            iconColorClass="text-amber-500"
            iconBgClass="bg-amber-500/10 border-amber-500/20"
            loading={loading}
          />
        </Link>
      </div>

      {/* Pending Organizers Table */}
      <Card variant="default" className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background-elevated/50">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h2 className="font-bold text-sm sm:text-base text-text-primary">
              Pending Organizer Approvals
            </h2>
            {pendingCount !== null && pendingCount > 0 && (
              <Badge variant="warning" size="sm">
                {pendingCount}
              </Badge>
            )}
          </div>
          <Link
            href="/admin/organizers?status=pending"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Lihat semua
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-background/50 text-text-muted text-[11px] uppercase font-bold tracking-wider">
                <th className="px-5 py-3">Nama Organizer</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Tanggal Daftar</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-3.5">
                      <div className="h-4 bg-background-elevated rounded-md w-3/4" />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="h-4 bg-background-elevated rounded-md w-1/2" />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="h-4 bg-background-elevated rounded-md w-1/3" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="h-6 bg-background-elevated rounded-md w-16 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : pendingList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-text-muted">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success opacity-80" />
                    Tidak ada organizer yang menunggu persetujuan
                  </td>
                </tr>
              ) : (
                pendingList.map((org) => (
                  <tr
                    key={org.id}
                    className="hover:bg-background-elevated/40 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-black shrink-0">
                          {(org.name ?? 'O').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-text-primary">{org.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-text-secondary">{org.email}</td>
                    <td className="px-5 py-3.5 text-text-muted">{formatDate(org.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApprove(org.id)}
                          loading={actionLoading === String(org.id) + '-approve'}
                        >
                          Approve
                        </Button>
                        <Link href="/admin/organizers">
                          <Button variant="outline" size="sm">
                            Detail
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
