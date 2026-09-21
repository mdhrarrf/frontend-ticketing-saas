'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Search, SlidersHorizontal, X, Ticket, Zap,
  ChevronLeft, ChevronRight, Music2, Mic2, Theater, BookOpen, Trophy, Globe
} from 'lucide-react';
import { EventCard } from '@/components/events/EventCard';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { apiService } from '@/lib/api';
import type { Event } from '@/types';

const CATEGORIES = [
  { value: '', label: 'Semua', icon: null },
  { value: 'concert', label: 'Concert', icon: Music2 },
  { value: 'festival', label: 'Festival', icon: Theater },
  { value: 'fan_meeting', label: 'Fan Meeting', icon: Mic2 },
  { value: 'seminar', label: 'Seminar', icon: BookOpen },
  { value: 'sports', label: 'Sports', icon: Trophy },
  { value: 'exhibition', label: 'Exhibition', icon: Globe },
];

const SORT_OPTIONS = [
  { value: '', label: 'Terpopuler' },
  { value: 'event_date_asc', label: 'Paling Dekat' },
  { value: 'price_asc', label: 'Harga Terendah' },
  { value: 'price_desc', label: 'Harga Tertinggi' },
  { value: 'newest', label: 'Terbaru' },
];

interface Meta {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

function EventsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [meta, setMeta] = useState<Meta>({ current_page: 1, last_page: 1, total: 0, per_page: 12 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [warOnly, setWarOnly] = useState(searchParams.get('war_ticket') === 'true');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 1));

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, per_page: 12 };
      if (search) params.search = search;
      if (category) params.category = category;
      if (warOnly) params.war_ticket = true;
      if (sort) params.sort = sort;

      const res = await apiService.events.getEvents(params);
      const d = (res as any)?.data ?? res;
      setEvents(Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []);
      if (d?.meta) setMeta(d.meta);
      else if (d?.current_page) {
        setMeta({
          current_page: d.current_page,
          last_page: d.last_page,
          total: d.total,
          per_page: d.per_page
        });
      }
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, warOnly, sort, page]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Sync URL query params
  useEffect(() => {
    const p = new URLSearchParams();
    if (search) p.set('q', search);
    if (category) p.set('category', category);
    if (warOnly) p.set('war_ticket', 'true');
    if (page > 1) p.set('page', String(page));
    router.replace(`/events${p.size ? `?${p.toString()}` : ''}`, { scroll: false });
  }, [search, category, warOnly, page, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadEvents();
  };

  const resetFilters = () => {
    setSearch('');
    setCategory('');
    setWarOnly(false);
    setSort('');
    setPage(1);
  };

  const hasFilters = search || category || warOnly || sort;

  return (
    <PageContainer size="lg" className="pt-24 pb-16">
      {/* ─── PAGE HEADER ─────────────────────────────────── */}
      <PageHeader
        title="Jelajahi Event"
        description={
          meta.total > 0
            ? `${meta.total.toLocaleString('id-ID')} event tersedia dan siap dipesan`
            : 'Temukan konser musik, festival, dan acara favoritmu'
        }
      />

      {/* ─── SEARCH + CONTROLS ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!e.target.value) setPage(1);
              }}
              placeholder="Cari event, artis, atau venue..."
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-hidden focus:border-primary transition-colors"
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            Cari
          </Button>
        </form>

        <div className="flex items-center gap-2.5">
          {/* Sort dropdown */}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-hidden focus:border-primary transition-colors cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-card text-text-primary">
                {o.label}
              </option>
            ))}
          </select>

          {/* Filter toggle button */}
          <Button
            type="button"
            variant={showFilters ? 'primary' : 'outline'}
            size="md"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <SlidersHorizontal size={16} className="mr-1.5" />
            Filter
            {hasFilters && (
              <span className="ml-1.5 w-2 h-2 rounded-full bg-accent animate-pulse" />
            )}
          </Button>

          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-danger hover:text-danger hover:bg-danger/10"
            >
              <X size={15} className="mr-1" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* ─── FILTER EXPANDABLE PANEL ─────────────────────── */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-card border border-border mb-6 space-y-4 shadow-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category filter pills */}
            <div className="flex-1">
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2.5">
                Kategori Event
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const isActive = category === c.value;
                  return (
                    <button
                      key={c.value}
                      onClick={() => {
                        setCategory(c.value);
                        setPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-background hover:bg-background-elevated text-text-secondary border border-border'
                      }`}
                    >
                      {Icon && <Icon size={13} />}
                      <span>{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* War ticket switch */}
            <div className="shrink-0 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2.5">
                Mode Tiket
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={warOnly}
                  onChange={(e) => {
                    setWarOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="w-4 h-4 rounded-sm border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <span className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                  <Zap size={14} className="text-warning fill-warning" />
                  War Ticket Only
                </span>
              </label>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── ACTIVE FILTER CHIPS ─────────────────────────── */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-text-muted font-medium mr-1">Filter Aktif:</span>
          {search && (
            <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-2.5">
              <span>"{search}"</span>
              <button
                onClick={() => { setSearch(''); setPage(1); }}
                className="hover:text-danger cursor-pointer ml-1"
                aria-label="Hapus filter pencarian"
              >
                <X size={12} />
              </button>
            </Badge>
          )}
          {category && (
            <Badge variant="primary" className="flex items-center gap-1.5 py-1 px-2.5">
              <span>{CATEGORIES.find((c) => c.value === category)?.label}</span>
              <button
                onClick={() => { setCategory(''); setPage(1); }}
                className="hover:text-danger cursor-pointer ml-1"
                aria-label="Hapus filter kategori"
              >
                <X size={12} />
              </button>
            </Badge>
          )}
          {warOnly && (
            <Badge variant="warning" className="flex items-center gap-1.5 py-1 px-2.5">
              <Zap size={12} className="fill-warning" />
              <span>War Ticket</span>
              <button
                onClick={() => { setWarOnly(false); setPage(1); }}
                className="hover:text-danger cursor-pointer ml-1"
                aria-label="Hapus filter war ticket"
              >
                <X size={12} />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* ─── EVENTS GRID ─────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <Skeleton className="w-full aspect-video rounded-xl" />
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-6 w-1/3 rounded-md" />
                <Skeleton className="h-8 w-1/4 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="h-full"
              >
                <EventCard event={event} index={i} />
              </motion.div>
            ))}
          </div>

          {/* ─── PAGINATION ──────────────────────────────── */}
          {meta.last_page > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-12 pt-6 border-t border-border">
              <p className="text-xs text-text-muted">
                Menampilkan {((meta.current_page - 1) * meta.per_page) + 1}–
                {Math.min(meta.current_page * meta.per_page, meta.total)} dari {meta.total.toLocaleString('id-ID')} event
              </p>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={meta.current_page === 1}
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft size={16} />
                </Button>

                {[...Array(meta.last_page)].map((_, i) => {
                  const p = i + 1;
                  const isActive = p === meta.current_page;
                  if (Math.abs(p - meta.current_page) > 2 && p !== 1 && p !== meta.last_page) {
                    if (p === meta.current_page - 3 || p === meta.current_page + 3) {
                      return <span key={p} className="px-2 text-text-muted text-xs">…</span>;
                    }
                    return null;
                  }
                  return (
                    <Button
                      key={p}
                      variant={isActive ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setPage(p)}
                      className="min-w-9"
                    >
                      {p}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                  disabled={meta.current_page === meta.last_page}
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={<Ticket className="w-6 h-6 text-text-muted" />}
          title="Tidak Ada Event Ditemukan"
          description="Coba gunakan kata kunci pencarian yang lain atau reset filter yang sedang aktif."
          action={
            <Button variant="primary" size="sm" onClick={resetFilters}>
              Reset Filter
            </Button>
          }
          className="py-16 bg-card border border-border rounded-3xl"
        />
      )}
    </PageContainer>
  );
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <EventsContent />
    </Suspense>
  );
}
